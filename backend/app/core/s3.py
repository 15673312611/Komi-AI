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
"""

"""
S3 Storage Utilities
"""
import asyncio
from functools import lru_cache, partial
import boto3
from app.core.config import settings
from app.core.logger import get_logger
from fastapi import HTTPException
from typing import Optional
from urllib.parse import urlparse, urlunparse

logger = get_logger(__name__)

# AWS rejects any SigV4 presigned URL whose X-Amz-Expires exceeds one week with
# AuthorizationQueryParametersError. Only the legacy SigV2 signer (which
# botocore still selects for us-east-1 and eu-west-1) has no such limit, so a
# longer value happens to work in those regions and 403s everywhere else.
S3_MAX_PRESIGN_SECONDS = 604800

# head_object retries after put_object, to ride out transient read-after-write
# failures rather than failing the whole upload.
_UPLOAD_VERIFY_ATTEMPTS = 3
_UPLOAD_VERIFY_BACKOFF_SECONDS = 0.5


def strip_s3_signature(url: Optional[str]) -> Optional[str]:
    """Reduce a presigned S3 URL back to the bare object URL.

    Signed URLs must never reach the database: they expire, and a stored
    signature outlives its validity. Clients round-trip response values into
    update payloads (the agent customization form does exactly this), so
    stripping on the way in is the only reliable guard.
    """
    if not url or 'amazonaws.com' not in url:
        return url
    return urlunparse(urlparse(url)._replace(query='', fragment=''))


def url_for_s3_key(s3_key: str) -> str:
    """The canonical stored URL for an object key. Single source of truth for
    the URL shape — _key_from_url must be able to round-trip whatever this
    produces.

    Buckets whose name contains a dot get path-style: the wildcard on
    *.s3.<region>.amazonaws.com only covers one label, so the virtual-hosted
    form (my.bucket.s3.<region>.amazonaws.com) fails TLS verification in any
    strict client.
    """
    if '.' in settings.S3_BUCKET:
        return f"https://s3.{settings.S3_REGION}.amazonaws.com/{settings.S3_BUCKET}/{s3_key}"
    return f"https://{settings.S3_BUCKET}.s3.{settings.S3_REGION}.amazonaws.com/{s3_key}"


def _key_from_url(s3_url: str) -> str:
    """Extract the object key from either S3 URL format.

    Virtual-hosted puts the bucket in the host (bucket.s3...amazonaws.com/key);
    path-style puts it in the first path segment, against either the legacy
    global endpoint or a regional one (s3.<region>.amazonaws.com/bucket/key).
    """
    parsed_url = urlparse(s3_url)
    path_parts = parsed_url.path.strip('/').split('/')
    if parsed_url.netloc.startswith(f"{settings.S3_BUCKET}."):
        return '/'.join(path_parts)
    # Path-style: drop the leading bucket segment.
    return '/'.join(path_parts[1:])


@lru_cache(maxsize=1)
def get_s3_client():
    """Get boto3 S3 client.

    Cached: constructing a client resolves session, endpoint and credential
    config and costs ~1.3ms, which dwarfs the ~0.05ms presign it is usually
    built for. boto3 clients are thread-safe for method calls. Call
    get_s3_client.cache_clear() if settings change at runtime (tests).
    """
    return boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.S3_REGION
    )


def sign_s3_url(s3_url: str, expiration: Optional[int] = None) -> str:
    """
    Generate a signed URL for an S3 object.

    Synchronous on purpose: generate_presigned_url computes an HMAC locally and
    makes no network call, so this is safe to call from response serialization
    (see the field_serializers on the response schemas) without an event loop.

    Args:
        s3_url: The S3 URL of the object
        expiration: Lifetime in seconds; defaults to settings.S3_PRESIGN_EXPIRY_SECONDS
                    and is clamped to S3_MAX_PRESIGN_SECONDS
    Returns:
        Signed URL for the object, or the input unchanged if it is not signable
    """
    try:
        if not settings.S3_FILE_STORAGE or not s3_url:
            return s3_url

        # Inline data URIs (e.g. generated orb avatars stored in photo_url) and any
        # non-S3 absolute URL are not S3 objects — return them unchanged.
        if s3_url.startswith('data:') or 'amazonaws.com' not in s3_url:
            return s3_url

        if expiration is None:
            expiration = settings.S3_PRESIGN_EXPIRY_SECONDS
        expiration = min(expiration, S3_MAX_PRESIGN_SECONDS)

        s3_client = get_s3_client()
        signed_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.S3_BUCKET,
                'Key': _key_from_url(s3_url)
            },
            ExpiresIn=expiration
        )
        return signed_url
    except Exception as e:
        logger.exception(f"Error generating signed URL: {str(e)}")
        return s3_url


def sign_s3_key(s3_key: str, expiration: Optional[int] = None) -> str:
    """Signed URL for an object key, for callers that hold a key rather than a
    stored URL (help-center article images resolve by key)."""
    return sign_s3_url(url_for_s3_key(s3_key), expiration)


async def get_s3_signed_url(s3_url: str, expiration: Optional[int] = None) -> str:
    """Awaitable shim over sign_s3_url for the existing `await` call sites.

    Deprecated: signing never touched the network, so prefer sign_s3_url.
    """
    return sign_s3_url(s3_url, expiration)

async def upload_file_to_s3(
    file_content: bytes,
    folder: str,
    filename: str,
    content_type: Optional[str] = None
) -> str:
    """
    Upload file to S3 bucket
    Args:
        file_content: The file content as bytes
        folder: The S3 folder path
        filename: The filename to save as
        content_type: Optional MIME type
    Returns:
        The S3 URL of the uploaded file
    Raises:
        HTTPException: if the object cannot be stored or verified

    The bucket is expected to exist already — provisioning it belongs in
    deployment, not on the request path, and the runtime identity should not
    hold s3:CreateBucket.
    """
    try:
        s3_client = get_s3_client()

        # Construct S3 key (path)
        s3_key = f"{folder}/{filename}"

        # Upload to S3
        extra_args = {}
        if content_type:
            extra_args['ContentType'] = content_type
        
        logger.info(f"Putting object to S3: bucket={settings.S3_BUCKET}, key={s3_key}, size={len(file_content)} bytes")
        # boto3 is synchronous — offload so a large body never blocks the loop.
        await asyncio.to_thread(
            partial(
                s3_client.put_object,
                Bucket=settings.S3_BUCKET,
                Key=s3_key,
                Body=file_content,
                **extra_args
            )
        )
        # Verify file was written
        for attempt in range(_UPLOAD_VERIFY_ATTEMPTS):
            try:
                await asyncio.to_thread(
                    partial(s3_client.head_object, Bucket=settings.S3_BUCKET, Key=s3_key)
                )
                break
            except Exception as verify_err:
                if attempt < _UPLOAD_VERIFY_ATTEMPTS - 1:
                    await asyncio.sleep(_UPLOAD_VERIFY_BACKOFF_SECONDS)
                else:
                    logger.error(f"File verification failed after retries: {s3_key} - {str(verify_err)}")
                    raise HTTPException(
                        status_code=500,
                        detail="File upload verification failed"
                    )

        url = url_for_s3_key(s3_key)

        logger.info(f"Successfully uploaded file to S3: {s3_key}")
        return url

    except HTTPException:
        raise
    except Exception as e:
        # Deliberately no local-disk fallback: on a containerised deploy the
        # uploads dir is not durable, so falling back silently returns a URL
        # that works once and 404s after the next restart, with the caller
        # none the wiser. Fail the request instead.
        logger.exception(f"S3 upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail="File upload failed")


async def download_file_from_s3(s3_url: str) -> bytes:
    """Download an object's bytes (worker-side readback of stored uploads).
    boto3 is synchronous — offload so the transfer never blocks the event loop."""

    def _download() -> bytes:
        s3_client = get_s3_client()
        response = s3_client.get_object(Bucket=settings.S3_BUCKET, Key=_key_from_url(s3_url))
        return response['Body'].read()

    return await asyncio.to_thread(_download)


async def delete_file_from_s3(s3_url: str) -> bool:
    """Delete file from S3 bucket"""
    try:
        s3_client = get_s3_client()
        await asyncio.to_thread(
            partial(
                s3_client.delete_object,
                Bucket=settings.S3_BUCKET,
                Key=_key_from_url(s3_url)
            )
        )
        return True
        
    except Exception as e:
        logger.error(f"Error deleting from S3: {str(e)}")
        return False 