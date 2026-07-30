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

import json
import uuid
from datetime import datetime, timedelta, timezone

import httpx
import pytest

import app.crm.base as crm_base
from app.core.config import settings
from app.crm.base import CrmAuthError, LeadPayload, OAuthTokens
from app.crm.pipedrive import PipedriveAdapter
from app.crm.registry import get_adapter

API_DOMAIN = "https://acme.pipedrive.com"


@pytest.fixture
def adapter():
    return PipedriveAdapter()


@pytest.fixture
def tokens():
    return OAuthTokens(access_token="at", refresh_token="rt", api_domain=API_DOMAIN,
                       external_account_id="777", display_name="Acme")


@pytest.fixture
def payload():
    return LeadPayload(
        lead_response_id=uuid.uuid4(),
        email="jane@acme.com", name="Jane Doe", phone="+15550100",
        summary="Wants a demo", custom_fields={"Team size": "40"},
    )


@pytest.fixture
def http(monkeypatch):
    """MockTransport routed by url substring; records requests in order."""
    recorded = []
    responses = {}

    def handler(request: httpx.Request) -> httpx.Response:
        recorded.append(request)
        for fragment, (status, body) in responses.items():
            if fragment in str(request.url):
                return httpx.Response(status, json=body)
        return httpx.Response(200, json={})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    monkeypatch.setattr(crm_base, "_http_client", client)
    return {"requests": recorded, "respond": responses}


class TestRegistry:

    def test_both_adapters_resolve(self):
        assert get_adapter("hubspot") is not None
        assert get_adapter("pipedrive") is not None
        assert get_adapter("salesforce") is None  # phase 2


class TestTokenFlows:

    @pytest.mark.asyncio
    async def test_exchange_code_captures_api_domain_and_company(self, adapter, http,
                                                                 monkeypatch):
        monkeypatch.setattr(settings, "PIPEDRIVE_CLIENT_ID", "cid")
        monkeypatch.setattr(settings, "PIPEDRIVE_CLIENT_SECRET", "sek")
        http["respond"]["oauth.pipedrive.com/oauth/token"] = (200, {
            "access_token": "new-at", "refresh_token": "new-rt",
            "expires_in": 3600, "api_domain": API_DOMAIN})
        http["respond"]["users/me"] = (200, {
            "data": {"company_id": 777, "company_name": "Acme"}})

        tokens = await adapter.exchange_code("code-1", "https://app/cb")

        assert tokens.api_domain == API_DOMAIN
        assert tokens.external_account_id == "777"
        assert tokens.display_name == "Acme"
        # Sliding refresh expiry stamped ~60 days out.
        assert tokens.refresh_token_expires_at > datetime.now(timezone.utc) + timedelta(days=59)
        # Token endpoint used HTTP Basic (client_id:secret), not body params.
        token_request = http["requests"][0]
        assert token_request.headers["Authorization"].startswith("Basic ")

    @pytest.mark.asyncio
    async def test_refresh_slides_window_and_keeps_identity(self, adapter, http, tokens):
        http["respond"]["oauth/token"] = (200, {
            "access_token": "at2", "expires_in": 3600})
        refreshed = await adapter.refresh_tokens(tokens)
        assert refreshed.access_token == "at2"
        assert refreshed.refresh_token == "rt"          # not rotated → kept
        assert refreshed.api_domain == API_DOMAIN        # kept from old tokens
        assert refreshed.external_account_id == "777"
        assert refreshed.refresh_token_expires_at is not None

    @pytest.mark.asyncio
    async def test_refresh_rejection_is_auth_error(self, adapter, http, tokens):
        http["respond"]["oauth/token"] = (400, {"error": "invalid_grant"})
        with pytest.raises(CrmAuthError):
            await adapter.refresh_tokens(tokens)


class TestPushLead:

    @pytest.mark.asyncio
    async def test_new_person_new_lead_with_note(self, adapter, http, tokens, payload):
        http["respond"]["persons/search"] = (200, {"data": {"items": []}})
        http["respond"]["api/v2/persons"] = (201, {"data": {"id": 42}})
        # Fragment order matters: the open-lead listing (GET …/leads?person_id=…)
        # must match before the creation POST's fragment.
        http["respond"]["api/v1/leads?"] = (200, {"data": []})
        http["respond"]["api/v1/leads"] = (201, {"data": {"id": "lead-1"}})
        http["respond"]["api/v1/notes"] = (201, {"data": {"id": 9}})

        result = await adapter.push_lead(tokens, payload)

        assert result.ok and result.action == "created"
        assert result.contact_id == "42"
        assert result.secondary_id == "lead-1"
        assert result.record_url == f"{API_DOMAIN}/person/42"

        urls = [str(r.url) for r in http["requests"]]
        assert "persons/search" in urls[0]
        assert urls[1].endswith("/api/v2/persons")
        # Lead listing (open-lead check) precedes lead creation.
        assert "api/v1/leads?" in urls[2]
        assert urls[3].endswith("/api/v1/leads")
        assert urls[4].endswith("/api/v1/notes")

        person = json.loads(http["requests"][1].content)
        assert person["emails"][0]["value"] == "jane@acme.com"
        note = json.loads(http["requests"][4].content)
        assert note["lead_id"] == "lead-1"
        assert "<b>Team size:</b> 40" in note["content"]

    @pytest.mark.asyncio
    async def test_company_links_organization(self, adapter, http, tokens):
        payload = LeadPayload(lead_response_id=uuid.uuid4(), email="jane@acme.com",
                              name="Jane Doe", company="Acme Inc")
        http["respond"]["organizations/search"] = (200, {"data": {"items": []}})
        http["respond"]["api/v2/organizations"] = (201, {"data": {"id": 77}})
        http["respond"]["persons/search"] = (200, {"data": {"items": []}})
        http["respond"]["api/v2/persons"] = (201, {"data": {"id": 42}})
        http["respond"]["api/v1/leads?"] = (200, {"data": []})
        http["respond"]["api/v1/leads"] = (201, {"data": {"id": "lead-1"}})

        result = await adapter.push_lead(tokens, payload)

        assert result.ok
        # Org found-or-created, then the person body carries org_id.
        org_create = next(r for r in http["requests"]
                          if r.method == "POST" and r.url.path.endswith("/api/v2/organizations"))
        assert json.loads(org_create.content)["name"] == "Acme Inc"
        person_create = next(r for r in http["requests"]
                             if r.method == "POST" and r.url.path.endswith("/api/v2/persons"))
        assert json.loads(person_create.content)["org_id"] == 77
        # The Lead carries its own organization_id (separate from the person's).
        lead_create = next(r for r in http["requests"]
                           if r.method == "POST" and r.url.path.endswith("/api/v1/leads"))
        assert json.loads(lead_create.content)["organization_id"] == 77

    @pytest.mark.asyncio
    async def test_no_company_skips_org_calls(self, adapter, http, tokens, payload):
        # payload has no company → no organization API calls at all.
        http["respond"]["persons/search"] = (200, {"data": {"items": []}})
        http["respond"]["api/v2/persons"] = (201, {"data": {"id": 42}})
        http["respond"]["api/v1/leads?"] = (200, {"data": []})
        http["respond"]["api/v1/leads"] = (201, {"data": {"id": "lead-1"}})
        await adapter.push_lead(tokens, payload)
        assert not any("organizations" in str(r.url) for r in http["requests"])

    @pytest.mark.asyncio
    async def test_existing_person_gets_blanks_filled_only(self, adapter, http,
                                                           tokens, payload):
        http["respond"]["persons/search"] = (200, {"data": {"items": [
            {"item": {"id": 42, "name": "Jane Doe", "phones": []}}]}})
        http["respond"]["api/v2/persons/42"] = (200, {"data": {"id": 42}})
        http["respond"]["api/v1/leads?"] = (200, {"data": []})
        http["respond"]["api/v1/leads"] = (201, {"data": {"id": "lead-1"}})

        result = await adapter.push_lead(tokens, payload)
        assert result.ok and result.action == "updated"

        patch = next(r for r in http["requests"] if r.method == "PATCH")
        body = json.loads(patch.content)
        assert "name" not in body            # already set — not clobbered
        assert body["phones"][0]["value"] == "+15550100"  # blank → filled

    @pytest.mark.asyncio
    async def test_open_lead_skips_lead_creation(self, adapter, http, tokens, payload):
        http["respond"]["persons/search"] = (200, {"data": {"items": [
            {"item": {"id": 42, "name": "Jane Doe", "phones": [{"value": "+1"}]}}]}})
        http["respond"]["api/v1/leads?"] = (200, {"data": [{"id": "existing-lead"}]})

        result = await adapter.push_lead(tokens, payload)

        assert result.ok and result.secondary_id is None
        # No POST to /api/v1/leads and no note.
        posts = [r for r in http["requests"] if r.method == "POST"]
        assert posts == []

    @pytest.mark.asyncio
    async def test_lead_listing_failure_retries_instead_of_duplicating(
            self, adapter, http, tokens, payload):
        http["respond"]["persons/search"] = (200, {"data": {"items": [
            {"item": {"id": 42, "name": "Jane Doe", "phones": [{"value": "+1"}]}}]}})
        http["respond"]["api/v1/leads?"] = (500, {"error": "flaky"})

        result = await adapter.push_lead(tokens, payload)

        assert not result.ok and result.retryable
        # No lead was blindly created while the open-lead check was failing.
        assert [r for r in http["requests"] if r.method == "POST"] == []

    @pytest.mark.asyncio
    async def test_search_401_flags_auth_failure(self, adapter, http, tokens, payload):
        http["respond"]["persons/search"] = (401, {"error": "unauthorized"})
        result = await adapter.push_lead(tokens, payload)
        assert not result.ok and result.auth_failed

    @pytest.mark.asyncio
    async def test_person_create_429_is_retryable(self, adapter, http, monkeypatch,
                                                  tokens, payload):
        def handler(request):
            if "persons/search" in str(request.url):
                return httpx.Response(200, json={"data": {"items": []}})
            return httpx.Response(429, headers={"Retry-After": "5"}, json={})
        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        monkeypatch.setattr(crm_base, "_http_client", client)

        result = await adapter.push_lead(tokens, payload)
        assert not result.ok and result.retryable
        assert result.retry_after_seconds == 5

    @pytest.mark.asyncio
    async def test_network_error_is_retryable(self, adapter, monkeypatch, tokens, payload):
        def handler(request):
            raise httpx.ConnectError("connection refused")
        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        monkeypatch.setattr(crm_base, "_http_client", client)

        result = await adapter.push_lead(tokens, payload)
        assert not result.ok and result.retryable


class TestConnectionLifecycle:

    @pytest.mark.asyncio
    async def test_test_connection_ok(self, adapter, http, tokens):
        http["respond"]["users/me"] = (200, {"data": {"company_name": "Acme"}})
        info = await adapter.test_connection(tokens)
        assert info == {"ok": True, "account_name": "Acme", "error": None}

    @pytest.mark.asyncio
    async def test_revoke_never_raises(self, adapter, monkeypatch, tokens):
        def handler(request):
            raise httpx.ConnectError("connection refused")
        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        monkeypatch.setattr(crm_base, "_http_client", client)
        await adapter.revoke(tokens)  # must not raise
