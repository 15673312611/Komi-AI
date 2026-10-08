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

Article-mode import tests: link discovery bounds, HTML→Markdown conversion
(link absolutization, image placeholder/re-host, data: skip), and the
end-to-end job with mocked fetches.
"""
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from urllib.parse import urlparse

import pytest

from app.models.faq import FAQ, FAQStatus
from app.models.faq_generation_job import FAQGenerationJob, FAQJobType
from app.repositories.faq import FAQRepository
from app.services import faq_article_import
from app.services.faq_article_import import (
    _ArticleConverter,
    _article_key,
    _remap_source_links,
    discover_article_links,
    fetch_article,
    run_article_import_job,
)


def _response(text="", url="https://help.example.com/", content=b"", content_type="text/html"):
    response = MagicMock()
    response.text = text
    response.url = url
    response.content = content
    response.headers = {"content-type": content_type}
    response.raise_for_status = MagicMock()
    return response


# Chatwoot-style homepage: category cards, each a section heading + article
# links, plus a curated "Featured Articles" cross-cut and a category page link.
INDEX_HTML = """
<html><body><main>
  <p>{filler}</p>
  <section>
    <h2>Featured Articles</h2>
    <a href="/hc/atoa/articles/1-how-to-install">Install (featured)</a>
  </section>
  <section>
    <h2>📞 Help and support</h2>
    <a href="/hc/atoa/articles/1-how-to-install">Install</a>
    <a href="/hc/atoa/articles/2-refunds">Refunds</a>
    <a href="/hc/atoa/categories/9-help-and-support">View all</a>
  </section>
  <a href="https://other-site.com/hc/x/articles/9-foreign">Foreign</a>
  <a href="/downloads/guide.pdf">PDF</a>
  <a href="/pricing">Pricing (not an article)</a>
</main></body></html>
""".format(filler="x" * 600)

ARTICLE_HTML = """
<html><head><title>How to install | Example Help</title></head><body>
<main>
<nav><a href="/">Atoa Help Centre</a></nav>
<div class="crumbs"><a href="/hc/atoa/en">Home</a></div>
<article>
  <h1>How to install</h1>
  <p>{filler}</p>
  <ol><li>Download the app.</li><li>Run the installer.</li></ol>
  <p>See <a href="/pricing">pricing</a> for plans.</p>
  <img src="/img/shot.png" alt="screenshot">
  <img src="data:image/png;base64,AAAA" alt="inline">
</article>
<span>Last updated on Sep 20, 2024</span>
<footer><p>Made with <a href="https://www.chatwoot.com">Chatwoot</a></p></footer>
</main>
</body></html>
""".format(filler="Installation takes about two minutes. " * 10)


def test_discover_links_sections_categories_and_filters():
    client = MagicMock()
    from bs4 import BeautifulSoup
    # A category page reachable via the "View all" link returns the full list.
    category_page = BeautifulSoup(
        "<body><main><h1>Help and support</h1>"
        '<a href="/hc/atoa/articles/2-refunds">Refunds</a>'
        '<a href="/hc/atoa/articles/3-disputes">Disputes</a>'
        "</main></body>",
        "html.parser",
    )
    with patch.object(faq_article_import, "_fetch_index_soup") as index_fetch, \
         patch.object(faq_article_import, "_fetch_soup") as page_fetch:
        index_fetch.return_value = (BeautifulSoup(INDEX_HTML, "html.parser"), "https://help.example.com/hc/atoa/en")
        page_fetch.return_value = (category_page, "https://help.example.com/hc/atoa/categories/9-help-and-support")
        links = discover_article_links(client, "https://help.example.com/hc/atoa/en", limit=20)

    by_url = dict(links)
    # Only /articles/ pages; off-site, pdf and /pricing excluded. Check the
    # parsed host/path (not a URL substring) so an off-site article can't slip
    # through and the check isn't a substring-sanitization smell.
    hosts = {urlparse(u).hostname for u, _ in links}
    assert hosts == {"help.example.com"}
    assert not any(urlparse(u).path.endswith(".pdf") or urlparse(u).path == "/pricing" for u, _ in links)
    # Featured cross-cut isn't a category; the section heading tags the article.
    assert by_url["https://help.example.com/hc/atoa/articles/1-how-to-install"] == "Help and support"
    assert by_url["https://help.example.com/hc/atoa/articles/2-refunds"] == "Help and support"
    # Article only on the followed category page still imported + categorised.
    assert by_url["https://help.example.com/hc/atoa/articles/3-disputes"] == "Help and support"


def test_discover_links_respects_limit():
    client = MagicMock()
    many = "".join(f'<a href="/articles/a{i}">A{i}</a>' for i in range(50))
    with patch.object(faq_article_import, "_fetch_index_soup") as fetch:
        from bs4 import BeautifulSoup
        fetch.return_value = (
            BeautifulSoup(f"<body><main><p>{'x' * 600}</p>{many}</main></body>", "html.parser"),
            "https://help.example.com/articles",
        )
        links = discover_article_links(client, "https://help.example.com/articles", limit=5)
    assert len(links) == 5


def test_discover_links_flat_fallback_without_article_marker():
    """A non-standard help page with no /articles/ links imports every link."""
    client = MagicMock()
    html = f"<body><main><p>{'x' * 600}</p><a href='/faq/pay'>Pay</a><a href='/faq/refund'>Refund</a></main></body>"
    with patch.object(faq_article_import, "_fetch_index_soup") as fetch:
        from bs4 import BeautifulSoup
        fetch.return_value = (BeautifulSoup(html, "html.parser"), "https://help.example.com/faq")
        links = discover_article_links(client, "https://help.example.com/faq", limit=10)
    assert {u for u, _ in links} == {"https://help.example.com/faq/pay", "https://help.example.com/faq/refund"}
    assert all(c is None for _, c in links)  # category resolved per-article later


def test_fetch_article_converts_markdown_strips_chrome_and_collects_images():
    client = MagicMock()
    image = _response(content=b"\x89PNG", content_type="image/png")
    with patch.object(faq_article_import, "_fetch_soup") as fetch, \
         patch.object(faq_article_import, "safe_get", return_value=image):
        from bs4 import BeautifulSoup
        fetch.return_value = (
            BeautifulSoup(ARTICLE_HTML, "html.parser"),
            "https://help.example.com/hc/atoa/articles/1-how-to-install",
        )
        article = fetch_article(client, "https://help.example.com/hc/atoa/articles/1", "Help and support")

    assert article is not None
    assert article.title == "How to install"
    assert article.category_hint == "Help and support"  # from the category override
    # h1 removed (would duplicate the question), list preserved as Markdown.
    assert "# How to install" not in article.markdown
    assert "1. Download the app." in article.markdown
    # Link absolutized (same-site remapping happens later, in the import job).
    assert "[pricing](https://help.example.com/pricing)" in article.markdown
    # Real image collected as placeholder; data: image reduced to alt text.
    assert "cm-pending-image://0.img" in article.markdown
    assert len(article.pending_images) == 1
    assert "base64" not in article.markdown
    # Help-center chrome stripped: no Chatwoot footer, breadcrumb or metadata.
    lowered = article.markdown.lower()
    assert "chatwoot" not in lowered
    assert "made with" not in lowered
    assert "last updated" not in lowered
    assert "[home]" not in lowered
    assert "atoa help centre" not in lowered


def test_converter_skips_oversized_and_wrong_type_images():
    client = MagicMock()
    too_big = _response(content=b"x" * (faq_article_import.MAX_FAQ_IMAGE_BYTES + 1), content_type="image/png")
    wrong_type = _response(content=b"x", content_type="image/svg+xml")
    for response in (too_big, wrong_type):
        with patch.object(faq_article_import, "safe_get", return_value=response):
            converter = _ArticleConverter(base_url="https://a.example.com/", client=client)
            markdown = converter.convert('<img src="/i.png" alt="pic">')
        assert converter.images == {}
        assert "pic" in markdown and "![" not in markdown


def test_converter_absolutizes_links():
    """The converter absolutizes every link (relative → absolute); same-site
    remapping happens later in the import job, not here."""
    conv = _ArticleConverter(
        base_url="https://help.paywithatoa.co.uk/hc/x/articles/1-base", client=MagicMock(),
    )
    md = conv.convert(
        '<a href="/hc/x/articles/2-add">rel</a> and <a href="https://stripe.com/d">ext</a>'
    )
    assert "https://help.paywithatoa.co.uk/hc/x/articles/2-add" in md
    assert "https://stripe.com/d" in md


def test_article_key_extracts_numeric_id():
    assert _article_key("/hc/atoa/articles/1711032863-how-do-i-add-employees") == "1711032863"
    assert _article_key("/hc/atoa/articles/1711032863") == "1711032863"
    assert _article_key("/hc/atoa/categories/account-") is None  # not an article


def test_remap_source_links_articles_categories_and_offsite():
    """Article links → ROOT-RELATIVE /a/{slug} (no origin, so a custom-domain move
    keeps them working); home/category breadcrumb links dropped. Main-site links
    (same registrable domain, different host) and all external links untouched."""
    key_to_slug = {"1711032863": "how-do-i-add-employees"}
    md = (
        "[Add staff](https://help.paywithatoa.co.uk/hc/atoa/articles/1711032863-how-do-i-add-employees) "
        "[Home](https://help.paywithatoa.co.uk/hc/atoa/en) "
        "[Account](https://help.paywithatoa.co.uk/hc/atoa/en/categories/account-) "
        "[QR in-store](https://paywithatoa.co.uk/in-store-qr/) "  # main site, NOT the help center
        "[Stripe](https://stripe.com/docs) "
        "![img](/api/v1/uploads/help_center/x.png)"
    )
    out = _remap_source_links(md, {"help.paywithatoa.co.uk"}, key_to_slug)
    assert "[Add staff](/a/how-do-i-add-employees)" in out         # root-relative, no origin
    assert "[Home]" not in out                                     # breadcrumb dropped
    assert "[Account]" not in out                                  # category breadcrumb dropped
    assert "[QR in-store](https://paywithatoa.co.uk/in-store-qr/)" in out  # main site kept
    assert "[Stripe](https://stripe.com/docs)" in out              # off-site untouched
    assert "help.paywithatoa.co.uk" not in out
    assert "![img](/api/v1/uploads/help_center/x.png)" in out      # image embed untouched


def test_remap_source_links_handles_markdown_titles():
    """markdownify emits `[x](url "title")` for anchors with a title attribute —
    a titled help-center link must still be remapped, and a titled off-site link
    kept intact."""
    key_to_slug = {"1711032863": "how-do-i-add-employees"}
    md = (
        '[Add staff](https://help.paywithatoa.co.uk/hc/atoa/articles/1711032863-x "Tip") '
        '[Docs](https://stripe.com/docs "Stripe docs")'
    )
    out = _remap_source_links(md, {"help.paywithatoa.co.uk"}, key_to_slug)
    assert "[Add staff](/a/how-do-i-add-employees)" in out          # remapped despite title
    assert '[Docs](https://stripe.com/docs "Stripe docs")' in out   # off-site title preserved
    assert "help.paywithatoa.co.uk" not in out


@pytest.mark.asyncio
async def test_article_import_job_inserts_drafts(db, test_organization):
    job = FAQGenerationJob(
        organization_id=test_organization.id,
        job_type=FAQJobType.IMPORT_ARTICLES.value,
        source_url="https://help.example.com/articles",
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Duplicate-title article must dedup against existing FAQs.
    FAQRepository(db).create(FAQ(
        organization_id=test_organization.id, question="How to install",
        answer="old", category="Guides",
    ))

    articles = {
        "https://help.example.com/articles/one": faq_article_import.Article(
            url="https://help.example.com/articles/one",
            title="How to install", markdown="dupe", category_hint="Guides",
        ),
        "https://help.example.com/articles/two": faq_article_import.Article(
            url="https://help.example.com/articles/two",
            title="How billing works", markdown="**Billing** steps.", category_hint="Billing",
        ),
    }
    # discover now yields (url, category) pairs; the category flows to fetch_article.
    discovered = [(url, "Billing") for url in articles]
    with patch.object(faq_article_import, "discover_article_links", return_value=discovered), \
         patch.object(faq_article_import, "fetch_article", side_effect=lambda c, url, category: articles[url]):
        created = await run_article_import_job(db, job)

    assert created == 1
    row = db.query(FAQ).filter(FAQ.question == "How billing works").one()
    assert row.status == FAQStatus.DRAFT.value
    assert row.answer == "**Billing** steps."
    assert row.source_label == "Imported from help.example.com"
    assert row.knowledge_id is None


@pytest.mark.asyncio
async def test_article_import_job_remaps_cross_links(db, test_organization):
    """Cross-links remap even when the typed index host differs from the ACTUAL
    article host (redirect / main-site index → help subdomain): article link →
    /a/{new-slug}, home breadcrumb dropped, main-site link KEPT."""
    from app.models.help_center import HelpCenterSettings

    db.add(HelpCenterSettings(
        organization_id=test_organization.id, slug="acme", enabled=True, brand_color="#4338CA",
    ))
    job = FAQGenerationJob(
        organization_id=test_organization.id,
        job_type=FAQJobType.IMPORT_ARTICLES.value,
        source_url="https://example.com/help",  # main-site index, NOT the article host
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    articles = {
        "https://help.example.com/hc/articles/1711-install": faq_article_import.Article(
            url="https://help.example.com/hc/articles/1711-install",  # real host = help subdomain
            title="How to install", markdown="Install steps.", category_hint="Guides",
        ),
        "https://help.example.com/hc/articles/2822-billing": faq_article_import.Article(
            url="https://help.example.com/hc/articles/2822-billing",
            title="How billing works",
            markdown=(
                "See [install](https://help.example.com/hc/articles/1711-install), "
                "[home](https://help.example.com/hc/en), "
                "and [pricing](https://example.com/pricing)."
            ),
            category_hint="Billing",
        ),
    }
    discovered = [(url, None) for url in articles]
    with patch.object(faq_article_import, "discover_article_links", return_value=discovered), \
         patch.object(faq_article_import, "fetch_article", side_effect=lambda c, url, category: articles[url]):
        created = await run_article_import_job(db, job)

    assert created == 2
    install = db.query(FAQ).filter(FAQ.question == "How to install").one()
    billing = db.query(FAQ).filter(FAQ.question == "How billing works").one()
    # Article link → root-relative /a/{slug} (prefix added at render); home dropped.
    assert f"(/a/{install.slug})" in billing.answer
    assert "http://localhost:8000" not in billing.answer     # no origin baked in
    assert "[home]" not in billing.answer                    # breadcrumb dropped
    assert "help.example.com" not in billing.answer          # source-host links remapped/dropped
    assert "[pricing](https://example.com/pricing)" in billing.answer  # main-site link KEPT


def test_remap_cleans_breadcrumb_separator_residue():
    """Dropping "Home › Account" links must not leave a stray "› ›" line."""
    md = "[Home](https://help.x.co/en) › [Account](https://help.x.co/categories/2-a)\n\nReal content."
    out = _remap_source_links(md, {"help.x.co"}, {})
    assert "›" not in out
    assert out.lstrip().startswith("Real content.")


# ---------- preserving the source help center's URLs ----------

def _import_job(db, org_id, **kw):
    job = FAQGenerationJob(
        organization_id=org_id,
        job_type=FAQJobType.IMPORT_ARTICLES.value,
        source_url="https://help.example.com/articles",
        **kw,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


async def _run_import(db, job, articles):
    discovered = [(url, "Billing") for url in articles]
    with patch.object(faq_article_import, "discover_article_links", return_value=discovered), \
         patch.object(faq_article_import, "fetch_article", side_effect=lambda c, url, category: articles[url]):
        return await run_article_import_job(db, job)


def _article(url, title):
    return faq_article_import.Article(
        url=url, title=title, markdown="Body.", category_hint="Billing",
    )


@pytest.mark.asyncio
async def test_article_import_preserves_original_urls_when_enabled(db, test_organization):
    """The migrated article is served at the exact path it had on the old help
    center, so the org keeps the URL it already ranks for."""
    job = _import_job(db, test_organization.id, preserve_source_urls=True)
    url = "https://help.example.com/hc/en-us/articles/360012-reset?utm=x"
    articles = {url: _article(url, "How billing works")}

    assert await _run_import(db, job, articles) == 1

    row = db.query(FAQ).filter(FAQ.question == "How billing works").one()
    assert row.url_path == "/hc/en-us/articles/360012-reset"   # query string dropped
    assert row.source_url == url
    assert row.slug  # still assigned — /a/{slug} stays the alias that 301s


@pytest.mark.asyncio
async def test_article_import_records_source_url_but_no_path_when_disabled(db, test_organization):
    """Provenance is always captured, so preserved paths can be applied later."""
    job = _import_job(db, test_organization.id)
    url = "https://help.example.com/hc/en-us/articles/360012-reset"
    articles = {url: _article(url, "How billing works")}

    assert await _run_import(db, job, articles) == 1

    row = db.query(FAQ).filter(FAQ.question == "How billing works").one()
    assert row.url_path is None
    assert row.source_url == url


@pytest.mark.asyncio
async def test_article_import_falls_back_to_the_slug_on_an_unusable_path(db, test_organization):
    """One URL that would shadow a real route must not cost the org the import."""
    job = _import_job(db, test_organization.id, preserve_source_urls=True)
    reserved = "https://help.example.com/ask"
    good = "https://help.example.com/hc/articles/2"
    articles = {reserved: _article(reserved, "Reserved"), good: _article(good, "Fine")}

    assert await _run_import(db, job, articles) == 2

    assert db.query(FAQ).filter(FAQ.question == "Reserved").one().url_path is None
    assert db.query(FAQ).filter(FAQ.question == "Fine").one().url_path == "/hc/articles/2"


@pytest.mark.asyncio
async def test_article_import_still_stores_cross_links_as_slug_paths(db, test_organization):
    """Bodies must keep /a/{slug}: it's the only form the render-time prefixer
    can handle in path mode, and it survives a later path edit."""
    from app.models.help_center import HelpCenterSettings

    db.add(HelpCenterSettings(
        organization_id=test_organization.id, slug="acme", enabled=True, brand_color="#4338CA",
    ))
    job = _import_job(db, test_organization.id, preserve_source_urls=True)
    one = "https://help.example.com/hc/articles/1"
    two = "https://help.example.com/hc/articles/2"
    articles = {
        one: _article(one, "First"),
        two: faq_article_import.Article(
            url=two, title="Second", markdown=f"See [first]({one}).", category_hint="Billing",
        ),
    }

    assert await _run_import(db, job, articles) == 2

    first = db.query(FAQ).filter(FAQ.question == "First").one()
    second = db.query(FAQ).filter(FAQ.question == "Second").one()
    assert first.url_path == "/hc/articles/1"
    assert f"(/a/{first.slug})" in second.answer
    assert "/hc/articles/1" not in second.answer
