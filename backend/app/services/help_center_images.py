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

Help-center article images. Images embedded in an article's Markdown must
resolve to a STABLE URL that is baked inline in the answer forever — so no
signed/expiring URLs. Local storage returns a host-RELATIVE path under the
/api/v1/uploads mount, which resolves against whichever origin serves the page
(the main app in path mode, and public_app — which mounts uploads — in host
mode). S3 returns its own absolute URL. Shared by the admin upload endpoint and
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
_UPLOAD_FOLDER = "help_center"


def absolute_upload_url(stored: str) -> str:
    """Make a stored upload path absolute. S3 returns an absolute http(s) URL
    already; local mode returns a path under the /api/v1/uploads mount, which we
    anchor to the backend's public origin so it loads cross-domain."""
    if stored.startswith("http"):
        return stored
    return f"{settings.BACKEND_URL.rstrip('/')}{stored}"


async def store_article_image(content: bytes, content_type: str) -> str:
    """Persist validated image bytes and return the stable URL to bake into the
    answer markdown: a relative /api/v1/uploads/... path for local storage, or
    the absolute S3 URL for S3. Caller is responsible for size/content-type
    validation against MAX_FAQ_IMAGE_BYTES / FAQ_IMAGE_TYPES.

    Note: do NOT wrap in resolve_public_url here — that signs S3 URLs, which
    expire and must never be baked permanently into stored content."""
    file_name = f"{uuid4()}{FAQ_IMAGE_TYPES[content_type]}"
    return await store_upload(content, folder=_UPLOAD_FOLDER, file_name=file_name, content_type=content_type)
