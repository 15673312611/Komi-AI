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

Direct tests of the "belongs to my org" guards. Several of the endpoints that
use them (Shopify/Jira agent-config) resolve auth by calling get_current_user
inside the handler rather than via a dependency, which makes them awkward to
drive through TestClient — so the security boundary itself is exercised here.
"""
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.models.agent import Agent, AgentType
from app.models.organization import Organization
from app.models.user import User, UserGroup
from app.repositories.agent import AgentRepository
from app.api.shopify import _require_shopify_agent_in_org
from app.api.jira import _require_jira_agent_in_org
from app.api.tickets import _validate_assignment_references


@pytest.fixture
def other_org(db) -> Organization:
    org = Organization(id=uuid4(), name="Other Org", domain="other-guard.example.com", timezone="UTC")
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@pytest.fixture
def foreign_agent(db, other_org) -> Agent:
    agent = Agent(
        id=uuid4(),
        name="Foreign Agent",
        agent_type=AgentType.CUSTOMER_SUPPORT,
        instructions=["x"],
        organization_id=other_org.id,
        is_active=True,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


def _raises_404(fn, *args):
    with pytest.raises(HTTPException) as exc:
        fn(*args)
    assert exc.value.status_code == 404


class TestAgentRepositoryScoping:
    def test_get_agent_in_org_matches_only_same_org(self, db, test_agent, test_organization, other_org):
        repo = AgentRepository(db)
        assert repo.get_agent_in_org(test_agent.id, test_organization.id) is not None
        assert repo.get_agent_in_org(test_agent.id, other_org.id) is None


class TestAgentConfigGuards:
    """Shopify + Jira + knowledge all gate agent_id the same way."""

    def test_shopify_allows_own_agent(self, db, test_agent, test_organization):
        _require_shopify_agent_in_org(db, str(test_agent.id), test_organization.id)

    def test_shopify_rejects_foreign_agent(self, db, foreign_agent, test_organization):
        _raises_404(_require_shopify_agent_in_org, db, str(foreign_agent.id), test_organization.id)

    def test_shopify_rejects_malformed_agent_id(self, db, test_organization):
        _raises_404(_require_shopify_agent_in_org, db, "not-a-uuid", test_organization.id)

    def test_jira_allows_own_agent(self, db, test_agent, test_organization):
        _require_jira_agent_in_org(db, str(test_agent.id), test_organization.id)

    def test_jira_rejects_foreign_agent(self, db, foreign_agent, test_organization):
        _raises_404(_require_jira_agent_in_org, db, str(foreign_agent.id), test_organization.id)


class TestTicketAssignmentGuard:
    def test_allows_assignee_and_group_in_org(self, db, test_user, test_organization):
        group = UserGroup(id=uuid4(), name="G", organization_id=test_organization.id)
        db.add(group)
        db.commit()
        # No raise
        _validate_assignment_references(db, test_organization.id, test_user.id, group.id)

    def test_rejects_foreign_assignee(self, db, other_org, test_organization):
        outsider = User(
            id=uuid4(),
            email="outsider@other-guard.example.com",
            hashed_password="x",
            organization_id=other_org.id,
            is_active=True,
        )
        db.add(outsider)
        db.commit()
        _raises_404(_validate_assignment_references, db, test_organization.id, outsider.id, None)

    def test_rejects_foreign_group(self, db, other_org, test_organization):
        foreign_group = UserGroup(id=uuid4(), name="FG", organization_id=other_org.id)
        db.add(foreign_group)
        db.commit()
        _raises_404(_validate_assignment_references, db, test_organization.id, None, foreign_group.id)
