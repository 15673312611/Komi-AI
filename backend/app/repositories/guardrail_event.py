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

from datetime import datetime
from typing import Dict, Optional, Sequence
from uuid import UUID

from sqlalchemy import func

from app.core.logger import get_logger
from app.database import SessionLocal
from app.models.guardrail_event import GuardrailEvent

logger = get_logger(__name__)


def record_guardrail_events(
    *,
    rules: Sequence[str],
    surface: str,
    layer: str,
    action: str,
    org_id: Optional[str] = None,
    agent_id: Optional[str] = None,
    session_id: Optional[str] = None,
    score: Optional[float] = None,
    char_len: Optional[int] = None,
    excerpt: Optional[str] = None,
) -> None:
    """Best-effort insert of one row per triggered rule, in a single session.

    Opens its OWN session: callers may hold no session at all (the workflow
    LLM path), and a guardrail write must never poison a caller's transaction.
    Swallows every exception — an event that fails to record must not affect
    the reply.

    `matched` stores the rule ids that fired together, never the matched text:
    that text is the visitor's own words and this column is unencrypted, so
    reviewable content belongs in `excerpt` instead.
    """
    if not rules:
        return
    try:
        with SessionLocal() as db:
            for rule in rules:
                db.add(
                    GuardrailEvent(
                        organization_id=org_id,
                        agent_id=agent_id,
                        session_id=session_id,
                        surface=surface,
                        layer=layer,
                        rule=rule,
                        action=action,
                        score=score,
                        matched=list(rules),
                        char_len=char_len,
                        excerpt=excerpt,
                    )
                )
            db.commit()
    except Exception as e:
        logger.error(f"Failed to record guardrail events {list(rules)}/{action}: {e}")


class GuardrailEventRepository:
    """Query/review side, used by analysis and tests."""

    def __init__(self, db):
        self.db = db

    def counts_by_rule(
        self,
        start: datetime,
        end: datetime,
        organization_id: Optional[UUID] = None,
    ) -> Dict[str, int]:
        """Events per rule id in the half-open window [start, end)."""
        query = (
            self.db.query(GuardrailEvent.rule, func.count(GuardrailEvent.id))
            .filter(GuardrailEvent.created_at >= start)
            .filter(GuardrailEvent.created_at < end)
        )
        if organization_id is not None:
            query = query.filter(GuardrailEvent.organization_id == organization_id)
        return dict(query.group_by(GuardrailEvent.rule).all())

    def mark_false_positive(self, event_id: UUID) -> Optional[GuardrailEvent]:
        """Sole writer of the review flags: marks an event reviewed AND a
        false positive (the precision gate for strict mode)."""
        event = self.db.query(GuardrailEvent).filter(GuardrailEvent.id == event_id).first()
        if not event:
            return None
        event.reviewed = True
        event.false_positive = True
        self.db.commit()
        self.db.refresh(event)
        return event
