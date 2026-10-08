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

from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory

BACKEND_DIR = Path(__file__).resolve().parents[1]


def test_migrations_have_a_single_head():
    """Two heads take production down: scripts/start.sh runs `alembic upgrade
    head`, which refuses to choose between them, so the container exits before
    gunicorn binds and restart-loops behind a 502.

    It happens when two branches each add a revision off the same parent — each
    PR is green alone and the branch only exists once both have merged, so
    reviewing either in isolation cannot catch it. This can.

    Fix by re-parenting the unapplied revision onto the other head (linear, no
    merge revision), or with a merge revision when both have already been
    applied somewhere.
    """
    heads = ScriptDirectory.from_config(
        Config(str(BACKEND_DIR / "alembic.ini"))
    ).get_heads()
    assert len(heads) == 1, f"expected one migration head, found: {heads}"
