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

"""index chat_history on (session_id, created_at)

Revision ID: add_chat_session_idx_001
Revises: hc_img_paths_001
Create Date: 2026-07-22

chat_history had no index on session_id — only the primary key — so every lookup of
a conversation's messages was a sequential scan. The columns match the ordering
every reader now uses, (created_at, id), so the inbox previews and
get_session_history are both answered from the index alone.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_chat_session_idx_001'
down_revision = 'hc_img_paths_001'
branch_labels = None
depends_on = None

INDEX_NAME = 'ix_chat_history_session_created'


def upgrade() -> None:
    op.create_index(
        INDEX_NAME,
        'chat_history',
        ['session_id', sa.text('created_at DESC'), sa.text('id DESC')],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(INDEX_NAME, table_name='chat_history')
