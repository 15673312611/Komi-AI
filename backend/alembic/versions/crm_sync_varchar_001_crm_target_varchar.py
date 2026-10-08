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

"""convert crm_sync_target to varchar so new CRMs need no migration

Revision ID: crm_sync_varchar_001
Revises: merge_tkt_csat_001
Create Date: 2026-07-22 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'crm_sync_varchar_001'
down_revision: Union[str, None] = 'merge_tkt_csat_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# The original crmsynctarget enum stored member NAMES; the varchar column stores
# lowercase enum VALUES ('none', 'hubspot', ...) to match ChannelType convention.
_ORIGINAL_ENUM_LABELS = ('NONE', 'HUBSPOT', 'SALESFORCE')


def upgrade() -> None:
    op.execute("ALTER TABLE lead_capture_configs ALTER COLUMN crm_sync_target DROP DEFAULT")
    op.execute(
        "ALTER TABLE lead_capture_configs "
        "ALTER COLUMN crm_sync_target TYPE varchar(32) "
        "USING lower(crm_sync_target::text)"
    )
    op.execute("ALTER TABLE lead_capture_configs ALTER COLUMN crm_sync_target SET DEFAULT 'none'")
    op.execute("DROP TYPE IF EXISTS crmsynctarget")


def downgrade() -> None:
    labels = ", ".join(f"'{label}'" for label in _ORIGINAL_ENUM_LABELS)
    op.execute(f"CREATE TYPE crmsynctarget AS ENUM ({labels})")
    op.execute("ALTER TABLE lead_capture_configs ALTER COLUMN crm_sync_target DROP DEFAULT")
    # Values unknown to the original enum (e.g. 'pipedrive') fold to 'NONE'.
    op.execute(
        "ALTER TABLE lead_capture_configs "
        "ALTER COLUMN crm_sync_target TYPE crmsynctarget "
        f"USING (CASE WHEN upper(crm_sync_target) IN ({labels}) "
        "THEN upper(crm_sync_target) ELSE 'NONE' END)::crmsynctarget"
    )
    op.execute("ALTER TABLE lead_capture_configs ALTER COLUMN crm_sync_target SET DEFAULT 'NONE'")
