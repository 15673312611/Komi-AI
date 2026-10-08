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
"""

import sys
from pathlib import Path

from app.knowledge.crawl_scope import (
    DEFAULT_CRAWL_SCOPE,
    SCOPE_DOMAIN,
    SCOPE_HOST,
    SCOPE_PATH,
    CrawlScope,
    is_crawlable_url,
    url_scheme,
)


def test_url_scheme_ignores_ports():
    assert url_scheme("https://site.com/a") == "https"
    assert url_scheme("HTTP://site.com") == "http"
    assert url_scheme("mailto:hi@site.com") == "mailto"
    assert url_scheme("tel:+441234567890") == "tel"
    assert url_scheme("javascript:void(0)") == "javascript"
    # A scheme-less host:port must not read as a scheme (that would make
    # _normalize_url leave it alone and the crawl skip a real page).
    assert url_scheme("site.com:8443/x") == ""
    assert url_scheme("/relative/path") == ""
    assert url_scheme("") == ""


def test_is_crawlable_url():
    assert is_crawlable_url("https://site.com/a")
    assert is_crawlable_url("/relative/path")  # resolved against a base later
    assert not is_crawlable_url("mailto:hi@site.com")
    assert not is_crawlable_url("tel:+441234567890")
    assert not is_crawlable_url("sms:+441234567890")
    assert not is_crawlable_url("javascript:void(0)")
    assert not is_crawlable_url("data:text/html,<h1>x</h1>")


def test_host_scope_is_the_default():
    scope = CrawlScope.for_seed("https://help.site.com/hc/en")
    assert scope.mode == DEFAULT_CRAWL_SCOPE == SCOPE_HOST
    assert scope.allows("https://help.site.com/hc/en/articles/1")
    # The rest of the company web presence stays out — the reported bug.
    assert not scope.allows("https://www.site.com/all-integrations")
    assert not scope.allows("https://site.com/blog/announcement")
    assert not scope.allows("https://support.site.com/hc/help-center/en")
    assert not scope.allows("https://other.com/a")


def test_host_scope_treats_www_as_the_same_host():
    scope = CrawlScope.for_seed("https://site.com/")
    assert scope.allows("https://www.site.com/pricing")
    assert scope.allows("http://SITE.com/pricing")
    assert not scope.allows("https://blog.site.com/post")


def test_canonical_puts_links_on_the_seeds_host_spelling():
    """example.com/terms and www.example.com/terms are one page; storing both
    spends two of the source's sub-page slots on the same text."""
    bare = CrawlScope.for_seed("https://site.com/")
    assert bare.canonical("https://www.site.com/terms") == "https://site.com/terms"
    assert bare.canonical("https://site.com/terms") == "https://site.com/terms"

    # Toward the SEED, not blindly www-stripped: a site may serve only the www
    # form, and the seed is the spelling the crawl already fetched.
    www = CrawlScope.for_seed("https://www.site.com/")
    assert www.canonical("https://site.com/terms") == "https://www.site.com/terms"

    # Port and path survive the rewrite.
    assert bare.canonical("https://www.site.com:8443/a/b") == "https://site.com:8443/a/b"


def test_canonical_leaves_other_hosts_alone():
    scope = CrawlScope.for_seed("https://site.com/", SCOPE_DOMAIN)
    # A real subdomain is a different site, even under domain scope.
    assert scope.canonical("https://blog.site.com/post") == "https://blog.site.com/post"
    assert scope.canonical("https://other.com/a") == "https://other.com/a"
    # Nothing to rewrite, nothing to crash on.
    assert scope.canonical("mailto:hi@site.com") == "mailto:hi@site.com"
    assert scope.canonical("https://[bad") == "https://[bad"
    assert scope.canonical("") == ""


def test_domain_scope_keeps_the_previous_reach():
    scope = CrawlScope.for_seed("https://help.site.com/hc/en", SCOPE_DOMAIN)
    assert scope.allows("https://www.site.com/all-integrations")
    assert scope.allows("https://support.site.com/x")
    # Equality, not a suffix match: a lookalike domain must not slip through.
    assert not scope.allows("https://evilsite.com/c")
    assert not scope.allows("https://other.com/a")


def test_path_scope_matches_on_segment_boundaries():
    scope = CrawlScope.for_seed("https://site.com/hc/en", SCOPE_PATH)
    assert scope.allows("https://site.com/hc/en")
    assert scope.allows("https://site.com/hc/en/")
    assert scope.allows("https://site.com/hc/en/articles/1")
    assert not scope.allows("https://site.com/hc/entertainment")
    assert not scope.allows("https://site.com/blog/post")
    # Still host-bound.
    assert not scope.allows("https://help.site.com/hc/en/articles/1")


def test_path_scope_from_a_root_seed_behaves_like_host_scope():
    scope = CrawlScope.for_seed("https://site.com/", SCOPE_PATH)
    assert scope.allows("https://site.com/anything/deep")


def test_no_scope_allows_non_http_urls():
    """The mailto: crawl bug: 'https://' + 'mailto:a@site.com' parses as host
    site.com with 'mailto:a' as userinfo, so a naive domain check passed it."""
    for mode in (SCOPE_PATH, SCOPE_HOST, SCOPE_DOMAIN):
        scope = CrawlScope.for_seed("https://site.com/", mode)
        assert not scope.allows("mailto:hi@site.com")
        assert not scope.allows("tel:+441234567890")
        assert not scope.allows("https://mailto:hi@site.com/pay-by-bank")


def test_unknown_mode_falls_back_to_the_default():
    scope = CrawlScope.for_seed("https://site.com/", "everything")
    assert scope.mode == DEFAULT_CRAWL_SCOPE


def _pruner():
    """The cleanup script lives outside the app tree (it must not import `app`),
    so it re-implements the scope check. Load it the way it runs on a host."""
    sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
    try:
        import prune_offsite_pages

        return prune_offsite_pages
    finally:
        sys.path.pop(0)


def test_pruner_scope_agrees_with_the_crawler():
    """The script deletes what the crawler would no longer store, so its copy of
    the rules must not drift from CrawlScope."""
    pruner = _pruner()
    seed = "https://help.site.com/hc/en"
    urls = [
        "https://help.site.com/hc/en/articles/1",
        "https://help.site.com/pricing",
        "https://www.site.com/all-integrations",
        "https://site.com/blog/post",
        "https://support.site.com/x",
        "https://other.com/a",
        "https://mailto:hi@help.site.com/hc/en/pay-by-bank",
    ]
    for mode in (SCOPE_HOST, SCOPE_PATH):
        scope = CrawlScope.for_seed(seed, mode)
        for url in urls:
            assert pruner.in_scope(url, seed, mode) == scope.allows(url), (mode, url)


def test_pruner_leaves_non_crawled_pages_alone():
    """Text pages and PDF chunks live in the same table under their own ids —
    they are not crawled URLs, so the pruner must never select them."""
    pruner = _pruner()
    seed = "https://help.site.com/hc/en"
    assert pruner.in_scope("Shipping Policy", seed, SCOPE_HOST)
    assert pruner.in_scope("7acf323c-7100-4e34-b0db-bcda9f5b2ef1_1", seed, SCOPE_PATH)
    # ...while chunk ids of a crawled page still resolve to their page.
    assert pruner.page_id_of("https://site.com/docs_2") == "https://site.com/docs"
    assert pruner.page_id_of("https://site.com/getting_started") == "https://site.com/getting_started"


def test_malformed_urls_are_out_of_scope_not_crashes():
    scope = CrawlScope.for_seed("https://site.com/")
    assert not scope.allows("https://[not-an-ipv6/x")
    assert not scope.allows("")
    # A seed we can't parse a host from allows nothing (host/path modes).
    assert not CrawlScope.for_seed("https://[bad").allows("https://site.com/a")
