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

"""Which URLs a website crawl is allowed to follow.

Two independent problems this decides, both seen on a real help-center import
that stored 247 pages of which only ~102 were help articles:

* **Scheme.** ``urljoin`` leaves a ``mailto:``/``tel:`` href untouched, and
  prefixing a scheme-less value with ``https://`` turns ``mailto:a@example.com``
  into ``https://mailto:a@example.com`` — which parses as host ``example.com``
  with ``mailto:a`` as userinfo, so it passed the same-domain check and was
  crawled as a page (then spawned ``https://mailto:a@example.com/pricing`` and
  friends from the fetched body). Only http(s) URLs are crawlable.

* **Reach.** Bounding a crawl by the *registrable domain* means a crawl seeded at
  ``help.example.com`` also walks ``www.example.com``, ``example.com/blog/*`` and
  every other host under ``example.com`` — the whole company web presence lands
  in one knowledge source. The default is now the seed's own host; ``domain``
  (previous behaviour) and ``path`` (seed host + seed path prefix) stay available
  per source.
"""

from dataclasses import dataclass
from typing import Optional
from urllib.parse import ParseResult, urlparse, urlunparse

from app.knowledge.domains import registrable_domain

# Scope modes, narrowest first. Kept as plain strings: they travel through the
# API request and the queue item's JSON metadata.
SCOPE_PATH = "path"
SCOPE_HOST = "host"
SCOPE_DOMAIN = "domain"
CRAWL_SCOPES = (SCOPE_PATH, SCOPE_HOST, SCOPE_DOMAIN)

DEFAULT_CRAWL_SCOPE = SCOPE_HOST

# Anything else (mailto:, tel:, sms:, javascript:, data:, ftp:) is a contact or
# script action, not a page to fetch.
CRAWLABLE_SCHEMES = ("http", "https")


def url_scheme(url: str) -> str:
    """Lowercased scheme of a URL, or ``''`` when it has none.

    Not ``urlparse(url).scheme``: that reads the scheme-less ``example.com:8443/x``
    as scheme ``example.com``. A real scheme has no ``.`` or ``/`` before the colon.
    """
    head, sep, _ = (url or "").strip().partition(":")
    if not sep or not head or "." in head or "/" in head:
        return ""
    return head.lower()


def is_crawlable_url(url: str) -> bool:
    """True for an http(s) URL or a scheme-less one (a relative href still to be
    resolved against its base). False for ``mailto:``/``tel:``/``javascript:``/…"""
    scheme = url_scheme(url)
    return scheme in CRAWLABLE_SCHEMES or not scheme


def _parsed(url: str) -> Optional[ParseResult]:
    """Parsed URL, or None when it can't be parsed — a malformed IPv6 literal
    makes ``.hostname`` raise, and callers want "out of scope", not a traceback."""
    try:
        parsed = urlparse(url or "")
        parsed.hostname  # raises here rather than at each use site
    except ValueError:
        return None
    return parsed


def _hostname(url: str) -> str:
    """Host of a URL, or ``''`` if it has none / can't be parsed."""
    parsed = _parsed(url)
    return (parsed.hostname or "") if parsed else ""


def _host_key(host: str) -> str:
    """Host identity for comparisons: lowercased, ``www.`` dropped, so a site
    linking between ``example.com`` and ``www.example.com`` stays in scope."""
    host = (host or "").lower().strip().rstrip(".")
    return host[4:] if host.startswith("www.") else host


@dataclass(frozen=True)
class CrawlScope:
    """The boundary of one crawl, derived from its seed URL."""

    mode: str
    domain: str
    host: str
    seed_host: str
    path_prefix: str

    @classmethod
    def for_seed(cls, seed_url: str, mode: str = DEFAULT_CRAWL_SCOPE) -> "CrawlScope":
        """Scope for a crawl seeded at ``seed_url``. An unknown mode falls back to
        the default rather than failing a queued crawl."""
        if mode not in CRAWL_SCOPES:
            mode = DEFAULT_CRAWL_SCOPE
        parsed = _parsed(seed_url)
        host = ((parsed.hostname or "") if parsed else "").lower()
        return cls(
            mode=mode,
            domain=registrable_domain(host),
            host=_host_key(host),
            seed_host=host,
            path_prefix=((parsed.path or "") if parsed else "").rstrip("/"),
        )

    def canonical(self, url: str) -> str:
        """Put an in-scope URL on the seed's own spelling of the host.

        ``example.com/terms`` and ``www.example.com/terms`` are one page, but
        they are two page ids — so a site that links both ways stores the page
        twice, burning two of the source's sub-page slots and feeding retrieval
        and FAQ generation the same text twice.

        Rewrites toward the SEED's host rather than always stripping ``www.``:
        plenty of sites serve only one of the two, and the seed is the form the
        user gave us and the crawl already fetched. Only the seed host's own
        variant is touched — a genuine subdomain under ``domain`` scope is left
        as it is.
        """
        parsed = _parsed(url)
        if parsed is None or not parsed.hostname:
            return url
        host = parsed.hostname.lower()
        if host == self.seed_host or _host_key(host) != self.host:
            return url
        netloc = f"{self.seed_host}:{parsed.port}" if parsed.port else self.seed_host
        return urlunparse(parsed._replace(netloc=netloc))

    def allows(self, url: str) -> bool:
        """True if ``url`` may be fetched and stored as part of this crawl."""
        if url_scheme(url) not in CRAWLABLE_SCHEMES:
            return False

        parsed = _parsed(url)
        if parsed is None:
            return False
        # No userinfo: pages are never fetched with credentials, and this is what
        # a leftover 'https://mailto:a@example.com/x' from an older crawl looks
        # like ('mailto:a' as user:password) once the scheme has been mangled off.
        if parsed.username or parsed.password:
            return False

        host = parsed.hostname or ""
        if self.mode == SCOPE_DOMAIN:
            # Equality, not a suffix match: 'evilexample.com'.endswith('example.com')
            # would let one plan-limited source fan out across unrelated domains.
            return bool(self.domain) and registrable_domain(host) == self.domain

        if not self.host or _host_key(host) != self.host:
            return False
        if self.mode == SCOPE_HOST:
            return True

        # Path scope: compare on a segment boundary so a '/hc/en' seed keeps
        # '/hc/en/articles/1' but not '/hc/entertainment'.
        path = (parsed.path or "").rstrip("/")
        return path == self.path_prefix or path.startswith(f"{self.path_prefix}/")

    def describe(self) -> str:
        """Short human-readable scope, for crawl logs."""
        if self.mode == SCOPE_DOMAIN:
            return f"domain {self.domain}"
        if self.mode == SCOPE_HOST:
            return f"host {self.host}"
        return f"host {self.host} under {self.path_prefix or '/'}"
