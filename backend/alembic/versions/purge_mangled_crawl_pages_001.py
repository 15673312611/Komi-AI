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

"""delete crawl pages that were never pages (mangled mailto: URLs)

Revision ID: purge_mangled_crawl_pages_001
Revises: merge_hc_url_path_001
Create Date: 2026-08-12

The website crawler followed `mailto:` hrefs: urljoin left them intact and
_normalize_url prefixed them, so `mailto:a@example.com` became
`https://mailto:a@example.com` — a URL whose host really is `example.com` (with
`mailto:a` as userinfo), which passed the same-domain check, was fetched (the
server ignores the credentials and serves the site root) and was stored as a
knowledge page. Its body then produced more of them: `https://mailto:a@example.com/pricing`.

The crawler no longer produces these (app/knowledge/crawl_scope.py); this
removes the ones already stored, so they stop being retrieved as answers and
stop feeding FAQ generation.

Deliberately narrow. Only chunk rows are deleted whose page id is
  * an http(s) URL carrying userinfo (`https://<something>@host/...`), which a
    crawl never legitimately produces, or
  * a non-HTTP scheme (`mailto:`, `tel:`, …), which is not a page at all,
and only under a WEBSITE source. Everything else stays: PDF chunks keyed by
UUID, text pages keyed by their title (including text pages added under a
website source), and every real crawled URL — off-target ones included. Pages
that are real content but outside the new default crawl scope (a marketing site
picked up from a help-center seed) are NOT touched here: they were crawled by
design, deleting them is a judgement call per source, and
backend/scripts/prune_offsite_pages.py does that opt-in with a dry run.

Vector tables are per-organisation and named in the `knowledge` rows, so the
loop reads them from there rather than guessing. Tables listed but missing are
skipped, and re-running deletes nothing.
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'purge_mangled_crawl_pages_001'
down_revision = 'merge_hc_url_path_001'
branch_labels = None
depends_on = None

# A page id that is not a page: userinfo before the first path segment, or a
# scheme that is not http(s). Anchored, so a '/@handle' path does not match.
_USERINFO_PATTERN = '^https?://[^/]*@'
_NON_HTTP_SCHEME_PATTERN = '^(mailto|tel|sms|javascript|data|ftp):'


def upgrade() -> None:
    op.execute(
        f"""
        DO $$
        DECLARE
            r record;
            removed bigint;
            total bigint := 0;
        BEGIN
            FOR r IN
                SELECT DISTINCT schema AS sch, table_name AS tbl
                  FROM knowledge
                 WHERE schema IS NOT NULL AND table_name IS NOT NULL
            LOOP
                BEGIN
                    -- %L quotes each pattern, so the regexes need no escaping.
                    EXECUTE format(
                        'DELETE FROM %I.%I v WHERE (v.id ~ %L OR v.id ~* %L) '
                        'AND v.name IN (SELECT source FROM knowledge '
                        'WHERE source_type = %L)',
                        r.sch, r.tbl,
                        '{_USERINFO_PATTERN}', '{_NON_HTTP_SCHEME_PATTERN}', 'WEBSITE'
                    );
                    GET DIAGNOSTICS removed = ROW_COUNT;
                    total := total + removed;
                EXCEPTION
                    WHEN undefined_table OR invalid_schema_name OR undefined_column THEN
                        CONTINUE;
                END;
            END LOOP;
            RAISE NOTICE 'Removed % mangled crawl page chunk(s)', total;
        END $$;
        """
    )


def downgrade() -> None:
    """No-op: the deleted rows were crawl artefacts of a bug, and their content
    (a site's root page stored under a bogus URL) cannot be reconstructed. A
    re-crawl repopulates whatever the source should legitimately contain."""
