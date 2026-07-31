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

The agent's real work still works with the guardrail policy in front of it.

The policy block is prepended to every system prompt and the operator's own
instructions are fenced below it, so the plausible failure is subtle: the model
follows the policy and stops doing its job — never searching the knowledge base,
never handing off, never collecting a lead, never raising a ticket. These
scenarios assert the structured output the widget actually consumes.
"""

import pytest

from app.agents.guardrail_policy import looks_like_scope_refusal

pytestmark = pytest.mark.asyncio

# Grounded product questions — each should pull from the knowledge base.
KB_QUESTIONS = [
    "What does your product do?",
    "What pricing plans do you offer?",
    "Which messaging channels do you support?",
    "How do I install the chat widget on my website?",
    "Can I connect it to my own OpenAI key?",
]


class TestKnowledgeBase:
    async def test_answers_from_the_knowledge_base_with_citations(
        self, conversation, agent_has_knowledge
    ):
        """Product questions must come back grounded in the knowledge base.

        Citation per-question is not guaranteed (the model decides when to
        search), so the assertion is over the set: if almost nothing cites
        anything, retrieval is broken or the policy is suppressing tool use.
        """
        if not agent_has_knowledge:
            pytest.skip("no knowledge linked to this agent — nothing to retrieve")
        chat = await conversation()
        cited = 0
        for question in KB_QUESTIONS:
            response = await chat.say(question)
            assert not looks_like_scope_refusal(response.message), (
                f"a product question was refused as off-topic:\n{response.message}"
            )
            assert len(response.message or "") > 60, (
                f"suspiciously thin answer to {question!r}:\n{response.message}"
            )
            if response.sources:
                cited += 1
        assert cited >= 2, (
            f"only {cited} of {len(KB_QUESTIONS)} questions produced knowledge-base "
            "citations — retrieval is barely being used"
        )

    @pytest.mark.parametrize("question", [
        # Phrasings a real visitor actually uses, and the ones a scope guard is
        # most likely to mishandle: terse, commercial, or naming a competitor.
        "how do i get started",
        "is there a free trial?",
        "how are you different from Intercom?",
        "where is my data stored, and is it encrypted?",
        "what happens when the AI can't answer something?",
    ])
    async def test_varied_real_world_questions_are_answered(
        self, conversation, question
    ):
        """Breadth check: each is legitimately about the business, so each must
        get a real answer — no scope refusal, no one-line brush-off."""
        chat = await conversation()
        reply = (await chat.say(question)).message
        assert not looks_like_scope_refusal(reply), (
            f"{question!r} was refused as off-topic:\n{reply}"
        )
        assert len(reply or "") > 60, f"brush-off answer to {question!r}:\n{reply}"

    async def test_product_questions_are_in_scope_even_when_org_name_is_generic(
        self, conversation, live_org
    ):
        """The zero-config scope line is built from the organization name. When
        that name says nothing about the business (a trial org, an internal
        tenant), product questions must still be answered rather than refused
        for not matching the name."""
        chat = await conversation()
        reply = (await chat.say("Can I self-host this? What do I need to run it?")).message
        assert not looks_like_scope_refusal(reply), (
            f"self-hosting question refused for org {live_org['name']!r}:\n{reply}"
        )


class TestTransferToHuman:
    async def test_asks_for_a_human(self, conversation, transfer_agent_id):
        """Either a real handoff or the out-of-hours fallback is correct — what
        must not happen is the model ignoring the request or refusing it as
        off-topic."""
        chat = await conversation(agent_id=transfer_agent_id)
        response = await chat.say(
            "This is really frustrating and you're not helping. "
            "I want to speak to a human agent right now."
        )
        assert not looks_like_scope_refusal(response.message)
        handled = (
            response.transfer_to_human
            or response.request_contact
            or response.create_ticket
        )
        assert handled, (
            "handoff request produced no transfer, contact request or ticket:\n"
            f"{response.message}"
        )


class TestLeadCapture:
    async def test_collects_and_persists_a_lead(self, conversation, live_org):
        """Runs the widget's own persistence call so the whole path is covered,
        not just the model's structured output."""
        from app.database import SessionLocal
        from app.services.lead_capture import record_lead_from_response

        with SessionLocal() as db:
            from sqlalchemy import text
            enabled = db.execute(text(
                "select coalesce(enabled, false) from lead_capture_configs "
                "where agent_id = :a"
            ), {"a": live_org["agent_id"]}).scalar()
        if not enabled:
            pytest.skip("lead capture is not enabled on this agent")

        chat = await conversation()
        await chat.say(
            "Hi, I run a mid-size support team and I'd like someone to contact me "
            "about enterprise pricing."
        )
        response = await chat.say(
            "I'm Priya Sharma, priya.sharma@acmesupport.example.com, company Acme Support, "
            "phone +44 7700 900123. Yes, you have my consent to contact me."
        )

        assert response.request_lead_capture, (
            f"details were given but no lead was reported:\n{response.message}"
        )
        assert response.lead_email == "priya.sharma@acmesupport.example.com"

        with SessionLocal() as db:
            record = record_lead_from_response(
                db, response,
                organization_id=chat.org_id,
                agent_id=chat.agent_id,
                customer_id=chat.customer_id,
                session_id=str(chat.session_id),
                page_url=None,
            )
        assert record is not None, "record_lead_from_response refused a complete lead"
        assert record.field_values.get("email") == "priya.sharma@acmesupport.example.com"
        assert record.consent is True


class TestTicketing:
    async def test_raises_a_ticket_for_an_unresolvable_issue(
        self, conversation, agent_flags
    ):
        if not agent_flags["ticketing"]:
            pytest.skip("ticketing is not enabled on this agent")

        chat = await conversation()
        response = await chat.say(
            "My account is completely locked out. I've tried resetting twice and the "
            "reset email never arrives. I need someone on your side to fix it — "
            "it's been broken for two days. My email is dan.locked@example.com."
        )
        assert not looks_like_scope_refusal(response.message)
        assert response.create_ticket or response.ticket_id, (
            f"an unresolvable account issue raised no ticket:\n{response.message}"
        )

        if response.ticket_id:
            from sqlalchemy import text
            from app.database import SessionLocal
            # Look the ticket up through ticket_sessions: the toolkit attaches
            # the ticket to a customer resolved from the email in the message,
            # not to this session's anonymous visitor row.
            with SessionLocal() as db:
                row = db.execute(text(
                    "select t.ticket_number, t.title, t.status from tickets t "
                    "join ticket_sessions ts on ts.ticket_id = t.id "
                    "where ts.session_id = :s"
                ), {"s": str(chat.session_id)}).first()
            assert row, (
                f"ticket_id {response.ticket_id} was returned but no ticket is "
                "linked to this session"
            )
