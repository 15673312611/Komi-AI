"""
Copyright 2024-2026 Komi AI

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Help-center article images. Images embedded in an article's Markdown must
resolve to a STABLE URL that is baked inline in the answer forever — so no
signed/expiring URLs, and no raw S3 URLs either now the bucket is private.
Both storage backends therefore return the same host-RELATIVE path, which
app/api/help_center_images.py resolves per request (redirect to a freshly
signed URL on S3, direct file on local). Host-relative so it resolves against
whichever origin serves the page: the main app in path mode, public_app on a
help-center subdomain / custom domain. Shared by the admin upload endpoint and
the article importer's re-hosting path.
"""

import re
from uuid import uuid4

from app.core.config import settings
from app.services.file_storage import store_upload

def strip_upload_host(text: str) -> str:
    """Convert the app's OWN absolute upload URLs to relative /api/v1/uploads/...
    paths, leaving everything else untouched. Only strips the configured
    BACKEND_URL origin or a loopback host (localhost/127.0.0.1/0.0.0.0) — a
    third-party URL that merely contains /api/v1/uploads/ (e.g. a link pasted
    into an FAQ answer) is NOT rewritten. S3 and already-relative URLs never
    match. Used by the one-time backfill migration."""
    if not text:
        return text
    backend = settings.BACKEND_URL.rstrip("/")
    # Match our own backend origin OR any loopback host (with optional port),
    # only when it sits directly in front of an /api/v1/uploads/ path.
    pattern = re.compile(
        r'(?:' + re.escape(backend)
        + r'|https?://(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?)'
        + r'(?=/api/v1/uploads/)'
    )
    return pattern.sub("", text)

MAX_FAQ_IMAGE_BYTES = 5 * 1024 * 1024
# Reject larger-than-this on a side up front (bomb guard); downscale the stored
# image to fit FAQ_IMAGE_FIT_DIM so article pages stay light.
FAQ_IMAGE_MAX_DIM = 6000
FAQ_IMAGE_FIT_DIM = 1600
FAQ_IMAGE_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
}
UPLOAD_FOLDER = "help_center"

# store_article_image names files "<uuid4><ext>". The delivery route matches
# against this before interpolating the name into an S3 key or a filesystem
# path, so it is what stops a traversal ("../agents/x.png") being served.
_UUID4_PATTERN = (
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
)
_EXTENSION_PATTERN = "|".join(
    re.escape(ext.lstrip(".")) for ext in sorted(set(FAQ_IMAGE_TYPES.values()))
)
ARTICLE_IMAGE_NAME_RE = re.compile(rf"^{_UUID4_PATTERN}\.(?:{_EXTENSION_PATTERN})$")

# Absolute S3 URLs baked into article Markdown before delivery moved behind
# article_image_path(). Both URL shapes (virtual-hosted and path-style) end in
# ".../help_center/<name>", so anchor on that.
_BAKED_S3_IMAGE_RE = re.compile(
    r"https?://[^\s\"'()]*amazonaws\.com/[^\s\"'()]*"
    + re.escape(UPLOAD_FOLDER)
    + rf"/({_UUID4_PATTERN}\.(?:{_EXTENSION_PATTERN}))"
)


def article_image_path(file_name: str) -> str:
    """The stable, host-relative URL baked into article Markdown.

    Identical for local and S3 storage — app/api/help_center_images.py resolves
    it per request. Host-relative so it works both in path mode (main app) and
    on a help-center subdomain / custom domain (public_app)."""
    return f"{settings.API_V1_STR}/help-center/images/{file_name}"


def absolute_upload_url(stored: str) -> str:
    """Make a stored upload path absolute. S3 returns an absolute http(s) URL
    already; local mode returns a path under the /api/v1/uploads mount, which we
    anchor to the backend's public origin so it loads cross-domain."""
    if stored.startswith("http"):
        return stored
    return f"{settings.BACKEND_URL.rstrip('/')}{stored}"


def rewrite_baked_s3_image_urls(text: str) -> str:
    """Point previously-baked absolute S3 article-image URLs at article_image_path.

    Those URLs 403 now the bucket is private, and would have needed re-signing
    anyway. Used by the one-time backfill migration."""
    if not text:
        return text
    return _BAKED_S3_IMAGE_RE.sub(lambda m: article_image_path(m.group(1)), text)


async def store_article_image(content: bytes, content_type: str) -> str:
    """Persist validated image bytes and return the stable URL to bake into the
    answer markdown. Caller is responsible for size/content-type validation
    against MAX_FAQ_IMAGE_BYTES / FAQ_IMAGE_TYPES.

    The returned path is storage-agnostic and never expires. It must not be a
    signed S3 URL (those expire) nor a raw S3 URL (the bucket is private, so
    those 403) — the delivery route resolves it per request instead."""
    file_name = f"{uuid4()}{FAQ_IMAGE_TYPES[content_type]}"
    await store_upload(content, folder=UPLOAD_FOLDER, file_name=file_name, content_type=content_type)
    return article_image_path(file_name)
