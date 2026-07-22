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

import enum
import uuid

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, JSON,
    UniqueConstraint, Index,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class _ValueStrEnum(str, enum.Enum):
    """str-enum whose str() is the value — in-memory enum instances and
    refreshed-from-DB plain strings render identically (plain-string columns)."""

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.value


class CrmProvider(_ValueStrEnum):
    """CRMs a lead can be pushed to.

    Stored as plain strings (not a DB enum) so adding a provider never
    requires a schema migration — mirrors ChannelType.
    """
    HUBSPOT = "hubspot"
    PIPEDRIVE = "pipedrive"


class CrmConnectionStatus(_ValueStrEnum):
    ACTIVE = "active"
    EXPIRED = "expired"    # refresh token dead — needs a reconnect
    REVOKED = "revoked"    # uninstalled from the CRM side


class CrmSyncJobStatus(_ValueStrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"    # intentionally not pushed (no email, plan downgrade, uninstall)


class CrmConnection(Base):
    """An organization's OAuth connection to a CRM (one per provider per org).

    All provider secrets (access/refresh tokens, scopes, per-tenant API domain)
    live together in `encrypted_credentials` as a Fernet-encrypted JSON blob so
    new providers never need schema changes. Token expiries are mirrored into
    plain columns so background sweeps can query without decrypting.
    """
    __tablename__ = "crm_connections"

    __table_args__ = (
        UniqueConstraint('organization_id', 'provider', name='uq_crm_connection_org_provider'),
        UniqueConstraint('provider', 'external_account_id', name='uq_crm_connection_external'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    provider = Column(String(32), nullable=False, index=True)
    # Platform-side identifier: HubSpot hub_id, Pipedrive company_id, ...
    external_account_id = Column(String, nullable=False)
    # Human-readable label shown in settings: portal / company name
    display_name = Column(String, nullable=True)
    # Fernet-encrypted JSON of provider secrets (tokens, scopes, api_domain)
    encrypted_credentials = Column(Text, nullable=False)
    status = Column(String(16), nullable=False, default=CrmConnectionStatus.ACTIVE.value,
                    server_default=CrmConnectionStatus.ACTIVE.value)
    last_error = Column(Text, nullable=True)

    access_token_expires_at = Column(DateTime(timezone=True), nullable=True)
    # Pipedrive refresh tokens have a 60-day sliding expiry; NULL for HubSpot.
    refresh_token_expires_at = Column(DateTime(timezone=True), nullable=True)
    last_refreshed_at = Column(DateTime(timezone=True), nullable=True)

    connected_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organization = relationship("Organization")


class CrmSyncJob(Base):
    """Queue row for pushing one captured lead to one CRM.

    The (lead_response_id, provider) unique constraint is the idempotency
    backbone: enqueue uses ON CONFLICT DO NOTHING, so double-invocation and
    worker replays can never produce a second push for the same lead.
    """
    __tablename__ = "crm_sync_jobs"

    __table_args__ = (
        UniqueConstraint('lead_response_id', 'provider', name='uq_crm_sync_job_lead_provider'),
        Index('ix_crm_sync_jobs_claim', 'status', 'next_attempt_at'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    lead_response_id = Column(
        UUID(as_uuid=True),
        ForeignKey("lead_capture_responses.id", ondelete="CASCADE"),
        nullable=False,
    )
    # UI context only; the push itself resolves everything from the lead response.
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True)
    provider = Column(String(32), nullable=False)
    # Resolved at process time (not enqueue) so a reconnect between capture and
    # push still delivers; stamped for audit once the job runs.
    connection_id = Column(UUID(as_uuid=True), ForeignKey("crm_connections.id", ondelete="SET NULL"), nullable=True)

    status = Column(String(16), nullable=False, default=CrmSyncJobStatus.PENDING.value,
                    server_default=CrmSyncJobStatus.PENDING.value)
    attempts = Column(Integer, nullable=False, default=0, server_default='0')
    next_attempt_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    # Set on claim; stale-claim recovery resets rows stuck in processing.
    started_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    # {"action": "created|updated", "contact_id": ..., "secondary_id": ..., "record_url": ...}
    result = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    lead_response = relationship("LeadCaptureResponse")
    connection = relationship("CrmConnection")
