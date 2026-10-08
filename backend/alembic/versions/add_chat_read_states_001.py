"""persist per-user conversation read cursors

Revision ID: add_chat_read_states_001
Revises: restore_closed_at_001
Create Date: 2026-08-25
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "add_chat_read_states_001"
down_revision = "restore_closed_at_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "chat_read_states",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("last_read_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["session_id"], ["session_to_agents.session_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "session_id"),
    )
    op.create_index("ix_chat_read_states_organization_id", "chat_read_states", ["organization_id"])
    op.create_index("ix_chat_read_states_user_org", "chat_read_states", ["user_id", "organization_id"])


def downgrade() -> None:
    op.drop_index("ix_chat_read_states_user_org", table_name="chat_read_states")
    op.drop_index("ix_chat_read_states_organization_id", table_name="chat_read_states")
    op.drop_table("chat_read_states")
