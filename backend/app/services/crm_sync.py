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
from app.crm.base import CrmAuthError, CrmPushResult, CrmTransientError
from app.crm.mapping import build_customer_payload, build_lead_payload
from app.crm.registry import get_adapter
from app.models.crm import CrmConnectionStatus, CrmSyncJob
from app.models.customer import Customer
from app.models.lead_capture import CrmSyncTarget, LeadCaptureConfig, LeadCaptureResponse
from app.repositories.crm import (
    CrmConnectionRepository, CrmSyncJobRepository, CrmCustomerSyncRepository,
)
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
        # Record the per-person link so the People drawer can show it.
        if response.customer_id:
            _record_customer_sync(db, job.organization_id, response.customer_id,
                                  job.provider, result)
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


class CrmManualSyncError(Exception):
    """A manual "Sync now" could not be completed (surfaced to the user)."""


async def sync_customer_to_crm(db: Session, customer: Customer) -> list:
    """Manual "Sync now" from the People drawer: push this person to every
    active CRM connection in their org and record each link. Synchronous so
    the UI gets an immediate result. Returns the list of recorded links.

    Raises CrmManualSyncError for user-facing failures (no email, no
    connection, plan gate, or a definitive provider rejection)."""
    from app.repositories.customer import CustomerRepository
    # Anonymous visitors carry a placeholder stand-in (…@noemail.com / .channel)
    # that can't receive mail — never push it to a CRM.
    if CustomerRepository.is_placeholder_email(customer.email):
        raise CrmManualSyncError("Add an email to this person before syncing to a CRM.")
    if not feature_allowed(db, customer.organization_id, "crm_sync"):
        raise CrmManualSyncError("CRM sync is not available in your current plan.")

    connections = CrmConnectionRepository(db).list_by_org(customer.organization_id)
    active = [c for c in connections if c.status == CrmConnectionStatus.ACTIVE.value]
    if not active:
        raise CrmManualSyncError("Connect a CRM in Settings → Integrations first.")

    payload = build_customer_payload(customer, summary=_latest_summary(db, customer.id))
    records, errors = [], []
    for connection in active:
        adapter = get_adapter(connection.provider)
        if adapter is None:
            continue
        try:
            tokens = await get_valid_tokens(db, connection)
            result = await adapter.push_lead(tokens, payload)
            if result.auth_failed:
                tokens = await get_valid_tokens(db, connection, force_refresh=True)
                result = await adapter.push_lead(tokens, payload)
        except CrmAuthError:
            errors.append(f"{connection.provider}: reconnect required")
            continue
        except CrmTransientError:
            errors.append(f"{connection.provider}: temporary error, try again")
            continue
        if result.ok:
            records.append(_record_customer_sync(
                db, customer.organization_id, customer.id, connection.provider, result))
        elif result.auth_failed:
            connections_repo = CrmConnectionRepository(db)
            connections_repo.set_status(connection, CrmConnectionStatus.EXPIRED.value,
                                        last_error=result.error)
            errors.append(f"{connection.provider}: reconnect required")
        else:
            errors.append(f"{connection.provider}: {result.error or 'push failed'}")

    if not records and errors:
        raise CrmManualSyncError("; ".join(errors))
    return records


def _record_customer_sync(db: Session, organization_id, customer_id, provider: str,
                          result: CrmPushResult):
    return CrmCustomerSyncRepository(db).record(
        organization_id=organization_id,
        customer_id=customer_id,
        provider=provider,
        contact_id=result.contact_id,
        secondary_id=result.secondary_id,
        record_url=result.record_url,
    )


def _latest_summary(db: Session, customer_id) -> Optional[str]:
    """The most recent AI conversation summary for a person (the same one the
    People drawer shows), so a manual push carries it as a CRM note."""
    row = (
        db.query(LeadCaptureResponse.summary)
        .filter(LeadCaptureResponse.customer_id == customer_id,
                LeadCaptureResponse.summary.isnot(None))
        .order_by(LeadCaptureResponse.created_at.desc())
        .first()
    )
    return row[0] if row else None


def _config_for_agent(db: Session, agent_id) -> Optional[LeadCaptureConfig]:
    if agent_id is None:
        return None
    return db.query(LeadCaptureConfig).filter(
        LeadCaptureConfig.agent_id == agent_id).first()
