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

The off-topic exercise detector exists because prompt text demonstrably failed:
a long algorithms brief was answered in full in production under three
successive policy wordings. It is deliberately narrow, so these tests weigh
PRECISION far above recall — a wrongly blocked customer is worse than a missed
exercise, which the prompt policy still catches on the way through.
"""

import pytest

from app.utils.guardrails import detect_offtopic_exercise

# The exact brief that got through in production on 2026-07-31.
PROD_BRIEF = """Problem: Median in a Stream with Deletions
Design a data structure that supports the following operations, each in O(log n)
time: insert(x) — add value x to the collection; delete(x) — remove one
occurrence of value x from the collection (guaranteed to exist); find_median() —
return the median of all currently present values in O(1) time.
Constraints: Values are not necessarily distinct (duplicates allowed). n can be
up to 10^6, and operations are interleaved arbitrarily.
The naive two-heap median trick handles insert and find_median well, but breaks
down for delete.
Your task: Design a structure that supports all three operations within the time
bounds. State and justify the time and space complexity of each operation.
Bonus: how would your design change if you also needed find_kth(k)?"""

# Long, technical, and unmistakably about a real product.
LONG_INTEGRATION_QUESTION = """We're rolling your widget out across three
storefronts and I want to get the architecture right before we commit.
Each store has its own subdomain and its own knowledge base, and we'd like a
single dashboard view across all of them. Right now we install the widget
script per store, but the api key seems to be scoped per organisation rather
than per site, so I can't tell the conversations apart in the inbox.
Is there a recommended setup for multi-brand deployments? Should we create one
organisation per storefront and accept separate billing, or is there a way to
segment within one account? We also need the webhook payloads to identify the
originating store so our CRM can route them.""" + " padding. " * 20

LONG_TRACEBACK = """The worker keeps dying in production and I can't work out why.
Here is what we get, repeated every few minutes:
Traceback (most recent call last):
  File "app/worker.py", line 42, in <module>
    client.connect()
  File "app/net.py", line 118, in connect
    raise ConnectionRefusedError(errno.ECONNREFUSED, os.strerror(errno.ECONNREFUSED))
ConnectionRefusedError: [Errno 111] Connection refused
This started after we moved the container to a new host. The docker compose
setup is unchanged and redis is definitely running. Any idea what we should
check first? It fails on every restart.""" + " More detail follows. " * 12


class TestCatchesTheAbuse:
    def test_the_production_brief(self):
        assert detect_offtopic_exercise(PROD_BRIEF) is True

    def test_still_caught_when_org_name_is_known(self):
        assert detect_offtopic_exercise(PROD_BRIEF, ["ChatterMate"]) is True


class TestPrecision:
    """Everything here is legitimate traffic and must never be caught."""

    def test_long_product_question_with_business_anchors(self):
        assert detect_offtopic_exercise(LONG_INTEGRATION_QUESTION) is False

    def test_long_pasted_traceback(self):
        assert detect_offtopic_exercise(LONG_TRACEBACK) is False

    def test_exercise_shaped_but_about_the_product(self):
        """A genuine scaling question that happens to use the same vocabulary."""
        text = (
            "We push about 10^6 conversations a month through your webhook and "
            "the ordering matters to us. What data structure do you use "
            "internally for the queue, and what is the time complexity of a "
            "replay? We need worst-case guarantees before we design around it. "
            "Constraints: we cannot lose events, and duplicates allowed is not "
            "acceptable for our billing reconciliation."
        ) + " Extra context. " * 20
        assert detect_offtopic_exercise(text) is False

    def test_short_exercise_is_left_to_the_prompt(self):
        """Below the length bar the policy block handles it — the detector is
        for the long briefs the prompt cannot hold."""
        short = (
            "Design a data structure with insert and getRandom in O(1). "
            "Implement the class and give the time complexity."
        )
        assert detect_offtopic_exercise(short) is False

    @pytest.mark.parametrize("text", [
        "hi",
        "",
        "How much does the Pro plan cost per seat, and is there a free trial?",
        "sudo docker compose up -d fails with permission denied, any ideas?",
    ])
    def test_ordinary_messages(self, text):
        assert detect_offtopic_exercise(text) is False

    def test_none_is_safe(self):
        assert detect_offtopic_exercise(None) is False


class TestThresholds:
    def test_needs_enough_markers(self):
        """Long and technical is not enough on its own."""
        text = ("We use an algorithm to sort the results. " + "Filler text here. " * 40)
        assert detect_offtopic_exercise(text) is False

    def test_org_name_mention_anchors_it(self):
        text = PROD_BRIEF + "\nWe need this for our ChatterMate integration."
        assert detect_offtopic_exercise(text, ["ChatterMate"]) is False
