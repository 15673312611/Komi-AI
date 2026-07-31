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

"""add investigation_runs.connector_status

Revision ID: add_run_connector_status_001
Revises: add_agent_guardrail_prompt_001
Create Date: 2026-07-31

Records the MCP connector outcome of each investigation run ({"configured": N,
"loaded": M, "failed": [{"name", "error"}]}) so a run that quietly executed
with 0 of its configured tools (e.g. npx missing in the image, issue #271) is
visible on the run detail instead of only in worker logs.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic.
revision = 'add_run_connector_status_001'
down_revision = 'add_agent_guardrail_prompt_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('investigation_runs', sa.Column('connector_status', JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('investigation_runs', 'connector_status')
