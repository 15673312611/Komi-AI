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

The public help-center site: a standalone FastAPI app the host-dispatch layer
routes {slug}.<base-domain> and verified custom domains to. Server-rendered
Jinja2 HTML for SEO (landing list + per-article pages); the only JSON endpoint
is the rate-limited "Ask AI".
"""

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, PlainTextResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db
from app.models.faq import FAQ
from app.models.help_center import HelpCenterSettings
from app.repositories.faq import FAQRepository
from app.services.file_storage import resolve_public_url
from app.services.help_center_content import (
    excerpt,
    read_time_label,
    render_article_html,
    to_plain_text,
)
from app.services.help_center_public import (
    MAX_QUESTION_CHARS,
    answer_question,
    ask_available,
    category_colors,
    contrast_ink,
    get_published_article,
    normalize_host,
    published_faq_groups,
    related_articles,
    resolve_help_center,
    widget_id_for,
)
from app.services.help_center_seo import (
    absolute_asset_url,
    article_description,
    article_json_ld,
    article_title,
    breadcrumbs,
    index_description,
    index_json_ld,
    index_title,
    site_url,
)
from app.services.public_rate_limit import allow_request

public_app = FastAPI(title="ChatterMate Help Center", docs_url=None, redoc_url=None, openapi_url=None)
# Serve ONLY help-center images on this app, so relative logo/article-image paths
# resolve on a subdomain/custom-domain origin (host dispatch). Scoped to the
# help_center/ subtree — the help center must never expose chat_attachments,
# knowledge, avatars, etc. (in path mode these paths are served by the main app
# instead). check_dir=False: the dir may not exist until the first upload; a
# missing file 404s. Local storage only — S3 URLs never hit this mount.
public_app.mount(
    "/api/v1/uploads/help_center",
    StaticFiles(directory="uploads/help_center", check_dir=False),
    name="help_center_uploads",
)
templates = Jinja2Templates(directory="app/templates")

PAGE_CACHE_CONTROL = "public, max-age=60"
ASK_LIMIT_PER_MINUTE = 10
ASK_LIMIT_PER_DAY = 100


class AskRequest(BaseModel):
    question: str = Field(min_length=3, max_length=MAX_QUESTION_CHARS)


class FeedbackRequest(BaseModel):
    helpful: bool


def _client_ip(request: Request) -> str:
    """Rate-limit key. Our nginx APPENDS the real client IP to any
    X-Forwarded-For the client sent, so only the RIGHTMOST entry is
    trustworthy — keying on the first entry would let attackers rotate fake
    IPs and bypass the limit."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def _resolve_or_404(request: Request, db: Session):
    hc = request.scope.get("help_center")
    if hc:  # path dispatch (/help/{slug}) — org from the path slug, not Host
        row = resolve_help_center(db, slug=hc["slug"])
    else:
        row = resolve_help_center(db, host=normalize_host(request.headers.get("host")))
    if not row:
        raise HTTPException(status_code=404, detail="Help center not found")
    return row


def _base_path(request: Request) -> str:
    """URL prefix for internal links: "/help/{slug}" under path dispatch, "" otherwise."""
    return request.scope.get("help_center", {}).get("base_path", "")


async def _chrome_context(row: HelpCenterSettings, base_path: str = "") -> dict:
    """Shared header/footer/widget context used by every rendered page.

    `base_path` is the URL prefix templates prepend to internal links: "" for
    host dispatch (site at origin root) and "/help/{slug}" for path dispatch."""
    return {
        "row": row,
        "base_path": base_path,
        "brand_color": row.brand_color,
        "brand_ink": contrast_ink(row.brand_color),
        # Relative (/api/v1/uploads/...) so the logo resolves against whichever
        # origin serves the page — public_app now mounts uploads for host mode,
        # and path mode is same-origin as the API. S3 stays absolute (signed).
        "logo_url": await resolve_public_url(row.logo_url) if row.logo_url else None,
        "favicon_url": await resolve_public_url(row.favicon_url) if row.favicon_url else None,
        "header_links": row.header_links or [],
        "widget_id": widget_id_for(row),
        # The widget LOADER (chattermate.min.js) is served by the frontend, while
        # the widget APP it pulls in (/assets/widget.js) is served from
        # VITE_WIDGET_URL by the backend. In prod both resolve to the app domain.
        "widget_script_url": f"{settings.FRONTEND_URL}/webclient/chattermate.min.js",
    }


def _social_context(row: HelpCenterSettings, site: str) -> dict:
    """Open Graph / Twitter card values shared by both page types.

    og:image must be absolute (scrapers don't resolve relative URLs), so a
    relative logo is anchored to the serving origin. Deliberately NOT signed
    like the rendered logo: social scrapers cache the URL and re-fetch it long
    after a signature would expire, so this uses the stored URL — the same
    unsigned form article images already bake in, which S3 setups serve via a
    public-read help_center/ prefix.
    """
    logo_url = absolute_asset_url(row.logo_url, site)
    return {
        "og_site_name": index_title(row),
        "og_image": logo_url,
        "seo_logo_url": logo_url,
    }


def _card_view(faq: FAQ) -> dict:
    """List-card view model: question links to the article, with a plain-text
    preview and read time computed from the Markdown answer. Search fields are
    split so the client can rank title hits above body hits, and the body is
    plain text (raw Markdown would make URLs/syntax searchable noise)."""
    return {
        "question": faq.question,
        "slug": faq.slug,
        "preview": excerpt(faq.answer),
        "read_time": read_time_label(faq.answer),
        "search_title": faq.question.lower(),
        "search_text": f"{to_plain_text(faq.answer)} {faq.category}".lower(),
    }


@public_app.get("/", response_class=HTMLResponse)
async def index(request: Request, q: str = "", db: Session = Depends(get_db)):
    row = _resolve_or_404(request, db)
    search = q.strip()[:200] or None
    groups = published_faq_groups(db, row, search=search)
    colors = category_colors([category for category, _faqs in groups])
    card_groups = [(category, [_card_view(faq) for faq in faqs]) for category, faqs in groups]
    site = site_url(row)
    social = _social_context(row, site)
    published = [faq for _category, faqs in groups for faq in faqs]
    context = {
        **await _chrome_context(row, _base_path(request)),
        **social,
        "request": request,
        "groups": card_groups,
        "colors": colors,
        "search": search or "",
        "title": index_title(row),
        "description": index_description(row),
        "canonical_url": f"{site}/",
        "og_type": "website",
        "json_ld": index_json_ld(row, published, site, social["seo_logo_url"]),
        "ask_enabled": ask_available(row),
    }
    response = templates.TemplateResponse(request, "help_center/index.html", context)
    response.headers["Cache-Control"] = PAGE_CACHE_CONTROL
    return response


@public_app.get("/a/{slug}", response_class=HTMLResponse)
async def article(slug: str, request: Request, db: Session = Depends(get_db)):
    row = _resolve_or_404(request, db)
    faq = get_published_article(db, row, slug)
    if not faq:
        raise HTTPException(status_code=404, detail="Article not found")

    # All published categories (unfiltered) drive the sidebar + stable colors.
    all_groups = published_faq_groups(db, row)
    colors = category_colors([category for category, _faqs in all_groups])
    default_color = colors.get(faq.category, "#6d5bd0")
    topics = [
        {
            "category": category,
            "count": len(faqs),
            "color": colors.get(category, default_color),
            "active": category == faq.category,
        }
        for category, faqs in all_groups
    ]
    related = [
        {
            "question": rel.question,
            "slug": rel.slug,
            "read_time": read_time_label(rel.answer),
            "color": colors.get(rel.category, default_color),
        }
        for rel in related_articles(db, row, faq)
    ]
    base_path = _base_path(request)
    article_view = {
        "question": faq.question,
        "category": faq.category,
        "color": default_color,
        "read_time": read_time_label(faq.answer),
        "body_html": render_article_html(faq.answer, base_path),
        "related": related,
    }
    site = site_url(row)
    social = _social_context(row, site)
    crumbs = breadcrumbs(row, faq, base_path, site)
    context = {
        **await _chrome_context(row, base_path),
        **social,
        "request": request,
        "article": article_view,
        "breadcrumbs": crumbs,
        "topics": topics,
        "title": article_title(row, faq),
        "description": article_description(faq),
        "canonical_url": f"{site}/a/{faq.slug}",
        "og_type": "article",
        "json_ld": article_json_ld(
            row, faq, site, crumbs, social["seo_logo_url"], social["og_image"]
        ),
    }
    response = templates.TemplateResponse(request, "help_center/article.html", context)
    response.headers["Cache-Control"] = PAGE_CACHE_CONTROL
    return response


@public_app.post("/ask")
async def ask(payload: AskRequest, request: Request, db: Session = Depends(get_db)):
    row = _resolve_or_404(request, db)
    if not ask_available(row):
        raise HTTPException(status_code=404, detail="AI answers are not enabled")
    ip = _client_ip(request)
    if not allow_request(f"ask:{ip}:1m", ASK_LIMIT_PER_MINUTE, 60) or not allow_request(
        f"ask:{ip}:1d", ASK_LIMIT_PER_DAY, 86400
    ):
        raise HTTPException(status_code=429, detail="Too many questions — please try again later.")
    # answer_question manages its own short sessions around the slow LLM call.
    answer = await answer_question(row.organization_id, row.agent_id, payload.question)
    if not answer:
        raise HTTPException(status_code=503, detail="Could not answer right now — please try again.")
    return {"answer": answer}


@public_app.post("/a/{slug}/feedback")
async def article_feedback(
    slug: str, payload: FeedbackRequest, request: Request, db: Session = Depends(get_db)
):
    """Record a 'Was this helpful?' vote. One vote per article per IP per day
    (deduped via the rate limiter; fail-open, idempotent — a repeat vote is a
    silent no-op rather than an error)."""
    row = _resolve_or_404(request, db)
    faq = get_published_article(db, row, slug)
    if not faq:
        raise HTTPException(status_code=404, detail="Article not found")
    ip = _client_ip(request)
    if allow_request(f"faqfb:{faq.id}:{ip}", 1, 86400):
        FAQRepository(db).record_feedback(faq.id, payload.helpful)
    return {"ok": True}


@public_app.get("/sitemap.xml")
async def sitemap(request: Request, db: Session = Depends(get_db)):
    row = _resolve_or_404(request, db)
    base = site_url(row)
    groups = published_faq_groups(db, row)
    urls = [f"  <url><loc>{base}/</loc></url>"]
    for _category, faqs in groups:
        for faq in faqs:
            if faq.slug:
                urls.append(f"  <url><loc>{base}/a/{faq.slug}</loc></url>")
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>\n"
    )
    return Response(content=xml, media_type="application/xml", headers={"Cache-Control": PAGE_CACHE_CONTROL})


@public_app.get("/robots.txt", response_class=PlainTextResponse)
async def robots(request: Request, db: Session = Depends(get_db)):
    row = _resolve_or_404(request, db)
    return PlainTextResponse(f"User-agent: *\nAllow: /\nSitemap: {site_url(row)}/sitemap.xml\n")


@public_app.get("/healthz")
async def healthz():
    """Liveness for the SSL-provisioning probe; host-level only, no org data."""
    return {"status": "ok"}
