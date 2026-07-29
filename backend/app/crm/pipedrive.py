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
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlencode

import httpx

from app.core.config import settings
from app.core.logger import get_logger
from app.crm.base import (
    CrmAdapter, CrmAuthError, CrmPushResult, CrmTransientError,
    LeadPayload, OAuthTokens, classify_error_response, get_http_client,
)
from app.crm.mapping import build_note_body
from app.crm.registry import register_adapter
from app.models.crm import CrmProvider

logger = get_logger(__name__)

AUTHORIZE_URL = "https://oauth.pipedrive.com/oauth/authorize"
TOKEN_URL = "https://oauth.pipedrive.com/oauth/token"
REVOKE_URL = "https://oauth.pipedrive.com/oauth/revoke"
# Refresh tokens die 60 days after their LAST use (sliding window) — every
# refresh restamps this; the worker's proactive sweep keeps idle tenants alive.
REFRESH_TOKEN_LIFETIME_DAYS = 60


class PipedriveAdapter(CrmAdapter):
    """Pushes a lead as Person (v2, email-deduped) + Lead (v1) + context Note.

    All API calls go to the tenant's `api_domain` from the token response.
    A push is ~4 sequential calls, well under the 10 req/2s search cap; the
    worker additionally serializes pushes per organization.
    """

    provider = CrmProvider.PIPEDRIVE.value

    def get_authorize_url(self, state: str, redirect_uri: str) -> str:
        # Scopes are declared on the app in Developer Hub, not in the URL.
        return f"{AUTHORIZE_URL}?" + urlencode({
            "client_id": settings.PIPEDRIVE_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "state": state,
        })

    async def exchange_code(self, code: str, redirect_uri: str) -> OAuthTokens:
        tokens = await self._token_request({
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        })
        # Company identity comes from users/me on the tenant's api_domain.
        try:
            response = await get_http_client().get(
                f"{tokens.api_domain}/api/v1/users/me",
                headers=self._auth_header(tokens))
            if response.status_code == 200:
                data = response.json().get("data") or {}
                tokens.external_account_id = str(data.get("company_id", ""))
                tokens.display_name = data.get("company_name")
        except httpx.HTTPError as e:
            logger.warning(f"Pipedrive users/me lookup failed (ignored): {e}")
        return tokens

    async def refresh_tokens(self, tokens: OAuthTokens) -> OAuthTokens:
        refreshed = await self._token_request({
            "grant_type": "refresh_token",
            "refresh_token": tokens.refresh_token,
        }, fallback_refresh_token=tokens.refresh_token)
        refreshed.api_domain = refreshed.api_domain or tokens.api_domain
        refreshed.external_account_id = tokens.external_account_id
        refreshed.display_name = tokens.display_name
        return refreshed

    async def push_lead(self, tokens: OAuthTokens, payload: LeadPayload) -> CrmPushResult:
        try:
            person_id, action, person_error = await self._upsert_person(tokens, payload)
            if person_error is not None:
                return person_error
            lead_id, lead_error = await self._ensure_open_lead(tokens, person_id, payload)
            if lead_error is not None:
                return lead_error
            if lead_id:
                await self._attach_note(tokens, lead_id, payload)
        except httpx.HTTPError as e:
            return CrmPushResult(ok=False, error=f"network error: {e}", retryable=True)

        return CrmPushResult(
            ok=True, action=action,
            contact_id=str(person_id), secondary_id=str(lead_id) if lead_id else None,
            record_url=f"{tokens.api_domain}/person/{person_id}" if tokens.api_domain else None,
        )

    async def revoke(self, tokens: OAuthTokens) -> None:
        try:
            await get_http_client().post(
                REVOKE_URL,
                headers={"Authorization": f"Basic {self._basic_secret()}"},
                data={"token": tokens.refresh_token,
                      "token_type_hint": "refresh_token"},
            )
        except Exception as e:
            logger.warning(f"Pipedrive token revocation failed (ignored): {e}")

    async def test_connection(self, tokens: OAuthTokens) -> dict:
        try:
            response = await get_http_client().get(
                f"{tokens.api_domain}/api/v1/users/me",
                headers=self._auth_header(tokens))
        except httpx.HTTPError as e:
            return {"ok": False, "account_name": None, "error": f"network error: {e}"}
        if response.status_code != 200:
            return {"ok": False, "account_name": None,
                    "error": f"HTTP {response.status_code}"}
        data = response.json().get("data") or {}
        return {"ok": True, "account_name": data.get("company_name"), "error": None}

    # ---- push steps -------------------------------------------------------

    async def _upsert_person(self, tokens: OAuthTokens, payload: LeadPayload):
        """Search by email; update blanks on a hit, create on a miss.
        Returns (person_id, action, error_result)."""
        response = await get_http_client().get(
            f"{tokens.api_domain}/api/v2/persons/search?" + urlencode({
                "term": payload.email, "fields": "email", "exact_match": "true"}),
            headers=self._auth_header(tokens))
        if response.status_code != 200:
            return None, None, classify_error_response(response)

        items = ((response.json().get("data") or {}).get("items")) or []
        if items:
            item = items[0].get("item") or {}
            person_id = item.get("id")
            update = self._blank_filling_update(item, payload)
            if update:
                patch = await get_http_client().patch(
                    f"{tokens.api_domain}/api/v2/persons/{person_id}",
                    headers=self._auth_header(tokens), json=update)
                if patch.status_code not in (200, 201):
                    logger.warning(
                        f"Pipedrive person update failed: HTTP {patch.status_code}")
            return person_id, "updated", None

        create = await get_http_client().post(
            f"{tokens.api_domain}/api/v2/persons",
            headers=self._auth_header(tokens),
            json=self._person_body(payload))
        if create.status_code not in (200, 201):
            return None, None, classify_error_response(create)
        person_id = (create.json().get("data") or {}).get("id")
        return person_id, "created", None

    async def _ensure_open_lead(self, tokens: OAuthTokens, person_id,
                                payload: LeadPayload):
        """Create a Lead unless the person already has an open one — repeat
        captures must not spam the leads inbox. Returns (lead_id, error_result)."""
        listing = await get_http_client().get(
            f"{tokens.api_domain}/api/v1/leads?" + urlencode({
                "person_id": person_id, "archived_status": "not_archived"}),
            headers=self._auth_header(tokens))
        if listing.status_code != 200:
            # Guessing here risks a duplicate lead — classify and let the
            # (idempotent) job retry instead.
            return None, classify_error_response(listing)
        if listing.json().get("data") or []:
            return None, None  # open lead exists — nothing to create

        title = f"{payload.name or payload.email} — ChatterMate lead"
        create = await get_http_client().post(
            f"{tokens.api_domain}/api/v1/leads",
            headers=self._auth_header(tokens),
            json={"title": title, "person_id": person_id})
        if create.status_code not in (200, 201):
            return None, classify_error_response(create)
        return (create.json().get("data") or {}).get("id"), None

    async def _attach_note(self, tokens: OAuthTokens, lead_id,
                           payload: LeadPayload) -> None:
        """Context note on the lead. Best-effort — never fails the job."""
        try:
            response = await get_http_client().post(
                f"{tokens.api_domain}/api/v1/notes",
                headers=self._auth_header(tokens),
                json={"lead_id": lead_id,
                      "content": build_note_body(payload)})
            if response.status_code not in (200, 201):
                logger.warning(f"Pipedrive note attach failed: HTTP {response.status_code}")
        except httpx.HTTPError as e:
            logger.warning(f"Pipedrive note attach failed: {e}")

    # ---- helpers ----------------------------------------------------------

    async def _token_request(self, data: dict,
                             fallback_refresh_token: str = "") -> OAuthTokens:
        try:
            response = await get_http_client().post(
                TOKEN_URL, data=data,
                headers={"Authorization": f"Basic {self._basic_secret()}",
                         "Content-Type": "application/x-www-form-urlencoded"},
            )
        except httpx.HTTPError as e:
            raise CrmTransientError(f"Pipedrive token endpoint unreachable: {e}")
        if response.status_code >= 500:
            raise CrmTransientError(f"Pipedrive token endpoint HTTP {response.status_code}")
        if response.status_code != 200:
            raise CrmAuthError(f"Pipedrive token request rejected: {response.text[:300]}")
        body = response.json()
        now = datetime.now(timezone.utc)
        return OAuthTokens(
            access_token=body["access_token"],
            refresh_token=body.get("refresh_token") or fallback_refresh_token,
            expires_at=now + timedelta(seconds=body.get("expires_in", 3600)),
            api_domain=body.get("api_domain"),
            # Sliding window restarts on every successful token use.
            refresh_token_expires_at=now + timedelta(days=REFRESH_TOKEN_LIFETIME_DAYS),
            raw=body,
        )

    def _person_body(self, payload: LeadPayload) -> dict:
        body = {"name": payload.name or payload.email,
                "emails": [{"value": payload.email, "primary": True}]}
        if payload.phone:
            body["phones"] = [{"value": payload.phone, "primary": True}]
        return body

    def _blank_filling_update(self, item: dict, payload: LeadPayload) -> dict:
        """Only fill fields the existing person is missing — never clobber."""
        update = {}
        if payload.name and not item.get("name"):
            update["name"] = payload.name
        if payload.phone and not item.get("phones"):
            update["phones"] = [{"value": payload.phone, "primary": True}]
        return update

    def _auth_header(self, tokens: OAuthTokens) -> dict:
        return {"Authorization": f"Bearer {tokens.access_token}"}

    @staticmethod
    def _basic_secret() -> str:
        raw = f"{settings.PIPEDRIVE_CLIENT_ID}:{settings.PIPEDRIVE_CLIENT_SECRET}"
        return base64.b64encode(raw.encode()).decode()


register_adapter(PipedriveAdapter())
