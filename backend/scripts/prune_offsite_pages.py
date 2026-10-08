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

Opt-in cleanup: drop stored pages that fall outside a website source's crawl scope.

Crawls used to be bounded by the registrable domain, so a source seeded at
help.example.com also stored www.example.com, example.com/blog/* and every other
subdomain. New crawls stay on the seed's host (app/knowledge/crawl_scope.py);
this prunes what earlier crawls already stored.

Unlike the mangled-mailto purge (alembic purge_mangled_crawl_pages_001, which runs
automatically because those rows are provably junk), these pages are REAL content
someone may be relying on. So this is a manual, per-source decision: it reports by
default and only deletes with --apply.

Run it on the HOST, not inside the backend container — importing the `app` package
pulls in the FastAPI app and the ML stack, and has OOM'd production before. Nothing
here imports it; the scope rules mirror app/knowledge/crawl_scope.py in ~20 lines of
stdlib.

    DATABASE_URL=postgresql://... python backend/scripts/prune_offsite_pages.py
    DATABASE_URL=postgresql://... python backend/scripts/prune_offsite_pages.py \
        --source https://help.example.com --scope path --apply

Re-running is a no-op once a source is clean. Deleting a page removes it from the
agent's retrieval immediately; FAQs already generated from it are NOT removed —
generated FAQs record only their source, not the page they came from, so review
them in the dashboard afterwards.
"""

import argparse
import os
import re
import sys
from collections import defaultdict
from urllib.parse import urlparse

import psycopg
from psycopg import sql

DESCRIPTION = "Report (and optionally delete) stored pages outside a website source's crawl scope"

# Mirrors PAGE_ID_EXPR in app/knowledge/page_editor.py: a chunk id is the page id
# with an optional _<number> suffix. Only a numeric suffix is stripped, so a page
# named 'getting_started' stays whole.
_CHUNK_SUFFIX = re.compile(r"_[0-9]+$")

SCOPE_HOST = "host"
SCOPE_PATH = "path"


def page_id_of(chunk_id: str) -> str:
    return _CHUNK_SUFFIX.sub("", chunk_id)


def host_key(host: str) -> str:
    """www-insensitive host identity, as the crawler compares hosts."""
    host = (host or "").lower().strip().rstrip(".")
    return host[4:] if host.startswith("www.") else host


def in_scope(page_url: str, seed: str, scope: str) -> bool:
    """True if ``page_url`` is inside the seed URL's scope.

    Anything that is not an http(s) URL — a text page added under a website
    source, a PDF chunk keyed by UUID — is left alone: it is not a crawled page,
    so it is not this script's business.
    """
    try:
        page = urlparse(page_url)
        root = urlparse(seed)
    except ValueError:
        return True
    if page.scheme not in ("http", "https"):
        return True
    # A URL with userinfo is a mangled mailto: link, not a page. The migration
    # purge_mangled_crawl_pages_001 removes these; catch them here too so the
    # script gives the same answer when it runs before that migration.
    if page.username or page.password:
        return False
    if host_key(page.hostname or "") != host_key(root.hostname or ""):
        return False
    if scope == SCOPE_HOST:
        return True
    prefix = (root.path or "").rstrip("/")
    path = (page.path or "").rstrip("/")
    return path == prefix or path.startswith(f"{prefix}/")


def website_sources(conn, org=None, source=None):
    query = (
        "SELECT id, organization_id, source, schema, table_name FROM knowledge "
        "WHERE source_type = 'WEBSITE' AND schema IS NOT NULL AND table_name IS NOT NULL"
    )
    params = []
    if org:
        # organization_id is a uuid column; compare as text so a plain --org
        # string doesn't trip 'operator does not exist: uuid = text'.
        query += " AND organization_id::text = %s"
        params.append(org)
    if source:
        query += " AND source LIKE %s"
        params.append(f"%{source}%")
    with conn.cursor() as cur:
        cur.execute(query + " ORDER BY id", params)
        return cur.fetchall()


def _table(schema, table):
    """Quoted, injection-safe table reference. The names come from the knowledge
    rows rather than the caller, but they still identify a table, not a value."""
    return sql.Identifier(schema, table)


def chunk_ids(conn, schema, table, source):
    """Every chunk id stored for one source, or None if the table is gone."""
    with conn.cursor() as cur:
        cur.execute("SELECT to_regclass(%s)", (_table(schema, table).as_string(conn),))
        if cur.fetchone()[0] is None:
            return None
        cur.execute(
            sql.SQL("SELECT id FROM {} WHERE name = %s").format(_table(schema, table)),
            (source,),
        )
        return [row[0] for row in cur.fetchall()]


def delete_chunks(conn, schema, table, source, ids):
    with conn.cursor() as cur:
        cur.execute(
            sql.SQL("DELETE FROM {} WHERE name = %s AND id = ANY(%s)").format(
                _table(schema, table)
            ),
            (source, ids),
        )
        return cur.rowcount


def prune(conn, scope, apply_changes, org, source_filter, samples):
    sources = website_sources(conn, org, source_filter)
    print(f"{len(sources)} website source(s) to inspect (scope: {scope})\n")

    total_pages = total_chunks = touched_sources = 0
    for _id, org_id, source, schema, table in sources:
        ids = chunk_ids(conn, schema, table, source)
        if ids is None:
            print(f"! {source}: vector table {schema}.{table} is missing — skipped")
            continue

        offsite = defaultdict(list)
        for chunk in ids:
            page = page_id_of(chunk)
            if not in_scope(page, source, scope):
                offsite[page].append(chunk)
        if not offsite:
            continue

        touched_sources += 1
        pages = sorted(offsite)
        chunks = [c for page in pages for c in offsite[page]]
        total_pages += len(pages)
        total_chunks += len(chunks)

        kept = len({page_id_of(c) for c in ids}) - len(pages)
        print(f"{source}  (org {org_id})")
        print(f"    {len(pages)} off-scope page(s), {len(chunks)} chunk(s); {kept} page(s) kept")
        for page in pages[:samples]:
            print(f"      - {page}")
        if len(pages) > samples:
            print(f"      … and {len(pages) - samples} more")

        if apply_changes:
            removed = delete_chunks(conn, schema, table, source, chunks)
            conn.commit()
            print(f"    deleted {removed} chunk(s)")
        print()

    verb = "Deleted" if apply_changes else "Would delete"
    print(f"{verb} {total_pages} page(s) / {total_chunks} chunk(s) across {touched_sources} source(s)")
    if not apply_changes and total_pages:
        print("Dry run — re-run with --apply to delete.")


def main() -> int:
    parser = argparse.ArgumentParser(description=DESCRIPTION)
    parser.add_argument(
        "--scope",
        choices=(SCOPE_HOST, SCOPE_PATH),
        default=SCOPE_HOST,
        help="host: keep pages on the source URL's host (default). "
             "path: also require the source URL's path prefix.",
    )
    parser.add_argument("--apply", action="store_true", help="actually delete (default: report only)")
    parser.add_argument("--org", help="limit to one organization id")
    parser.add_argument("--source", help="limit to sources whose URL contains this string")
    parser.add_argument("--samples", type=int, default=10, help="off-scope URLs to list per source")
    args = parser.parse_args()

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL is required", file=sys.stderr)
        return 2

    with psycopg.connect(database_url) as conn:
        prune(conn, args.scope, args.apply, args.org, args.source, args.samples)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
