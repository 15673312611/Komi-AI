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
"""

import json
import uuid

import httpx
import pytest

import app.crm.base as crm_base
from app.core.config import settings
from app.crm.base import CrmAuthError, CrmTransientError, LeadPayload, OAuthTokens
from app.crm.hubspot import HubSpotAdapter


@pytest.fixture
def adapter():
    return HubSpotAdapter()


@pytest.fixture
def tokens():
    return OAuthTokens(access_token="at", refresh_token="rt",
                       external_account_id="12345", display_name="acme.com")


@pytest.fixture
def payload():
    return LeadPayload(
        lead_response_id=uuid.uuid4(),
        email="jane@acme.com", name="Jane Doe", company="Acme",
        phone="+15550100", summary="Wants a demo",
        custom_fields={"Team size": "40"},
    )


@pytest.fixture
def http(monkeypatch):
    """Route CRM HTTP through a MockTransport; returns the recorded requests
    plus a `respond` dict mapping url-substring -> (status, json_body)."""
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


class TestAuthorizeUrl:

    def test_contains_client_id_scope_state(self, adapter, monkeypatch):
        monkeypatch.setattr(settings, "HUBSPOT_CLIENT_ID", "cid-1")
        url = adapter.get_authorize_url("state-xyz", "https://app/cb")
        assert url.startswith("https://app.hubspot.com/oauth/authorize?")
        assert "client_id=cid-1" in url
        assert "state=state-xyz" in url
        assert "crm.objects.contacts.write" in url


class TestTokenFlows:

    @pytest.mark.asyncio
    async def test_exchange_code_returns_portal_identity(self, adapter, http):
        http["respond"]["oauth/v1/token"] = (200, {
            "access_token": "new-at", "refresh_token": "new-rt", "expires_in": 1800})
        http["respond"]["oauth/v1/access-tokens/new-at"] = (200, {
            "hub_id": 999, "hub_domain": "acme.hubspot.com"})

        tokens = await adapter.exchange_code("code-1", "https://app/cb")
        assert tokens.access_token == "new-at"
        assert tokens.external_account_id == "999"
        assert tokens.display_name == "acme.hubspot.com"
        assert tokens.expires_at is not None

    @pytest.mark.asyncio
    async def test_refresh_rejection_is_auth_error(self, adapter, http, tokens):
        http["respond"]["oauth/v1/token"] = (400, {"error": "invalid_grant"})
        with pytest.raises(CrmAuthError):
            await adapter.refresh_tokens(tokens)

    @pytest.mark.asyncio
    async def test_refresh_5xx_is_transient(self, adapter, http, tokens):
        http["respond"]["oauth/v1/token"] = (502, {"error": "bad gateway"})
        with pytest.raises(CrmTransientError):
            await adapter.refresh_tokens(tokens)

    @pytest.mark.asyncio
    async def test_refresh_keeps_identity_and_refresh_token(self, adapter, http, tokens):
        http["respond"]["oauth/v1/token"] = (200, {"access_token": "at2", "expires_in": 1800})
        refreshed = await adapter.refresh_tokens(tokens)
        assert refreshed.access_token == "at2"
        # HubSpot doesn't rotate refresh tokens — the old one stays valid.
        assert refreshed.refresh_token == "rt"
        assert refreshed.external_account_id == "12345"


class TestPushLead:

    @pytest.mark.asyncio
    async def test_created_contact_with_note(self, adapter, http, tokens, payload):
        http["respond"]["batch/upsert"] = (200, {
            "results": [{"id": "301", "new": True}]})
        http["respond"]["objects/notes"] = (201, {"id": "n1"})

        result = await adapter.push_lead(tokens, payload)

        assert result.ok and result.action == "created"
        assert result.contact_id == "301"
        assert result.record_url == "https://app.hubspot.com/contacts/12345/record/0-1/301"

        upsert = json.loads(http["requests"][0].content)
        props = upsert["inputs"][0]["properties"]
        assert upsert["inputs"][0]["idProperty"] == "email"
        assert props["firstname"] == "Jane" and props["lastname"] == "Doe"
        assert props["lifecyclestage"] == "lead"

        note = json.loads(http["requests"][1].content)
        assert "<b>Team size:</b> 40" in note["properties"]["hs_note_body"]
        assert note["associations"][0]["to"]["id"] == "301"
        assert note["associations"][0]["types"][0]["associationTypeId"] == 202

    @pytest.mark.asyncio
    async def test_existing_contact_is_updated(self, adapter, http, tokens, payload):
        http["respond"]["batch/upsert"] = (200, {"results": [{"id": "301", "new": False}]})
        result = await adapter.push_lead(tokens, payload)
        assert result.ok and result.action == "updated"

    @pytest.mark.asyncio
    async def test_note_failure_does_not_fail_push(self, adapter, http, tokens, payload):
        http["respond"]["batch/upsert"] = (200, {"results": [{"id": "301", "new": True}]})
        http["respond"]["objects/notes"] = (500, {"error": "boom"})
        result = await adapter.push_lead(tokens, payload)
        assert result.ok

    @pytest.mark.asyncio
    async def test_401_flags_auth_failure(self, adapter, http, tokens, payload):
        http["respond"]["batch/upsert"] = (401, {"category": "EXPIRED_AUTHENTICATION"})
        result = await adapter.push_lead(tokens, payload)
        assert not result.ok and result.auth_failed and not result.retryable

    @pytest.mark.asyncio
    async def test_429_is_retryable_with_retry_after(self, adapter, http, monkeypatch,
                                                     tokens, payload):
        def handler(request):
            return httpx.Response(429, headers={"Retry-After": "11"}, json={})
        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        monkeypatch.setattr(crm_base, "_http_client", client)

        result = await adapter.push_lead(tokens, payload)
        assert not result.ok and result.retryable
        assert result.retry_after_seconds == 11

    @pytest.mark.asyncio
    async def test_5xx_is_retryable(self, adapter, http, tokens, payload):
        http["respond"]["batch/upsert"] = (503, {"error": "unavailable"})
        result = await adapter.push_lead(tokens, payload)
        assert not result.ok and result.retryable and not result.auth_failed

    @pytest.mark.asyncio
    async def test_validation_4xx_is_permanent(self, adapter, http, tokens, payload):
        http["respond"]["batch/upsert"] = (400, {"category": "VALIDATION_ERROR"})
        result = await adapter.push_lead(tokens, payload)
        assert not result.ok and not result.retryable and not result.auth_failed

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
        http["respond"]["access-tokens/at"] = (200, {"hub_domain": "acme.hubspot.com"})
        info = await adapter.test_connection(tokens)
        assert info == {"ok": True, "account_name": "acme.hubspot.com", "error": None}

    @pytest.mark.asyncio
    async def test_test_connection_dead_token(self, adapter, http, tokens):
        http["respond"]["access-tokens/at"] = (401, {})
        info = await adapter.test_connection(tokens)
        assert info["ok"] is False

    @pytest.mark.asyncio
    async def test_revoke_never_raises(self, adapter, monkeypatch, tokens):
        def handler(request):
            raise httpx.ConnectError("connection refused")
        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        monkeypatch.setattr(crm_base, "_http_client", client)
        await adapter.revoke(tokens)  # must not raise
