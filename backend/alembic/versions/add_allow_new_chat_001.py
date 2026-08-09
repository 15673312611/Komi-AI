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

"""add agent_customizations.allow_new_chat

Revision ID: add_allow_new_chat_001
Revises: repair_agent_role_seed_001
Create Date: 2026-08-09

Shows a "New chat" control in the widget so a visitor can abandon the current
conversation and start a clean one. Defaults false: starting a new chat closes
the session, which would cut off a human agent mid-handover, so operators opt in.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_allow_new_chat_001'
down_revision = 'repair_agent_role_seed_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'agent_customizations',
        sa.Column('allow_new_chat', sa.Boolean(),
                  server_default=sa.text('false'), nullable=False),
    )


def downgrade() -> None:
    op.drop_column('agent_customizations', 'allow_new_chat')
