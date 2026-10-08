"""Short-lived, signed local-storage URLs for chat attachments."""

import base64
import hashlib
import hmac
import time
from typing import Optional

from app.core.config import settings


def _signature(storage_key: str, expires_at: int) -> str:
    payload = f"{storage_key}:{expires_at}".encode("utf-8")
    digest = hmac.new(
        settings.CONVERSATION_SECRET_KEY.encode("utf-8"), payload, hashlib.sha256
    ).digest()
    return base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")


def local_attachment_download_url(storage_key: str, expires_in: Optional[int] = None) -> str:
    """Return a browser-usable, time-limited URL for a local chat attachment."""
    ttl = expires_in if expires_in is not None else settings.S3_PRESIGN_EXPIRY_SECONDS
    expires_at = int(time.time()) + max(1, int(ttl))
    signature = _signature(storage_key, expires_at)
    return (
        f"{settings.API_V1_STR}/files/download/{storage_key}"
        f"?expires={expires_at}&signature={signature}"
    )


def is_valid_local_attachment_signature(
    storage_key: str, expires_at: Optional[int], signature: Optional[str]
) -> bool:
    """Validate a signed local attachment URL without leaking key existence."""
    if not isinstance(expires_at, int) or expires_at < int(time.time()) or not signature:
        return False
    return hmac.compare_digest(_signature(storage_key, expires_at), signature)
