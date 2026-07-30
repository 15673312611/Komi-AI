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

import json
import random
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.crm import (
    CrmConnection, CrmConnectionStatus, CrmSyncJob, CrmSyncJobStatus, CrmCustomerSync,
)
from app.core.security import encrypt_api_key, decrypt_api_key
from app.core.logger import get_logger

logger = get_logger(__name__)

# Retry policy: exponential backoff capped at an hour, terminal after MAX_ATTEMPTS.
MAX_ATTEMPTS = 7
BASE_BACKOFF_SECONDS = 60
MAX_BACKOFF_SECONDS = 3600
BACKOFF_JITTER_SECONDS = 30
# A job stuck in `processing` longer than this is presumed orphaned by a worker
# crash and is reclaimed.
STALE_CLAIM_MINUTES = 10


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class CrmConnectionRepository:
    """CRUD for CRM OAuth connections. Credentials are always stored
    Fernet-encrypted; use get_credentials()/save_credentials() so plaintext
    tokens never touch the table."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_org_provider(self, organization_id: UUID, provider: str) -> Optional[CrmConnection]:
        return self.db.query(CrmConnection).filter(
            CrmConnection.organization_id == organization_id,
            CrmConnection.provider == provider,
        ).first()

    def get_active(self, organization_id: UUID, provider: str) -> Optional[CrmConnection]:
        return self.db.query(CrmConnection).filter(
            CrmConnection.organization_id == organization_id,
            CrmConnection.provider == provider,
            CrmConnection.status == CrmConnectionStatus.ACTIVE.value,
        ).first()

    def get_by_external_id(self, provider: str, external_account_id: str) -> Optional[CrmConnection]:
        """Resolve which org a CRM portal is connected to (one portal ↔ one org)."""
        return self.db.query(CrmConnection).filter(
            CrmConnection.provider == provider,
            CrmConnection.external_account_id == external_account_id,
        ).first()

    def list_by_org(self, organization_id: UUID) -> List[CrmConnection]:
        return self.db.query(CrmConnection).filter(
            CrmConnection.organization_id == organization_id
        ).order_by(CrmConnection.created_at).all()

    def create_or_update(
        self,
        organization_id: UUID,
        provider: str,
        external_account_id: str,
        credentials: dict,
        display_name: Optional[str] = None,
        access_token_expires_at: Optional[datetime] = None,
        refresh_token_expires_at: Optional[datetime] = None,
        connected_by_user_id: Optional[UUID] = None,
    ) -> CrmConnection:
        """Upsert the org's connection for a provider (OAuth callback path).

        A reconnect replaces credentials, reactivates the row and clears any
        stored error.
        """
        try:
            connection = self.get_by_org_provider(organization_id, provider)
            if connection is None:
                connection = CrmConnection(organization_id=organization_id, provider=provider)
                self.db.add(connection)
            connection.external_account_id = external_account_id
            connection.display_name = display_name
            connection.encrypted_credentials = encrypt_api_key(json.dumps(credentials))
            connection.status = CrmConnectionStatus.ACTIVE.value
            connection.last_error = None
            connection.access_token_expires_at = access_token_expires_at
            connection.refresh_token_expires_at = refresh_token_expires_at
            connection.last_refreshed_at = _utcnow()
            if connected_by_user_id is not None:
                connection.connected_by_user_id = connected_by_user_id
            self.db.commit()
            self.db.refresh(connection)
            logger.info(f"Connected {provider} CRM for org {organization_id}")
            return connection
        except Exception as e:
            logger.error(f"Error saving CRM connection: {str(e)}")
            self.db.rollback()
            raise

    def get_credentials(self, connection: CrmConnection) -> dict:
        """Decrypt a connection's credential blob."""
        return json.loads(decrypt_api_key(connection.encrypted_credentials))

    def save_credentials(
        self,
        connection: CrmConnection,
        credentials: dict,
        access_token_expires_at: Optional[datetime] = None,
        refresh_token_expires_at: Optional[datetime] = None,
    ) -> CrmConnection:
        """Persist refreshed tokens, mirroring expiries so sweeps never decrypt."""
        try:
            connection.encrypted_credentials = encrypt_api_key(json.dumps(credentials))
            connection.access_token_expires_at = access_token_expires_at
            if refresh_token_expires_at is not None:
                connection.refresh_token_expires_at = refresh_token_expires_at
            connection.last_refreshed_at = _utcnow()
            self.db.commit()
            self.db.refresh(connection)
            return connection
        except Exception as e:
            logger.error(f"Error updating CRM credentials: {str(e)}")
            self.db.rollback()
            raise

    def set_status(self, connection: CrmConnection, status: str,
                   last_error: Optional[str] = None) -> CrmConnection:
        try:
            connection.status = status
            connection.last_error = last_error
            self.db.commit()
            self.db.refresh(connection)
            return connection
        except Exception as e:
            logger.error(f"Error updating CRM connection status: {str(e)}")
            self.db.rollback()
            raise

    def list_needing_refresh(self, provider: str, not_refreshed_since: datetime) -> List[CrmConnection]:
        """Active connections whose tokens haven't been refreshed recently —
        the proactive sweep that keeps Pipedrive's sliding refresh window alive."""
        return self.db.query(CrmConnection).filter(
            CrmConnection.provider == provider,
            CrmConnection.status == CrmConnectionStatus.ACTIVE.value,
            (CrmConnection.last_refreshed_at.is_(None)) |
            (CrmConnection.last_refreshed_at < not_refreshed_since),
        ).all()

    def delete(self, connection: CrmConnection) -> bool:
        try:
            self.db.delete(connection)
            self.db.commit()
            return True
        except Exception as e:
            logger.error(f"Error deleting CRM connection: {str(e)}")
            self.db.rollback()
            return False


class CrmSyncJobRepository:
    """The lead-push queue. One job per (lead, provider), claimed with
    SKIP LOCKED so multiple workers never double-process."""

    def __init__(self, db: Session):
        self.db = db

    def enqueue(
        self,
        organization_id: UUID,
        lead_response_id: UUID,
        provider: str,
        agent_id: Optional[UUID] = None,
    ) -> Optional[CrmSyncJob]:
        """Insert a job; returns None if one already exists for this lead+provider.

        The uq_crm_sync_job_lead_provider constraint enforces idempotency —
        a concurrent duplicate surfaces as IntegrityError, not a second job.
        """
        job = CrmSyncJob(
            organization_id=organization_id,
            lead_response_id=lead_response_id,
            provider=provider,
            agent_id=agent_id,
        )
        try:
            self.db.add(job)
            self.db.commit()
            self.db.refresh(job)
            return job
        except IntegrityError:
            self.db.rollback()
            return None
        except Exception as e:
            logger.error(f"Error enqueuing CRM sync job: {str(e)}")
            self.db.rollback()
            raise

    def claim_batch(self, limit: int = 20) -> List[CrmSyncJob]:
        """Atomically claim due pending jobs (FOR UPDATE SKIP LOCKED)."""
        try:
            now = _utcnow()
            ids = self.db.execute(
                select(CrmSyncJob.id)
                .where(
                    CrmSyncJob.status == CrmSyncJobStatus.PENDING.value,
                    CrmSyncJob.next_attempt_at <= now,
                )
                .order_by(CrmSyncJob.next_attempt_at)
                .limit(limit)
                .with_for_update(skip_locked=True)
            ).scalars().all()
            if not ids:
                self.db.commit()
                return []
            self.db.query(CrmSyncJob).filter(CrmSyncJob.id.in_(ids)).update(
                {CrmSyncJob.status: CrmSyncJobStatus.PROCESSING.value,
                 CrmSyncJob.started_at: now},
                synchronize_session=False,
            )
            self.db.commit()
            return (self.db.query(CrmSyncJob)
                    .filter(CrmSyncJob.id.in_(ids))
                    .order_by(CrmSyncJob.next_attempt_at)
                    .all())
        except Exception as e:
            logger.error(f"Error claiming CRM sync jobs: {str(e)}")
            self.db.rollback()
            return []

    def reclaim_stale(self, older_than_minutes: int = STALE_CLAIM_MINUTES) -> int:
        """Return crashed-worker claims to the queue."""
        try:
            cutoff = _utcnow() - timedelta(minutes=older_than_minutes)
            count = self.db.query(CrmSyncJob).filter(
                CrmSyncJob.status == CrmSyncJobStatus.PROCESSING.value,
                CrmSyncJob.started_at < cutoff,
            ).update(
                {CrmSyncJob.status: CrmSyncJobStatus.PENDING.value,
                 CrmSyncJob.started_at: None},
                synchronize_session=False,
            )
            self.db.commit()
            if count:
                logger.warning(f"Reclaimed {count} stale CRM sync job(s)")
            return count
        except Exception as e:
            logger.error(f"Error reclaiming stale CRM sync jobs: {str(e)}")
            self.db.rollback()
            return 0

    def complete(self, job: CrmSyncJob, result: dict,
                 connection_id: Optional[UUID] = None) -> CrmSyncJob:
        return self._finish(job, CrmSyncJobStatus.COMPLETED.value,
                            result=result, connection_id=connection_id)

    def fail(self, job: CrmSyncJob, error: str,
             connection_id: Optional[UUID] = None) -> CrmSyncJob:
        return self._finish(job, CrmSyncJobStatus.FAILED.value,
                            error=error, connection_id=connection_id)

    def skip(self, job: CrmSyncJob, reason: str) -> CrmSyncJob:
        return self._finish(job, CrmSyncJobStatus.SKIPPED.value, error=reason)

    def schedule_retry(self, job: CrmSyncJob, error: str,
                       retry_after_seconds: Optional[int] = None) -> CrmSyncJob:
        """Back the job off exponentially; terminal failure after MAX_ATTEMPTS.

        A provider-supplied Retry-After wins over the computed backoff when longer.
        """
        try:
            job.attempts += 1
            job.last_error = error
            if job.attempts >= MAX_ATTEMPTS:
                job.status = CrmSyncJobStatus.FAILED.value
            else:
                backoff = min(BASE_BACKOFF_SECONDS * (2 ** job.attempts), MAX_BACKOFF_SECONDS)
                delay = max(retry_after_seconds or 0, backoff) + random.uniform(0, BACKOFF_JITTER_SECONDS)
                job.status = CrmSyncJobStatus.PENDING.value
                job.started_at = None
                job.next_attempt_at = _utcnow() + timedelta(seconds=delay)
            self.db.commit()
            self.db.refresh(job)
            return job
        except Exception as e:
            logger.error(f"Error scheduling CRM sync retry: {str(e)}")
            self.db.rollback()
            raise

    def skip_pending_for_connection(self, organization_id: UUID, provider: str,
                                    reason: str) -> int:
        """Cancel queued work when a connection dies (disconnect/uninstall)."""
        try:
            count = self.db.query(CrmSyncJob).filter(
                CrmSyncJob.organization_id == organization_id,
                CrmSyncJob.provider == provider,
                CrmSyncJob.status == CrmSyncJobStatus.PENDING.value,
            ).update(
                {CrmSyncJob.status: CrmSyncJobStatus.SKIPPED.value,
                 CrmSyncJob.last_error: reason},
                synchronize_session=False,
            )
            self.db.commit()
            return count
        except Exception as e:
            logger.error(f"Error skipping pending CRM sync jobs: {str(e)}")
            self.db.rollback()
            return 0

    def reopen_failed(self, organization_id: UUID, provider: str) -> int:
        """Requeue terminally-failed jobs after a reconnect. The unique
        (lead_response_id, provider) constraint blocks re-enqueue, so without
        this a lead that failed while the connection was expired would never
        reach the CRM even after the admin reconnects."""
        try:
            count = self.db.query(CrmSyncJob).filter(
                CrmSyncJob.organization_id == organization_id,
                CrmSyncJob.provider == provider,
                CrmSyncJob.status == CrmSyncJobStatus.FAILED.value,
            ).update(
                {CrmSyncJob.status: CrmSyncJobStatus.PENDING.value,
                 CrmSyncJob.attempts: 0,
                 CrmSyncJob.started_at: None,
                 CrmSyncJob.next_attempt_at: _utcnow()},
                synchronize_session=False,
            )
            self.db.commit()
            if count:
                logger.info(f"Reopened {count} failed {provider} sync job(s) for "
                            f"org {organization_id} after reconnect")
            return count
        except Exception as e:
            logger.error(f"Error reopening failed CRM sync jobs: {str(e)}")
            self.db.rollback()
            return 0

    def count_recent_failures(self, organization_id: UUID, provider: str,
                              days: int = 7) -> int:
        cutoff = _utcnow() - timedelta(days=days)
        return self.db.query(CrmSyncJob).filter(
            CrmSyncJob.organization_id == organization_id,
            CrmSyncJob.provider == provider,
            CrmSyncJob.status == CrmSyncJobStatus.FAILED.value,
            CrmSyncJob.updated_at >= cutoff,
        ).count()

    def _finish(self, job: CrmSyncJob, status: str, result: Optional[dict] = None,
                error: Optional[str] = None,
                connection_id: Optional[UUID] = None) -> CrmSyncJob:
        try:
            job.status = status
            if result is not None:
                job.result = result
            if error is not None:
                job.last_error = error
            if connection_id is not None:
                job.connection_id = connection_id
            self.db.commit()
            self.db.refresh(job)
            return job
        except Exception as e:
            logger.error(f"Error finishing CRM sync job: {str(e)}")
            self.db.rollback()
            raise


class CrmCustomerSyncRepository:
    """The per-person CRM link shown on the People drawer (one row per
    customer + provider); upserted on every successful push."""

    def __init__(self, db: Session):
        self.db = db

    def list_for_customer(self, customer_id: UUID) -> List[CrmCustomerSync]:
        return self.db.query(CrmCustomerSync).filter(
            CrmCustomerSync.customer_id == customer_id
        ).all()

    def record(self, organization_id: UUID, customer_id: UUID, provider: str,
               contact_id: Optional[str] = None, secondary_id: Optional[str] = None,
               record_url: Optional[str] = None) -> CrmCustomerSync:
        """Upsert the customer's link for a provider after a successful push."""
        try:
            row = self.db.query(CrmCustomerSync).filter(
                CrmCustomerSync.customer_id == customer_id,
                CrmCustomerSync.provider == provider,
            ).first()
            if row is None:
                row = CrmCustomerSync(
                    organization_id=organization_id,
                    customer_id=customer_id,
                    provider=provider,
                )
                self.db.add(row)
            row.contact_id = contact_id
            row.secondary_id = secondary_id
            row.record_url = record_url
            row.synced_at = _utcnow()
            self.db.commit()
            self.db.refresh(row)
            return row
        except Exception as e:
            logger.error(f"Error recording CRM customer sync: {str(e)}")
            self.db.rollback()
            raise
