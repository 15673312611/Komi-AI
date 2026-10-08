"""Repoint baked absolute S3 article-image URLs at the delivery route

Revision ID: hc_img_paths_001
Revises: add_notif_prefs_001
Create Date: 2026-07-28

Article images used to be baked into faqs.answer as absolute S3 URLs. Those
only ever worked while the bucket was publicly readable; on a correctly private
bucket they 403. Article Markdown cannot hold a signed URL either, since it is
stored permanently and signatures expire. Rewrite them to the stable
/api/v1/help-center/images/<name> path, which is resolved per request against
whichever storage backend is configured. Local /api/v1/uploads/ paths and
non-S3 URLs are left untouched.
Irreversible best-effort — downgrade is a no-op.
"""
from alembic import op
import sqlalchemy as sa

from app.services.help_center_images import rewrite_baked_s3_image_urls

revision = "hc_img_paths_001"
down_revision = "add_notif_prefs_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    rows = bind.execute(
        sa.text("SELECT id, answer FROM faqs WHERE answer LIKE '%amazonaws.com%'")
    ).fetchall()
    for row in rows:
        new_answer = rewrite_baked_s3_image_urls(row.answer)
        if new_answer != row.answer:
            bind.execute(
                sa.text("UPDATE faqs SET answer = :val WHERE id = :id"),
                {"val": new_answer, "id": row.id},
            )


def downgrade() -> None:
    # The original bucket/region are not recoverable from the rewritten path,
    # and the new path works on every backend anyway.
    pass
