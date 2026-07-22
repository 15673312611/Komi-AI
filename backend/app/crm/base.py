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

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import ClassVar, Optional
from uuid import UUID

import httpx

REQUEST_TIMEOUT_SECONDS = 20

_http_client: Optional[httpx.AsyncClient] = None


def get_http_client() -> httpx.AsyncClient:
    """Shared AsyncClient for all CRM adapters (tests swap in a MockTransport)."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS)
    return _http_client


class CrmAuthError(Exception):
    """The provider definitively rejected our grant (invalid_grant/revoked) —
    the connection needs a human reconnect, retrying cannot help."""


class CrmTransientError(Exception):
    """Temporary provider failure (5xx/network/429) — safe to retry later."""


@dataclass
class OAuthTokens:
    """Decrypted per-tenant OAuth state, passed into every adapter call.

    `api_domain` is the per-tenant API host where the provider has one
    (Pipedrive api_domain; later Salesforce instance_url / Zoho DC host).
    """
    access_token: str
    refresh_token: str
    expires_at: Optional[datetime] = None
    api_domain: Optional[str] = None
    refresh_token_expires_at: Optional[datetime] = None
    external_account_id: str = ""
    display_name: Optional[str] = None
    raw: dict = field(default_factory=dict)


@dataclass
class LeadPayload:
    """Provider-agnostic view of one captured lead (built by crm.mapping)."""
    lead_response_id: UUID
    email: str
    name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    summary: Optional[str] = None
    # Human label -> value, from the agent's configured custom fields.
    custom_fields: dict = field(default_factory=dict)
    source_url: Optional[str] = None


@dataclass
class CrmPushResult:
    ok: bool
    action: Optional[str] = None          # 'created' | 'updated'
    contact_id: Optional[str] = None      # HubSpot contact / Pipedrive person
    secondary_id: Optional[str] = None    # Pipedrive lead id
    record_url: Optional[str] = None      # deep link for the UI
    error: Optional[str] = None
    retryable: bool = False
    retry_after_seconds: Optional[int] = None
    auth_failed: bool = False


def classify_error_response(response: httpx.Response) -> CrmPushResult:
    """Map a failed provider response onto retry semantics.

    401 → dead token (refresh-and-retry, else reconnect); 429 → back off,
    honoring Retry-After; 5xx → transient; other 4xx → permanent (payload/
    scope problems a retry can't fix).
    """
    body = response.text[:500]
    error = f"HTTP {response.status_code}: {body}"
    if response.status_code == 401:
        return CrmPushResult(ok=False, error=error, auth_failed=True)
    if response.status_code == 429:
        retry_after = response.headers.get("Retry-After")
        seconds = int(retry_after) if retry_after and retry_after.isdigit() else None
        return CrmPushResult(ok=False, error=error, retryable=True,
                             retry_after_seconds=seconds)
    if response.status_code >= 500:
        return CrmPushResult(ok=False, error=error, retryable=True)
    return CrmPushResult(ok=False, error=error)


class CrmAdapter(ABC):
    """One stateless singleton per CRM. Tokens are passed into every call —
    the adapter holds no per-tenant state (mirrors ChannelAdapter)."""

    provider: ClassVar[str]

    @abstractmethod
    def get_authorize_url(self, state: str, redirect_uri: str) -> str:
        """Provider consent-screen URL for the OAuth install redirect."""

    @abstractmethod
    async def exchange_code(self, code: str, redirect_uri: str) -> OAuthTokens:
        """Swap the callback code for tokens + account identity.
        Raises CrmAuthError on a rejected code, CrmTransientError on 5xx."""

    @abstractmethod
    async def refresh_tokens(self, tokens: OAuthTokens) -> OAuthTokens:
        """Mint a fresh access token. Raises CrmAuthError on invalid_grant
        (connection dead), CrmTransientError on temporary failure."""

    @abstractmethod
    async def push_lead(self, tokens: OAuthTokens, payload: LeadPayload) -> CrmPushResult:
        """Create-or-update the lead in the CRM, deduping by email.
        Never raises — failures come back classified in CrmPushResult."""

    @abstractmethod
    async def revoke(self, tokens: OAuthTokens) -> None:
        """Best-effort token revocation on disconnect. Never raises."""

    @abstractmethod
    async def test_connection(self, tokens: OAuthTokens) -> dict:
        """Cheap read-only authenticated call.
        Returns {"ok": bool, "account_name": str | None, "error": str | None}."""
