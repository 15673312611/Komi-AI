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

"""add agents.ai_replies_enabled (human-only agents)

Revision ID: add_agent_ai_replies_001
Revises: purge_mangled_crawl_pages_001
Create Date: 2026-08-02

Off means the AI never answers on this agent: every chat is queued for the team
from the customer's first message. Defaults on, so existing agents keep
answering exactly as before.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_agent_ai_replies_001'
down_revision = 'purge_mangled_crawl_pages_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'agents',
        sa.Column('ai_replies_enabled', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    )


def downgrade() -> None:
    op.drop_column('agents', 'ai_replies_enabled')
