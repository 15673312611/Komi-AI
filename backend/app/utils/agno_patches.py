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

# Runtime patches for the pinned agno==1.7.6. Remove this module with the
# agno 2.x upgrade.
#
# agno 1.7.6 does not terminate a run when tool_call_limit is exceeded: it
# appends a tool-result message asking the model not to call the tool again
# and sends the conversation back to the model. Models that ignore the
# instruction (observed with gpt-4o-mini) then loop forever, re-sending an
# ever-growing payload on every iteration (issue #269).
#
# The first fix set stop_after_tool_call=True on the limit-error message, which
# breaks the response loop in agno.models.base. That ended the loop, but it ended
# it AT THE TOOL RESULT — before the model ever wrote an answer — so every run
# that reached the limit returned an empty turn and the visitor got the
# "I didn't quite catch that" fallback. In production that was most turns on any
# agent with a few knowledge sources.
#
# What we actually want is a bounded run that still answers: at the limit, stop
# offering tools and let the model reply from what it already retrieved. Clearing
# `tools` for the next completion does exactly that, and it also makes the runaway
# loop impossible — a model with no tools cannot call one. The hard stop is kept
# as a backstop for the case that should now be unreachable.

from agno.models.base import Model

from app.core.logger import get_logger

logger = get_logger(__name__)

_PATCHED_FLAG = "_chattermate_answers_at_limit"

# Both live on the Model instance. Safe as instance state: create_model() builds
# a fresh Model per ChatAgent and ChatAgent is built per request, so neither
# outlives a single run.
#
# _ROUND counts model round-trips; _EXHAUSTED_AT records the round the budget ran
# out in. The distinction is load-bearing: a model can request SEVERAL tools in
# one assistant message, and agno walks that whole batch before calling the model
# again. Every over-budget call in the batch arrives here, so a plain
# "have we been here before" flag mistakes the second parallel call for a genuine
# repeat and terminates the run — reintroducing the empty reply this patch exists
# to prevent. Observed in local testing with tool_call_limit=1.
_ROUND = "_chattermate_round"
_EXHAUSTED_AT = "_chattermate_exhausted_round"

# Replaces agno's own limit-error text, which only tells the model it may not
# call the tool again. Left at that, gpt-4o-mini narrated the plumbing to the
# visitor ("I wasn't able to retrieve ... due to tool limitation") and then
# answered from general knowledge — which also contradicts the grounding rule the
# guardrail relies on. Say what to do instead: answer from what is already here,
# and if that is not enough, admit it rather than invent.
_LIMIT_INSTRUCTION = (
    "You have used all the tool calls available for this turn. Answer now, using "
    "only what the tools have already returned and what your instructions cover. "
    "Do not mention tools, searches, limits or any internal constraint — the "
    "visitor must not read about the plumbing. If what you have is not enough to "
    "answer properly, say plainly that you don't have that detail and offer to "
    "connect them with the team. Never fill the gap with general knowledge."
)


def _strip_tools(self, kwargs: dict) -> dict:
    """Drop the tool definitions from a model call once the budget is spent.

    Also counts the round, since this runs exactly once per model round-trip.
    """
    setattr(self, _ROUND, getattr(self, _ROUND, 0) + 1)
    if getattr(self, _EXHAUSTED_AT, None) is not None and kwargs.get("tools"):
        kwargs = {**kwargs, "tools": None, "tool_choice": None}
    return kwargs


def apply_agno_patches() -> None:
    """Apply all agno runtime patches. Safe to call more than once."""
    if getattr(Model.create_tool_call_limit_error_result, _PATCHED_FLAG, False):
        return

    original_limit_result = Model.create_tool_call_limit_error_result
    original_process = Model._process_model_response
    original_aprocess = Model._aprocess_model_response
    # Streaming is a separate pair of entry points that never touch the two
    # above. Patching only the non-streaming ones left the live chat — which
    # streams — with its tools intact after the limit, so the next round called a
    # tool again and hit the backstop. Verified against a real agent.
    original_stream = Model.process_response_stream
    original_astream = Model.aprocess_response_stream

    def create_tool_call_limit_error_result(self, function_call):
        message = original_limit_result(self, function_call)
        current_round = getattr(self, _ROUND, 0)
        exhausted_at = getattr(self, _EXHAUSTED_AT, None)

        # Every over-budget call in the batch gets the instruction, not just the
        # first: the model reads all of the tool results, and leaving agno's
        # "tool call limit reached" text on the siblings was enough for it to keep
        # narrating the limit to the visitor.
        message.content = _LIMIT_INSTRUCTION

        if exhausted_at is None:
            setattr(self, _EXHAUSTED_AT, current_round)
            logger.warning(
                "Tool call limit reached; answering without further tools "
                f"(tool={function_call.function.name})"
            )
        elif current_round > exhausted_at:
            # A LATER round still asking for tools means withdrawal did not take
            # effect. Unreachable in practice — a model offered no tools cannot
            # call one — but end the run rather than risk the #269 loop.
            message.stop_after_tool_call = True
            logger.warning(
                "Tool call limit reached in a later round despite tools being "
                f"withdrawn; terminating agent run (tool={function_call.function.name})"
            )
        # Same round: another tool from the same parallel batch. Already handled
        # by the first one — say nothing and let the run continue to the answer.
        return message

    def _process_model_response(self, *args, **kwargs):
        return original_process(self, *args, **_strip_tools(self, kwargs))

    async def _aprocess_model_response(self, *args, **kwargs):
        return await original_aprocess(self, *args, **_strip_tools(self, kwargs))

    def process_response_stream(self, *args, **kwargs):
        yield from original_stream(self, *args, **_strip_tools(self, kwargs))

    async def aprocess_response_stream(self, *args, **kwargs):
        async for chunk in original_astream(self, *args, **_strip_tools(self, kwargs)):
            yield chunk

    setattr(create_tool_call_limit_error_result, _PATCHED_FLAG, True)
    Model.create_tool_call_limit_error_result = create_tool_call_limit_error_result
    Model._process_model_response = _process_model_response
    Model._aprocess_model_response = _aprocess_model_response
    Model.process_response_stream = process_response_stream
    Model.aprocess_response_stream = aprocess_response_stream
