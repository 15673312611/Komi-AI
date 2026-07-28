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

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import pytest

from app.crm.base import CrmPushResult, OAuthTokens
from app.crm.hubspot import HubSpotAdapter
from app.models.crm import (
    CrmConnectionStatus, CrmCustomerSync, CrmSyncJob, CrmSyncJobStatus,
)
from app.models.customer import Customer
from app.models.lead_capture import LeadCaptureConfig, LeadCaptureResponse
from app.repositories.crm import (
    CrmConnectionRepository, CrmCustomerSyncRepository, CrmSyncJobRepository,
)
from app.services.crm_sync import (
    CrmManualSyncError, enqueue_crm_sync, process_job, sync_customer_to_crm,
)
from app.services.lead_capture import record_lead_capture


@pytest.fixture(autouse=True)
def _allow_crm_feature(monkeypatch):
    """Default the plan gate open so these tests exercise the sync logic, not
    the enterprise plan machinery, regardless of whether the enterprise module
    is installed. Gate-specific tests override this with False."""
    monkeypatch.setattr("app.services.crm_sync.feature_allowed", lambda *a, **k: True)


@pytest.fixture
def config(db, test_agent):
    cfg = LeadCaptureConfig(
        agent_id=test_agent.id, enabled=True, require_consent=True,
        crm_sync_target="hubspot",
        fields=[{"key": "email", "standard": True, "enabled": True}],
    )
    db.add(cfg)
    db.commit()
    db.refresh(cfg)
    return cfg


@pytest.fixture
def connection(db, test_organization):
    return CrmConnectionRepository(db).create_or_update(
        organization_id=test_organization.id,
        provider="hubspot",
        external_account_id="12345",
        credentials={"access_token": "at", "refresh_token": "rt", "api_domain": None},
        access_token_expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )


@pytest.fixture
def lead(db, test_organization, test_agent, test_customer):
    response = LeadCaptureResponse(
        organization_id=test_organization.id, agent_id=test_agent.id,
        customer_id=test_customer.id,
        field_values={"email": "lead@example.com", "name": "Lead Person"},
        summary="Wants a demo", consent=True, qualified=True,
    )
    db.add(response)
    db.commit()
    db.refresh(response)
    return response


OK_RESULT = CrmPushResult(ok=True, action="created", contact_id="301",
                          record_url="https://app.hubspot.com/contacts/1/record/0-1/301")


class TestEnqueue:

    def test_no_target_no_job(self, db, config, lead, connection):
        config.crm_sync_target = "none"
        db.commit()
        assert enqueue_crm_sync(db, config, lead) is None

    def test_no_connection_no_job(self, db, config, lead):
        assert enqueue_crm_sync(db, config, lead) is None

    def test_enqueues_once(self, db, config, lead, connection):
        job = enqueue_crm_sync(db, config, lead)
        assert job is not None and job.provider == "hubspot"
        assert enqueue_crm_sync(db, config, lead) is None  # idempotent

    def test_plan_gate_fails_closed(self, db, config, lead, connection, monkeypatch):
        monkeypatch.setattr("app.services.crm_sync.feature_allowed",
                            lambda *a, **k: False)
        assert enqueue_crm_sync(db, config, lead) is None


class TestProcessJob:

    @pytest.mark.asyncio
    async def test_happy_path_completes_with_result(self, db, config, lead,
                                                    connection, monkeypatch):
        monkeypatch.setattr(HubSpotAdapter, "push_lead", AsyncMock(return_value=OK_RESULT))
        job = enqueue_crm_sync(db, config, lead)

        job = await process_job(db, job)

        assert job.status == CrmSyncJobStatus.COMPLETED.value
        assert job.result["contact_id"] == "301"
        assert job.connection_id == connection.id

    @pytest.mark.asyncio
    async def test_connection_missing_is_terminal(self, db, config, lead, connection,
                                                  monkeypatch):
        job = enqueue_crm_sync(db, config, lead)
        CrmConnectionRepository(db).set_status(connection,
                                               CrmConnectionStatus.REVOKED.value)
        job = await process_job(db, job)
        assert job.status == CrmSyncJobStatus.FAILED.value
        assert job.last_error == "no_connection"

    @pytest.mark.asyncio
    async def test_downgraded_org_is_skipped(self, db, config, lead, connection,
                                             monkeypatch):
        job = enqueue_crm_sync(db, config, lead)
        monkeypatch.setattr("app.services.crm_sync.feature_allowed",
                            lambda *a, **k: False)
        job = await process_job(db, job)
        assert job.status == CrmSyncJobStatus.SKIPPED.value

    @pytest.mark.asyncio
    async def test_retryable_failure_backs_off(self, db, config, lead, connection,
                                               monkeypatch):
        monkeypatch.setattr(HubSpotAdapter, "push_lead", AsyncMock(
            return_value=CrmPushResult(ok=False, error="HTTP 502", retryable=True)))
        job = enqueue_crm_sync(db, config, lead)
        job = await process_job(db, job)
        assert job.status == CrmSyncJobStatus.PENDING.value
        assert job.attempts == 1

    @pytest.mark.asyncio
    async def test_persistent_auth_failure_kills_connection(
            self, db, config, lead, connection, monkeypatch):
        monkeypatch.setattr(HubSpotAdapter, "push_lead", AsyncMock(
            return_value=CrmPushResult(ok=False, error="HTTP 401", auth_failed=True)))
        monkeypatch.setattr(HubSpotAdapter, "refresh_tokens", AsyncMock(
            return_value=OAuthTokens(
                access_token="at2", refresh_token="rt",
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=30))))
        job = enqueue_crm_sync(db, config, lead)

        job = await process_job(db, job)

        assert job.status == CrmSyncJobStatus.FAILED.value
        assert job.last_error.startswith("auth:")
        db.refresh(connection)
        assert connection.status == CrmConnectionStatus.EXPIRED.value

    @pytest.mark.asyncio
    async def test_auth_failure_recovers_after_forced_refresh(
            self, db, config, lead, connection, monkeypatch):
        push = AsyncMock(side_effect=[
            CrmPushResult(ok=False, error="HTTP 401", auth_failed=True),
            OK_RESULT,
        ])
        monkeypatch.setattr(HubSpotAdapter, "push_lead", push)
        monkeypatch.setattr(HubSpotAdapter, "refresh_tokens", AsyncMock(
            return_value=OAuthTokens(
                access_token="at2", refresh_token="rt",
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=30))))
        job = enqueue_crm_sync(db, config, lead)

        job = await process_job(db, job)

        assert job.status == CrmSyncJobStatus.COMPLETED.value
        assert push.await_count == 2


class TestLeadCaptureHook:

    def test_recorded_lead_is_queued(self, db, config, connection,
                                     test_organization, test_agent, test_customer,
                                     monkeypatch):
        response = record_lead_capture(
            db, config,
            organization_id=test_organization.id,
            agent_id=test_agent.id,
            customer_id=test_customer.id,
            session_id=None,
            lead_data={"email": "hooked@example.com"},
            summary="s", consent=True,
        )
        assert response is not None
        jobs = db.query(CrmSyncJob).filter_by(lead_response_id=response.id).all()
        assert len(jobs) == 1 and jobs[0].provider == "hubspot"

    def test_enqueue_crash_never_breaks_capture(self, db, config, connection,
                                                test_organization, test_agent,
                                                test_customer, monkeypatch):
        monkeypatch.setattr("app.services.crm_sync.enqueue_crm_sync",
                            lambda *a, **k: (_ for _ in ()).throw(RuntimeError("boom")))
        response = record_lead_capture(
            db, config,
            organization_id=test_organization.id,
            agent_id=test_agent.id,
            customer_id=test_customer.id,
            session_id=None,
            lead_data={"email": "hooked2@example.com"},
            summary="s", consent=True,
        )
        assert response is not None  # lead recorded despite the CRM crash


class TestAutoSyncRecordsCustomerLink:

    @pytest.mark.asyncio
    async def test_completed_job_records_customer_sync(self, db, config, lead,
                                                       connection, monkeypatch):
        monkeypatch.setattr(HubSpotAdapter, "push_lead", AsyncMock(return_value=OK_RESULT))
        job = enqueue_crm_sync(db, config, lead)
        await process_job(db, job)
        # The People drawer reads this per-person link.
        link = db.query(CrmCustomerSync).filter_by(
            customer_id=lead.customer_id, provider="hubspot").first()
        assert link is not None
        assert link.record_url == OK_RESULT.record_url


@pytest.fixture
def synced_customer(db, test_organization):
    cust = Customer(organization_id=test_organization.id,
                    email="nadia@example.com", full_name="Nadia Rahman")
    db.add(cust)
    db.commit()
    db.refresh(cust)
    return cust


class TestManualSync:

    @pytest.mark.asyncio
    async def test_pushes_and_records_link(self, db, connection, synced_customer,
                                           monkeypatch):
        monkeypatch.setattr(HubSpotAdapter, "push_lead", AsyncMock(return_value=OK_RESULT))
        records = await sync_customer_to_crm(db, synced_customer)
        assert len(records) == 1 and records[0].provider == "hubspot"
        link = CrmCustomerSyncRepository(db).list_for_customer(synced_customer.id)
        assert link and link[0].record_url == OK_RESULT.record_url

    @pytest.mark.asyncio
    async def test_requires_email(self, db, connection, test_organization):
        # Anonymous visitors carry a @noemail.com placeholder, not a real address.
        anon = Customer(organization_id=test_organization.id,
                        email="anon-visitor@noemail.com")
        db.add(anon); db.commit(); db.refresh(anon)
        with pytest.raises(CrmManualSyncError, match="email"):
            await sync_customer_to_crm(db, anon)

    @pytest.mark.asyncio
    async def test_requires_connection(self, db, synced_customer):
        with pytest.raises(CrmManualSyncError, match="Connect a CRM"):
            await sync_customer_to_crm(db, synced_customer)

    @pytest.mark.asyncio
    async def test_plan_gate(self, db, connection, synced_customer, monkeypatch):
        monkeypatch.setattr("app.services.crm_sync.feature_allowed",
                            lambda *a, **k: False)
        with pytest.raises(CrmManualSyncError, match="plan"):
            await sync_customer_to_crm(db, synced_customer)

    @pytest.mark.asyncio
    async def test_provider_failure_surfaces(self, db, connection, synced_customer,
                                             monkeypatch):
        monkeypatch.setattr(HubSpotAdapter, "push_lead", AsyncMock(
            return_value=CrmPushResult(ok=False, error="bad request")))
        with pytest.raises(CrmManualSyncError):
            await sync_customer_to_crm(db, synced_customer)
