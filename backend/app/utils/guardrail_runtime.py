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
from app.repositories.guardrail_event import record_guardrail_event
from app.utils.guardrails import detect_injection

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


@dataclass(frozen=True)
class InboundVerdict:
    rule_ids: Tuple[str, ...] = ()
    block: bool = False
    matched: Tuple[str, ...] = ()

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
    rule: str,
    action: str,
    ctx=None,
    session_id: Optional[str] = None,
    matched: Optional[List[str]] = None,
    text: Optional[str] = None,
) -> None:
    """Log line first (always), then best-effort DB row."""
    org_id = getattr(ctx, "org_id", None)
    agent_id = getattr(ctx, "agent_id", None)
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
    record_guardrail_event(
        surface=surface,
        layer=layer,
        rule=rule,
        action=action,
        org_id=org_id,
        agent_id=agent_id,
        session_id=session_id,
        matched=matched,
        char_len=len(text) if text else None,
        excerpt=excerpt,
    )


def _should_block(rule_ids: Tuple[str, ...]) -> bool:
    mode = (getattr(settings, "GUARDRAIL_INBOUND_ACTION", "template_only") or "off").lower()
    if mode == "strict":
        return bool(rule_ids)
    if mode == "template_only":
        return "injection.frame_tokens" in rule_ids
    return False


def check_inbound(
    text: Optional[str],
    ctx=None,
    surface: str = "widget",
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
        if not result.triggered:
            return InboundVerdict()
        block = allow_block and _should_block(result.rule_ids)
        for rule_id in result.rule_ids:
            _record(
                surface=surface,
                layer="inbound",
                rule=rule_id,
                action="blocked" if block else "counted",
                ctx=ctx,
                session_id=session_id,
                matched=list(result.matched),
                text=text,
            )
        return InboundVerdict(rule_ids=result.rule_ids, block=block, matched=result.matched)
    except Exception as e:
        logger.error(f"Inbound guardrail check failed open: {e}")
        return InboundVerdict()


def check_output(
    message: Optional[str],
    ctx=None,
    surface: str = "widget",
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
                rule="injection.prompt_leak",
                action="replaced",
                ctx=ctx,
                session_id=session_id,
                text=message,
            )
            return LEAK_REPLY, ["injection.prompt_leak"]
        if looks_like_scope_refusal(message):
            _record(
                surface=surface,
                layer="output",
                rule="offtopic.model_refused",
                action="counted",
                ctx=ctx,
                session_id=session_id,
                text=message,
            )
            return message, ["offtopic.model_refused"]
        return message, []
    except Exception as e:
        logger.error(f"Output guardrail check failed open: {e}")
        return message, []
