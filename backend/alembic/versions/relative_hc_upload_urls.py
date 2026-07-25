"""Make help-center upload URLs relative (strip baked-in absolute host)

Revision ID: rel_hc_uploads_001
Revises: add_hc_favicon_001
Create Date: 2026-07-25

Article images (baked into faqs.answer markdown) and, historically, some
logo/favicon rows carried an absolute host in front of the /api/v1/uploads/
path (e.g. http://localhost:8000/api/v1/uploads/...). That breaks the moment the
help center is viewed from any other origin. Convert those to relative paths so
they resolve against whichever origin serves the page. S3 URLs (no
/api/v1/uploads/ segment) and already-relative paths are left untouched.
Irreversible best-effort — downgrade is a no-op.
"""
from alembic import op
import sqlalchemy as sa

from app.services.help_center_images import strip_upload_host

revision = "rel_hc_uploads_001"
down_revision = "add_hc_favicon_001"
branch_labels = None
depends_on = None


def _rewrite(bind, table: str, column: str) -> None:
    rows = bind.execute(
        sa.text(f"SELECT id, {column} AS val FROM {table} WHERE {column} LIKE '%/api/v1/uploads/%'")
    ).fetchall()
    for row in rows:
        new_val = strip_upload_host(row.val)
        if new_val != row.val:
            bind.execute(
                sa.text(f"UPDATE {table} SET {column} = :val WHERE id = :id"),
                {"val": new_val, "id": row.id},
            )


def upgrade() -> None:
    bind = op.get_bind()
    _rewrite(bind, "faqs", "answer")
    _rewrite(bind, "help_center_settings", "logo_url")
    _rewrite(bind, "help_center_settings", "favicon_url")


def downgrade() -> None:
    # Can't reliably re-absolutize (original host unknown); relative paths are correct anyway.
    pass
