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

live_url mode selection, preserved-URL-path normalisation, and help-center
upload URL relativization.
"""
from types import SimpleNamespace

import pytest

from app.core.config import settings
from app.services.help_center_images import (
    rewrite_baked_s3_image_urls,
    store_article_image,
    strip_upload_host,
)
from app.models.faq import FAQ, FAQ_URL_PATH_MAX_LENGTH
from app.services.help_center_settings import (
    assign_faq_url_paths,
    live_url,
    normalize_url_path,
    resolve_faq_url_path,
)


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
    monkeypatch.setattr(settings, "HELP_CENTER_BASE_DOMAIN", "komi.help")
    assert live_url(_row()) == "https://acme.komi.help"


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


# ---------- preserved original URL paths ----------

@pytest.mark.parametrize("raw,expected", [
    # A full source URL is reduced to its path.
    ("https://support.acme.com/hc/en-us/articles/360012-reset", "/hc/en-us/articles/360012-reset"),
    ("//support.acme.com/hc/articles/1", "/hc/articles/1"),
    # Query strings and fragments are tracking/anchor noise, not identity.
    ("https://support.acme.com/hc/articles/1?utm_source=x#top", "/hc/articles/1"),
    # Hand-typed forms: leading slash optional, trailing/duplicate slashes normalised.
    ("hc/articles/1", "/hc/articles/1"),
    ("/hc//articles/1/", "/hc/articles/1"),
    ("  /hc/articles/1  ", "/hc/articles/1"),
    # Stored DECODED, because that's what the ASGI scope gives the router.
    ("/hc/en-us/articles/caf%C3%A9", "/hc/en-us/articles/café"),
])
def test_normalize_url_path_accepts(raw, expected):
    assert normalize_url_path(raw) == expected


@pytest.mark.parametrize("raw", [
    None, "", "   ", "/", "//", "https://support.acme.com",
    # Would shadow a real public route (first-segment match).
    "/a/some-article", "/ask", "/api/v1/uploads/x", "/healthz", "/robots.txt",
    "/sitemap.xml", "/help/acme/a/x", "/.well-known/acme-challenge/x",
    "/uploads/x", "/static/x", "/ASK",
    # Traversal / non-canonical.
    "/hc/../etc/passwd", "/hc/./articles",
    # Percent-encoded forms of all of the above: unquote runs BEFORE the segment
    # checks, so encoding must not smuggle a traversal or a reserved prefix past
    # them. Getting that order wrong is the classic hole in a path normaliser.
    "/hc/%2e%2e/etc/passwd", "/%61sk", "/%41SK", "/hc/articles/1%00",
    # Control characters (header/log injection).
    "/hc/articles\n/x",
])
def test_normalize_url_path_rejects(raw):
    assert normalize_url_path(raw) is None


def test_normalize_url_path_rejects_overlong():
    assert normalize_url_path("/" + "x" * FAQ_URL_PATH_MAX_LENGTH) is None


def test_normalize_url_path_allows_prefix_lookalikes():
    """Reserving the FIRST SEGMENT must not reject paths that merely start with
    the same letters."""
    assert normalize_url_path("/apix/articles/1") == "/apix/articles/1"
    assert normalize_url_path("/articles/asking") == "/articles/asking"


def _faq_row(org_id, question):
    return FAQ(organization_id=org_id, question=question, answer="body")


def test_assign_faq_url_paths_applies_and_skips_collisions(db, test_organization):
    """First row wins a duplicated path; the batch-mate and an unusable source
    fall back to /a/{slug} rather than failing the import."""
    rows = [_faq_row(test_organization.id, f"Q{i}") for i in range(4)]
    sources = [
        "https://help.acme.com/hc/articles/1",
        "https://help.acme.com/hc/articles/1",   # duplicate within the batch
        "https://help.acme.com/a/reserved",      # unusable — reserved segment
        "https://help.acme.com/hc/articles/2",
    ]

    applied = assign_faq_url_paths(db, rows, sources)

    assert applied == 2
    assert [r.url_path for r in rows] == ["/hc/articles/1", None, None, "/hc/articles/2"]


def test_assign_faq_url_paths_skips_paths_taken_in_the_db(db, test_organization):
    existing = _faq_row(test_organization.id, "Existing")
    existing.slug = "existing"
    existing.url_path = "/hc/articles/1"
    db.add(existing)
    db.commit()

    rows = [_faq_row(test_organization.id, "New")]
    assert assign_faq_url_paths(db, rows, ["https://help.acme.com/hc/articles/1"]) == 0
    assert rows[0].url_path is None


def test_resolve_faq_url_path_returns_none_when_taken_but_allows_own_row(db, test_organization):
    existing = _faq_row(test_organization.id, "Existing")
    existing.slug = "existing"
    existing.url_path = "/hc/articles/1"
    db.add(existing)
    db.commit()

    assert resolve_faq_url_path(db, test_organization.id, "/hc/articles/1") is None
    # Re-saving the same article keeps its own path instead of colliding.
    assert resolve_faq_url_path(
        db, test_organization.id, "https://help.acme.com/hc/articles/1", exclude_id=existing.id
    ) == "/hc/articles/1"
    assert resolve_faq_url_path(db, test_organization.id, "/ask") is None
