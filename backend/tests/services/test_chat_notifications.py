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

Chat notification preference gating: who gets a push for which event, and
what happens for users who have never opened the settings page.
"""
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from app.models.notification import Notification, NotificationType
from app.models.notification_settings import UserNotificationSettings
from app.models.permission import Permission
from app.models.role import Role
from app.models.user import User
from app.repositories.chat import ChatRepository
from app.repositories.session_to_agent import SessionToAgentRepository
from app.services.chat_notifications import notify_chat_assigned, notify_new_chat
from app.services.notifications import ChatNotificationEvent, notify_chat_event


@pytest.fixture
def second_user(db, test_organization, test_role) -> User:
    user = User(
        id=uuid4(),
        email="second@example.com",
        full_name="Second User",
        hashed_password="hashed_password",
        is_active=True,
        organization_id=test_organization.id,
        role_id=test_role.id,
    )
    db.add(user)
    db.commit()
    return user


async def _notify(db, user_ids, event):
    with patch("app.services.notifications.send_fcm_notification", new=AsyncMock()):
        await notify_chat_event(
            db=db,
            user_ids=user_ids,
            event=event,
            title="New Chat Transfer",
            message="A chat has been transferred to your group.",
            metadata={"session_id": "abc-123"},
        )


def _notifications_for(db, user_id):
    return db.query(Notification).filter(Notification.user_id == user_id).all()


@pytest.mark.asyncio
async def test_users_without_settings_get_default_enabled_events(db, test_user):
    """No settings row means the defaults apply — transfers still notify."""
    await _notify(db, [test_user.id], ChatNotificationEvent.CHAT_TRANSFER)

    notifications = _notifications_for(db, test_user.id)
    assert len(notifications) == 1
    assert notifications[0].type == NotificationType.CHAT
    assert notifications[0].notification_metadata["event"] == "notify_chat_transfer"
    # session_id must survive — the push uses it to deep-link the conversation.
    assert notifications[0].notification_metadata["session_id"] == "abc-123"


@pytest.mark.asyncio
async def test_users_without_settings_do_not_get_default_disabled_events(db, test_user):
    """New-chat is opt-in, so an untouched user gets nothing."""
    await _notify(db, [test_user.id], ChatNotificationEvent.NEW_CHAT)

    assert _notifications_for(db, test_user.id) == []


@pytest.mark.asyncio
async def test_muted_user_is_skipped_others_are_not(db, test_user, second_user):
    db.add(UserNotificationSettings(user_id=test_user.id, notify_chat_transfer=False))
    db.commit()

    await _notify(db, [test_user.id, second_user.id], ChatNotificationEvent.CHAT_TRANSFER)

    assert _notifications_for(db, test_user.id) == []
    assert len(_notifications_for(db, second_user.id)) == 1


@pytest.mark.asyncio
async def test_opted_in_user_gets_new_chat(db, test_user):
    db.add(UserNotificationSettings(user_id=test_user.id, notify_new_chat=True))
    db.commit()

    await _notify(db, [test_user.id], ChatNotificationEvent.NEW_CHAT)

    assert len(_notifications_for(db, test_user.id)) == 1


@pytest.mark.asyncio
async def test_duplicate_recipients_notified_once(db, test_user):
    await _notify(
        db,
        [test_user.id, test_user.id, str(test_user.id)],
        ChatNotificationEvent.CHAT_TRANSFER,
    )

    assert len(_notifications_for(db, test_user.id)) == 1


@pytest.mark.asyncio
async def test_no_recipients_is_a_no_op(db):
    await _notify(db, [], ChatNotificationEvent.CHAT_TRANSFER)

    assert db.query(Notification).count() == 0


@pytest.fixture
def inbox_user(db, test_organization) -> User:
    """A user whose role can see unclaimed chats, opted in to new-chat pushes."""
    permission = Permission(name="view_unassigned_chats")
    db.add(permission)
    db.commit()

    role = Role(name="Inbox Agent", organization_id=test_organization.id)
    role.permissions = [permission]
    db.add(role)
    db.commit()

    user = User(
        id=uuid4(),
        email="inbox@example.com",
        full_name="Inbox Agent",
        hashed_password="hashed_password",
        is_active=True,
        organization_id=test_organization.id,
        role_id=role.id,
    )
    db.add(user)
    db.add(UserNotificationSettings(user_id=user.id, notify_new_chat=True))
    db.commit()
    return user


def _new_session(db, test_organization, test_agent, test_customer):
    return SessionToAgentRepository(db).create_session(
        session_id=uuid4(),
        agent_id=test_agent.id,
        customer_id=test_customer.id,
        organization_id=test_organization.id,
    )


@pytest.mark.asyncio
async def test_new_chat_notifies_only_users_who_can_open_it(
    db, test_organization, test_agent, test_customer, test_user, inbox_user
):
    """test_user's role has no chat permissions, so it isn't a recipient."""
    session = _new_session(db, test_organization, test_agent, test_customer)

    with patch("app.services.notifications.send_fcm_notification", new=AsyncMock()):
        await notify_new_chat(db, session)

    assert len(_notifications_for(db, inbox_user.id)) == 1
    assert _notifications_for(db, test_user.id) == []

    notification = _notifications_for(db, inbox_user.id)[0]
    assert notification.notification_metadata["session_id"] == str(session.session_id)
    assert "web widget" in notification.message


@pytest.mark.asyncio
async def test_new_chat_respects_the_opt_in(
    db, test_organization, test_agent, test_customer, inbox_user
):
    db.query(UserNotificationSettings)\
        .filter(UserNotificationSettings.user_id == inbox_user.id)\
        .update({"notify_new_chat": False})
    db.commit()

    session = _new_session(db, test_organization, test_agent, test_customer)
    with patch("app.services.notifications.send_fcm_notification", new=AsyncMock()):
        await notify_new_chat(db, session)

    assert _notifications_for(db, inbox_user.id) == []


@pytest.mark.asyncio
async def test_opening_the_widget_alone_is_not_a_new_chat(
    db, test_organization, test_agent, test_customer
):
    """The widget opens its session on connect — no customer message, no chat."""
    session = _new_session(db, test_organization, test_agent, test_customer)
    chat_repo = ChatRepository(db)

    assert chat_repo.has_customer_messages(session.session_id) is False

    chat_repo.create_message({
        "message": "Hello?",
        "message_type": "user",
        "session_id": str(session.session_id),
        "organization_id": str(test_organization.id),
        "agent_id": str(test_agent.id),
        "customer_id": str(test_customer.id),
    })

    assert chat_repo.has_customer_messages(session.session_id) is True
    # A bot-only session still counts as unstarted.
    other = _new_session(db, test_organization, test_agent, test_customer)
    chat_repo.create_message({
        "message": "Hi there!",
        "message_type": "bot",
        "session_id": str(other.session_id),
        "organization_id": str(test_organization.id),
        "agent_id": str(test_agent.id),
        "customer_id": str(test_customer.id),
    })
    assert chat_repo.has_customer_messages(other.session_id) is False


@pytest.mark.asyncio
async def test_assignment_notifies_the_target(
    db, test_organization, test_agent, test_customer, test_user, second_user
):
    session = _new_session(db, test_organization, test_agent, test_customer)

    with patch("app.services.notifications.send_fcm_notification", new=AsyncMock()):
        await notify_chat_assigned(db, session, second_user.id, assigned_by=test_user.id)

    assert len(_notifications_for(db, second_user.id)) == 1
    assert _notifications_for(db, test_user.id) == []


@pytest.mark.asyncio
async def test_self_assignment_notifies_nobody(
    db, test_organization, test_agent, test_customer, test_user
):
    """Claiming a chat yourself shouldn't push a notification back at you."""
    session = _new_session(db, test_organization, test_agent, test_customer)

    with patch("app.services.notifications.send_fcm_notification", new=AsyncMock()):
        await notify_chat_assigned(db, session, test_user.id, assigned_by=test_user.id)

    assert _notifications_for(db, test_user.id) == []
