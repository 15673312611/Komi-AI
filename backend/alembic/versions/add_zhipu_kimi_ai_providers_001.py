"""Add Zhipu and Kimi AI provider enum values.

Revision ID: add_zhipu_kimi_ai_providers_001
Revises: normalise_upload_prefix_001
"""

from typing import Sequence, Union

from alembic import op


revision: str = "add_zhipu_kimi_ai_providers_001"
down_revision: Union[str, None] = "normalise_upload_prefix_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE aimodeltype ADD VALUE IF NOT EXISTS 'ZHIPU'")
    op.execute("ALTER TYPE aimodeltype ADD VALUE IF NOT EXISTS 'KIMI'")


def downgrade() -> None:
    # PostgreSQL enum values cannot be removed safely in place.
    pass
