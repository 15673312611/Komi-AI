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

Runtime enforcement for the global chat guardrails.

Two checks around every LLM call on visitor text:
- check_inbound: strong-signal injection detection BEFORE inference. Blocking
  is governed by GUARDRAIL_INBOUND_ACTION ("off" / "template_only" / "strict");
  non-blocking hits are still counted, which is the data that gates ever
  turning "strict" on.
- check_output: scans the reply for leaked policy text (replace + record) and
  for the model's own scope refusal (record only) — the only place scope
  declines become measurable, since chat messages are encrypted at rest.

Every entry point here FAILS OPEN: a guardrail bug must degrade to
"no guardrail", never to "no chat".
"""

from dataclasses import dataclass, field
from typing import List, Optional, Tuple

from app.agents.guardrail_policy import CANARY_STRINGS, looks_like_scope_refusal
from app.core.config import settings
from app.core.logger import get_logger
from app.repositories.guardrail_event import record_guardrail_events
from app.utils.guardrails import (
    RULE_FRAME_TOKENS,
    RULE_OFFTOPIC_EXERCISE,
    detect_injection,
    detect_offtopic_exercise,
)

logger = get_logger(__name__)

# What the visitor sees when a message is blocked pre-inference.
BLOCK_REPLY = (
    "I can't process that message. If you have a question I can help with, "
    "just ask it in plain words."
)

# What replaces a reply that leaked policy text.
LEAK_REPLY = (
    "I can't share details about how I'm set up. Is there something else I "
    "can help you with?"
)

_EXCERPT_MAX = 300

# Output-side rule ids (the inbound ones live with their patterns in guardrails).
RULE_PROMPT_LEAK = "injection.prompt_leak"
RULE_MODEL_REFUSED = "offtopic.model_refused"


class Surface:
    """Where a guardrail event came from — the values stored in
    guardrail_events.surface."""

    WIDGET = "widget"
    CHANNEL = "channel"
    WORKFLOW = "workflow"
    HELP_CENTER = "help_center"


def offtopic_reply(org_name: Optional[str]) -> str:
    """The scope decline, used when an exercise brief is stopped in code. Says
    the same thing the policy asks the model to say, so a visitor cannot tell
    which layer answered."""
    who = (org_name or "").strip() or "this business"
    return (
        f"I can only help with questions about {who}. "
        f"What can I help you with?"
    )


@dataclass(frozen=True)
class InboundVerdict:
    rule_ids: Tuple[str, ...] = ()
    block: bool = False
    matched: Tuple[str, ...] = ()
    reply: str = BLOCK_REPLY

    @property
    def triggered(self) -> bool:
        return bool(self.rule_ids)

    def as_attributes(self) -> dict:
        """chat_history.attributes payload — rule ids only, the column is
        unencrypted plain JSON."""
        if not self.triggered:
            return {}
        return {
            "guardrail": {
                "rules": list(self.rule_ids),
                "action": "blocked" if self.block else "counted",
            }
        }


def _record(
    *,
    surface: str,
    layer: str,
    rules: Tuple[str, ...],
    action: str,
    ctx=None,
    session_id: Optional[str] = None,
    text: Optional[str] = None,
) -> None:
    """Log line first (always), then one best-effort write for all rules.

    `matched` carries the rule ids only. The matched substring would be the
    visitor's own words, and this column is plain JSON while `excerpt` is
    encrypted — reviewable text belongs there, not here.
    """
    org_id = getattr(ctx, "org_id", None)
    agent_id = getattr(ctx, "agent_id", None)
    for rule in rules:
        logger.warning(
            f"GUARDRAIL_EVENT rule={rule} layer={layer} action={action} "
            f"surface={surface} org={org_id} agent={agent_id} "
            f"session={session_id} len={len(text) if text else 0}"
        )
    if not getattr(settings, "GUARDRAIL_EVENTS_ENABLED", True):
        return
    excerpt = None
    if text and getattr(settings, "GUARDRAIL_STORE_EXCERPT", True):
        excerpt = text[:_EXCERPT_MAX]
    # One session for the whole verdict: an attack tripping several rules used
    # to open a connection per rule.
    record_guardrail_events(
        rules=rules,
        surface=surface,
        layer=layer,
        action=action,
        org_id=org_id,
        agent_id=agent_id,
        session_id=session_id,
        char_len=len(text) if text else None,
        excerpt=excerpt,
    )


def _business_terms(ctx) -> Tuple[str, ...]:
    """Org name and the domain's own label — a message naming either is about
    the business, whatever else it contains."""
    terms = []
    for attr in ("org_name", "domain"):
        value = getattr(ctx, attr, None)
        if isinstance(value, str) and value.strip():
            terms.append(value.strip())
            if attr == "domain" and "." in value:
                terms.append(value.split(".", 1)[0])
    return tuple(terms)


def _default_scope_in_force(ctx) -> bool:
    """True only when the agent runs the shipped scope rule unmodified."""
    try:
        if not getattr(ctx, "guardrail_enabled", True):
            return False
        custom = getattr(ctx, "guardrail_prompt", None)
        return not (isinstance(custom, str) and custom.strip())
    except Exception:
        return True


def _should_block(rule_ids: Tuple[str, ...]) -> bool:
    mode = (getattr(settings, "GUARDRAIL_INBOUND_ACTION", "template_only") or "off").lower()
    if mode == "strict":
        return bool(rule_ids)
    if mode == "template_only":
        return RULE_FRAME_TOKENS in rule_ids
    return False


def check_inbound(
    text: Optional[str],
    ctx=None,
    surface: str = Surface.WIDGET,
    session_id: Optional[str] = None,
    allow_block: bool = True,
) -> InboundVerdict:
    """Pre-LLM injection check on a visitor message.

    `allow_block=False` forces count-only regardless of mode — used on paths
    that must never short-circuit (the workflow LLM node owns its own control
    flow and message storage).
    """
    try:
        result = detect_injection(text or "")
        rules = list(result.rule_ids)
        block = allow_block and _should_block(result.rule_ids)
        reply = BLOCK_REPLY

        # Off-topic exercise briefs: prompt text could not hold these, so they
        # are stopped here — which also avoids paying for the inference the
        # whole change exists to prevent.
        #
        # Only when the tenant is running the DEFAULT scope rule. The detector
        # encodes our default's assumptions (an algorithms brief is off-topic),
        # which is wrong for a coding bootcamp or a maths tutor — and blocking
        # pre-inference gives the model no chance to disagree. If they switched
        # the rule off or wrote their own, this must not fire, or the dashboard
        # would say one thing and the code do another.
        if _default_scope_in_force(ctx) and detect_offtopic_exercise(
            text or "", _business_terms(ctx)
        ):
            rules.append(RULE_OFFTOPIC_EXERCISE)
            mode = (getattr(settings, "GUARDRAIL_OFFTOPIC_ACTION", "block") or "off").lower()
            if allow_block and mode == "block":
                block = True
                reply = offtopic_reply(getattr(ctx, "org_name", None))

        if not rules:
            return InboundVerdict()
        _record(
            surface=surface,
            layer="inbound",
            rules=tuple(rules),
            action="blocked" if block else "counted",
            ctx=ctx,
            session_id=session_id,
            text=text,
        )
        return InboundVerdict(
            rule_ids=tuple(rules), block=block, matched=result.matched, reply=reply
        )
    except Exception as e:
        logger.error(f"Inbound guardrail check failed open: {e}")
        return InboundVerdict()


def check_output(
    message: Optional[str],
    ctx=None,
    surface: str = Surface.WIDGET,
    session_id: Optional[str] = None,
) -> Tuple[Optional[str], List[str]]:
    """Post-LLM output check.

    Returns (possibly replaced message, rule ids recorded). A canary hit —
    policy text leaking into the reply — replaces the message; the model's
    own scope refusal is only counted, never altered.
    """
    try:
        if not message or not getattr(settings, "GUARDRAIL_OUTPUT_CHECK_ENABLED", True):
            return message, []
        if any(canary in message for canary in CANARY_STRINGS):
            _record(
                surface=surface,
                layer="output",
                rules=(RULE_PROMPT_LEAK,),
                action="replaced",
                ctx=ctx,
                session_id=session_id,
                text=message,
            )
            return LEAK_REPLY, [RULE_PROMPT_LEAK]
        if looks_like_scope_refusal(message):
            _record(
                surface=surface,
                layer="output",
                rules=(RULE_MODEL_REFUSED,),
                action="counted",
                ctx=ctx,
                session_id=session_id,
                text=message,
            )
            return message, [RULE_MODEL_REFUSED]
        return message, []
    except Exception as e:
        logger.error(f"Output guardrail check failed open: {e}")
        return message, []
