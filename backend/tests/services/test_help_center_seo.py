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

Help-center SEO helpers: absolute-vs-relative URL handling across the three
serving modes, meta derivation/overrides, and the JSON-LD graph wiring.
"""
from datetime import datetime, timezone
from types import SimpleNamespace

from app.core.config import settings
from app.services.help_center_seo import (
    absolute_asset_url,
    article_description,
    article_href,
    article_json_ld,
    article_title,
    article_url,
    asset_origin,
    breadcrumbs,
    index_json_ld,
    site_url,
)


def _row(**kw):
    base = {
        "domain_verified": False,
        "custom_domain": None,
        "slug": "acme",
        "title": None,
        "description": None,
        "organization": SimpleNamespace(name="Acme"),
    }
    base.update(kw)
    return SimpleNamespace(**base)


def _faq(**kw):
    base = {
        "question": "How do I sign up?",
        "answer": "Click **Settings**.",
        "category": "Getting started",
        "slug": "how-do-i-sign-up",
        "url_path": None,
        "meta_title": None,
        "meta_description": None,
        "created_at": datetime(2026, 1, 2, tzinfo=timezone.utc),
        "updated_at": None,
    }
    base.update(kw)
    return SimpleNamespace(**base)


def _graph(doc):
    """Graph nodes keyed by @type (multi-typed nodes land under each type)."""
    nodes = {}
    for node in doc["@graph"]:
        types = node["@type"]
        for node_type in [types] if isinstance(types, str) else types:
            nodes[node_type] = node
    return nodes


# ---------- URL space ----------

def test_asset_origin_drops_the_path_in_path_mode(monkeypatch):
    """In path mode the site lives under /help/{slug} but uploads stay at the
    origin root, so assets must anchor to the origin, not the site prefix."""
    monkeypatch.setattr(settings, "HELP_CENTER_PUBLIC_MODE", "path")
    monkeypatch.setattr(settings, "BACKEND_URL", "http://localhost:8000")
    site = site_url(_row())
    assert site == "http://localhost:8000/help/acme"
    assert asset_origin(site) == "http://localhost:8000"
    assert (
        absolute_asset_url("/api/v1/uploads/help_center/l.png", site)
        == "http://localhost:8000/api/v1/uploads/help_center/l.png"
    )


def test_absolute_asset_url_passes_s3_urls_through():
    """S3 URLs are already absolute — anchoring them would corrupt them."""
    stored = "https://bucket.s3.amazonaws.com/help_center/l.png"
    assert absolute_asset_url(stored, "https://help.acme.com") == stored
    assert absolute_asset_url(None, "https://help.acme.com") is None


def test_site_url_has_no_trailing_slash(monkeypatch):
    """Every absolute URL is built by concatenation, so a trailing slash here
    would produce '//a/slug' everywhere."""
    monkeypatch.setattr(settings, "HELP_CENTER_PUBLIC_MODE", "path")
    monkeypatch.setattr(settings, "BACKEND_URL", "http://localhost:8000/")
    assert site_url(_row()) == "http://localhost:8000/help/acme"


# ---------- meta ----------

def test_meta_derives_from_content_then_yields_to_overrides():
    row, faq = _row(), _faq()
    assert article_title(row, faq) == "How do I sign up? · Acme Help Center"
    assert article_description(faq) == "Click Settings ."

    overridden = _faq(meta_title="Signing up", meta_description="Custom.")
    assert article_title(row, overridden) == "Signing up"
    assert article_description(overridden) == "Custom."


def test_description_falls_back_to_the_question_for_prose_free_answers():
    assert article_description(_faq(answer="![](/img.png)")) == "How do I sign up?"


# ---------- breadcrumbs ----------

def test_breadcrumbs_carry_relative_hrefs_and_absolute_urls():
    """The page links relatively (so the markup works on any origin) while
    BreadcrumbList advertises absolute URLs."""
    site = "https://help.acme.com"
    crumbs = breadcrumbs(_row(), _faq(), "/help/acme", site)
    assert [c["label"] for c in crumbs] == ["Home", "Getting started", "How do I sign up?"]
    assert crumbs[0]["href"] == "/help/acme/"
    assert crumbs[1]["href"] == "/help/acme/?topic=Getting%20started"
    assert crumbs[1]["url"] == f"{site}/?topic=Getting%20started"
    # The current page is rendered as text, so it has no link.
    assert crumbs[-1]["href"] is None
    assert crumbs[-1]["url"] == f"{site}/a/how-do-i-sign-up"


# ---------- JSON-LD ----------

def test_article_graph_is_wired_by_id():
    site = "https://help.acme.com"
    faq = _faq()
    crumbs = breadcrumbs(_row(), faq, "", site)
    nodes = _graph(article_json_ld(_row(), faq, site, crumbs, None, None))

    page_id = f"{site}/a/how-do-i-sign-up#webpage"
    assert nodes["WebPage"]["@id"] == page_id
    assert nodes["TechArticle"]["mainEntityOfPage"]["@id"] == page_id
    assert nodes["WebPage"]["breadcrumb"]["@id"] == nodes["BreadcrumbList"]["@id"]
    assert nodes["TechArticle"]["author"]["@id"] == nodes["Organization"]["@id"]
    assert "FAQPage" not in nodes


def test_article_graph_omits_empty_optional_nodes():
    """No logo and no image must not leave null-valued keys in the graph."""
    site = "https://help.acme.com"
    faq = _faq()
    nodes = _graph(
        article_json_ld(_row(), faq, site, breadcrumbs(_row(), faq, "", site), None, None)
    )
    assert "logo" not in nodes["Organization"]
    assert "image" not in nodes["TechArticle"]


def test_date_modified_never_predates_publication():
    """updated_at is NULL until the first edit, so it falls back to created_at
    rather than being omitted or set earlier than datePublished."""
    site = "https://help.acme.com"
    faq = _faq()
    article = _graph(
        article_json_ld(_row(), faq, site, breadcrumbs(_row(), faq, "", site), None, None)
    )["TechArticle"]
    assert article["dateModified"] == article["datePublished"]

    edited = _faq(updated_at=datetime(2026, 3, 4, tzinfo=timezone.utc))
    article = _graph(
        article_json_ld(_row(), edited, site, breadcrumbs(_row(), edited, "", site), None, None)
    )["TechArticle"]
    assert article["dateModified"] > article["datePublished"]


def test_index_graph_keeps_faqpage_and_drops_mainentity_when_empty():
    site = "https://help.acme.com"
    nodes = _graph(index_json_ld(_row(), [_faq()], site, None))
    assert nodes["FAQPage"]["mainEntity"][0]["name"] == "How do I sign up?"

    empty = _graph(index_json_ld(_row(), [], site, None))
    # An empty mainEntity is invalid FAQPage markup — omit the key entirely.
    assert "mainEntity" not in empty["FAQPage"]


# ---------- preserved original article URLs ----------

def test_article_url_defaults_to_the_slug_path():
    assert article_url("https://help.acme.com", _faq()) == "https://help.acme.com/a/how-do-i-sign-up"


def test_article_url_prefers_a_preserved_path():
    """A migrated article advertises the URL it already ranks for, not /a/{slug}."""
    faq = _faq(url_path="/hc/en-us/articles/360012-reset")
    assert article_url("https://help.acme.com", faq) == (
        "https://help.acme.com/hc/en-us/articles/360012-reset"
    )


def test_article_url_percent_encodes_but_keeps_separators():
    """Paths are STORED decoded, so every emitted URL has to re-encode them."""
    faq = _faq(url_path="/hc/en-us/articles/café brûlée")
    assert article_url("https://help.acme.com", faq) == (
        "https://help.acme.com/hc/en-us/articles/caf%C3%A9%20br%C3%BBl%C3%A9e"
    )


def test_article_href_prefixes_the_base_path():
    faq = _faq(url_path="/hc/articles/1")
    assert article_href(faq) == "/hc/articles/1"
    assert article_href(faq, "/help/acme") == "/help/acme/hc/articles/1"


def test_breadcrumbs_and_json_ld_follow_the_preserved_url():
    """The whole SEO surface has to agree on one canonical article URL."""
    row, faq = _row(), _faq(url_path="/hc/articles/1")
    site = "https://help.acme.com"
    crumbs = breadcrumbs(row, faq, "", site)
    assert crumbs[-1]["url"] == f"{site}/hc/articles/1"

    graph = article_json_ld(row, faq, site, crumbs, None, None)
    page = next(n for n in graph["@graph"] if n["@type"] == "WebPage")
    article = next(n for n in graph["@graph"] if n["@type"] == "TechArticle")
    assert page["url"] == f"{site}/hc/articles/1"
    assert page["@id"] == f"{site}/hc/articles/1#webpage"
    assert article["@id"] == f"{site}/hc/articles/1#article"
