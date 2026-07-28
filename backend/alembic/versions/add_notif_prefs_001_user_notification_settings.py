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

"""add per-user chat notification preferences

Revision ID: add_notif_prefs_001
Revises: add_faq_seo_001
Create Date: 2026-07-22

Rows are created lazily on first read, so nothing is backfilled here — a user
without a row falls back to the column defaults (transfer/assignment on,
new-chat off), which keeps today's transfer notifications working unchanged.
The revision id is kept short — alembic_version.version_num is varchar(32).
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = 'add_notif_prefs_001'
down_revision = 'add_faq_seo_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'user_notification_settings',
        sa.Column('user_id', UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('notify_new_chat', sa.Boolean(), nullable=False,
                  server_default=sa.false()),
        sa.Column('notify_chat_transfer', sa.Boolean(), nullable=False,
                  server_default=sa.true()),
        sa.Column('notify_chat_assigned', sa.Boolean(), nullable=False,
                  server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('user_notification_settings')
