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

SEO surface of the public help center: the <head> values (title, description,
canonical, Open Graph) and the schema.org JSON-LD graph. Kept out of the route
module so every page derives its metadata by the same rules.

Two URL spaces are in play and must not be mixed up:
  - ABSOLUTE (live_url-based) for canonical, og:*, sitemap and every JSON-LD
    @id/url — crawlers and social scrapers need a fetchable address.
  - RELATIVE (base_path-prefixed) for links the page actually renders, so the
    same markup works on a subdomain, a custom domain and /help/{slug}.
Breadcrumbs carry both, which is how the BreadcrumbList markup is guaranteed to
match the visible trail (a Google requirement).
"""

from datetime import datetime
from typing import List, Optional, Sequence
from urllib.parse import quote, urlsplit

from app.models.faq import FAQ
from app.models.help_center import HelpCenterSettings
from app.services.help_center_content import excerpt, to_plain_text
from app.services.help_center_settings import live_url

HOME_CRUMB = "Home"
# Meta descriptions get truncated by search engines around here; the excerpt
# helper adds an ellipsis rather than cutting mid-word.
META_DESCRIPTION_CHARS = 200


def site_url(row: HelpCenterSettings) -> str:
    """The help center's public base URL, never trailing-slashed."""
    return live_url(row).rstrip("/")


def asset_origin(site: str) -> str:
    """Scheme + host the site's uploads are served from. Same origin as the
    site in every mode — but NOT the same prefix in path mode, where the site
    is {backend}/help/{slug} while uploads stay at {backend}/api/v1/uploads/…"""
    parts = urlsplit(site)
    return f"{parts.scheme}://{parts.netloc}"


def absolute_asset_url(stored_url: Optional[str], site: str) -> Optional[str]:
    """A stored logo/image URL made absolute for og:image and JSON-LD. S3 URLs
    are already absolute and pass through; local uploads are relative and get
    anchored to the serving origin."""
    if not stored_url:
        return None
    if stored_url.startswith("http://") or stored_url.startswith("https://"):
        return stored_url
    return f"{asset_origin(site)}{stored_url}"


def _isoformat(value: Optional[datetime]) -> Optional[str]:
    return value.isoformat() if value else None


def article_title(row: HelpCenterSettings, faq: FAQ) -> str:
    """The article's <title>: the org's override, else question + site name."""
    return faq.meta_title or f"{faq.question} · {row.organization.name} Help Center"


def article_description(faq: FAQ) -> str:
    """The article's meta description: the org's override, else an excerpt of
    the answer (falling back to the question for answers with no prose)."""
    return faq.meta_description or excerpt(faq.answer, META_DESCRIPTION_CHARS) or faq.question


def index_title(row: HelpCenterSettings) -> str:
    return row.title or f"{row.organization.name} Help Center"


def index_description(row: HelpCenterSettings) -> str:
    return row.description or f"Answers to common questions about {row.organization.name}."


def category_url(site: str, category: str) -> str:
    """Absolute URL of the index filtered to one category — the middle
    breadcrumb. Mirrors the ?topic= link the templates render."""
    return f"{site}/?topic={quote(category)}"


def breadcrumbs(
    row: HelpCenterSettings, faq: FAQ, base_path: str, site: str
) -> List[dict]:
    """Home › Category › Article. Each crumb carries `href` (what the page
    links to) and `url` (what BreadcrumbList advertises); the last crumb is the
    current page and is rendered as text, so it has no href."""
    return [
        {"label": HOME_CRUMB, "href": f"{base_path}/", "url": f"{site}/"},
        {
            "label": faq.category,
            "href": f"{base_path}/?topic={quote(faq.category)}",
            "url": category_url(site, faq.category),
        },
        {"label": faq.question, "href": None, "url": f"{site}/a/{faq.slug}"},
    ]


def _organization_node(row: HelpCenterSettings, site: str, logo_url: Optional[str]) -> dict:
    node = {
        "@type": "Organization",
        "@id": f"{site}/#organization",
        "name": row.organization.name,
        "url": f"{site}/",
    }
    if logo_url:
        node["logo"] = {"@type": "ImageObject", "url": logo_url}
    return node


def _website_node(row: HelpCenterSettings, site: str) -> dict:
    return {
        "@type": "WebSite",
        "@id": f"{site}/#website",
        "url": f"{site}/",
        "name": index_title(row),
        "publisher": {"@id": f"{site}/#organization"},
    }


def _question_entity(faq: FAQ) -> dict:
    """One schema.org Question + acceptedAnswer, from the plain-text form of the
    (Markdown) answer."""
    return {
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {"@type": "Answer", "text": to_plain_text(faq.answer)},
    }


def _breadcrumb_node(crumbs: Sequence[dict], page_url: str) -> dict:
    return {
        "@type": "BreadcrumbList",
        "@id": f"{page_url}#breadcrumb",
        "itemListElement": [
            {"@type": "ListItem", "position": i, "name": crumb["label"], "item": crumb["url"]}
            for i, crumb in enumerate(crumbs, start=1)
        ],
    }


def index_json_ld(
    row: HelpCenterSettings, faqs: Sequence[FAQ], site: str, logo_url: Optional[str]
) -> dict:
    """The landing page graph: Organization + WebSite + a CollectionPage that is
    also the FAQPage carrying every published Q&A.

    FAQPage - not QAPage - is the correct type for these owner-authored answers.
    QAPage models community/forum pages where users submit competing answers and
    requires answerCount/upvoteCount, which don't apply here. Google retired FAQ
    rich results, but the markup still describes the page for other consumers.
    """
    page_url = f"{site}/"
    page: dict = {
        "@type": ["CollectionPage", "FAQPage"],
        "@id": f"{page_url}#webpage",
        "url": page_url,
        "name": index_title(row),
        "description": index_description(row),
        "isPartOf": {"@id": f"{site}/#website"},
        "about": {"@id": f"{site}/#organization"},
    }
    if faqs:
        page["mainEntity"] = [_question_entity(faq) for faq in faqs]
    return {
        "@context": "https://schema.org",
        "@graph": [
            _organization_node(row, site, logo_url),
            _website_node(row, site),
            page,
        ],
    }


def article_json_ld(
    row: HelpCenterSettings,
    faq: FAQ,
    site: str,
    crumbs: Sequence[dict],
    logo_url: Optional[str],
    image_url: Optional[str],
) -> dict:
    """The article page graph: Organization + WebSite + WebPage + BreadcrumbList
    + TechArticle, wired together by @id.

    TechArticle (not FAQPage) is what a single how-to/help article is: Google
    dropped FAQ rich results, while BreadcrumbList still renders in search.
    """
    page_url = f"{site}/a/{faq.slug}"
    description = article_description(faq)
    article: dict = {
        "@type": "TechArticle",
        "@id": f"{page_url}#article",
        "headline": faq.question,
        "description": description,
        "articleSection": faq.category,
        "inLanguage": "en",
        "mainEntityOfPage": {"@id": f"{page_url}#webpage"},
        "isPartOf": {"@id": f"{page_url}#webpage"},
        "author": {"@id": f"{site}/#organization"},
        "publisher": {"@id": f"{site}/#organization"},
    }
    published_at = _isoformat(faq.created_at)
    # updated_at stays NULL until the first edit, so fall back to the creation
    # date rather than claiming a modification date older than publication.
    modified_at = _isoformat(faq.updated_at) or published_at
    if published_at:
        article["datePublished"] = published_at
    if modified_at:
        article["dateModified"] = modified_at
    if image_url:
        article["image"] = image_url
    web_page = {
        "@type": "WebPage",
        "@id": f"{page_url}#webpage",
        "url": page_url,
        "name": article_title(row, faq),
        "description": description,
        "isPartOf": {"@id": f"{site}/#website"},
        "breadcrumb": {"@id": f"{page_url}#breadcrumb"},
    }
    return {
        "@context": "https://schema.org",
        "@graph": [
            _organization_node(row, site, logo_url),
            _website_node(row, site),
            web_page,
            _breadcrumb_node(crumbs, page_url),
            article,
        ],
    }
