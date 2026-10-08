"""preserve original article URLs when migrating a help center

An org importing an existing help center can now keep every article at the URL
it already ranks for: faqs.url_path is the root-relative path the article is
SERVED at, and /a/{slug} 301s to it. faqs.source_url records where an imported
article came from (provenance only, never routed on). The job flag carries the
import-time opt-in through to the worker.

No backfill on purpose — NULL url_path is exactly today's behaviour (/a/{slug}),
so nothing already published moves.

Revision ID: add_hc_faq_url_path_001
Revises: repair_agent_role_seed_001
Create Date: 2026-08-06
"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = 'add_hc_faq_url_path_001'
down_revision = 'repair_agent_role_seed_001'
branch_labels = None
depends_on = None

URL_PATH_MAX_LENGTH = 400
SOURCE_URL_MAX_LENGTH = 2048


def upgrade() -> None:
    op.add_column('faqs', sa.Column('url_path', sa.String(length=URL_PATH_MAX_LENGTH), nullable=True))
    op.add_column('faqs', sa.Column('source_url', sa.String(length=SOURCE_URL_MAX_LENGTH), nullable=True))
    # Serves the preserved-path lookup and enforces per-org uniqueness. Every
    # existing row is NULL here, and Postgres treats NULLs as distinct, so the
    # unique index applies cleanly without a backfill.
    op.create_index('ix_faqs_org_url_path', 'faqs', ['organization_id', 'url_path'], unique=True)
    op.add_column(
        'faq_generation_jobs',
        sa.Column(
            'preserve_source_urls',
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column('faq_generation_jobs', 'preserve_source_urls')
    op.drop_index('ix_faqs_org_url_path', table_name='faqs')
    op.drop_column('faqs', 'source_url')
    op.drop_column('faqs', 'url_path')
