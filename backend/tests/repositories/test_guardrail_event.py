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
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest

from app.models.guardrail_event import GuardrailEvent
from app.repositories.guardrail_event import (
    GuardrailEventRepository,
    record_guardrail_events,
)


@pytest.fixture
def patched_session(db):
    """record_guardrail_event opens its own SessionLocal — point it at the
    test session."""
    with patch("app.repositories.guardrail_event.SessionLocal") as mock_sl:
        mock_sl.return_value.__enter__.return_value = db
        mock_sl.return_value.__exit__.return_value = False
        yield db


def _add_event(db, rule="injection.frame_tokens", created_at=None, org_id=None):
    event = GuardrailEvent(
        organization_id=org_id,
        surface="widget",
        layer="inbound",
        rule=rule,
        action="counted",
    )
    if created_at is not None:
        event.created_at = created_at
    db.add(event)
    db.commit()
    return event


class TestRecord:
    def test_record_persists_event(self, patched_session):
        record_guardrail_events(
            rules=["injection.override_instructions"],
            surface="widget",
            layer="inbound",
            action="counted",
            score=1.0,
            char_len=42,
        )
        rows = patched_session.query(GuardrailEvent).all()
        assert len(rows) == 1
        assert rows[0].rule == "injection.override_instructions"
        assert rows[0].action == "counted"
        assert rows[0].char_len == 42

    def test_record_never_raises(self):
        with patch(
            "app.repositories.guardrail_event.SessionLocal",
            side_effect=RuntimeError("db down"),
        ):
            # Must swallow: a failed event write cannot affect the reply.
            record_guardrail_events(
                rules=["x"], surface="widget", layer="inbound", action="counted"
            )

    def test_matched_holds_rule_ids_only(self, patched_session):
        # matched is plain JSON while excerpt is encrypted, so the matched
        # SUBSTRING (the visitor's own words) must never land here.
        record_guardrail_events(
            rules=["injection.frame_tokens", "injection.role_hijack"],
            surface="widget",
            layer="inbound",
            action="blocked",
        )
        rows = patched_session.query(GuardrailEvent).all()
        assert len(rows) == 2, "one row per triggered rule"
        for row in rows:
            assert json.dumps(row.matched) == json.dumps(
                ["injection.frame_tokens", "injection.role_hijack"]
            )

    def test_multiple_rules_share_one_session(self, patched_session):
        record_guardrail_events(
            rules=["a", "b", "c"], surface="widget", layer="inbound", action="counted"
        )
        assert patched_session.query(GuardrailEvent).count() == 3

    def test_empty_rules_writes_nothing(self, patched_session):
        record_guardrail_events(
            rules=[], surface="widget", layer="inbound", action="counted"
        )
        assert patched_session.query(GuardrailEvent).count() == 0

    def test_excerpt_nullable(self, patched_session):
        record_guardrail_events(
            rules=["x"], surface="help_center", layer="inbound", action="counted"
        )
        assert patched_session.query(GuardrailEvent).one().excerpt is None


class TestCountsByRule:
    def test_aggregates_per_rule_in_window(self, db):
        now = datetime.now(timezone.utc)
        _add_event(db, rule="injection.frame_tokens", created_at=now)
        _add_event(db, rule="injection.frame_tokens", created_at=now)
        _add_event(db, rule="offtopic.model_refused", created_at=now)
        # Outside the window on both sides.
        _add_event(db, rule="injection.frame_tokens", created_at=now - timedelta(days=10))
        _add_event(db, rule="injection.frame_tokens", created_at=now + timedelta(days=10))

        counts = GuardrailEventRepository(db).counts_by_rule(
            start=now - timedelta(days=1), end=now + timedelta(days=1)
        )
        assert counts == {
            "injection.frame_tokens": 2,
            "offtopic.model_refused": 1,
        }

    def test_org_filter(self, db, test_organization):
        now = datetime.now(timezone.utc)
        _add_event(db, created_at=now, org_id=test_organization.id)
        _add_event(db, created_at=now, org_id=None)
        counts = GuardrailEventRepository(db).counts_by_rule(
            start=now - timedelta(days=1),
            end=now + timedelta(days=1),
            organization_id=test_organization.id,
        )
        assert counts == {"injection.frame_tokens": 1}


class TestReview:
    def test_mark_false_positive(self, db):
        event = _add_event(db)
        assert event.reviewed is False
        updated = GuardrailEventRepository(db).mark_false_positive(event.id)
        assert updated.reviewed is True
        assert updated.false_positive is True

    def test_mark_false_positive_missing_event(self, db):
        import uuid

        assert GuardrailEventRepository(db).mark_false_positive(uuid.uuid4()) is None
