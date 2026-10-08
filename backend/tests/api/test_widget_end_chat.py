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

POST /widgets/{widget_id}/end-chat — the endpoint the widget calls to close a
conversation. It shipped untested, and a client bug calling it on every message
closed live chats the moment a human agent joined.
"""
from uuid import uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api import widget as widget_router
from app.core.security import create_conversation_token
from app.database import get_db
from app.models.session_to_agent import SessionStatus, SessionToAgent


@pytest.fixture
def client(db) -> TestClient:
    app = FastAPI()
    app.include_router(widget_router.router, prefix="/api/v1/widgets")

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)


@pytest.fixture
def open_session(db, test_widget, test_customer, test_agent) -> SessionToAgent:
    session = SessionToAgent(
        session_id=uuid4(),
        customer_id=test_customer.id,
        agent_id=test_agent.id,
        organization_id=test_customer.organization_id,
        status=SessionStatus.OPEN,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def _url(widget_id, session_id, **params) -> str:
    query = "".join(f"&{k}={v}" for k, v in params.items())
    return f"/api/v1/widgets/{widget_id}/end-chat?session_id={session_id}{query}"


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_closes_the_session(client, db, test_widget, open_session, test_conversation_token):
    response = client.post(
        _url(test_widget.id, open_session.session_id, reason="CUSTOMER_REQUEST"),
        headers=_auth(test_conversation_token),
    )

    assert response.status_code == 200
    assert response.json()["success"] is True

    db.refresh(open_session)
    assert open_session.status == SessionStatus.CLOSED


def test_requires_a_token(client, db, test_widget, open_session):
    """Regression: the token block used to be optional, so a request with no
    Authorization header fell through and closed any session by id."""
    response = client.post(_url(test_widget.id, open_session.session_id))

    assert response.status_code == 401
    db.refresh(open_session)
    assert open_session.status == SessionStatus.OPEN


def test_rejects_a_garbage_token(client, db, test_widget, open_session):
    response = client.post(
        _url(test_widget.id, open_session.session_id),
        headers=_auth("not-a-jwt"),
    )

    assert response.status_code == 401
    db.refresh(open_session)
    assert open_session.status == SessionStatus.OPEN


def test_rejects_a_token_issued_for_another_widget(client, db, test_widget, open_session, test_customer):
    other_widget_token = create_conversation_token(
        widget_id=str(uuid4()), customer_id=str(test_customer.id)
    )

    response = client.post(
        _url(test_widget.id, open_session.session_id),
        headers=_auth(other_widget_token),
    )

    assert response.status_code == 403
    db.refresh(open_session)
    assert open_session.status == SessionStatus.OPEN


def test_cannot_close_another_customers_session(client, db, test_widget, open_session):
    """The token proves who the caller is, not that the session is theirs."""
    stranger_token = create_conversation_token(
        widget_id=str(test_widget.id), customer_id=str(uuid4())
    )

    response = client.post(
        _url(test_widget.id, open_session.session_id),
        headers=_auth(stranger_token),
    )

    assert response.status_code == 404
    db.refresh(open_session)
    assert open_session.status == SessionStatus.OPEN


def test_unknown_session_is_not_found(client, test_widget, test_conversation_token):
    response = client.post(
        _url(test_widget.id, uuid4()),
        headers=_auth(test_conversation_token),
    )

    assert response.status_code == 404
