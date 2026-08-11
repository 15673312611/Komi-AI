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

import os

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi import UploadFile, HTTPException
from io import BytesIO
from app.core.s3 import (
    S3_MAX_PRESIGN_SECONDS,
    delete_file_from_s3,
    get_s3_client,
    get_s3_signed_url,
    is_s3_url,
    strip_s3_signature,
    upload_file_to_s3,
)
from app.core.config import Settings, settings
from botocore.exceptions import ClientError


def test_get_s3_client():
    """Test the get_s3_client function"""
    with patch('boto3.client') as mock_boto3_client:
        mock_client = MagicMock()
        mock_boto3_client.return_value = mock_client

        # The client is lru_cached; drop any instance an earlier test built so
        # boto3.client is actually invoked here.
        get_s3_client.cache_clear()
        client = get_s3_client()

        # Verify boto3.client was called with correct parameters
        mock_boto3_client.assert_called_once_with(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.S3_REGION
        )
        
        assert client == mock_client


def test_get_s3_client_passes_none_when_credentials_unset():
    """Unset credentials must reach boto3 as None, not ''.

    boto3 only falls back to its default chain — and therefore to an EC2/ECS
    instance role — when both credential kwargs are None. An empty string is
    taken as an explicit (blank) credential, which signs requests that AWS
    rejects with InvalidAccessKeyId.
    """
    with patch('boto3.client') as mock_boto3_client, \
         patch.object(settings, 'AWS_ACCESS_KEY_ID', None), \
         patch.object(settings, 'AWS_SECRET_ACCESS_KEY', None):
        get_s3_client.cache_clear()
        get_s3_client()

        kwargs = mock_boto3_client.call_args.kwargs
        assert kwargs['aws_access_key_id'] is None
        assert kwargs['aws_secret_access_key'] is None

    get_s3_client.cache_clear()


def test_aws_credentials_default_to_none_not_empty_string():
    """A blank/absent AWS_ACCESS_KEY_ID env var must land as None on settings."""
    with patch.dict(os.environ, {'AWS_ACCESS_KEY_ID': '', 'AWS_SECRET_ACCESS_KEY': ''}):
        fresh = Settings()
        assert fresh.AWS_ACCESS_KEY_ID is None
        assert fresh.AWS_SECRET_ACCESS_KEY is None


@pytest.mark.asyncio
async def test_get_s3_signed_url_with_s3_storage_enabled():
    """Test get_s3_signed_url when S3 storage is enabled"""
    test_s3_url = f"https://{settings.S3_BUCKET}.s3.{settings.S3_REGION}.amazonaws.com/test/file.jpg"
    expected_signed_url = "https://signed-url.example.com"
    
    with patch('app.core.s3.settings.S3_FILE_STORAGE', True), \
         patch('app.core.s3.get_s3_client') as mock_get_client:
        
        mock_client = MagicMock()
        mock_client.generate_presigned_url.return_value = expected_signed_url
        mock_get_client.return_value = mock_client
        
        result = await get_s3_signed_url(test_s3_url)
        
        # Verify the client was called correctly
        mock_client.generate_presigned_url.assert_called_once_with(
            'get_object',
            Params={
                'Bucket': settings.S3_BUCKET,
                'Key': 'test/file.jpg'
            },
            ExpiresIn=settings.S3_PRESIGN_EXPIRY_SECONDS
        )

        assert result == expected_signed_url


@pytest.mark.asyncio
async def test_get_s3_signed_url_clamps_expiry_to_s3_maximum():
    """A caller asking for longer than S3 allows is clamped, not passed through.

    AWS rejects SigV4 presigns above S3_MAX_PRESIGN_SECONDS with
    AuthorizationQueryParametersError, which 403s every signed image.
    """
    test_s3_url = f"https://{settings.S3_BUCKET}.s3.{settings.S3_REGION}.amazonaws.com/test/file.jpg"

    with patch('app.core.s3.settings.S3_FILE_STORAGE', True), \
         patch('app.core.s3.get_s3_client') as mock_get_client:

        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        # The pre-fix default: 30 days.
        await get_s3_signed_url(test_s3_url, expiration=2592000)

        assert mock_client.generate_presigned_url.call_args.kwargs['ExpiresIn'] == S3_MAX_PRESIGN_SECONDS


@pytest.mark.parametrize("stored,expected", [
    (
        "https://b.s3.us-east-1.amazonaws.com/k.png?AWSAccessKeyId=A&Signature=S&Expires=1",
        "https://b.s3.us-east-1.amazonaws.com/k.png",
    ),
    (
        "https://b.s3.us-east-1.amazonaws.com/k.png",
        "https://b.s3.us-east-1.amazonaws.com/k.png",
    ),
    ("/api/v1/uploads/help_center/k.png", "/api/v1/uploads/help_center/k.png"),
    ("data:image/png;base64,AAAA", "data:image/png;base64,AAAA"),
    (None, None),
    ("", ""),
])
def test_strip_s3_signature(stored, expected):
    """Signed URLs must never reach the database — clients round-trip response
    values straight back into update payloads."""
    assert strip_s3_signature(stored) == expected


@pytest.mark.asyncio
async def test_get_s3_signed_url_with_s3_storage_disabled():
    """Test get_s3_signed_url when S3 storage is disabled"""
    test_s3_url = "https://example.com/test/file.jpg"
    
    with patch('app.core.s3.settings.S3_FILE_STORAGE', False):
        result = await get_s3_signed_url(test_s3_url)
        assert result == test_s3_url


@pytest.mark.asyncio
async def test_get_s3_signed_url_with_exception():
    """Test get_s3_signed_url when an exception occurs"""
    test_s3_url = f"https://{settings.S3_BUCKET}.s3.{settings.S3_REGION}.amazonaws.com/test/file.jpg"
    
    with patch('app.core.s3.settings.S3_FILE_STORAGE', True), \
         patch('app.core.s3.get_s3_client') as mock_get_client:
        
        mock_client = MagicMock()
        mock_client.generate_presigned_url.side_effect = Exception("Test exception")
        mock_get_client.return_value = mock_client
        
        result = await get_s3_signed_url(test_s3_url)
        
        # Should return the original URL on error
        assert result == test_s3_url


@pytest.mark.asyncio
async def test_upload_file_to_s3_success():
    """Test successful file upload to S3"""
    # File content as bytes (the function now expects bytes directly)
    file_content = b"test file content"
    
    folder = "test-folder"
    filename = "test-file.txt"
    content_type = "text/plain"
    
    expected_url = f"https://{settings.S3_BUCKET}.s3.{settings.S3_REGION}.amazonaws.com/{folder}/{filename}"
    
    with patch('app.core.s3.get_s3_client') as mock_get_client:
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        
        result = await upload_file_to_s3(file_content, folder, filename, content_type)
        
        # Verify S3 client was called correctly
        mock_client.put_object.assert_called_once_with(
            Bucket=settings.S3_BUCKET,
            Key=f"{folder}/{filename}",
            Body=file_content,
            ContentType=content_type
        )
        
        assert result == expected_url


@pytest.mark.asyncio
async def test_upload_file_to_s3_without_content_type():
    """Test file upload to S3 without specifying content type"""
    file_content = b"test file content"
    
    folder = "test-folder"
    filename = "test-file.txt"
    
    with patch('app.core.s3.get_s3_client') as mock_get_client:
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        
        await upload_file_to_s3(file_content, folder, filename)
        
        # Verify S3 client was called without ContentType
        mock_client.put_object.assert_called_once_with(
            Bucket=settings.S3_BUCKET,
            Key=f"{folder}/{filename}",
            Body=file_content
        )


@pytest.mark.asyncio
@pytest.mark.parametrize("error", [
    ClientError({'Error': {'Code': 'TestException', 'Message': 'Test error message'}}, 'PutObject'),
    Exception("Test exception"),
])
async def test_upload_file_to_s3_raises_instead_of_falling_back(error):
    """A failed S3 upload must fail the request, not silently write to local disk.

    The old fallback returned a /api/v1/uploads/... path the caller could not
    distinguish from success — durable-looking, but gone on the next container
    restart.
    """
    with patch('app.core.s3.get_s3_client') as mock_get_client:
        mock_client = MagicMock()
        mock_client.put_object.side_effect = error
        mock_get_client.return_value = mock_client

        with pytest.raises(HTTPException) as exc_info:
            await upload_file_to_s3(b"test content", "folder", "file.txt")

        assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_upload_file_to_s3_does_not_create_the_bucket():
    """Provisioning belongs in deployment; the runtime identity should not need
    s3:CreateBucket, nor pay a head_bucket round-trip on every upload."""
    with patch('app.core.s3.get_s3_client') as mock_get_client:
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        await upload_file_to_s3(b"test content", "folder", "file.txt")

        mock_client.head_bucket.assert_not_called()
        mock_client.create_bucket.assert_not_called()


@pytest.mark.asyncio
async def test_delete_file_from_s3_success():
    """Test successful file deletion from S3"""
    test_s3_url = f"https://{settings.S3_BUCKET}.s3.{settings.S3_REGION}.amazonaws.com/test/file.jpg"
    
    with patch('app.core.s3.get_s3_client') as mock_get_client:
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        
        result = await delete_file_from_s3(test_s3_url)
        
        # Verify S3 client was called correctly
        mock_client.delete_object.assert_called_once_with(
            Bucket=settings.S3_BUCKET,
            Key="test/file.jpg"
        )
        
        assert result is True


@pytest.mark.asyncio
async def test_delete_file_from_s3_exception():
    """Test file deletion from S3 with an exception"""
    test_s3_url = f"https://{settings.S3_BUCKET}.s3.{settings.S3_REGION}.amazonaws.com/test/file.jpg"
    
    with patch('app.core.s3.get_s3_client') as mock_get_client:
        mock_client = MagicMock()
        mock_client.delete_object.side_effect = Exception("Test exception")
        mock_get_client.return_value = mock_client
        
        result = await delete_file_from_s3(test_s3_url)
        
        assert result is False

# ---------- is_s3_url ----------

@pytest.mark.parametrize("url", [
    # Every shape AWS serves, including the regional virtual-hosted form
    # url_for_s3_key produces and a dotted bucket name.
    "https://s3.amazonaws.com/bucket/key.pdf",
    "https://s3.us-east-1.amazonaws.com/bucket/key.pdf",
    "https://s3-us-west-2.amazonaws.com/bucket/key.pdf",
    "https://bucket.s3.amazonaws.com/key.pdf",
    "https://bucket.s3.us-east-1.amazonaws.com/key.pdf",
    "https://my.bucket.s3.us-east-1.amazonaws.com/key.pdf",
    "https://BUCKET.S3.AMAZONAWS.COM/key.pdf",
])
def test_is_s3_url_accepts_every_s3_endpoint_shape(url):
    assert is_s3_url(url) is True


@pytest.mark.parametrize("url", [
    None, "",
    # The whole point: an attacker-supplied URL can carry the string anywhere
    # outside the host, and a substring check would call these ours.
    "https://evil.com/s3.amazonaws.com/key.pdf",
    "https://evil.com/?x=s3.amazonaws.com",
    "https://evil.com/#s3.amazonaws.com",
    "https://s3.amazonaws.com.attacker.com/key.pdf",
    "https://foos3.amazonaws.com/key.pdf",
    "https://notamazonaws.com/key.pdf",
    "https://example.com/file.pdf",
])
def test_is_s3_url_rejects_lookalikes(url):
    assert is_s3_url(url) is False


def test_is_s3_url_matches_what_url_for_s3_key_produces():
    """Round-trip guard: whatever we generate must be recognised as ours."""
    from app.core.s3 import url_for_s3_key

    assert is_s3_url(url_for_s3_key("some/key.pdf")) is True
