"""
Copyright 2024-2026 ChatterMate

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

import pytest
from fastapi.testclient import TestClient
from app.database import get_db
from fastapi import FastAPI
from app.models.user import User
from app.models.notification import Notification, NotificationType
from app.models.notification_settings import UserNotificationSettings
from app.models.role import Role
from app.models.organization import Organization
from datetime import datetime, timezone
from uuid import uuid4
from app.api import notification as notification_router
from app.core.auth import get_current_user
from tests.conftest import engine, TestingSessionLocal, create_tables, Base

# Create a test FastAPI app
app = FastAPI()
app.include_router(
    notification_router.router,
    prefix="/api/notifications",
    tags=["notifications"]
)

@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test."""
    # Drop all tables first
    Base.metadata.drop_all(bind=engine)
    # Create tables except enterprise ones
    create_tables()
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_role(db) -> Role:
    """Create a test role"""
    role = Role(
        id=1,
        name="Test Role",
        description="Test Role Description",
        is_default=True
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

@pytest.fixture
def test_organization(db) -> Organization:
    """Create a test organization"""
    org = Organization(
        name="Test Organization",
        domain="test.com",
        timezone="UTC"
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

@pytest.fixture
def test_user(db, test_role, test_organization) -> User:
    """Create a test user"""
    user = User(
        id=uuid4(),
        email="test@example.com",
        hashed_password="hashed_password",
        is_active=True,
        organization_id=test_organization.id,
        full_name="Test User",
        role_id=test_role.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_notifications(db, test_user) -> list[Notification]:
    """Create test notifications"""
    notifications = []
    for i in range(3):
        notification = Notification(
            user_id=test_user.id,
            type=NotificationType.CHAT,
            title=f"Test Notification {i+1}",
            message=f"Test message {i+1}",
            is_read=i == 0,  # First notification is read
            notification_metadata={"test": True},
            created_at=datetime.now(timezone.utc)
        )
        notifications.append(notification)
        db.add(notification)
    db.commit()
    for n in notifications:
        db.refresh(n)
    return notifications

@pytest.fixture
def client(test_user) -> TestClient:
    """Create test client with mocked dependencies"""
    async def override_get_current_user():
        return test_user

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db] = lambda: TestingSessionLocal()
    
    return TestClient(app)

def test_list_notifications(
    client,
    db,
    test_user,
    test_notifications
):
    """Test listing user's notifications"""
    response = client.get("/api/notifications")
    assert response.status_code == 200
    notifications = response.json()
    assert len(notifications) == 3
    assert notifications[0]["user_id"] == str(test_user.id)
    assert notifications[0]["type"] == NotificationType.CHAT.value

def test_list_notifications_pagination(
    client,
    db,
    test_user,
    test_notifications
):
    """Test notification listing with pagination"""
    response = client.get("/api/notifications?skip=1&limit=1")
    assert response.status_code == 200
    notifications = response.json()
    assert len(notifications) == 1

def test_mark_as_read(
    client,
    db,
    test_user,
    test_notifications
):
    """Test marking a notification as read"""
    unread_notification = next(n for n in test_notifications if not n.is_read)
    response = client.patch(f"/api/notifications/{unread_notification.id}/read")
    assert response.status_code == 200
    assert response.json()["message"] == "Notification marked as read"
    
    # Verify notification is marked as read in database
    db.refresh(unread_notification)  # Refresh from database
    assert unread_notification.is_read == True

def test_mark_as_read_not_found(
    client,
    db,
    test_user
):
    """Test marking non-existent notification as read"""
    response = client.patch("/api/notifications/999/read")
    assert response.status_code == 404
    assert response.json()["detail"] == "Notification not found"

def test_mark_as_read_wrong_user(
    client,
    db,
    test_user
):
    """Test marking another user's notification as read"""
    # Create another user
    other_user = User(
        email="other@example.com",
        full_name="Other User",
        hashed_password="hashed_password",
        organization_id=test_user.organization_id  # Use same org as test_user
    )
    db.add(other_user)
    db.commit()
    
    # Create notification for different user
    other_notification = Notification(
        user_id=other_user.id,  # Use the other user's ID
        type="CHAT",
        title="Other Notification",
        message="Test message",
        notification_metadata={"test": True}
    )
    db.add(other_notification)
    db.commit()

    response = client.patch(f"/api/notifications/{other_notification.id}/read")
    assert response.status_code == 404
    assert response.json()["detail"] == "Notification not found"

def test_get_unread_count(
    client,
    db,
    test_user,
    test_notifications
):
    """Test getting unread notification count"""
    response = client.get("/api/notifications/unread-count")
    assert response.status_code == 200
    assert response.json()["count"] == 2  # Two unread notifications from fixture

def test_get_or_create_survives_insert_race(db, test_user):
    """A concurrent first-insert (IntegrityError) re-reads instead of 500ing"""
    from unittest.mock import patch
    from sqlalchemy.exc import IntegrityError
    from app.repositories.notification_settings import UserNotificationSettingsRepository

    repo = UserNotificationSettingsRepository(db)

    # The row the winning racer inserted; our repo's first get() is forced to
    # miss it (as if the winner hadn't committed yet when we looked).
    winner_row = UserNotificationSettings(user_id=test_user.id)
    db.add(winner_row)
    db.commit()

    real_get = repo.get
    calls = {"n": 0}

    def get_missing_first(user_id):
        calls["n"] += 1
        return None if calls["n"] == 1 else real_get(user_id)

    with patch.object(repo, "get", side_effect=get_missing_first), \
         patch.object(db, "commit", side_effect=IntegrityError("dup", {}, Exception())):
        result = repo.get_or_create(test_user.id)

    assert result is not None
    assert result.user_id == test_user.id


def test_get_settings_creates_defaults(
    client,
    db,
    test_user
):
    """First read lazily creates the row with the shipped defaults"""
    response = client.get("/api/notifications/settings")
    assert response.status_code == 200
    assert response.json() == {
        "notify_new_chat": False,
        "notify_chat_transfer": True,
        "notify_chat_assigned": True,
    }

    settings = db.query(UserNotificationSettings)\
        .filter_by(user_id=test_user.id).first()
    assert settings is not None


def test_update_settings_is_partial(
    client,
    db,
    test_user
):
    """Only the toggles sent are changed; the rest keep their values"""
    response = client.put(
        "/api/notifications/settings",
        json={"notify_new_chat": True}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["notify_new_chat"] is True
    assert body["notify_chat_transfer"] is True
    assert body["notify_chat_assigned"] is True

    response = client.put(
        "/api/notifications/settings",
        json={"notify_chat_transfer": False}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["notify_new_chat"] is True
    assert body["notify_chat_transfer"] is False


def test_settings_are_per_user(
    client,
    db,
    test_user
):
    """Updating the caller's settings never touches another user's row"""
    other_user = User(
        id=uuid4(),
        email="other-settings@example.com",
        full_name="Other User",
        hashed_password="hashed_password",
        organization_id=test_user.organization_id
    )
    db.add(other_user)
    db.commit()

    other_settings = UserNotificationSettings(user_id=other_user.id)
    db.add(other_settings)
    db.commit()

    response = client.put(
        "/api/notifications/settings",
        json={"notify_new_chat": True, "notify_chat_assigned": False}
    )
    assert response.status_code == 200

    db.refresh(other_settings)
    assert other_settings.notify_new_chat is False
    assert other_settings.notify_chat_assigned is True


def test_send_test_notification(
    client,
    db,
    test_user
):
    """Test sending a test notification"""
    response = client.post("/api/notifications/test")
    assert response.status_code == 200
    assert response.json()["message"] == "Test notification sent successfully"
    
    # Verify notification was created
    notification = db.query(Notification)\
        .filter_by(user_id=test_user.id)\
        .order_by(Notification.created_at.desc())\
        .first()
    assert notification is not None
    assert notification.title == "Test Notification"
    assert notification.type == NotificationType.CHAT 

def test_mark_all_as_read_clears_every_unread(
    client,
    db,
    test_user,
    test_notifications
):
    """One request must clear the whole backlog, not just the fetched page.

    The client used to loop the 50 rows it had loaded, so anyone with more unread
    than that could never clear the badge — it sat at 99+ no matter how often
    they tapped "Mark all read".
    """
    response = client.post("/api/notifications/read-all")
    assert response.status_code == 200
    assert response.json()["updated"] == 2  # the fixture leaves two unread

    for n in test_notifications:
        db.refresh(n)
        assert n.is_read is True


def test_mark_all_as_read_leaves_other_users_alone(
    client,
    db,
    test_user,
    test_notifications
):
    """A bulk UPDATE is exactly where a missing user filter goes unnoticed."""
    other_user = User(
        email="bulk-other@example.com",
        hashed_password="x",
        full_name="Other",
        organization_id=test_user.organization_id,
        role_id=test_user.role_id,
    )
    db.add(other_user)
    db.commit()
    theirs = Notification(
        user_id=other_user.id,
        type=NotificationType.CHAT,
        title="Theirs",
        message="Theirs",
        is_read=False,
    )
    db.add(theirs)
    db.commit()

    client.post("/api/notifications/read-all")

    db.refresh(theirs)
    assert theirs.is_read is False


def test_delete_notification(
    client,
    db,
    test_user,
    test_notifications
):
    target = test_notifications[0]
    response = client.delete(f"/api/notifications/{target.id}")
    assert response.status_code == 200

    assert db.query(Notification).filter(Notification.id == target.id).first() is None
    # The others survive
    assert db.query(Notification).filter(
        Notification.user_id == test_user.id
    ).count() == len(test_notifications) - 1


def test_delete_notification_not_found(client, db, test_user):
    response = client.delete("/api/notifications/999999")
    assert response.status_code == 404


def test_delete_another_users_notification_is_not_found(
    client,
    db,
    test_user
):
    """Must 404 rather than delete someone else's row."""
    other_user = User(
        email="delete-other@example.com",
        hashed_password="x",
        full_name="Other",
        organization_id=test_user.organization_id,
        role_id=test_user.role_id,
    )
    db.add(other_user)
    db.commit()
    theirs = Notification(
        user_id=other_user.id,
        type=NotificationType.CHAT,
        title="Theirs",
        message="Theirs",
        is_read=False,
    )
    db.add(theirs)
    db.commit()
    db.refresh(theirs)

    response = client.delete(f"/api/notifications/{theirs.id}")
    assert response.status_code == 404
    assert db.query(Notification).filter(Notification.id == theirs.id).first() is not None


def test_clear_all_notifications(
    client,
    db,
    test_user,
    test_notifications
):
    response = client.delete("/api/notifications")
    assert response.status_code == 200
    assert response.json()["deleted"] == len(test_notifications)

    assert db.query(Notification).filter(
        Notification.user_id == test_user.id
    ).count() == 0
