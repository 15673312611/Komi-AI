"""add durable idempotency key for outbound channel sends

Revision ID: add_outbound_idempotency_001
Revises: add_chat_read_states_001
Create Date: 2026-08-25
"""

from alembic import op
import sqlalchemy as sa


revision = "add_outbound_idempotency_001"
down_revision = "add_chat_read_states_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "channel_conversations",
        sa.Column("outbound_idempotency_key", sa.String(), nullable=True),
    )
    op.create_index(
        "ix_channel_conversations_outbound_idempotency_key",
        "channel_conversations",
        ["outbound_idempotency_key"],
    )
    op.create_unique_constraint(
        "uq_channel_conversation_outbound_key",
        "channel_conversations",
        ["channel_account_id", "outbound_idempotency_key"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_channel_conversation_outbound_key",
        "channel_conversations",
        type_="unique",
    )
    op.drop_index(
        "ix_channel_conversations_outbound_idempotency_key",
        table_name="channel_conversations",
    )
    op.drop_column("channel_conversations", "outbound_idempotency_key")
