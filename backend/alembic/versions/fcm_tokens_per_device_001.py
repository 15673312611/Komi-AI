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

"""per-device fcm_tokens table, replacing users.fcm_token_web

Revision ID: fcm_tokens_per_device_001
Revises: add_agent_ai_replies_001
Create Date: 2026-08-20

The old single column held one push token for the whole account, so signing in
on a second device overwrote the first one's token and signing out anywhere
cleared it for every device. Existing tokens are carried over, one row each, so
already-registered browsers keep receiving pushes across the deploy.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'fcm_tokens_per_device_001'
down_revision = 'add_agent_ai_replies_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'fcm_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('token', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token', name='uq_fcm_tokens_token'),
    )
    op.create_index('ix_fcm_tokens_user_id', 'fcm_tokens', ['user_id'])

    # Carry over the tokens already registered. DISTINCT ON keeps the unique
    # constraint safe in the unlikely case two accounts share a token — the
    # most recently updated row wins, which is the one FCM would deliver to.
    op.execute(
        """
        INSERT INTO fcm_tokens (id, user_id, token)
        SELECT DISTINCT ON (fcm_token_web) gen_random_uuid(), id, fcm_token_web
        FROM users
        WHERE fcm_token_web IS NOT NULL AND fcm_token_web <> ''
        ORDER BY fcm_token_web, updated_at DESC NULLS LAST
        """
    )

    op.drop_column('users', 'fcm_token_web')


def downgrade() -> None:
    op.add_column('users', sa.Column(
        'fcm_token_web', sa.String(), nullable=True))
    # Only one token per user fits in the old column; keep the newest.
    op.execute(
        """
        UPDATE users u
        SET fcm_token_web = t.token
        FROM (
            SELECT DISTINCT ON (user_id) user_id, token
            FROM fcm_tokens
            ORDER BY user_id, created_at DESC
        ) t
        WHERE t.user_id = u.id
        """
    )
    op.drop_index('ix_fcm_tokens_user_id', table_name='fcm_tokens')
    op.drop_table('fcm_tokens')
