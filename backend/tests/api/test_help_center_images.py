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

Delivery of help-center article images on both storage backends.
"""
import os
from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.help_center_images import router
from app.core.config import settings
from app.services.help_center_images import UPLOAD_FOLDER, store_article_image

VALID_NAME = "7b6fe1aa-1234-4c5d-9e0f-0123456789ab.png"


@pytest.fixture
def client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix=f"{settings.API_V1_STR}/help-center")
    # follow_redirects=False so the S3 redirect is asserted, not chased to AWS.
    return TestClient(app, follow_redirects=False)


def _url(name: str) -> str:
    return f"{settings.API_V1_STR}/help-center/images/{name}"


def test_s3_mode_redirects_to_a_freshly_signed_url(client):
    signed = f"https://s3.us-east-1.amazonaws.com/b/{UPLOAD_FOLDER}/{VALID_NAME}?Signature=S"
    signing_client = MagicMock()
    signing_client.generate_presigned_url.return_value = signed

    # settings is a single shared object, so one patch covers both modules.
    with patch.object(settings, 'S3_FILE_STORAGE', True), \
         patch('app.core.s3.get_s3_client', return_value=signing_client):
        response = client.get(_url(VALID_NAME))

    assert response.status_code == 307
    assert response.headers["location"] == signed
    # Signed from the key, not from a stored URL.
    assert signing_client.generate_presigned_url.call_args.kwargs['Params']['Key'] == (
        f"{UPLOAD_FOLDER}/{VALID_NAME}"
    )


def test_local_mode_serves_the_file_from_disk(client, tmp_path, monkeypatch):
    """The local flow must keep working with S3_FILE_STORAGE=false."""
    monkeypatch.chdir(tmp_path)
    upload_dir = tmp_path / "uploads" / UPLOAD_FOLDER
    upload_dir.mkdir(parents=True)
    (upload_dir / VALID_NAME).write_bytes(b"\x89PNG local bytes")

    with patch.object(settings, 'S3_FILE_STORAGE', False):
        response = client.get(_url(VALID_NAME))

    assert response.status_code == 200
    assert response.content == b"\x89PNG local bytes"


def test_local_mode_404s_a_missing_file(client, tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    with patch.object(settings, 'S3_FILE_STORAGE', False):
        response = client.get(_url(VALID_NAME))
    assert response.status_code == 404


def test_never_redirects_off_s3(client):
    """Defence in depth: only ever bounce a visitor to an S3 host."""
    with patch.object(settings, 'S3_FILE_STORAGE', True), \
         patch('app.api.help_center_images.sign_s3_key', return_value="https://evil.example.com/x"):
        response = client.get(_url(VALID_NAME))

    assert response.status_code == 404
    assert "location" not in response.headers


@pytest.mark.asyncio
async def test_local_upload_then_serve_round_trip(client, tmp_path, monkeypatch):
    """End-to-end with S3_FILE_STORAGE=false: the path store_article_image bakes
    into the answer Markdown is the one this route can serve."""
    monkeypatch.chdir(tmp_path)

    with patch.object(settings, 'S3_FILE_STORAGE', False):
        baked = await store_article_image(b"\x89PNG round trip", "image/png")
        assert baked.startswith(f"{settings.API_V1_STR}/help-center/images/")

        # The bytes really landed under the local uploads dir.
        name = baked.rsplit("/", 1)[-1]
        assert os.path.isfile(os.path.join("uploads", UPLOAD_FOLDER, name))

        response = client.get(baked)

    assert response.status_code == 200
    assert response.content == b"\x89PNG round trip"


@pytest.mark.parametrize("name", [
    "../../etc/passwd",
    "..%2f..%2fagents%2fphoto.png",
    "not-a-uuid.png",
    f"{VALID_NAME[:-4]}.svg",   # extension outside FAQ_IMAGE_TYPES
    f"{VALID_NAME}.exe",
])
def test_rejects_names_that_are_not_ours(client, name):
    """The name is interpolated into an S3 key and a filesystem path, so a
    non-matching name must 404 before either happens."""
    signing_client = MagicMock()
    with patch('app.api.help_center_images.settings.S3_FILE_STORAGE', True), \
         patch('app.core.s3.get_s3_client', return_value=signing_client):
        response = client.get(_url(name))

    assert response.status_code == 404
    signing_client.generate_presigned_url.assert_not_called()
