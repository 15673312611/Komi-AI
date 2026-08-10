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

from app.services.help_center_content import (
    excerpt,
    read_time_label,
    read_time_minutes,
    render_article_html,
    to_plain_text,
)

RICH = """## Getting started

From the dashboard, open [Settings](https://app.example.com/settings) and pick a connector.

1. Click **Add source**.
2. Authenticate.

![shot](https://cdn.example.com/a.png)

> Tip: assign roles as you invite.
"""


def test_render_produces_expected_tags():
    html = render_article_html(RICH)
    assert "<h2>" in html
    assert "<ol>" in html and "<li>" in html
    assert '<img alt="shot" src="https://cdn.example.com/a.png">' in html
    assert "<blockquote>" in html
    assert '<a href="https://app.example.com/settings"' in html


def test_render_sanitizes_scripts_and_bad_urls():
    html = render_article_html(
        '<script>alert(1)</script>\n\n[bad](javascript:alert(1))\n\n<img src=x onerror=alert(1)>'
    )
    assert "<script" not in html
    assert "javascript:" not in html
    assert "onerror" not in html


def test_render_rewrites_link_rel():
    html = render_article_html("[docs](https://docs.example.com)")
    assert 'rel="noopener noreferrer nofollow"' in html


def test_base_path_prefixes_internal_links_only():
    """Root-relative intra-help-center links (/a/{slug}, /) get the serving prefix;
    images and external links do not — so links work under path mode AND a custom
    domain from the SAME stored content."""
    md = "[other](/a/x) [home](/) ![i](/api/v1/uploads/y.png) [ext](https://e.com)"
    # Path mode: prefix added.
    html = render_article_html(md, base_path="/help/acme")
    assert 'href="/help/acme/a/x"' in html
    assert 'href="/help/acme/"' in html
    assert 'src="/api/v1/uploads/y.png"' in html          # image NOT prefixed
    assert 'href="https://e.com"' in html                 # external NOT prefixed
    # Host/custom-domain mode (base_path=""): stored links serve as-is at root.
    root = render_article_html(md)
    assert 'href="/a/x"' in root and 'href="/help/' not in root


def test_link_paths_resolve_cross_links_to_preserved_paths():
    """Bodies STORE /a/{slug} so links survive a path edit; the article's real
    served path is substituted at render time, avoiding a 301 hop."""
    md = "[moved](/a/x) [stayed](/a/y) [home](/)"
    link_paths = {"x": "/hc/en-us/articles/1"}

    html = render_article_html(md, link_paths=link_paths)
    assert 'href="/hc/en-us/articles/1"' in html
    assert 'href="/a/y"' in html          # no preserved path — unchanged
    assert 'href="/"' in html

    # The serving prefix still applies on top, in path mode.
    prefixed = render_article_html(md, base_path="/help/acme", link_paths=link_paths)
    assert 'href="/help/acme/hc/en-us/articles/1"' in prefixed
    assert 'href="/help/acme/a/y"' in prefixed


def test_to_plain_text_strips_markdown_and_html():
    plain = to_plain_text(RICH)
    assert "##" not in plain and "**" not in plain
    assert "<" not in plain and ">" not in plain
    assert "Getting started" in plain and "Add source" in plain


def test_excerpt_truncates_on_word_boundary():
    long = "word " * 60
    out = excerpt(long, length=40)
    assert len(out) <= 41 and out.endswith("…")
    assert " word" not in out[-2:]  # cut cleanly, not mid-word


def test_read_time_is_at_least_one_minute():
    assert read_time_minutes("short") == 1
    assert read_time_label("short") == "1 min read"
    assert read_time_minutes("word " * 800) >= 3
