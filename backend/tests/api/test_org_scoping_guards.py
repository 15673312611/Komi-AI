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
from app.api import knowledge as knowledge_router
from app.core.auth import get_current_user
from app.database import get_db
from app.models.permission import Permission
from app.models.role import Role
from app.models.user import User
from fastapi import FastAPI
from fastapi.testclient import TestClient


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


class TestKnowledgeByAgentScoping:
    """GET /knowledge/agent/{agent_id} filtered on the agent id alone.

    count_by_agent/get_by_agent take a UUID and no organization, so any
    authenticated user who knew another tenant's agent id read that tenant's
    knowledge inventory. link/unlink on the same router have always checked
    agent.organization_id; this read never did.
    """

    def _client(self, db, user):
        api = FastAPI()
        api.include_router(knowledge_router.router, prefix="/api/v1/knowledge")
        api.dependency_overrides[get_current_user] = lambda: user
        api.dependency_overrides[get_db] = lambda: (yield db)
        return TestClient(api)

    def _knowledge_reader(self, db, organization):
        role = Role(name="Knowledge Reader", organization_id=organization.id)
        role.permissions = [Permission(name="view_knowledge")]
        db.add(role)
        db.commit()
        db.refresh(role)
        user = User(
            id=uuid4(),
            email=f"reader-{uuid4().hex[:6]}@example.com",
            full_name="Reader",
            hashed_password="x",
            is_active=True,
            organization_id=organization.id,
            role_id=role.id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def test_rejects_another_orgs_agent(self, db, test_organization, foreign_agent):
        user = self._knowledge_reader(db, test_organization)

        response = self._client(db, user).get(f"/api/v1/knowledge/agent/{foreign_agent.id}")

        assert response.status_code == 404

    def test_allows_an_agent_in_the_callers_org(self, db, test_organization, test_agent):
        user = self._knowledge_reader(db, test_organization)

        response = self._client(db, user).get(f"/api/v1/knowledge/agent/{test_agent.id}")

        assert response.status_code == 200
