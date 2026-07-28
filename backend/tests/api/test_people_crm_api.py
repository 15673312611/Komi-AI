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

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

import app.main  # noqa: F401 — ensures routers are registered
import app.api.people as people_api
from app.core.application import app
from app.core.auth import get_current_user
from app.crm.base import CrmPushResult, OAuthTokens
from app.crm.hubspot import HubSpotAdapter
from app.database import get_db
from app.models.customer import Customer
from app.repositories.crm import CrmConnectionRepository

BASE = "/api/v1/people"


@pytest.fixture
def client(db, test_user):
    async def override_user():
        return test_user

    def override_db():
        yield db

    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_db] = override_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def _open_gates(monkeypatch):
    """Bypass the People/Lead-Management plan gate and the crm_sync gate so
    these tests exercise the endpoints regardless of enterprise presence."""
    monkeypatch.setattr(people_api, "_require_people_access", lambda *a, **k: None)
    monkeypatch.setattr("app.services.crm_sync.feature_allowed", lambda *a, **k: True)


@pytest.fixture
def person(db, test_organization):
    cust = Customer(organization_id=test_organization.id,
                    email="nadia@example.com", full_name="Nadia Rahman")
    db.add(cust)
    db.commit()
    db.refresh(cust)
    return cust


@pytest.fixture
def connection(db, test_organization):
    return CrmConnectionRepository(db).create_or_update(
        organization_id=test_organization.id, provider="hubspot",
        external_account_id="12345",
        credentials={"access_token": "at", "refresh_token": "rt", "api_domain": None},
        access_token_expires_at=datetime.now(timezone.utc) + timedelta(hours=1))


OK = CrmPushResult(ok=True, action="created", contact_id="301",
                   record_url="https://app.hubspot.com/contacts/1/record/0-1/301")


def test_status_no_connection(client, person):
    r = client.get(f"{BASE}/{person.id}/crm")
    assert r.status_code == 200
    body = r.json()
    assert body["connected_providers"] == []
    assert body["synced"] == []


def test_status_lists_connection(client, person, connection):
    r = client.get(f"{BASE}/{person.id}/crm")
    assert r.json()["connected_providers"] == ["hubspot"]


def test_sync_now_pushes_and_returns_link(client, person, connection, monkeypatch):
    monkeypatch.setattr(HubSpotAdapter, "push_lead", AsyncMock(return_value=OK))
    r = client.post(f"{BASE}/{person.id}/crm-sync")
    assert r.status_code == 200
    synced = r.json()["synced"]
    assert len(synced) == 1
    assert synced[0]["provider"] == "hubspot"
    assert synced[0]["record_url"] == OK.record_url


def test_sync_now_without_connection_400(client, person):
    r = client.post(f"{BASE}/{person.id}/crm-sync")
    assert r.status_code == 400
    assert "Connect a CRM" in r.json()["detail"]


def test_sync_now_placeholder_email_400(client, db, test_organization, connection):
    anon = Customer(organization_id=test_organization.id, email="visitor@noemail.com")
    db.add(anon); db.commit(); db.refresh(anon)
    r = client.post(f"{BASE}/{anon.id}/crm-sync")
    assert r.status_code == 400
    assert "email" in r.json()["detail"].lower()


def test_status_unknown_person_404(client):
    import uuid
    r = client.get(f"{BASE}/{uuid.uuid4()}/crm")
    assert r.status_code == 404
