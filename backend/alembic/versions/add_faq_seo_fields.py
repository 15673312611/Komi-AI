"""Per-article SEO overrides on FAQs

Revision ID: add_faq_seo_001
Revises: rel_hc_uploads_001
Create Date: 2026-07-25

Adds nullable meta_title / meta_description to faqs so an org can override the
public article page's <title> and meta description instead of always deriving
them from the question and answer excerpt. NULL keeps today's derived behaviour.
"""
from alembic import op
import sqlalchemy as sa

revision = "add_faq_seo_001"
down_revision = "rel_hc_uploads_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("faqs", sa.Column("meta_title", sa.String(length=120), nullable=True))
    op.add_column("faqs", sa.Column("meta_description", sa.String(length=300), nullable=True))


def downgrade() -> None:
    op.drop_column("faqs", "meta_description")
    op.drop_column("faqs", "meta_title")
