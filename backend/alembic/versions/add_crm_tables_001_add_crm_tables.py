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

"""add crm_connections and crm_sync_jobs (CRM lead push)

Revision ID: add_crm_tables_001
Revises: crm_sync_varchar_001
Create Date: 2026-07-22 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'add_crm_tables_001'
down_revision: Union[str, None] = 'crm_sync_varchar_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'crm_connections',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('provider', sa.String(length=32), nullable=False),
        sa.Column('external_account_id', sa.String(), nullable=False),
        sa.Column('display_name', sa.String(), nullable=True),
        sa.Column('encrypted_credentials', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=16), nullable=False, server_default='active'),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('access_token_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('refresh_token_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_refreshed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('connected_by_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['connected_by_user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('organization_id', 'provider', name='uq_crm_connection_org_provider'),
        sa.UniqueConstraint('provider', 'external_account_id', name='uq_crm_connection_external'),
    )
    op.create_index('ix_crm_connections_organization_id', 'crm_connections', ['organization_id'])
    op.create_index('ix_crm_connections_provider', 'crm_connections', ['provider'])

    op.create_table(
        'crm_sync_jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('lead_response_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('agent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('provider', sa.String(length=32), nullable=False),
        sa.Column('connection_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('status', sa.String(length=16), nullable=False, server_default='pending'),
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('next_attempt_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('result', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['lead_response_id'], ['lead_capture_responses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['connection_id'], ['crm_connections.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('lead_response_id', 'provider', name='uq_crm_sync_job_lead_provider'),
    )
    op.create_index('ix_crm_sync_jobs_organization_id', 'crm_sync_jobs', ['organization_id'])
    op.create_index('ix_crm_sync_jobs_claim', 'crm_sync_jobs', ['status', 'next_attempt_at'])


def downgrade() -> None:
    op.drop_index('ix_crm_sync_jobs_claim', table_name='crm_sync_jobs')
    op.drop_index('ix_crm_sync_jobs_organization_id', table_name='crm_sync_jobs')
    op.drop_table('crm_sync_jobs')
    op.drop_index('ix_crm_connections_provider', table_name='crm_connections')
    op.drop_index('ix_crm_connections_organization_id', table_name='crm_connections')
    op.drop_table('crm_connections')
