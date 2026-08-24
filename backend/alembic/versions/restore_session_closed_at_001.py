"""restore the durable session close timestamp

Revision ID: restore_closed_at_001
Revises: fcm_tokens_per_device_001
Create Date: 2026-08-24

The original end-chat migration accidentally dropped ``closed_at`` while
adding the reason and description columns.  The ORM and close APIs use the
timestamp for lifecycle reporting and idempotent state transitions, so restore
it on databases that have already applied that migration.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "restore_closed_at_001"
down_revision = "fcm_tokens_per_device_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "session_to_agents",
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("session_to_agents", "closed_at")
