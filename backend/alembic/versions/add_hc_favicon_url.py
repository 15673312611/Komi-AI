"""Help center favicon URL

Revision ID: add_hc_favicon_001
Revises: merge_tkt_csat_001
Create Date: 2026-07-25

Adds a nullable favicon_url to help center settings, mirroring logo_url, so orgs
can set the browser-tab icon for their public help center from Customization.
"""
from alembic import op
import sqlalchemy as sa

revision = "add_hc_favicon_001"
down_revision = "merge_tkt_csat_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("help_center_settings", sa.Column("favicon_url", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("help_center_settings", "favicon_url")
