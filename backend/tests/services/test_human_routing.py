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

Taking the AI out of a conversation: the state transition behind the per-chat
"hand to my team" action.
"""
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from app.models.session_to_agent import SessionToAgent, SessionStatus
from app.services.human_routing import route_session_to_human


@pytest.fixture
def open_session(db, test_agent, test_customer, test_organization) -> SessionToAgent:
    session = SessionToAgent(
        session_id=uuid4(),
        agent_id=test_agent.id,
        customer_id=test_customer.id,
        organization_id=test_organization.id,
        status=SessionStatus.OPEN,
        assigned_at=datetime.now(timezone.utc),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def _silenced():
    """Notifications and channel delivery are covered by their own tests."""
    return (
        patch("app.services.human_routing.notify_chat_event", new=AsyncMock()),
        patch("app.services.human_routing.notify_customer", new=AsyncMock()),
    )


@pytest.mark.asyncio
async def test_routing_queues_the_chat_without_an_assignee(db, open_session):
    """TRANSFERRED with user_id null is the state every AI guard checks."""
    notify, customer = _silenced()
    with notify, customer:
        assert await route_session_to_human(
            db, open_session, reason="DIRECT_REQUEST", description="test") is True

    db.refresh(open_session)
    assert open_session.status == SessionStatus.TRANSFERRED
    assert open_session.user_id is None


@pytest.mark.asyncio
async def test_routing_refuses_a_claimed_or_closed_chat(db, open_session, test_user):
    """Nothing to take away from the AI — it is not answering either one."""
    notify, customer = _silenced()

    open_session.user_id = test_user.id
    db.commit()
    with notify, customer:
        assert await route_session_to_human(db, open_session, reason="x") is False

    open_session.user_id = None
    open_session.status = SessionStatus.CLOSED
    db.commit()
    notify, customer = _silenced()
    with notify, customer:
        assert await route_session_to_human(db, open_session, reason="x") is False

    db.refresh(open_session)
    assert open_session.status == SessionStatus.CLOSED


@pytest.mark.asyncio
async def test_routing_is_idempotent(db, open_session):
    """A second call must not re-notify or re-message the customer."""
    notify, customer = _silenced()
    with notify, customer:
        assert await route_session_to_human(db, open_session, reason="x") is True

    with patch("app.services.human_routing.notify_chat_event", new=AsyncMock()) as n, \
         patch("app.services.human_routing.notify_customer", new=AsyncMock()) as c:
        assert await route_session_to_human(db, open_session, reason="x") is False
        assert not n.called
        assert not c.called
