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
from app.services.help_center_images import store_article_image, strip_upload_host
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
async def test_store_article_image_returns_relative_for_local(monkeypatch):
    async def fake_store_upload(content, folder=None, file_name=None, content_type=None):
        return f"/api/v1/uploads/{folder}/{file_name}"

    monkeypatch.setattr("app.services.help_center_images.store_upload", fake_store_upload)
    url = await store_article_image(b"x", "image/png")
    assert url.startswith("/api/v1/uploads/help_center/")
    assert not url.startswith("http")  # relative — no baked host


@pytest.mark.asyncio
async def test_store_article_image_keeps_absolute_s3(monkeypatch):
    async def fake_store_upload(content, folder=None, file_name=None, content_type=None):
        return "https://bucket.s3.amazonaws.com/help_center/x.png"

    monkeypatch.setattr("app.services.help_center_images.store_upload", fake_store_upload)
    url = await store_article_image(b"x", "image/png")
    assert url == "https://bucket.s3.amazonaws.com/help_center/x.png"
