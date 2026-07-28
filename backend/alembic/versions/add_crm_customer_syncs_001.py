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

"""add crm_customer_syncs (per-person CRM link)

Revision ID: add_crm_customer_syncs_001
Revises: a8efc6b31aa8
Create Date: 2026-07-28 20:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'add_crm_customer_syncs_001'
down_revision: Union[str, None] = 'a8efc6b31aa8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'crm_customer_syncs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('provider', sa.String(length=32), nullable=False),
        sa.Column('contact_id', sa.String(), nullable=True),
        sa.Column('secondary_id', sa.String(), nullable=True),
        sa.Column('record_url', sa.String(), nullable=True),
        sa.Column('synced_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('customer_id', 'provider', name='uq_crm_customer_sync_customer_provider'),
    )
    op.create_index('ix_crm_customer_syncs_organization_id', 'crm_customer_syncs', ['organization_id'])
    op.create_index('ix_crm_customer_syncs_customer_id', 'crm_customer_syncs', ['customer_id'])


def downgrade() -> None:
    op.drop_index('ix_crm_customer_syncs_customer_id', table_name='crm_customer_syncs')
    op.drop_index('ix_crm_customer_syncs_organization_id', table_name='crm_customer_syncs')
    op.drop_table('crm_customer_syncs')
