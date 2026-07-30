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

"""add guardrail_events table and agents.topic_scope

Revision ID: add_guardrails_layer_001
Revises: add_crm_customer_syncs_001
Create Date: 2026-07-30

Global guardrail layer for customer-facing agents. guardrail_events records
every trigger (injection signals, blocks, prompt-leak replacements, scope
refusals) so abuse is measurable and false positives reviewable before any
rule is promoted from counting to blocking. agents.topic_scope is the optional
per-agent remit override for the code-owned policy's topic-scope line; null
falls back to the agent description or the organization name/domain.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_guardrails_layer_001'
down_revision = 'add_crm_customer_syncs_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'guardrail_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=True),
        sa.Column('agent_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('agents.id', ondelete='SET NULL'), nullable=True),
        # No FK: a help-center /ask event has no chat session.
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('surface', sa.String(20), nullable=False),
        sa.Column('layer', sa.String(16), nullable=False),
        sa.Column('rule', sa.String(64), nullable=False),
        sa.Column('action', sa.String(16), nullable=False),
        sa.Column('score', sa.Float(), nullable=True),
        # Rule ids / short match tokens only — never raw visitor text.
        sa.Column('matched', sa.JSON(), nullable=True),
        sa.Column('char_len', sa.Integer(), nullable=True),
        # Encrypted at rest (EncryptedText decorates a Text column).
        sa.Column('excerpt', sa.Text(), nullable=True),
        sa.Column('reviewed', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('false_positive', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_guardrail_events_org_created', 'guardrail_events',
                    ['organization_id', 'created_at'])
    op.create_index('ix_guardrail_events_rule_created', 'guardrail_events',
                    ['rule', 'created_at'])

    op.add_column('agents', sa.Column('topic_scope', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('agents', 'topic_scope')
    op.drop_index('ix_guardrail_events_rule_created', table_name='guardrail_events')
    op.drop_index('ix_guardrail_events_org_created', table_name='guardrail_events')
    op.drop_table('guardrail_events')
