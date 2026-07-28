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

Public delivery of help-center article images.

Article Markdown bakes an image URL in permanently, so it cannot hold a signed
S3 URL (those expire) and it cannot hold a raw S3 URL either (the bucket is
private). Instead store_article_image bakes this stable app path, and this
route resolves it per request — redirecting to a freshly signed URL on S3, or
serving the file directly on local storage.

Registered on BOTH the main app (path mode) and public_app (subdomain/custom
domain host mode), because article pages are served by whichever one owns the
origin and the baked path is host-relative.
"""

import os
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, RedirectResponse

from app.core.config import settings
from app.core.s3 import sign_s3_key
from app.services.help_center_images import ARTICLE_IMAGE_NAME_RE, UPLOAD_FOLDER

router = APIRouter()

# The object is immutable — a fresh uuid per upload — so let clients and CDNs
# keep it for a while.
_MAX_CACHE_SECONDS = 300

# Every URL we are ever willing to redirect to is an S3 object URL.
_ALLOWED_REDIRECT_SUFFIX = ".amazonaws.com"

_NOT_FOUND = HTTPException(status_code=404, detail="Not found")


def _cache_control(max_age: int) -> str:
    return f"public, max-age={max_age}"


def _resolved_local_path(file_name: str) -> str:
    """Absolute path of a stored image, guaranteed to sit inside the upload dir.

    The name is already matched against ARTICLE_IMAGE_NAME_RE, so it cannot
    contain a separator; resolving and re-checking containment is belt-and-braces
    against symlinks and any future loosening of that pattern.
    """
    base = os.path.realpath(os.path.join("uploads", UPLOAD_FOLDER))
    resolved = os.path.realpath(os.path.join(base, os.path.basename(file_name)))
    if os.path.commonpath([base, resolved]) != base:
        raise _NOT_FOUND
    return resolved


@router.get("/images/{file_name}", include_in_schema=False)
async def get_article_image(file_name: str):
    """Resolve a baked article-image path to the actual image."""
    if not ARTICLE_IMAGE_NAME_RE.match(file_name):
        raise _NOT_FOUND

    if settings.S3_FILE_STORAGE:
        signed = sign_s3_key(f"{UPLOAD_FOLDER}/{os.path.basename(file_name)}")
        host = urlparse(signed).hostname or ""
        if not host.endswith(_ALLOWED_REDIRECT_SUFFIX):
            # sign_s3_url returns its input unchanged when it cannot sign; never
            # bounce a visitor somewhere that is not S3.
            raise _NOT_FOUND
        # Never cache the redirect longer than the signature it points at, or a
        # cached target outlives its own presign and starts 403ing.
        max_age = min(_MAX_CACHE_SECONDS, settings.S3_PRESIGN_EXPIRY_SECONDS // 2)
        return RedirectResponse(
            signed, status_code=307, headers={"Cache-Control": _cache_control(max_age)}
        )

    path = _resolved_local_path(file_name)
    if not os.path.isfile(path):
        raise _NOT_FOUND
    return FileResponse(path, headers={"Cache-Control": _cache_control(_MAX_CACHE_SECONDS)})
