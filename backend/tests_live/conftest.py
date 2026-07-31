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

Fixtures for the live suite: a real organization from the local Postgres, and
a conversation helper that drives ChatAgent exactly as the widget does and
removes everything it created afterwards.

This directory sits OUTSIDE `testpaths` (pytest.ini) on purpose, so `pytest
tests/` and CI never collect it — these tests spend real model credits. It also
means tests/conftest.py never loads, so app.core.config reads the real .env
(real DATABASE_URL and ENCRYPTION_KEY) instead of the in-memory SQLite harness.
"""

import os
import uuid

import pytest
from sqlalchemy import text

# Importing app.core.config runs load_dotenv(backend/.env) — do not pre-seed
# ENVIRONMENT or ENCRYPTION_KEY here or the real values will not win.
from app.database import SessionLocal


def _discover(db):
    """Pick the local agent that can exercise the most behaviour.

    Ranked by capability coverage — knowledge LINKED to the agent (not merely
    indexed for the org: an agent with no linked documents can never cite
    anything), lead capture, ticketing, and a staffed transfer group somewhere
    in its org. Picking on knowledge alone lands on an agent that skips three
    of the four behaviour tests, which reads as a green run having proved much
    more than it did.

    Pin a specific tenant with LIVE_ORG_ID + LIVE_AGENT_ID.
    """
    org_id = os.getenv("LIVE_ORG_ID")
    agent_id = os.getenv("LIVE_AGENT_ID")
    if org_id and agent_id:
        return org_id, agent_id

    row = db.execute(text("""
        select organization_id, id from (
            select a.organization_id, a.id, a.created_at,
                   ((select count(*) from knowledge_to_agents kta
                      where kta.agent_id = a.id) > 0)::int
                 + coalesce((select lc.enabled from lead_capture_configs lc
                              where lc.agent_id = a.id), false)::int
                 + a.ticketing_enabled::int
                 + exists (select 1 from agents t
                             join agent_usergroup ag on ag.agent_id = t.id
                             join user_groups ug on ug.group_id = ag.group_id
                            where t.organization_id = a.organization_id
                              and t.transfer_to_human and t.is_active)::int
                   as capability_score
              from agents a
              join ai_configs c
                on c.organization_id = a.organization_id and c.is_active
             where a.is_active
               and coalesce(a.use_workflow, false) = false
        ) ranked
      order by capability_score desc, created_at
         limit 1
    """)).first()
    if not row:
        pytest.skip("no local org with an active AI config and an active agent")
    return str(row[0]), str(row[1])


@pytest.fixture(scope="session")
def live_org():
    with SessionLocal() as db:
        org_id, agent_id = _discover(db)
        name, domain = db.execute(
            text("select name, domain from organizations where id = :o"),
            {"o": org_id},
        ).first()
    print(f"\n[live] org={name} ({domain}) org_id={org_id} agent_id={agent_id}")
    return {"org_id": org_id, "agent_id": agent_id, "name": name, "domain": domain}


def _agent_flags(db, agent_id):
    row = db.execute(text(
        "select transfer_to_human, ticketing_enabled from agents where id = :a"
    ), {"a": agent_id}).first()
    lead = db.execute(text(
        "select coalesce(enabled, false) from lead_capture_configs where agent_id = :a"
    ), {"a": agent_id}).scalar()
    return {"transfer": bool(row[0]), "ticketing": bool(row[1]), "lead": bool(lead)}


class Conversation:
    """One widget-style session against one agent. `say()` is a visitor turn."""

    def __init__(self, org_id, agent_id, customer_id, session_id, agent):
        self.org_id = org_id
        self.agent_id = agent_id
        self.customer_id = customer_id
        self.session_id = session_id
        self._agent = agent
        self.turns = []

    async def say(self, message):
        response = await self._agent.get_response(
            message=message,
            session_id=str(self.session_id),
            org_id=self.org_id,
            agent_id=self.agent_id,
            customer_id=self.customer_id,
        )
        self.turns.append((message, response))
        print(f"\n  > {message[:120]}\n  < {(response.message or '')[:300]}")
        return response

    def guardrail_events(self):
        with SessionLocal() as db:
            return [
                dict(rule=r[0], layer=r[1], action=r[2])
                for r in db.execute(text(
                    "select rule, layer, action from guardrail_events "
                    "where session_id = :s order by created_at"
                ), {"s": str(self.session_id)}).fetchall()
            ]


@pytest.fixture
def conversation(live_org):
    """Factory: `await conversation()` starts a session on the default agent,
    `await conversation(agent_id=...)` on a specific one. Everything created is
    deleted on teardown so repeat runs don't silt up the dev database."""
    created = []
    agents = []

    async def _start(agent_id=None):
        from app.agents.chat_agent import ChatAgent
        from app.core.security import decrypt_api_key
        from app.repositories.ai_config import AIConfigRepository

        org_id = live_org["org_id"]
        agent_id = agent_id or live_org["agent_id"]
        session_id = uuid.uuid4()
        customer_id = uuid.uuid4()

        with SessionLocal() as db:
            config = AIConfigRepository(db).get_active_config(org_id)
            db.execute(text(
                "insert into customers (id, organization_id, email, full_name) "
                "values (:i, :o, :e, 'Live Test Visitor')"
            ), {"i": customer_id, "o": org_id, "e": f"live-{session_id.hex[:10]}@example.com"})
            db.execute(text(
                "insert into session_to_agents "
                "(session_id, organization_id, customer_id, agent_id, status) "
                "values (:s, :o, :c, :a, 'OPEN')"
            ), {"s": session_id, "o": org_id, "c": customer_id, "a": agent_id})
            db.commit()
            model_type = (config.model_type.value
                          if hasattr(config.model_type, "value") else str(config.model_type))
            model_name = config.model_name
            api_key = decrypt_api_key(config.encrypted_api_key)

        created.append((session_id, customer_id))
        agent = await ChatAgent.create_async(
            api_key=api_key, model_name=model_name, model_type=model_type,
            org_id=org_id, agent_id=agent_id,
            customer_id=str(customer_id), session_id=str(session_id),
        )
        agents.append(agent)
        return Conversation(org_id, agent_id, str(customer_id), session_id, agent)

    yield _start

    for agent in agents:
        try:
            import asyncio
            asyncio.get_event_loop().run_until_complete(agent.safe_cleanup_mcp_tools())
        except Exception:
            pass

    # Child rows first: everything here is keyed on the session or customer this
    # test created, so nothing pre-existing is touched.
    with SessionLocal() as db:
        for session_id, customer_id in created:
            for stmt, params in [
                # Tickets first, via their session link — the toolkit attaches
                # them to a customer resolved by email, not to this session's
                # visitor, so deleting by customer_id alone would leave them.
                ("delete from tickets where id in "
                 "(select ticket_id from ticket_sessions where session_id = :s)",
                 {"s": session_id}),
                ("delete from ticket_sessions where session_id = :s", {"s": session_id}),
                ("delete from lead_capture_responses where session_id = :s", {"s": session_id}),
                ("delete from ratings where session_id = :s", {"s": session_id}),
                ("delete from chat_history where session_id = :s", {"s": session_id}),
                ("delete from guardrail_events where session_id = :s", {"s": session_id}),
                ("delete from session_to_agents where session_id = :s", {"s": session_id}),
                ("delete from tickets where customer_id = :c", {"c": customer_id}),
                ("delete from lead_capture_responses where customer_id = :c", {"c": customer_id}),
                ("delete from customers where id = :c", {"c": customer_id}),
            ]:
                try:
                    db.execute(text(stmt), params)
                    db.commit()
                except Exception:
                    db.rollback()


@pytest.fixture(scope="session")
def agent_has_knowledge(live_org):
    with SessionLocal() as db:
        return bool(db.execute(text(
            "select count(*) from knowledge_to_agents where agent_id = :a"
        ), {"a": live_org["agent_id"]}).scalar())


@pytest.fixture(scope="session")
def agent_flags(live_org):
    with SessionLocal() as db:
        return _agent_flags(db, live_org["agent_id"])


@pytest.fixture(scope="session")
def transfer_agent_id(live_org):
    """An agent in the same org with transfer enabled and a staffed group, or
    skip — transfer cannot be exercised without one."""
    with SessionLocal() as db:
        row = db.execute(text("""
            select a.id from agents a
              join agent_usergroup ag on ag.agent_id = a.id
              join user_groups ug on ug.group_id = ag.group_id
             where a.organization_id = :o and a.transfer_to_human and a.is_active
             limit 1
        """), {"o": live_org["org_id"]}).first()
    if not row:
        pytest.skip("no agent with transfer_to_human and a staffed group in this org")
    return str(row[0])
