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

from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx

from app.core.config import settings
from app.core.logger import get_logger
from app.crm.base import (
    CrmAdapter, CrmAuthError, CrmPushResult, CrmTransientError,
    LeadPayload, OAuthTokens, classify_error_response, get_http_client,
    summarize_provider_error,
)
from app.crm.mapping import build_note_body, split_name
from app.crm.registry import register_adapter
from app.models.crm import CrmProvider

logger = get_logger(__name__)

AUTHORIZE_URL = "https://app.hubspot.com/oauth/authorize"
API_BASE = "https://api.hubapi.com"
TOKEN_URL = f"{API_BASE}/oauth/v1/token"
# Request only what the push needs — the marketplace review checks scope usage.
SCOPES = "crm.objects.contacts.read crm.objects.contacts.write"
# HubSpot-defined association type: note -> contact.
NOTE_TO_CONTACT_ASSOCIATION_TYPE_ID = 202


class HubSpotAdapter(CrmAdapter):
    """Pushes a lead as a Contact (email upsert) plus a context Note.

    HubSpot's separate "Leads" object is deliberately not used: it requires a
    paid-seat owner and an existing contact, which doesn't fit lead capture.
    """

    provider = CrmProvider.HUBSPOT.value

    def get_authorize_url(self, state: str, redirect_uri: str) -> str:
        return f"{AUTHORIZE_URL}?" + urlencode({
            "client_id": settings.HUBSPOT_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "scope": SCOPES,
            "state": state,
        })

    async def exchange_code(self, code: str, redirect_uri: str) -> OAuthTokens:
        tokens = await self._token_request({
            "grant_type": "authorization_code",
            "client_id": settings.HUBSPOT_CLIENT_ID,
            "client_secret": settings.HUBSPOT_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "code": code,
        })
        # Token introspection carries the portal identity (hub_id/domain).
        response = await get_http_client().get(
            f"{API_BASE}/oauth/v1/access-tokens/{tokens.access_token}")
        if response.status_code == 200:
            info = response.json()
            tokens.external_account_id = str(info.get("hub_id", ""))
            tokens.display_name = info.get("hub_domain")
        return tokens

    async def refresh_tokens(self, tokens: OAuthTokens) -> OAuthTokens:
        refreshed = await self._token_request({
            "grant_type": "refresh_token",
            "client_id": settings.HUBSPOT_CLIENT_ID,
            "client_secret": settings.HUBSPOT_CLIENT_SECRET,
            "refresh_token": tokens.refresh_token,
        })
        refreshed.external_account_id = tokens.external_account_id
        refreshed.display_name = tokens.display_name
        return refreshed

    async def push_lead(self, tokens: OAuthTokens, payload: LeadPayload) -> CrmPushResult:
        properties = self._contact_properties(payload)
        try:
            response = await get_http_client().post(
                f"{API_BASE}/crm/v3/objects/contacts/batch/upsert",
                headers=self._auth_header(tokens),
                json={"inputs": [{
                    "id": payload.email,
                    "idProperty": "email",
                    "properties": properties,
                }]},
            )
        except httpx.HTTPError as e:
            return CrmPushResult(ok=False, error=f"network error: {e}", retryable=True)

        if response.status_code not in (200, 201):
            return classify_error_response(response)

        results = response.json().get("results") or [{}]
        contact_id = str(results[0].get("id", ""))
        action = "created" if results[0].get("new") else "updated"

        await self._attach_note(tokens, contact_id, payload)

        record_url = None
        if tokens.external_account_id and contact_id:
            record_url = (f"https://app.hubspot.com/contacts/"
                          f"{tokens.external_account_id}/record/0-1/{contact_id}")
        return CrmPushResult(ok=True, action=action, contact_id=contact_id,
                             record_url=record_url)

    async def revoke(self, tokens: OAuthTokens) -> None:
        try:
            await get_http_client().delete(
                f"{API_BASE}/oauth/v1/refresh-tokens/{tokens.refresh_token}")
        except Exception as e:
            logger.warning(f"HubSpot token revocation failed (ignored): {e}")

    async def test_connection(self, tokens: OAuthTokens) -> dict:
        try:
            response = await get_http_client().get(
                f"{API_BASE}/oauth/v1/access-tokens/{tokens.access_token}")
        except httpx.HTTPError as e:
            return {"ok": False, "account_name": None, "error": f"network error: {e}"}
        if response.status_code != 200:
            return {"ok": False, "account_name": None,
                    "error": f"HTTP {response.status_code}"}
        return {"ok": True, "account_name": response.json().get("hub_domain"),
                "error": None}

    async def _token_request(self, data: dict) -> OAuthTokens:
        try:
            response = await get_http_client().post(
                TOKEN_URL, data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        except httpx.HTTPError as e:
            raise CrmTransientError(f"HubSpot token endpoint unreachable: {e}")
        if response.status_code >= 500:
            raise CrmTransientError(f"HubSpot token endpoint HTTP {response.status_code}")
        if response.status_code != 200:
            # 400 invalid_grant / bad client config — retrying cannot help.
            logger.warning(f"HubSpot token request rejected: {response.text[:500]}")
            raise CrmAuthError(f"HubSpot rejected the token request: {summarize_provider_error(response.text)}")
        body = response.json()
        return OAuthTokens(
            access_token=body["access_token"],
            refresh_token=body.get("refresh_token", data.get("refresh_token", "")),
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=body.get("expires_in", 1800)),
            raw=body,
        )

    def _contact_properties(self, payload: LeadPayload) -> dict:
        first, last = split_name(payload.name)
        properties = {
            "email": payload.email,
            "firstname": first,
            "lastname": last,
            "phone": payload.phone,
            "company": payload.company,
            # Backward lifecycle moves are ignored by HubSpot, so this is
            # safe on updates too.
            "lifecyclestage": "lead",
        }
        return {k: v for k, v in properties.items() if v}

    async def _attach_note(self, tokens: OAuthTokens, contact_id: str,
                           payload: LeadPayload) -> None:
        """Context note (summary/custom answers/source). Best-effort: the
        contact is the push — a failed note never fails the job."""
        if not contact_id:
            return
        try:
            response = await get_http_client().post(
                f"{API_BASE}/crm/v3/objects/notes",
                headers=self._auth_header(tokens),
                json={
                    "properties": {
                        "hs_timestamp": int(datetime.now(timezone.utc).timestamp() * 1000),
                        "hs_note_body": build_note_body(payload),
                    },
                    "associations": [{
                        "to": {"id": contact_id},
                        "types": [{
                            "associationCategory": "HUBSPOT_DEFINED",
                            "associationTypeId": NOTE_TO_CONTACT_ASSOCIATION_TYPE_ID,
                        }],
                    }],
                },
            )
            if response.status_code not in (200, 201):
                logger.warning(f"HubSpot note attach failed: HTTP {response.status_code}")
        except httpx.HTTPError as e:
            logger.warning(f"HubSpot note attach failed: {e}")

    @staticmethod
    def _auth_header(tokens: OAuthTokens) -> dict:
        return {"Authorization": f"Bearer {tokens.access_token}"}


register_adapter(HubSpotAdapter())
