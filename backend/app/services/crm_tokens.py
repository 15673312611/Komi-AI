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
from typing import Optional

from sqlalchemy.orm import Session

from app.core.logger import get_logger
from app.crm.base import CrmAuthError, OAuthTokens
from app.crm.registry import get_adapter
from app.models.crm import CrmConnection, CrmConnectionStatus
from app.repositories.crm import CrmConnectionRepository

logger = get_logger(__name__)

# Refresh when the access token has less runway than this — covers clock skew
# and the request's own latency.
EXPIRY_MARGIN_SECONDS = 120


def tokens_from_connection(repo: CrmConnectionRepository,
                           connection: CrmConnection) -> OAuthTokens:
    """Decrypt a connection into the adapter-facing token dataclass."""
    credentials = repo.get_credentials(connection)
    return OAuthTokens(
        access_token=credentials.get("access_token", ""),
        refresh_token=credentials.get("refresh_token", ""),
        expires_at=_aware(connection.access_token_expires_at),
        api_domain=credentials.get("api_domain"),
        refresh_token_expires_at=_aware(connection.refresh_token_expires_at),
        external_account_id=connection.external_account_id or "",
        display_name=connection.display_name,
    )


def persist_tokens(repo: CrmConnectionRepository, connection: CrmConnection,
                   tokens: OAuthTokens) -> None:
    """Re-encrypt the blob and mirror expiries onto queryable columns."""
    repo.save_credentials(
        connection,
        {
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
            "api_domain": tokens.api_domain,
        },
        access_token_expires_at=tokens.expires_at,
        refresh_token_expires_at=tokens.refresh_token_expires_at,
    )


async def get_valid_tokens(db: Session, connection: CrmConnection,
                           force_refresh: bool = False) -> OAuthTokens:
    """Decrypted tokens with a live access token, refreshing when needed.

    Raises CrmAuthError after marking the connection expired when the provider
    definitively rejects our grant (the UI then shows "Reconnect");
    CrmTransientError propagates untouched so callers can retry.
    """
    repo = CrmConnectionRepository(db)
    tokens = tokens_from_connection(repo, connection)
    if not force_refresh and _has_runway(tokens.expires_at):
        return tokens

    # A refresh is needed. Serialize per connection: Pipedrive rotates the
    # refresh token on every use, so two concurrent refreshers would send the
    # same (now-consumed) token — the loser gets invalid_grant and would
    # falsely mark the connection expired. Lock the row and re-read the current
    # tokens under the lock (populate_existing bypasses the identity-map cache),
    # so we refresh at most once and always with the latest token. FOR UPDATE is
    # a no-op on SQLite (tests), which is fine.
    locked = (
        db.query(CrmConnection)
        .filter(CrmConnection.id == connection.id)
        .populate_existing()
        .with_for_update()
        .first()
    ) or connection
    tokens = tokens_from_connection(repo, locked)
    if not force_refresh and _has_runway(tokens.expires_at):
        db.commit()  # another worker refreshed while we waited — release the lock
        return tokens

    adapter = get_adapter(locked.provider)
    if adapter is None:
        raise CrmAuthError(f"No adapter for provider '{locked.provider}'")
    try:
        refreshed = await adapter.refresh_tokens(tokens)
    except CrmAuthError as e:
        logger.warning(f"CRM refresh rejected for {locked.provider} "
                       f"connection {locked.id}: {e}")
        repo.set_status(locked, CrmConnectionStatus.EXPIRED.value, last_error=str(e))
        raise
    persist_tokens(repo, locked, refreshed)
    return refreshed


def _has_runway(expires_at: Optional[datetime]) -> bool:
    if expires_at is None:
        return False
    margin = datetime.now(timezone.utc) + timedelta(seconds=EXPIRY_MARGIN_SECONDS)
    return _aware(expires_at) > margin


def _aware(dt: Optional[datetime]) -> Optional[datetime]:
    """Normalize DB datetimes: PG returns tz-aware, SQLite (tests) naive-UTC."""
    if dt is None or dt.tzinfo is not None:
        return dt
    return dt.replace(tzinfo=timezone.utc)
