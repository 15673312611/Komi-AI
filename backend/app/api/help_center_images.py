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

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.core.s3 import sign_s3_key
from app.services.help_center_images import ARTICLE_IMAGE_NAME_RE, UPLOAD_FOLDER

router = APIRouter()

# The object is immutable — a fresh uuid per upload — so let clients and CDNs
# keep it for a while.
_MAX_CACHE_SECONDS = 300

# Allow-list of redirect targets. S3 presigns come back either virtual-hosted
# (bucket.s3.<region>.amazonaws.com) or path-style against the regional or
# legacy global endpoint, depending on bucket name and region; local storage
# goes to our own static mount. Nothing else is ever a valid destination.
_ALLOWED_REDIRECT_PREFIXES = (
    f"https://{settings.S3_BUCKET}.s3.",
    "https://s3.",
    f"{settings.API_V1_STR}/uploads/",
)

_NOT_FOUND = HTTPException(status_code=404, detail="Not found")


def _cache_control(max_age: int) -> str:
    return f"public, max-age={max_age}"


@router.get("/images/{file_name}", include_in_schema=False)
async def get_article_image(file_name: str):
    """Resolve a baked article-image path to the actual image.

    Both branches redirect rather than serve bytes: S3 to a freshly signed URL,
    local storage to the /api/v1/uploads mount that already serves that
    directory on both the main app and public_app.
    """
    if not ARTICLE_IMAGE_NAME_RE.match(file_name):
        raise _NOT_FOUND

    if settings.S3_FILE_STORAGE:
        target = sign_s3_key(f"{UPLOAD_FOLDER}/{file_name}")
        # Never cache the redirect longer than the signature it points at, or a
        # cached target outlives its own presign and starts 403ing.
        max_age = min(_MAX_CACHE_SECONDS, settings.S3_PRESIGN_EXPIRY_SECONDS // 2)
    else:
        target = f"{settings.API_V1_STR}/uploads/{UPLOAD_FOLDER}/{file_name}"
        max_age = _MAX_CACHE_SECONDS

    if not target.startswith(_ALLOWED_REDIRECT_PREFIXES):
        # sign_s3_url hands back its input unchanged when it cannot sign; never
        # bounce a visitor anywhere outside the allow-list.
        raise _NOT_FOUND

    return RedirectResponse(
        target, status_code=307, headers={"Cache-Control": _cache_control(max_age)}
    )
