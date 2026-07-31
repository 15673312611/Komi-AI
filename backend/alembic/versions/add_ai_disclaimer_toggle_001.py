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

"""add agent_customizations.show_ai_disclaimer

Revision ID: add_ai_disclaimer_001
Revises: add_agent_guardrail_prompt_001
Create Date: 2026-07-31

Controls the "AI can make mistakes" line in the widget footer. Defaults true so
existing widgets disclose by default; operators who show the disclosure
elsewhere on their site can switch it off.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_ai_disclaimer_001'
down_revision = 'add_agent_guardrail_prompt_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'agent_customizations',
        sa.Column('show_ai_disclaimer', sa.Boolean(),
                  server_default=sa.text('true'), nullable=False),
    )


def downgrade() -> None:
    op.drop_column('agent_customizations', 'show_ai_disclaimer')
