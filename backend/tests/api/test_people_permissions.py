"""
Copyright 2024-2026 Komi AI

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Permission coverage for the People directory.

Deliberately a separate module from test_people_crm_api.py: that file's autouse
fixture stubs `_require_people_access` out entirely so it can focus on CRM
behaviour, which means no permission assertion made there can ever fail.
"""

from uuid import uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api import people as people_api
from app.core.auth import get_current_user
from app.database import get_db
from app.models.customer import Customer
from app.models.organization import Organization
from app.models.permission import Permission
from app.models.role import Role
from app.models.user import User

BASE = "/api/v1/people"

@pytest.fixture(autouse=True)
def without_the_plan_gate(monkeypatch):
    """The Pro (lead_capture) gate runs after the permission check and would
    otherwise answer first in an enterprise checkout, so these would silently
    skip exactly where the hosted product runs. Permissions are the subject."""
    monkeypatch.setattr(people_api, "HAS_ENTERPRISE", False)


@pytest.fixture
def api() -> FastAPI:
    app = FastAPI()
    app.include_router(people_api.router, prefix=BASE)
    return app


@pytest.fixture
def person(db, test_organization) -> Customer:
    customer = Customer(
        organization_id=test_organization.id,
        email="nadia@example.com",
        full_name="Nadia Rahman",
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def _user_with(db, organization, permission_names) -> User:
    role = Role(name=f"Role {uuid4().hex[:6]}", organization_id=organization.id)
    role.permissions = [Permission(name=name) for name in permission_names]
    db.add(role)
    db.commit()
    db.refresh(role)
    user = User(
        id=uuid4(),
        email=f"person-{uuid4().hex[:6]}@example.com",
        full_name="Someone",
        hashed_password="x",
        is_active=True,
        organization_id=organization.id,
        role_id=role.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _client(api: FastAPI, db, user: User) -> TestClient:
    async def override_user():
        return user

    def override_db():
        yield db

    api.dependency_overrides[get_current_user] = override_user
    api.dependency_overrides[get_db] = override_db
    return TestClient(api)


def test_view_people_can_read_the_directory(api, db, test_organization, person):
    user = _user_with(db, test_organization, ["view_people"])

    response = _client(api, db, user).get(BASE)

    assert response.status_code == 200


def test_view_people_can_correct_a_person(api, db, test_organization, person):
    """people.py documents the PATCH as the agent's identification tool — the
    one path allowed to correct a wrong phone number. It used to need the
    org-wide chat grants, so the Edit button rendered for an agent and 403'd."""
    user = _user_with(db, test_organization, ["view_people"])

    response = _client(api, db, user).patch(
        f"{BASE}/{person.id}", json={"full_name": "Corrected Name"}
    )

    assert response.status_code == 200


def test_view_people_can_mark_a_customer(api, db, test_organization, person):
    user = _user_with(db, test_organization, ["view_people"])

    response = _client(api, db, user).post(f"{BASE}/{person.id}/mark-customer")

    assert response.status_code == 200


def test_an_assigned_chats_agent_can_read_the_directory(api, db, test_organization, person):
    """PEOPLE_READ includes the inbox grants, not just view_people"""
    user = _user_with(db, test_organization, ["view_assigned_chats"])

    assert _client(api, db, user).get(BASE).status_code == 200


def test_a_role_without_a_people_grant_is_refused(api, db, test_organization, person):
    """Widening the write set must not widen who gets in at all"""
    user = _user_with(db, test_organization, ["manage_knowledge"])
    client = _client(api, db, user)

    assert client.get(BASE).status_code == 403
    assert client.patch(f"{BASE}/{person.id}", json={"full_name": "Nope"}).status_code == 403
    assert client.post(f"{BASE}/{person.id}/mark-customer").status_code == 403


def test_people_are_org_scoped(api, db, test_organization, person):
    """A person from another tenant is not in this directory"""
    other_org = Organization(id=uuid4(), name="Other", domain="other-people.example.com")
    db.add(other_org)
    db.commit()
    db.add(Customer(
        organization_id=other_org.id,
        email="outsider@example.com",
        full_name="Outsider",
    ))
    db.commit()
    user = _user_with(db, test_organization, ["view_people"])

    response = _client(api, db, user).get(BASE)

    assert response.status_code == 200
    assert "outsider@example.com" not in str(response.json())
