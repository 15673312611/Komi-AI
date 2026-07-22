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

import base64
import hashlib
import hmac
import time
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

import app.main  # noqa: F401 — ensures routers are registered on the FastAPI app
import app.api.crm as crm_api
from app.core.application import app
from app.core.auth import get_current_user
from app.core.config import settings
from app.crm.base import OAuthTokens
from app.crm.hubspot import HubSpotAdapter
from app.crm.pipedrive import PipedriveAdapter
from app.database import get_db
from app.models.crm import CrmConnectionStatus, CrmSyncJobStatus
from app.models.lead_capture import LeadCaptureResponse
from app.repositories.crm import CrmConnectionRepository, CrmSyncJobRepository

BASE = "/api/v1/crm"


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


@pytest.fixture
def crm_settings(monkeypatch):
    monkeypatch.setattr(settings, "HUBSPOT_CLIENT_ID", "hs-cid")
    monkeypatch.setattr(settings, "HUBSPOT_CLIENT_SECRET", "hs-sek")
    monkeypatch.setattr(settings, "PIPEDRIVE_CLIENT_ID", "pd-cid")
    monkeypatch.setattr(settings, "PIPEDRIVE_CLIENT_SECRET", "pd-sek")


@pytest.fixture
def connection(db, test_organization):
    return CrmConnectionRepository(db).create_or_update(
        organization_id=test_organization.id,
        provider="hubspot",
        external_account_id="12345",
        credentials={"access_token": "at", "refresh_token": "rt", "api_domain": None},
        display_name="acme.hubspot.com",
        access_token_expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )


def _lead_response(db, org, agent, customer):
    response = LeadCaptureResponse(
        organization_id=org.id, agent_id=agent.id, customer_id=customer.id,
        field_values={"email": "lead@example.com"}, consent=True)
    db.add(response)
    db.commit()
    db.refresh(response)
    return response


class TestInstall:

    def test_redirects_to_provider_consent(self, client, crm_settings):
        r = client.get(f"{BASE}/hubspot/install", follow_redirects=False)
        assert r.status_code == 307
        location = r.headers["location"]
        assert location.startswith("https://app.hubspot.com/oauth/authorize?")
        assert "state=" in location

    def test_unknown_provider_404(self, client, crm_settings):
        assert client.get(f"{BASE}/zoho/install",
                          follow_redirects=False).status_code == 404

    def test_unconfigured_credentials_400(self, client, monkeypatch):
        monkeypatch.setattr(settings, "PIPEDRIVE_CLIENT_ID", "")
        assert client.get(f"{BASE}/pipedrive/install",
                          follow_redirects=False).status_code == 400


class TestCallback:

    def test_happy_path_creates_encrypted_connection(
            self, client, crm_settings, db, test_organization, monkeypatch):
        crm_api._state_fallback["st-1"] = f"{test_organization.id}:hubspot"
        monkeypatch.setattr(HubSpotAdapter, "exchange_code", AsyncMock(
            return_value=OAuthTokens(
                access_token="new-at", refresh_token="new-rt",
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
                external_account_id="999", display_name="acme.hubspot.com")))

        r = client.get(f"{BASE}/hubspot/callback?code=c1&state=st-1",
                       follow_redirects=False)

        assert r.status_code == 307 and "status=success" in r.headers["location"]
        repo = CrmConnectionRepository(db)
        connection = repo.get_by_org_provider(test_organization.id, "hubspot")
        assert connection.status == CrmConnectionStatus.ACTIVE.value
        assert "new-at" not in connection.encrypted_credentials  # encrypted at rest
        assert repo.get_credentials(connection)["access_token"] == "new-at"

    def test_invalid_state_rejected(self, client, crm_settings):
        r = client.get(f"{BASE}/hubspot/callback?code=c1&state=bogus",
                       follow_redirects=False)
        assert "status=failure" in r.headers["location"]
        assert "invalid_state" in r.headers["location"]

    def test_state_provider_mismatch_rejected(self, client, crm_settings,
                                              test_organization):
        crm_api._state_fallback["st-2"] = f"{test_organization.id}:pipedrive"
        r = client.get(f"{BASE}/hubspot/callback?code=c1&state=st-2",
                       follow_redirects=False)
        assert "invalid_state" in r.headers["location"]

    def test_portal_connected_to_another_org_rejected(
            self, client, crm_settings, db, test_organization, monkeypatch):
        other_org_connection = CrmConnectionRepository(db).create_or_update(
            organization_id=_make_org(db).id, provider="hubspot",
            external_account_id="999", credentials={"access_token": "x"})
        assert other_org_connection is not None

        crm_api._state_fallback["st-3"] = f"{test_organization.id}:hubspot"
        monkeypatch.setattr(HubSpotAdapter, "exchange_code", AsyncMock(
            return_value=OAuthTokens(access_token="a", refresh_token="r",
                                     external_account_id="999")))
        r = client.get(f"{BASE}/hubspot/callback?code=c1&state=st-3",
                       follow_redirects=False)
        assert "account_connected_elsewhere" in r.headers["location"]

    def test_user_cancelled(self, client, crm_settings):
        r = client.get(f"{BASE}/hubspot/callback?error=access_denied",
                       follow_redirects=False)
        assert "reason=cancelled" in r.headers["location"]


class TestConnectionsList:

    def test_lists_with_recent_failures(self, client, crm_settings, db, connection,
                                        test_organization, test_agent, test_customer):
        lead = _lead_response(db, test_organization, test_agent, test_customer)
        job_repo = CrmSyncJobRepository(db)
        job = job_repo.enqueue(test_organization.id, lead.id, "hubspot")
        job_repo.fail(job, "boom")

        r = client.get(f"{BASE}/connections")
        assert r.status_code == 200
        [item] = r.json()
        assert item["provider"] == "hubspot"
        assert item["status"] == "active"
        assert item["recent_failures"] == 1
        assert "encrypted_credentials" not in item
        assert "access_token" not in str(item)


class TestTestEndpoint:

    def test_read_only_check(self, client, crm_settings, connection, monkeypatch):
        monkeypatch.setattr(HubSpotAdapter, "test_connection", AsyncMock(
            return_value={"ok": True, "account_name": "acme.hubspot.com",
                          "error": None}))
        r = client.post(f"{BASE}/hubspot/test")
        assert r.status_code == 200
        assert r.json() == {"ok": True, "account_name": "acme.hubspot.com",
                            "error": None}

    def test_not_connected_404(self, client, crm_settings):
        assert client.post(f"{BASE}/pipedrive/test").status_code == 404


class TestDisconnect:

    def test_revokes_deletes_and_skips_pending(
            self, client, crm_settings, db, connection,
            test_organization, test_agent, test_customer, monkeypatch):
        revoke = AsyncMock()
        monkeypatch.setattr(HubSpotAdapter, "revoke", revoke)
        lead = _lead_response(db, test_organization, test_agent, test_customer)
        job = CrmSyncJobRepository(db).enqueue(test_organization.id, lead.id, "hubspot")

        r = client.delete(f"{BASE}/hubspot")

        assert r.status_code == 200
        revoke.assert_awaited_once()
        assert CrmConnectionRepository(db).get_by_org_provider(
            test_organization.id, "hubspot") is None
        db.refresh(job)
        assert job.status == CrmSyncJobStatus.SKIPPED.value


class TestUninstallWebhooks:

    def test_pipedrive_uninstall_revokes_connection(
            self, client, crm_settings, db, test_organization):
        CrmConnectionRepository(db).create_or_update(
            organization_id=test_organization.id, provider="pipedrive",
            external_account_id="777", credentials={"access_token": "x"})
        auth = base64.b64encode(b"pd-cid:pd-sek").decode()

        r = client.post(f"{BASE}/pipedrive/uninstall",
                        json={"company_id": 777},
                        headers={"Authorization": f"Basic {auth}"})

        assert r.status_code == 200
        connection = CrmConnectionRepository(db).get_by_external_id("pipedrive", "777")
        assert connection.status == CrmConnectionStatus.REVOKED.value

    def test_pipedrive_bad_auth_is_uniform_404(self, client, crm_settings):
        bad = base64.b64encode(b"wrong:creds").decode()
        r = client.post(f"{BASE}/pipedrive/uninstall", json={"company_id": 1},
                        headers={"Authorization": f"Basic {bad}"})
        assert r.status_code == 404

    def test_hubspot_uninstall_with_valid_v3_signature(
            self, client, crm_settings, db, test_organization):
        CrmConnectionRepository(db).create_or_update(
            organization_id=test_organization.id, provider="hubspot",
            external_account_id="999", credentials={"access_token": "x"})
        body = b'[{"portalId": 999, "subscriptionType": "app.uninstalled"}]'
        timestamp = str(int(time.time() * 1000))
        url = f"http://testserver{BASE}/hubspot/uninstall"
        message = b"POST" + url.encode() + body + timestamp.encode()
        signature = base64.b64encode(
            hmac.new(b"hs-sek", message, hashlib.sha256).digest()).decode()

        r = client.post(f"{BASE}/hubspot/uninstall", content=body, headers={
            "Content-Type": "application/json",
            "X-HubSpot-Signature-v3": signature,
            "X-HubSpot-Request-Timestamp": timestamp,
        })

        assert r.status_code == 200
        connection = CrmConnectionRepository(db).get_by_external_id("hubspot", "999")
        assert connection.status == CrmConnectionStatus.REVOKED.value

    def test_hubspot_bad_signature_is_uniform_404(self, client, crm_settings):
        r = client.post(f"{BASE}/hubspot/uninstall", content=b"[]", headers={
            "X-HubSpot-Signature-v3": "bogus",
            "X-HubSpot-Request-Timestamp": str(int(time.time() * 1000)),
        })
        assert r.status_code == 404

    def test_hubspot_stale_timestamp_rejected(self, client, crm_settings):
        stale = str(int((time.time() - 3600) * 1000))
        r = client.post(f"{BASE}/hubspot/uninstall", content=b"[]", headers={
            "X-HubSpot-Signature-v3": "whatever",
            "X-HubSpot-Request-Timestamp": stale,
        })
        assert r.status_code == 404


def _make_org(db):
    from app.models.organization import Organization
    org = Organization(id=uuid.uuid4(), name=f"Other {uuid.uuid4().hex[:6]}",
                       domain=f"other-{uuid.uuid4().hex[:6]}.example.com",
                       timezone="UTC", is_active=True)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org
