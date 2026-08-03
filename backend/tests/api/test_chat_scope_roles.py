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

"""The chat-scope toggles on the user form.

Permissions live on roles, so ticking "can see all chats in the organization"
for one person has to resolve to a role. These pin that it resolves to the
RIGHT role — reusing one where possible, never widening the role the rest of
the team is on, and never letting an admin hand out a permission they lack.
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import uuid4

from app.api import users as users_router
from app.core.auth import get_current_user, require_permissions
from app.core.config import settings
from app.core.security import get_password_hash
from app.database import Base, get_db
from app.models.organization import Organization
from app.models.permission import Permission, DEFAULT_AGENT_ROLE_PERMISSIONS
from app.models.role import Role
from app.models.user import User
from tests.conftest import engine, TestingSessionLocal, create_tables

users_router.HAS_ENTERPRISE = False

app = FastAPI()
app.include_router(
    users_router.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"]
)

ALL_PERMISSION_NAMES = [name for name, _ in Permission.default_permissions()]
NEW_USER = {
    "email": "newagent@test.com",
    "full_name": "New Agent",
    "password": "Str0ng!Passw0rd",
    "is_active": True,
}


@pytest.fixture(scope="function")
def db():
    Base.metadata.drop_all(bind=engine)
    create_tables()
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def permissions(db) -> dict:
    rows = {}
    for name in ALL_PERMISSION_NAMES:
        perm = Permission(name=name, description=name)
        db.add(perm)
        rows[name] = perm
    db.commit()
    return rows


@pytest.fixture
def organization(db) -> Organization:
    org = Organization(id=uuid4(), name="Scope Org", domain="scope.test")
    db.add(org)
    db.commit()
    return org


def make_role(db, organization, permissions, name, granted) -> Role:
    role = Role(name=name, organization_id=organization.id, is_default=False)
    role.permissions = [permissions[n] for n in granted]
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@pytest.fixture
def agent_role(db, organization, permissions) -> Role:
    """The role a fresh org seeds: assigned chats, the AI queue, and People."""
    return make_role(
        db, organization, permissions, "Agent", DEFAULT_AGENT_ROLE_PERMISSIONS
    )


@pytest.fixture
def admin(db, organization, permissions) -> User:
    role = make_role(db, organization, permissions, "Admin", ALL_PERMISSION_NAMES)
    user = User(
        id=uuid4(), email="admin@test.com", full_name="Admin",
        hashed_password=get_password_hash("x"), organization_id=organization.id,
        role_id=role.id, is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def client(db, admin) -> TestClient:
    async def override_current_user():
        return admin

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = override_current_user
    yield TestClient(app)
    app.dependency_overrides.clear()


def create_user(client, role_id, **scope):
    return client.post(
        f"{settings.API_V1_STR}/users",
        json={**NEW_USER, "role_id": role_id, **scope},
    )


def role_of(db: Session, email: str) -> Role:
    user = db.query(User).filter(User.email == email).first()
    return db.query(Role).filter(Role.id == user.role_id).first()


def granted(role: Role) -> set:
    return {p.name for p in role.permissions}


def test_toggles_matching_the_role_reuse_it(client, db, agent_role):
    """The common case adds nothing to the Roles screen."""
    response = create_user(
        client, agent_role.id, see_all_ai_chats=True, see_all_org_chats=False
    )
    assert response.status_code == 200
    assert role_of(db, NEW_USER["email"]).id == agent_role.id
    assert db.query(Role).filter(Role.organization_id == agent_role.organization_id).count() == 2


def test_omitting_the_toggles_leaves_the_role_alone(client, db, agent_role):
    """A client that predates these fields keeps the old behaviour."""
    assert create_user(client, agent_role.id).status_code == 200
    assert role_of(db, NEW_USER["email"]).id == agent_role.id


def test_all_org_chats_derives_a_role_without_touching_the_original(
    client, db, agent_role
):
    response = create_user(
        client, agent_role.id, see_all_ai_chats=True, see_all_org_chats=True
    )
    assert response.status_code == 200

    assigned = role_of(db, NEW_USER["email"])
    assert assigned.id != agent_role.id
    assert assigned.name == "Agent (all chats)"
    assert granted(assigned) == set(DEFAULT_AGENT_ROLE_PERMISSIONS) | {"view_all_chats"}
    assert assigned.is_default is False

    # Everyone else on Agent is unaffected — the whole point of deriving.
    db.refresh(agent_role)
    assert granted(agent_role) == set(DEFAULT_AGENT_ROLE_PERMISSIONS)


def test_a_second_person_with_the_same_scope_reuses_the_derived_role(
    client, db, agent_role
):
    """Otherwise one role per invite piles up in the Roles screen."""
    create_user(client, agent_role.id, see_all_ai_chats=True, see_all_org_chats=True)
    first = role_of(db, NEW_USER["email"]).id

    client.post(
        f"{settings.API_V1_STR}/users",
        json={**NEW_USER, "email": "second@test.com", "role_id": agent_role.id,
              "see_all_ai_chats": True, "see_all_org_chats": True},
    )
    assert role_of(db, "second@test.com").id == first
    assert db.query(Role).filter(Role.name == "Agent (all chats)").count() == 1


def test_unticking_the_ai_queue_narrows_rather_than_widens(client, db, agent_role):
    response = create_user(
        client, agent_role.id, see_all_ai_chats=False, see_all_org_chats=False
    )
    assert response.status_code == 200

    assigned = role_of(db, NEW_USER["email"])
    assert assigned.id != agent_role.id
    assert "view_unassigned_chats" not in granted(assigned)
    assert granted(assigned) == set(DEFAULT_AGENT_ROLE_PERMISSIONS) - {
        "view_unassigned_chats"
    }


def test_cannot_grant_a_scope_you_do_not_hold(db, organization, permissions, agent_role):
    """Same rule as the Roles editor, reached by a different door."""
    limited_role = make_role(
        db, organization, permissions, "Team Lead",
        ["manage_users", "view_assigned_chats"],
    )
    lead = User(
        id=uuid4(), email="lead@test.com", full_name="Lead",
        hashed_password=get_password_hash("x"), organization_id=organization.id,
        role_id=limited_role.id, is_active=True,
    )
    db.add(lead)
    db.commit()

    async def override_current_user():
        return lead

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = override_current_user
    try:
        response = create_user(
            TestClient(app), agent_role.id,
            see_all_ai_chats=True, see_all_org_chats=True,
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
    assert "view_all_chats" in response.json()["detail"]
    assert db.query(User).filter(User.email == NEW_USER["email"]).first() is None


def test_super_admin_role_is_never_derived_from(client, db, organization, permissions):
    """super_admin already passes every check; a widened copy grants nothing."""
    owner_role = make_role(
        db, organization, permissions, "Owner", ["super_admin", "manage_users"]
    )
    response = create_user(
        client, owner_role.id, see_all_ai_chats=True, see_all_org_chats=True
    )
    assert response.status_code == 200
    assert role_of(db, NEW_USER["email"]).id == owner_role.id


def test_editing_a_person_moves_them_to_the_scoped_role(client, db, agent_role):
    """The leave-cover case: widen one person mid-employment, not the team."""
    create_user(client, agent_role.id, see_all_ai_chats=True, see_all_org_chats=False)
    user = db.query(User).filter(User.email == NEW_USER["email"]).first()
    assert user.role_id == agent_role.id

    response = client.put(
        f"{settings.API_V1_STR}/users/{user.id}",
        json={"see_all_org_chats": True},
    )
    assert response.status_code == 200

    db.expire_all()
    assigned = role_of(db, NEW_USER["email"])
    assert assigned.id != agent_role.id
    assert "view_all_chats" in granted(assigned)
    db.refresh(agent_role)
    assert "view_all_chats" not in granted(agent_role)


def test_rescoping_does_not_stack_suffixes_on_the_name(client, db, agent_role):
    """Widen someone, then narrow them: "Agent (assigned only)", not
    "Agent (all chats) (assigned only)"."""
    create_user(client, agent_role.id, see_all_ai_chats=True, see_all_org_chats=True)
    user = db.query(User).filter(User.email == NEW_USER["email"]).first()
    assert role_of(db, NEW_USER["email"]).name == "Agent (all chats)"

    response = client.put(
        f"{settings.API_V1_STR}/users/{user.id}",
        json={"see_all_ai_chats": False, "see_all_org_chats": False},
    )
    assert response.status_code == 200

    db.expire_all()
    assert role_of(db, NEW_USER["email"]).name == "Agent (assigned only)"


def test_toggles_win_over_the_dropdown_when_they_resolve_elsewhere(
    client, db, agent_role
):
    """Re-picking the base role while leaving the scope ticked must not narrow
    someone who is already on the derived role."""
    create_user(client, agent_role.id, see_all_ai_chats=True, see_all_org_chats=True)
    user = db.query(User).filter(User.email == NEW_USER["email"]).first()
    derived_id = role_of(db, NEW_USER["email"]).id
    assert derived_id != agent_role.id

    response = client.put(
        f"{settings.API_V1_STR}/users/{user.id}",
        json={
            "role_id": agent_role.id,
            "see_all_ai_chats": True,
            "see_all_org_chats": True,
        },
    )
    assert response.status_code == 200

    db.expire_all()
    assert role_of(db, NEW_USER["email"]).id == derived_id


def test_editing_without_the_toggles_keeps_the_role(client, db, agent_role):
    create_user(client, agent_role.id)
    user = db.query(User).filter(User.email == NEW_USER["email"]).first()

    response = client.put(
        f"{settings.API_V1_STR}/users/{user.id}", json={"full_name": "Renamed"}
    )
    assert response.status_code == 200
    db.expire_all()
    assert role_of(db, NEW_USER["email"]).id == agent_role.id


def test_a_foreign_orgs_role_is_still_refused(client, db, permissions):
    """The toggles must not become a way around the tenant check."""
    other_org = Organization(id=uuid4(), name="Other", domain="other.test")
    db.add(other_org)
    db.commit()
    foreign = Role(name="Agent", organization_id=other_org.id)
    foreign.permissions = [permissions["view_assigned_chats"]]
    db.add(foreign)
    db.commit()

    response = create_user(client, foreign.id, see_all_org_chats=True)
    assert response.status_code == 404
