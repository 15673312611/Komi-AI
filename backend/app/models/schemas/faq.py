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

from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Reuse the ORM enums so the API contract can never drift from the DB.
from app.models.faq import (
    DEFAULT_FAQ_CATEGORY,
    FAQ_META_DESCRIPTION_MAX_LENGTH,
    FAQ_META_TITLE_MAX_LENGTH,
    FAQ_SLUG_MAX_LENGTH,
    FAQ_URL_PATH_MAX_LENGTH,
    FAQStatus,
)
from app.models.schemas.pagination import Pagination
from app.utils.urls import normalize_url

MAX_QUESTION_LENGTH = 300
# Articles imported as-is (help-center pages with steps/images) routinely run
# long; the column is TEXT and the public renderer paginates nothing, so the
# cap only guards against runaway payloads.
MAX_ANSWER_LENGTH = 20000
MAX_BULK_IDS = 200


class SeoFields(BaseModel):
    """Optional per-article SEO overrides, shared by create and update.

    Blank strings are coerced to None so clearing a field in the admin UI
    restores the derived default instead of publishing an empty tag. `slug` is
    normalized and de-duplicated server-side (see resolve_faq_slug) — validation
    here only bounds the input, to exactly what the columns accept (values that
    are too long are rejected rather than silently truncated).
    """
    slug: Optional[str] = Field(default=None, max_length=FAQ_SLUG_MAX_LENGTH)
    # A URL path carried over from a help center the org migrated from, so the
    # article stays reachable at the URL it already ranks for. Accepts a full
    # URL or a bare path; normalized and checked server-side (normalize_url_path
    # / resolve_faq_url_path). Blank clears it, restoring /a/{slug}.
    url_path: Optional[str] = Field(default=None, max_length=FAQ_URL_PATH_MAX_LENGTH)
    meta_title: Optional[str] = Field(default=None, max_length=FAQ_META_TITLE_MAX_LENGTH)
    meta_description: Optional[str] = Field(
        default=None, max_length=FAQ_META_DESCRIPTION_MAX_LENGTH
    )

    @field_validator("slug", "url_path", "meta_title", "meta_description")
    @classmethod
    def _blank_to_none(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return v.strip() or None


class FAQBase(BaseModel):
    question: str = Field(min_length=1, max_length=MAX_QUESTION_LENGTH)
    answer: str = Field(min_length=1, max_length=MAX_ANSWER_LENGTH)
    category: str = Field(default=DEFAULT_FAQ_CATEGORY, min_length=1, max_length=100)

    @field_validator("question", "answer", "category")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be blank")
        return v


class FAQCreate(FAQBase, SeoFields):
    status: FAQStatus = FAQStatus.DRAFT


class FAQUpdate(SeoFields):
    """Partial update — omitted fields keep their current values (apply with
    model_dump(exclude_unset=True)), so e.g. a status-only PATCH can't silently
    reset the category to its default."""
    question: Optional[str] = Field(default=None, min_length=1, max_length=MAX_QUESTION_LENGTH)
    answer: Optional[str] = Field(default=None, min_length=1, max_length=MAX_ANSWER_LENGTH)
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    status: Optional[FAQStatus] = None

    @field_validator("question", "answer", "category")
    @classmethod
    def _strip(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        if not v:
            raise ValueError("must not be blank")
        return v


class FAQResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    question: str
    answer: str
    category: str
    slug: Optional[str] = None
    url_path: Optional[str] = None
    source_url: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    status: FAQStatus
    knowledge_id: Optional[int] = None
    source_label: Optional[str] = None
    helpful_yes: int = 0
    helpful_no: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class FAQListResponse(BaseModel):
    faqs: List[FAQResponse]
    pagination: Pagination


class FAQBulkStatusRequest(BaseModel):
    faq_ids: List[UUID] = Field(min_length=1, max_length=MAX_BULK_IDS)
    status: FAQStatus


class FAQBulkDeleteRequest(BaseModel):
    faq_ids: List[UUID] = Field(min_length=1, max_length=MAX_BULK_IDS)


class GenerateRequest(BaseModel):
    """Optional narrowing to specific knowledge sources; empty = new sources
    only (those without FAQs yet)."""
    knowledge_ids: Optional[List[int]] = Field(default=None, max_length=MAX_BULK_IDS)


class GenerationSourceResponse(BaseModel):
    """One knowledge source in the generation picker."""
    id: int
    name: str
    source_type: str
    has_faqs: bool
    pages: int
    estimated_calls: int


class GenerationEstimateResponse(BaseModel):
    """Confirm-dialog / source-picker numbers for a generation run.
    remaining_credits is None when unlimited (OSS, no cap, or own model key)."""
    total_sources: int
    new_sources: int
    pages: int
    estimated_calls: int
    metered: bool
    remaining_credits: Optional[int] = None
    sources: List[GenerationSourceResponse] = []


class ImportRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)
    # qa = single page, LLM extracts Q&A pairs (uses credits).
    # articles = crawl the page's linked articles and import each as-is
    #            (HTML -> Markdown, images re-hosted, no LLM).
    mode: Literal["qa", "articles"] = "qa"
    # articles mode only: serve each imported article at the URL path it already
    # has on the source help center, so the org's search rankings and inbound
    # links survive the migration. Ignored for qa.
    preserve_urls: bool = False

    @field_validator("url")
    @classmethod
    def _https_url(cls, v: str) -> str:
        # Scheme-level validation only; the import worker re-checks the URL
        # against the SSRF guards in app.knowledge.url_safety before fetching.
        return normalize_url(v, require_https=True)


class GenerationJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_type: str
    status: str
    stage: str
    progress_percentage: float
    faqs_created: int
    source_url: Optional[str] = None
    error: Optional[str] = None
    created_at: Optional[datetime] = None
