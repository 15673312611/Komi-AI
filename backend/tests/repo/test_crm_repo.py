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

import pytest

from app.models.crm import CrmConnectionStatus, CrmSyncJobStatus
from app.models.lead_capture import LeadCaptureResponse
from app.repositories.crm import (
    CrmConnectionRepository, CrmSyncJobRepository, MAX_ATTEMPTS,
)


@pytest.fixture
def conn_repo(db):
    return CrmConnectionRepository(db)


@pytest.fixture
def job_repo(db):
    return CrmSyncJobRepository(db)


@pytest.fixture
def test_lead_response(db, test_organization, test_agent, test_customer) -> LeadCaptureResponse:
    response = LeadCaptureResponse(
        organization_id=test_organization.id,
        agent_id=test_agent.id,
        customer_id=test_customer.id,
        field_values={"email": "lead@example.com", "name": "Lead Person"},
        consent=True,
        qualified=True,
    )
    db.add(response)
    db.commit()
    db.refresh(response)
    return response


CREDS = {"access_token": "at-1", "refresh_token": "rt-1", "api_domain": None}


def _aware(dt: datetime) -> datetime:
    """SQLite loses tzinfo on refresh; normalize for comparisons (PG keeps it)."""
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _connect(conn_repo, org_id, provider="hubspot", external_id="hub-123", **kwargs):
    return conn_repo.create_or_update(
        organization_id=org_id,
        provider=provider,
        external_account_id=external_id,
        credentials=CREDS,
        display_name="Acme Portal",
        **kwargs,
    )


class TestCrmConnectionRepository:

    def test_credentials_round_trip_encrypted(self, conn_repo, test_organization):
        conn = _connect(conn_repo, test_organization.id)
        # Stored blob is ciphertext, decrypts back to the original dict.
        assert "at-1" not in conn.encrypted_credentials
        assert conn_repo.get_credentials(conn) == CREDS

    def test_create_or_update_is_an_upsert(self, conn_repo, test_organization):
        first = _connect(conn_repo, test_organization.id)
        conn_repo.set_status(first, CrmConnectionStatus.EXPIRED.value, last_error="dead token")

        reconnected = _connect(conn_repo, test_organization.id, external_id="hub-456")
        assert reconnected.id == first.id  # same row, not a duplicate
        assert reconnected.external_account_id == "hub-456"
        assert reconnected.status == CrmConnectionStatus.ACTIVE.value
        assert reconnected.last_error is None

    def test_get_active_ignores_expired(self, conn_repo, test_organization):
        conn = _connect(conn_repo, test_organization.id)
        assert conn_repo.get_active(test_organization.id, "hubspot") is not None
        conn_repo.set_status(conn, CrmConnectionStatus.EXPIRED.value)
        assert conn_repo.get_active(test_organization.id, "hubspot") is None

    def test_save_credentials_mirrors_expiries(self, conn_repo, test_organization):
        conn = _connect(conn_repo, test_organization.id, provider="pipedrive",
                        external_id="pd-1")
        access_exp = datetime.now(timezone.utc) + timedelta(hours=1)
        refresh_exp = datetime.now(timezone.utc) + timedelta(days=60)
        conn = conn_repo.save_credentials(
            conn, {"access_token": "at-2", "refresh_token": "rt-2"},
            access_token_expires_at=access_exp,
            refresh_token_expires_at=refresh_exp,
        )
        assert conn_repo.get_credentials(conn)["access_token"] == "at-2"
        assert conn.access_token_expires_at is not None
        assert conn.refresh_token_expires_at is not None
        assert conn.last_refreshed_at is not None

    def test_list_needing_refresh(self, conn_repo, db, test_organization):
        conn = _connect(conn_repo, test_organization.id, provider="pipedrive",
                        external_id="pd-2")
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        # Freshly connected → not due.
        assert conn_repo.list_needing_refresh("pipedrive", cutoff) == []
        conn.last_refreshed_at = datetime.now(timezone.utc) - timedelta(days=2)
        db.commit()
        assert [c.id for c in conn_repo.list_needing_refresh("pipedrive", cutoff)] == [conn.id]
        # Expired connections are never swept.
        conn_repo.set_status(conn, CrmConnectionStatus.EXPIRED.value)
        assert conn_repo.list_needing_refresh("pipedrive", cutoff) == []


class TestCrmSyncJobRepository:

    def test_enqueue_is_idempotent(self, job_repo, test_organization, test_lead_response):
        job = job_repo.enqueue(test_organization.id, test_lead_response.id, "hubspot")
        assert job is not None
        assert job.status == CrmSyncJobStatus.PENDING.value
        # Same lead + provider → no second job.
        assert job_repo.enqueue(test_organization.id, test_lead_response.id, "hubspot") is None
        # Same lead, other provider → its own job.
        other = job_repo.enqueue(test_organization.id, test_lead_response.id, "pipedrive")
        assert other is not None and other.id != job.id

    def test_claim_marks_processing_and_respects_due_time(
            self, job_repo, db, test_organization, test_lead_response):
        due = job_repo.enqueue(test_organization.id, test_lead_response.id, "hubspot")
        future = job_repo.enqueue(test_organization.id, test_lead_response.id, "pipedrive")
        future.next_attempt_at = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()

        claimed = job_repo.claim_batch(limit=10)
        assert [j.id for j in claimed] == [due.id]
        assert claimed[0].status == CrmSyncJobStatus.PROCESSING.value
        assert claimed[0].started_at is not None
        # Already-claimed jobs are not claimed again.
        assert job_repo.claim_batch(limit=10) == []

    def test_reclaim_stale_returns_crashed_claims(
            self, job_repo, db, test_organization, test_lead_response):
        job = job_repo.enqueue(test_organization.id, test_lead_response.id, "hubspot")
        job_repo.claim_batch(limit=1)
        db.refresh(job)
        job.started_at = datetime.now(timezone.utc) - timedelta(minutes=30)
        db.commit()

        assert job_repo.reclaim_stale(older_than_minutes=10) == 1
        db.refresh(job)
        assert job.status == CrmSyncJobStatus.PENDING.value
        assert job.started_at is None

    def test_complete_stamps_result_and_connection(
            self, job_repo, conn_repo, test_organization, test_lead_response):
        conn = _connect(conn_repo, test_organization.id)
        job = job_repo.enqueue(test_organization.id, test_lead_response.id, "hubspot")
        job = job_repo.complete(job, {"action": "created", "contact_id": "42"},
                                connection_id=conn.id)
        assert job.status == CrmSyncJobStatus.COMPLETED.value
        assert job.result["contact_id"] == "42"
        assert job.connection_id == conn.id

    def test_schedule_retry_backs_off_then_fails_terminally(
            self, job_repo, test_organization, test_lead_response):
        job = job_repo.enqueue(test_organization.id, test_lead_response.id, "hubspot")
        before = datetime.now(timezone.utc)
        job = job_repo.schedule_retry(job, "HTTP 502")
        assert job.status == CrmSyncJobStatus.PENDING.value
        assert job.attempts == 1
        assert _aware(job.next_attempt_at) > before

        job.attempts = MAX_ATTEMPTS - 1
        job = job_repo.schedule_retry(job, "HTTP 502 again")
        assert job.status == CrmSyncJobStatus.FAILED.value
        assert job.attempts == MAX_ATTEMPTS

    def test_retry_after_wins_over_backoff_when_longer(
            self, job_repo, test_organization, test_lead_response):
        job = job_repo.enqueue(test_organization.id, test_lead_response.id, "hubspot")
        job = job_repo.schedule_retry(job, "HTTP 429", retry_after_seconds=7200)
        # 7200 > capped backoff (3600) → provider's Retry-After is honored.
        assert _aware(job.next_attempt_at) >= datetime.now(timezone.utc) + timedelta(seconds=7000)

    def test_skip_pending_for_connection(
            self, job_repo, test_organization, test_lead_response):
        job = job_repo.enqueue(test_organization.id, test_lead_response.id, "hubspot")
        count = job_repo.skip_pending_for_connection(
            test_organization.id, "hubspot", "app uninstalled")
        assert count == 1
        assert job_repo.claim_batch(limit=10) == []

    def test_count_recent_failures(self, job_repo, test_organization, test_lead_response):
        job = job_repo.enqueue(test_organization.id, test_lead_response.id, "hubspot")
        job_repo.fail(job, "boom")
        assert job_repo.count_recent_failures(test_organization.id, "hubspot") == 1
        assert job_repo.count_recent_failures(test_organization.id, "pipedrive") == 0

    def test_reopen_failed_requeues(self, job_repo, test_organization, test_lead_response):
        job = job_repo.enqueue(test_organization.id, test_lead_response.id, "hubspot")
        job.attempts = 7
        job_repo.fail(job, "no_connection")
        assert job_repo.reopen_failed(test_organization.id, "hubspot") == 1
        job_repo.db.refresh(job)
        assert job.status == CrmSyncJobStatus.PENDING.value
        assert job.attempts == 0
        # Other providers untouched.
        assert job_repo.reopen_failed(test_organization.id, "pipedrive") == 0
