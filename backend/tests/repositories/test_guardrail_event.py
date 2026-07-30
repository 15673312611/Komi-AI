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

import json
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest

from app.models.guardrail_event import GuardrailEvent
from app.repositories.guardrail_event import (
    GuardrailEventRepository,
    record_guardrail_event,
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
        record_guardrail_event(
            surface="widget",
            layer="inbound",
            rule="injection.override_instructions",
            action="counted",
            score=1.0,
            matched=["ignore all previous instructions"],
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
            record_guardrail_event(
                surface="widget", layer="inbound", rule="x", action="counted"
            )

    def test_matched_never_contains_full_input(self, patched_session):
        # The runtime layer passes short match tokens, not the message; the
        # repo stores exactly what it is given, so hand it tokens and assert
        # the row holds only those.
        record_guardrail_event(
            surface="widget",
            layer="inbound",
            rule="injection.frame_tokens",
            action="blocked",
            matched=["<|im_start|>"],
        )
        row = patched_session.query(GuardrailEvent).one()
        assert json.dumps(row.matched) == json.dumps(["<|im_start|>"])

    def test_excerpt_nullable(self, patched_session):
        record_guardrail_event(
            surface="help_center", layer="inbound", rule="x", action="counted"
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
