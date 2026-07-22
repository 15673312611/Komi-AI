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

from typing import Optional

from sqlalchemy.orm import Session

from app.core.logger import get_logger
from app.crm.base import CrmAuthError, CrmTransientError
from app.crm.mapping import build_lead_payload
from app.crm.registry import get_adapter
from app.models.crm import CrmConnectionStatus, CrmSyncJob
from app.models.customer import Customer
from app.models.lead_capture import CrmSyncTarget, LeadCaptureConfig, LeadCaptureResponse
from app.repositories.crm import CrmConnectionRepository, CrmSyncJobRepository
from app.services.crm_tokens import get_valid_tokens
from app.services.feature_gate import feature_allowed

logger = get_logger(__name__)


def enqueue_crm_sync(db: Session, config: LeadCaptureConfig,
                     response: LeadCaptureResponse) -> Optional[CrmSyncJob]:
    """Queue a captured lead for CRM push, or quietly decide not to.

    All the "should this sync at all" logic lives here so the capture path
    stays dumb: no target configured, plan lacks the feature (fails closed),
    or no active connection → no job. Idempotent per (lead, provider)."""
    provider = str(config.crm_sync_target or CrmSyncTarget.NONE.value)
    if provider == CrmSyncTarget.NONE.value:
        return None
    if get_adapter(provider) is None:
        logger.warning(f"Lead {response.id}: unknown CRM target '{provider}', not syncing")
        return None
    if not feature_allowed(db, response.organization_id, "crm_sync"):
        logger.info(f"Lead {response.id}: plan lacks crm_sync, not syncing")
        return None
    connection = CrmConnectionRepository(db).get_active(response.organization_id, provider)
    if connection is None:
        logger.info(f"Lead {response.id}: no active {provider} connection, not syncing")
        return None
    job = CrmSyncJobRepository(db).enqueue(
        organization_id=response.organization_id,
        lead_response_id=response.id,
        provider=provider,
        agent_id=response.agent_id,
    )
    if job is not None:
        logger.info(f"Queued {provider} sync for lead {response.id}")
    return job


async def process_job(db: Session, job: CrmSyncJob) -> CrmSyncJob:
    """Run one claimed sync job to a terminal or retry state.

    Safe to re-run: the adapters' push sequences converge (HubSpot upsert,
    Pipedrive search-first + open-lead check)."""
    jobs = CrmSyncJobRepository(db)

    # Re-checked at run time: the org may have downgraded since enqueue.
    if not feature_allowed(db, job.organization_id, "crm_sync"):
        return jobs.skip(job, "plan no longer includes crm_sync")

    connections = CrmConnectionRepository(db)
    connection = connections.get_active(job.organization_id, job.provider)
    if connection is None:
        # Terminal: retrying cannot help until a human reconnects, and the
        # reconnect path enqueues nothing retroactively — the UI surfaces it.
        return jobs.fail(job, "no_connection")

    response = db.get(LeadCaptureResponse, job.lead_response_id)
    if response is None:
        return jobs.skip(job, "lead response deleted")
    payload = build_lead_payload(
        response,
        _config_for_agent(db, response.agent_id),
        db.get(Customer, response.customer_id) if response.customer_id else None,
    )
    if not payload.email:
        return jobs.skip(job, "lead has no email")

    adapter = get_adapter(job.provider)
    try:
        tokens = await get_valid_tokens(db, connection)
    except CrmAuthError as e:
        return jobs.fail(job, f"auth: {e}", connection_id=connection.id)
    except CrmTransientError as e:
        return jobs.schedule_retry(job, f"token refresh failed: {e}")

    result = await adapter.push_lead(tokens, payload)

    if result.auth_failed:
        # The stored expiry looked fine but the provider said no — force one
        # refresh and retry before declaring the connection dead.
        try:
            tokens = await get_valid_tokens(db, connection, force_refresh=True)
        except (CrmAuthError, CrmTransientError) as e:
            return jobs.fail(job, f"auth: {e}", connection_id=connection.id)
        result = await adapter.push_lead(tokens, payload)
        if result.auth_failed:
            connections.set_status(connection, CrmConnectionStatus.EXPIRED.value,
                                   last_error=result.error)
            return jobs.fail(job, f"auth: {result.error}", connection_id=connection.id)

    if result.ok:
        logger.info(f"Pushed lead {response.id} to {job.provider} "
                    f"({result.action} {result.contact_id})")
        return jobs.complete(job, {
            "action": result.action,
            "contact_id": result.contact_id,
            "secondary_id": result.secondary_id,
            "record_url": result.record_url,
        }, connection_id=connection.id)
    if result.retryable:
        return jobs.schedule_retry(job, result.error or "retryable failure",
                                   retry_after_seconds=result.retry_after_seconds)
    return jobs.fail(job, result.error or "push failed", connection_id=connection.id)


def _config_for_agent(db: Session, agent_id) -> Optional[LeadCaptureConfig]:
    if agent_id is None:
        return None
    return db.query(LeadCaptureConfig).filter(
        LeadCaptureConfig.agent_id == agent_id).first()
