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

"""add agents.guardrail_prompt and agents.guardrail_enabled

Revision ID: add_agent_guardrail_prompt_001
Revises: add_guardrails_layer_001
Create Date: 2026-07-31

Makes the agent's scope rule tenant-editable. A code-owned topic list is a
guess about what a business is NOT — the shipped wording refused maths problems
for a maths tutor and algorithm questions for a coding bootcamp, i.e. their core
use case. guardrail_prompt NULL means "use the platform default", so the default
wording can still be improved centrally without rewriting existing rows.
guardrail_enabled defaults true so every existing agent keeps its protection.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_agent_guardrail_prompt_001'
down_revision = 'add_guardrails_layer_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('agents', sa.Column('guardrail_prompt', sa.Text(), nullable=True))
    op.add_column(
        'agents',
        sa.Column('guardrail_enabled', sa.Boolean(),
                  server_default=sa.text('true'), nullable=False),
    )


def downgrade() -> None:
    op.drop_column('agents', 'guardrail_enabled')
    op.drop_column('agents', 'guardrail_prompt')
