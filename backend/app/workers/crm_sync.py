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

CRM lead-push worker.

Claims due crm_sync_jobs (FOR UPDATE SKIP LOCKED — replica-safe), groups them
by (provider, organization) and pushes each group serially so one tenant's
burst can't trip provider rate limits, while distinct tenants run
concurrently. A second, slower timer proactively refreshes Pipedrive tokens:
their refresh tokens die 60 days after last use, so idle tenants must be kept
alive by us, not by traffic.

Run as its own container: python -m app.workers.crm_sync
"""

import asyncio
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import List

from app.core.logger import get_logger
from app.crm.base import CrmAuthError, CrmTransientError
from app.database import SessionLocal
from app.models.crm import CrmProvider, CrmSyncJob
from app.repositories.crm import CrmConnectionRepository, CrmSyncJobRepository
from app.services.crm_sync import process_job
from app.services.crm_tokens import get_valid_tokens

logger = get_logger(__name__)

POLL_INTERVAL_SECONDS = 10
CLAIM_BATCH_SIZE = 20
REFRESH_SWEEP_INTERVAL_SECONDS = 6 * 3600
# Refresh anything not refreshed within a day — an idle tenant then has ~59
# failed sweeps of headroom before its 60-day window could actually lapse.
REFRESH_STALE_AFTER_HOURS = 24


async def run_sync_pass() -> None:
    """One poll: reclaim crashed claims, claim due jobs, push them."""
    with SessionLocal() as db:
        repo = CrmSyncJobRepository(db)
        repo.reclaim_stale()
        jobs = repo.claim_batch(CLAIM_BATCH_SIZE)
    if not jobs:
        return

    groups = defaultdict(list)
    for job in jobs:
        groups[(job.provider, job.organization_id)].append(job)
    await asyncio.gather(*(
        _process_group([job.id for job in group]) for group in groups.values()
    ))


async def _process_group(job_ids: List) -> None:
    """Serial pushes for one (provider, org) — its own session, so groups
    running concurrently never share SQLAlchemy state. When the connection
    proves dead mid-group, the rest fail fast instead of re-hitting it."""
    with SessionLocal() as db:
        repo = CrmSyncJobRepository(db)
        connection_dead = False
        for job_id in job_ids:
            job = db.get(CrmSyncJob, job_id)
            if job is None:
                continue
            if connection_dead:
                repo.fail(job, "auth: connection expired (failed earlier in batch)")
                continue
            try:
                job = await process_job(db, job)
            except Exception as e:
                logger.error(f"CRM sync job {job_id} crashed: {e}")
                db.rollback()  # discard any half-done state before the retry write
                repo.schedule_retry(job, f"worker error: {e}")
                continue
            if (job.last_error or "").startswith("auth:"):
                connection_dead = True


async def run_refresh_sweep() -> None:
    """Keep Pipedrive's sliding refresh-token window alive for idle tenants."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=REFRESH_STALE_AFTER_HOURS)
    with SessionLocal() as db:
        connections = CrmConnectionRepository(db).list_needing_refresh(
            CrmProvider.PIPEDRIVE.value, cutoff)
        for connection in connections:
            try:
                await get_valid_tokens(db, connection, force_refresh=True)
                logger.info(f"Refreshed idle Pipedrive connection {connection.id}")
            except CrmAuthError:
                pass  # marked expired inside get_valid_tokens; UI shows Reconnect
            except CrmTransientError as e:
                logger.warning(f"Pipedrive sweep refresh failed (will retry next "
                               f"sweep): {e}")


async def run_sync_loop(poll_interval: int = POLL_INTERVAL_SECONDS) -> None:
    while True:
        try:
            await run_sync_pass()
        except Exception as e:
            logger.error(f"Error in CRM sync loop: {e}")
        await asyncio.sleep(poll_interval)


async def run_refresh_loop(interval: int = REFRESH_SWEEP_INTERVAL_SECONDS) -> None:
    while True:
        try:
            await run_refresh_sweep()
        except Exception as e:
            logger.error(f"Error in CRM refresh sweep: {e}")
        await asyncio.sleep(interval)


async def main() -> None:
    await asyncio.gather(
        run_sync_loop(),
        run_refresh_loop(),
    )


if __name__ == "__main__":
    logger.info("Starting CRM sync worker")
    asyncio.run(main())
