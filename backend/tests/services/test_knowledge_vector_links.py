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

import json
from unittest.mock import MagicMock
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.dialects import postgresql

from app.services import knowledge_vector_links as kvl


def _knowledge(source="https://example.com"):
    k = MagicMock()
    k.source = source
    k.schema = "ai"
    k.table_name = "d_00000000-0000-0000-0000-000000000000"
    k.organization_id = uuid4()
    return k


def _db_returning(filters):
    """A db whose SELECT yields one row with the given filters."""
    db = MagicMock()
    row = MagicMock()
    row.filters = filters
    db.execute.return_value.first.return_value = row
    return db


def test_update_sql_binds_every_parameter():
    """The regression: ':param::jsonb' is not parsed as a bind parameter.

    SQLAlchemy's text() bind regex has a negative lookahead on ':', so a
    parameter immediately followed by the '::' cast operator is left in the
    string verbatim and reaches psycopg as a literal ':new_filters', which
    Postgres rejects with `syntax error at or near ":"`. CAST(... AS jsonb)
    avoids the adjacency.
    """
    sql = kvl._UPDATE_SQL.format(schema="ai", table="d_x")
    compiled = text(sql).compile(dialect=postgresql.dialect())

    assert set(compiled.params) == {"new_filters", "agent_ids", "has_agents", "source"}
    # Nothing left for the driver to choke on.
    assert ":new_filters" not in str(compiled)
    assert ":agent_ids" not in str(compiled)


def test_update_sql_uses_no_double_colon_cast():
    """Guard the specific construct, so it cannot be reintroduced."""
    assert "::" not in kvl._UPDATE_SQL


def test_add_agent_preserves_existing_agents():
    """Linking a second agent must not evict the first.

    The old code did `agent_ids = [new]` whenever the id was already present or
    the value was not a list, which wiped every other agent from the source.
    """
    db = _db_returning({"agent_id": ["aaa", "bbb"]})
    new_agent = uuid4()

    kvl.add_agent(db, _knowledge(), new_agent)

    params = db.execute.call_args.args[1]
    assert json.loads(params["agent_ids"]) == sorted(["aaa", "bbb", str(new_agent)])


def test_add_agent_is_idempotent():
    """Re-adding an already-present agent is a no-op, not a reset."""
    existing = uuid4()
    db = _db_returning({"agent_id": [str(existing), "other"]})

    kvl.add_agent(db, _knowledge(), existing)

    params = db.execute.call_args.args[1]
    assert json.loads(params["agent_ids"]) == sorted([str(existing), "other"])


def test_remove_agent_keeps_the_others():
    keep, drop = str(uuid4()), uuid4()
    db = _db_returning({"agent_id": [keep, str(drop)]})

    kvl.remove_agent(db, _knowledge(), drop)

    params = db.execute.call_args.args[1]
    assert json.loads(params["agent_ids"]) == [keep]
    assert params["has_agents"] is True


def test_remove_last_agent_yields_empty_list():
    only = uuid4()
    db = _db_returning({"agent_id": [str(only)]})

    kvl.remove_agent(db, _knowledge(), only)

    params = db.execute.call_args.args[1]
    assert json.loads(params["agent_ids"]) == []
    assert params["has_agents"] is False


def test_filters_payload_carries_source_and_org():
    db = _db_returning({"agent_id": []})
    knowledge = _knowledge("https://docs.example.com")
    agent = uuid4()

    kvl.add_agent(db, knowledge, agent)

    filters = json.loads(db.execute.call_args.args[1]["new_filters"])
    assert filters["name"] == "https://docs.example.com"
    assert filters["org_id"] == str(knowledge.organization_id)
    assert filters["agent_id"] == [str(agent)]


def test_source_is_bound_never_interpolated():
    """A quote in the title must not be able to break out of the statement."""
    db = _db_returning({"agent_id": []})
    knowledge = _knowledge("it's \"quoted\"; DROP TABLE x;--")

    kvl.add_agent(db, knowledge, uuid4())

    sql, params = db.execute.call_args.args
    assert params["source"] == "it's \"quoted\"; DROP TABLE x;--"
    assert "DROP TABLE" not in str(sql)


def test_no_vector_rows_is_a_no_op():
    """A source whose chunks are not written yet must not be updated."""
    db = MagicMock()
    db.execute.return_value.first.return_value = None

    kvl.add_agent(db, _knowledge(), uuid4())

    # Only the SELECT ran; no UPDATE was issued.
    assert db.execute.call_count == 1


def test_missing_table_metadata_is_a_no_op():
    db = MagicMock()
    knowledge = _knowledge()
    knowledge.table_name = None

    kvl.add_agent(db, knowledge, uuid4())

    db.execute.assert_not_called()


def test_non_list_agent_filter_is_normalised():
    """Corrupt/legacy JSON must not propagate a bad type into the rewrite."""
    db = _db_returning({"agent_id": "not-a-list"})
    agent = uuid4()

    kvl.add_agent(db, _knowledge(), agent)

    params = db.execute.call_args.args[1]
    assert json.loads(params["agent_ids"]) == [str(agent)]
