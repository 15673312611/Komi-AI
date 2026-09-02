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
from unittest.mock import AsyncMock

import pytest

from app.crm.base import CrmAuthError, OAuthTokens
from app.crm.hubspot import HubSpotAdapter
from app.models.crm import CrmConnectionStatus
from app.repositories.crm import CrmConnectionRepository
from app.services.crm_tokens import get_valid_tokens


@pytest.fixture
def connection(db, test_organization):
    return CrmConnectionRepository(db).create_or_update(
        organization_id=test_organization.id,
        provider="hubspot",
        external_account_id="12345",
        credentials={"access_token": "at", "refresh_token": "rt", "api_domain": None},
        access_token_expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )


@pytest.mark.asyncio
async def test_returns_without_refresh_while_token_has_runway(db, connection, monkeypatch):
    refresh = AsyncMock()
    monkeypatch.setattr(HubSpotAdapter, "refresh_tokens", refresh)
    tokens = await get_valid_tokens(db, connection)
    assert tokens.access_token == "at"
    refresh.assert_not_awaited()


@pytest.mark.asyncio
async def test_refreshes_and_persists_when_expiring(db, connection, monkeypatch):
    connection.access_token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=30)
    db.commit()
    monkeypatch.setattr(HubSpotAdapter, "refresh_tokens", AsyncMock(
        return_value=OAuthTokens(
            access_token="at2", refresh_token="rt",
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30))))

    tokens = await get_valid_tokens(db, connection)

    assert tokens.access_token == "at2"
    repo = CrmConnectionRepository(db)
    assert repo.get_credentials(connection)["access_token"] == "at2"
    assert connection.last_refreshed_at is not None


@pytest.mark.asyncio
async def test_force_refresh_ignores_runway(db, connection, monkeypatch):
    refresh = AsyncMock(return_value=OAuthTokens(
        access_token="at2", refresh_token="rt",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=30)))
    monkeypatch.setattr(HubSpotAdapter, "refresh_tokens", refresh)
    await get_valid_tokens(db, connection, force_refresh=True)
    refresh.assert_awaited_once()


@pytest.mark.asyncio
async def test_rejected_refresh_marks_connection_expired(db, connection, monkeypatch):
    connection.access_token_expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.commit()
    monkeypatch.setattr(HubSpotAdapter, "refresh_tokens", AsyncMock(
        side_effect=CrmAuthError("invalid_grant")))

    with pytest.raises(CrmAuthError):
        await get_valid_tokens(db, connection)

    db.refresh(connection)
    assert connection.status == CrmConnectionStatus.EXPIRED.value
    assert "invalid_grant" in connection.last_error
