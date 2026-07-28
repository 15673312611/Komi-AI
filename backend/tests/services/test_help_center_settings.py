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

live_url mode selection and help-center upload URL relativization.
"""
from types import SimpleNamespace

import pytest

from app.core.config import settings
from app.services.help_center_images import (
    rewrite_baked_s3_image_urls,
    store_article_image,
    strip_upload_host,
)
from app.services.help_center_settings import live_url


def _row(**kw):
    base = {"domain_verified": False, "custom_domain": None, "slug": "acme"}
    base.update(kw)
    return SimpleNamespace(**base)


# ---------- live_url per mode ----------

def test_live_url_custom_domain_wins(monkeypatch):
    """A verified custom domain takes precedence in every mode."""
    monkeypatch.setattr(settings, "HELP_CENTER_PUBLIC_MODE", "path")
    row = _row(domain_verified=True, custom_domain="help.acme.com")
    assert live_url(row) == "https://help.acme.com"


def test_live_url_subdomain_mode(monkeypatch):
    monkeypatch.setattr(settings, "HELP_CENTER_PUBLIC_MODE", "subdomain")
    monkeypatch.setattr(settings, "HELP_CENTER_BASE_DOMAIN", "chattermate.help")
    assert live_url(_row()) == "https://acme.chattermate.help"


def test_live_url_path_mode_uses_backend_url(monkeypatch):
    monkeypatch.setattr(settings, "HELP_CENTER_PUBLIC_MODE", "path")
    monkeypatch.setattr(settings, "BACKEND_URL", "http://localhost:8000")
    assert live_url(_row()) == "http://localhost:8000/help/acme"


# ---------- upload URL relativization ----------

def test_strip_upload_host_local_absolute():
    md = "![](http://localhost:8000/api/v1/uploads/help_center/x.png)"
    assert strip_upload_host(md) == "![](/api/v1/uploads/help_center/x.png)"


def test_strip_upload_host_leaves_s3_and_relative_untouched():
    s3 = "![](https://bucket.s3.amazonaws.com/help_center/x.png)"
    rel = "![](/api/v1/uploads/help_center/x.png)"
    assert strip_upload_host(s3) == s3
    assert strip_upload_host(rel) == rel


def test_strip_upload_host_leaves_third_party_urls_untouched(monkeypatch):
    """A third-party URL that merely contains /api/v1/uploads/ (e.g. pasted into
    an answer) must NOT be rewritten — only our own backend/loopback origin is."""
    monkeypatch.setattr(settings, "BACKEND_URL", "http://localhost:8000")
    foreign = "See https://legacy.vendor.com/api/v1/uploads/guide.pdf for details."
    assert strip_upload_host(foreign) == foreign


def test_strip_upload_host_strips_configured_backend_origin(monkeypatch):
    monkeypatch.setattr(settings, "BACKEND_URL", "https://self.example.com")
    md = "![](https://self.example.com/api/v1/uploads/help_center/x.png)"
    assert strip_upload_host(md) == "![](/api/v1/uploads/help_center/x.png)"


@pytest.mark.asyncio
@pytest.mark.parametrize("stored", [
    "/api/v1/uploads/help_center/x.png",                     # local storage
    "https://bucket.s3.amazonaws.com/help_center/x.png",     # S3
])
async def test_store_article_image_bakes_the_same_stable_path(monkeypatch, stored):
    """The baked URL is storage-agnostic and never expires.

    It must not be a signed URL (they expire) nor a raw S3 URL (the bucket is
    private, so those 403) — the delivery route resolves it per request.
    """
    async def fake_store_upload(content, folder=None, file_name=None, content_type=None):
        return stored

    monkeypatch.setattr("app.services.help_center_images.store_upload", fake_store_upload)
    url = await store_article_image(b"x", "image/png")

    assert url.startswith("/api/v1/help-center/images/")
    assert not url.startswith("http")  # relative — resolves on whichever origin serves the page
    assert "amazonaws" not in url and "Signature=" not in url


@pytest.mark.parametrize("text,expected", [
    # virtual-hosted
    ("![](https://b.s3.us-east-1.amazonaws.com/help_center/{n})", "![](/api/v1/help-center/images/{n})"),
    # path-style, dotted bucket
    ("![](https://s3.us-east-1.amazonaws.com/my.bucket/help_center/{n})", "![](/api/v1/help-center/images/{n})"),
    # local paths and unrelated URLs are left alone
    ("![](/api/v1/uploads/help_center/{n})", "![](/api/v1/uploads/help_center/{n})"),
    ("![](https://example.com/help_center/{n})", "![](https://example.com/help_center/{n})"),
])
def test_rewrite_baked_s3_image_urls(text, expected):
    name = "7b6fe1aa-1234-4c5d-9e0f-0123456789ab.png"
    assert rewrite_baked_s3_image_urls(text.format(n=name)) == expected.format(n=name)
