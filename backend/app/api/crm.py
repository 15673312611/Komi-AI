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

import base64
import hashlib
import hmac
import secrets
import time
from typing import List
from urllib.parse import urlencode
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.auth import get_current_organization, require_permissions
from app.core.config import settings
from app.core.logger import get_logger
from app.core.redis import get_redis
from app.crm.base import CrmAuthError, CrmTransientError, basic_auth_header
from app.crm.registry import get_adapter
from app.database import get_db
from app.models.crm import CrmConnectionStatus, CrmProvider
from app.models.organization import Organization
from app.models.schemas.crm import CrmConnectionOut, CrmTestResult
from app.models.user import User
from app.repositories.crm import CrmConnectionRepository, CrmSyncJobRepository
from app.services.crm_tokens import get_valid_tokens, tokens_from_connection
from app.services.feature_gate import check_feature_access

router = APIRouter()
logger = get_logger(__name__)

STATE_TTL_SECONDS = 60 * 10
UPGRADE_MESSAGE = "CRM sync is not available in your current plan."
# HubSpot signs webhooks with a timestamp; reject anything older than this.
WEBHOOK_TIMESTAMP_MAX_AGE_SECONDS = 300

# In-process fallback when Redis is disabled (single-worker dev setups).
# Maps state -> (value, expires_at) so abandoned installs don't leak forever.
_state_fallback: dict = {}


def _prune_state_fallback() -> None:
    now = time.time()
    for key in [k for k, (_, exp) in _state_fallback.items() if exp < now]:
        _state_fallback.pop(key, None)


def _provider_credentials(provider: str) -> tuple:
    return {
        CrmProvider.HUBSPOT.value: (settings.HUBSPOT_CLIENT_ID, settings.HUBSPOT_CLIENT_SECRET),
        CrmProvider.PIPEDRIVE.value: (settings.PIPEDRIVE_CLIENT_ID, settings.PIPEDRIVE_CLIENT_SECRET),
    }.get(provider, ("", ""))


def _require_provider(provider: str) -> None:
    if get_adapter(provider) is None:
        raise HTTPException(status_code=404, detail="Unknown CRM provider")


def _store_state(state: str, org_id: str, provider: str) -> None:
    redis_client = get_redis()
    value = f"{org_id}:{provider}"
    if redis_client is not None:
        redis_client.set(f"crm_oauth_state:{state}", value, ex=STATE_TTL_SECONDS)
    else:
        _prune_state_fallback()
        _state_fallback[state] = (value, time.time() + STATE_TTL_SECONDS)


def _pop_state(state: str) -> tuple:
    redis_client = get_redis()
    if redis_client is not None:
        key = f"crm_oauth_state:{state}"
        value = redis_client.get(key)
        if value:
            redis_client.delete(key)
    else:
        entry = _state_fallback.pop(state, None)
        value = entry[0] if entry and entry[1] >= time.time() else None
    if not value or ":" not in value:
        return None, None
    org_id, provider = value.split(":", 1)
    return org_id, provider


def _redirect_uri(provider: str) -> str:
    return f"{settings.BACKEND_URL.rstrip('/')}{settings.API_V1_STR}/crm/{provider}/callback"


def _settings_redirect(provider: str, status: str, reason: str = None) -> RedirectResponse:
    params = {"status": status, "integration": provider}
    if reason:
        params["reason"] = reason
    return RedirectResponse(f"{settings.FRONTEND_URL}/settings/integrations?{urlencode(params)}")


def _get_org_connection_or_404(db: Session, organization: Organization, provider: str):
    connection = CrmConnectionRepository(db).get_by_org_provider(organization.id, provider)
    if connection is None:
        raise HTTPException(status_code=404, detail="CRM is not connected")
    return connection


@router.get("/connections", response_model=List[CrmConnectionOut])
async def list_connections(
    current_user: User = Depends(require_permissions("manage_organization")),
    organization: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db),
):
    """Connection status per provider for the integrations page, with a
    failed-push count so a quietly broken connection is visible."""
    check_feature_access(db, organization.id, "crm_sync", UPGRADE_MESSAGE)
    job_repo = CrmSyncJobRepository(db)
    out = []
    for connection in CrmConnectionRepository(db).list_by_org(organization.id):
        item = CrmConnectionOut.model_validate(connection)
        item.recent_failures = job_repo.count_recent_failures(
            organization.id, connection.provider)
        out.append(item)
    return out


@router.get("/{provider}/install")
async def install_crm(
    provider: str,
    current_user: User = Depends(require_permissions("manage_organization")),
    organization: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db),
):
    """Start the OAuth install: redirect the browser to the CRM's consent page
    with a CSRF state bound to (organization, provider)."""
    _require_provider(provider)
    check_feature_access(db, organization.id, "crm_sync", UPGRADE_MESSAGE)
    client_id, client_secret = _provider_credentials(provider)
    if not client_id or not client_secret:
        raise HTTPException(status_code=400,
                            detail=f"{provider} app credentials are not configured")
    state = secrets.token_urlsafe(24)
    _store_state(state, str(organization.id), provider)
    adapter = get_adapter(provider)
    return RedirectResponse(adapter.get_authorize_url(state, _redirect_uri(provider)))


@router.get("/{provider}/callback")
async def crm_oauth_callback(
    provider: str,
    code: str = None,
    state: str = None,
    error: str = None,
    db: Session = Depends(get_db),
):
    """Complete the OAuth install: exchange the code, upsert the connection,
    and bounce back to the settings page."""
    _require_provider(provider)
    if error:
        return _settings_redirect(
            provider, "failure", "cancelled" if error == "access_denied" else error)
    org_id, state_provider = _pop_state(state or "")
    if org_id is None or state_provider != provider or not code:
        return _settings_redirect(provider, "failure", "invalid_state")

    adapter = get_adapter(provider)
    try:
        tokens = await adapter.exchange_code(code, _redirect_uri(provider))
    except (CrmAuthError, CrmTransientError) as e:
        logger.error(f"{provider} OAuth exchange failed: {e}")
        return _settings_redirect(provider, "failure", "oauth_failed")

    repo = CrmConnectionRepository(db)
    existing = repo.get_by_external_id(provider, tokens.external_account_id)
    if existing is not None and str(existing.organization_id) != org_id:
        return _settings_redirect(provider, "failure", "account_connected_elsewhere")

    repo.create_or_update(
        organization_id=UUID(org_id),
        provider=provider,
        external_account_id=tokens.external_account_id,
        credentials={
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
            "api_domain": tokens.api_domain,
        },
        display_name=tokens.display_name,
        access_token_expires_at=tokens.expires_at,
        refresh_token_expires_at=tokens.refresh_token_expires_at,
    )
    # A reconnect is the fix for a dead connection — requeue anything that
    # terminally failed while it was down so those leads reach the CRM.
    CrmSyncJobRepository(db).reopen_failed(UUID(org_id), provider)
    logger.info(f"Connected {provider} ({tokens.display_name}) for org {org_id}")
    return _settings_redirect(provider, "success")


@router.post("/{provider}/test", response_model=CrmTestResult)
async def test_crm_connection(
    provider: str,
    current_user: User = Depends(require_permissions("manage_organization")),
    organization: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db),
):
    """Read-only connectivity check — never writes records into the CRM."""
    _require_provider(provider)
    check_feature_access(db, organization.id, "crm_sync", UPGRADE_MESSAGE)
    connection = _get_org_connection_or_404(db, organization, provider)
    try:
        tokens = await get_valid_tokens(db, connection)
    except CrmAuthError:
        return CrmTestResult(ok=False, error="Connection expired — please reconnect")
    except CrmTransientError as e:
        return CrmTestResult(ok=False, error=str(e))
    return CrmTestResult(**(await get_adapter(provider).test_connection(tokens)))


@router.delete("/{provider}")
async def disconnect_crm(
    provider: str,
    current_user: User = Depends(require_permissions("manage_organization")),
    organization: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db),
):
    """Disconnect: best-effort token revocation, drop the row, cancel queued
    pushes. Agents' crm_sync_target stays set — it's simply inert until a
    reconnect, and the UI warns about the mismatch."""
    _require_provider(provider)
    connection = _get_org_connection_or_404(db, organization, provider)
    repo = CrmConnectionRepository(db)
    try:
        await get_adapter(provider).revoke(tokens_from_connection(repo, connection))
    except Exception as e:
        logger.warning(f"{provider} revoke on disconnect failed (ignored): {e}")
    CrmSyncJobRepository(db).skip_pending_for_connection(
        organization.id, provider, "disconnected")
    repo.delete(connection)
    return {"status": "disconnected"}


# ---- uninstall webhooks (marketplace requirement) --------------------------


@router.post("/hubspot/uninstall")
async def hubspot_uninstall_webhook(request: Request, db: Session = Depends(get_db)):
    """HubSpot app-uninstall events, authenticated by the v3 signature
    (HMAC-SHA256 over method+url+body+timestamp with the client secret)."""
    body = await request.body()
    if not _valid_hubspot_signature(request, body):
        raise HTTPException(status_code=404)
    try:
        events = (await request.json()) or []
    except Exception:
        events = []
    for event in events if isinstance(events, list) else [events]:
        portal_id = str(event.get("portalId", "") or event.get("hub_id", ""))
        event_kind = f"{event.get('subscriptionType', '')}{event.get('eventType', '')}".lower()
        if portal_id and "uninstall" in event_kind:
            _revoke_connection(db, CrmProvider.HUBSPOT.value, portal_id)
    return {"ok": True}


@router.post("/pipedrive/uninstall")
async def pipedrive_uninstall_webhook(request: Request, db: Session = Depends(get_db)):
    """Pipedrive app_uninstalled callback, authenticated with HTTP Basic —
    the Developer Hub webhook is configured with our client_id:client_secret."""
    if not _valid_pipedrive_basic_auth(request.headers.get("Authorization", "")):
        raise HTTPException(status_code=404)
    try:
        payload = await request.json()
    except Exception:
        payload = {}
    company_id = str(payload.get("company_id", ""))
    if company_id:
        _revoke_connection(db, CrmProvider.PIPEDRIVE.value, company_id)
    return {"ok": True}


def _revoke_connection(db: Session, provider: str, external_account_id: str) -> None:
    repo = CrmConnectionRepository(db)
    connection = repo.get_by_external_id(provider, external_account_id)
    if connection is None:
        return
    repo.set_status(connection, CrmConnectionStatus.REVOKED.value,
                    last_error="App uninstalled from the CRM")
    CrmSyncJobRepository(db).skip_pending_for_connection(
        connection.organization_id, provider, "app uninstalled")
    logger.info(f"{provider} app uninstalled for org {connection.organization_id}")


def _valid_hubspot_signature(request: Request, body: bytes) -> bool:
    """HubSpot v3: base64(HMAC-SHA256(secret, METHOD + full_url + body + ts)),
    with a freshness window against replay."""
    signature = request.headers.get("X-HubSpot-Signature-v3", "")
    timestamp = request.headers.get("X-HubSpot-Request-Timestamp", "")
    if not signature or not timestamp or not settings.HUBSPOT_CLIENT_SECRET:
        return False
    try:
        age_ms = time.time() * 1000 - int(timestamp)
    except ValueError:
        return False
    if age_ms > WEBHOOK_TIMESTAMP_MAX_AGE_SECONDS * 1000:
        return False
    # HubSpot signs the public https URL; behind the reverse proxy the
    # reconstructed URL may say http — accept either scheme, nothing else.
    url = str(request.url)
    candidate_urls = {url, url.replace("http://", "https://", 1)}
    for candidate in candidate_urls:
        message = f"{request.method}{candidate}".encode() + body + timestamp.encode()
        expected = base64.b64encode(
            hmac.new(settings.HUBSPOT_CLIENT_SECRET.encode(), message, hashlib.sha256).digest()
        ).decode()
        if hmac.compare_digest(expected, signature):
            return True
    return False


def _valid_pipedrive_basic_auth(header: str) -> bool:
    client_id, client_secret = _provider_credentials(CrmProvider.PIPEDRIVE.value)
    if not client_id or not client_secret or not header.startswith("Basic "):
        return False
    return hmac.compare_digest(header[6:], basic_auth_header(client_id, client_secret))
