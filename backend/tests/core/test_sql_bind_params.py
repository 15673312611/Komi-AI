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

Codebase-wide guard for a SQL construct that fails only at runtime.

`:param::type` looks like a bound parameter next to a Postgres cast, but
SQLAlchemy's text() bind regex ends with a negative lookahead on ':', so the
parameter is never recognised. The literal ':param' reaches the driver and
Postgres rejects the statement with `syntax error at or near ":"`.

Nothing catches this before production: it compiles, it type-checks, and the
SQLite test database never sees these statements. It broke knowledge link/unlink
in production for five days. Use CAST(:param AS type) instead.
"""

import re
from pathlib import Path

import pytest
from sqlalchemy import text
from sqlalchemy.dialects import postgresql

APP_DIR = Path(__file__).resolve().parents[2] / "app"

# ':name' immediately followed by '::' — the exact construct that silently
# stops being a bind parameter.
_PARAM_THEN_CAST = re.compile(r"(?<![:\w$]):([\w$]+)::")


def _python_sources():
    return sorted(p for p in APP_DIR.rglob("*.py") if "__pycache__" not in p.parts)


def test_no_bind_param_immediately_followed_by_a_cast():
    offenders = []
    for path in _python_sources():
        for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            stripped = line.lstrip()
            # Skip prose: the fix is documented in comments that name the construct.
            if stripped.startswith("#"):
                continue
            for match in _PARAM_THEN_CAST.finditer(line):
                offenders.append(
                    f"{path.relative_to(APP_DIR.parent)}:{lineno} -> :{match.group(1)}:: "
                    f"(use CAST(:{match.group(1)} AS <type>))"
                )

    assert not offenders, "SQL bind parameter swallowed by a '::' cast:\n" + "\n".join(offenders)


@pytest.mark.parametrize(
    "sql,expected",
    [
        ("SELECT :a::jsonb", set()),          # swallowed — the bug
        ("SELECT CAST(:a AS jsonb)", {"a"}),  # bound — the fix
    ],
)
def test_the_guard_describes_real_sqlalchemy_behaviour(sql, expected):
    """Pin the SQLAlchemy behaviour the guard above exists for, so the guard is
    removed deliberately if a future version ever starts parsing ':a::jsonb'.
    """
    compiled = text(sql).compile(dialect=postgresql.dialect())
    assert set(compiled.params) == expected
