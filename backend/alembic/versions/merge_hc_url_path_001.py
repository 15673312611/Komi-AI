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

"""merge the preserved-URL, allow-new-chat and upload-prefix heads

Revision ID: merge_hc_url_path_001
Revises: add_hc_faq_url_path_001, add_allow_new_chat_001, normalise_upload_prefix_001
Create Date: 2026-08-10

Three revisions branched off repair_agent_role_seed_001 independently: the
preserved help-center URLs on this branch, plus allow-new-chat and the upload
prefix normalisation, which had ALREADY left main with two heads before this
branch existed. `alembic upgrade head` in scripts/start.sh refuses to pick
between heads and fails, so the backend crash-loops on start until they are
rejoined. This no-op merge does that. The revision id is kept short —
alembic_version.version_num is varchar(32).
"""
from alembic import op  # noqa: F401
import sqlalchemy as sa  # noqa: F401

# revision identifiers, used by Alembic.
revision = 'merge_hc_url_path_001'
down_revision = (
    'add_hc_faq_url_path_001',
    'add_allow_new_chat_001',
    'normalise_upload_prefix_001',
)
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
