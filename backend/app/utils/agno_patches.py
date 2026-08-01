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

# Set on the Model instance once the run has spent its tool budget. Safe as
# instance state: create_model() builds a fresh Model per ChatAgent, and
# ChatAgent is built per request, so the flag never outlives one run.
_EXHAUSTED = "_chattermate_tools_exhausted"


def _strip_tools(self, kwargs: dict) -> dict:
    """Drop the tool definitions from a model call once the budget is spent."""
    if getattr(self, _EXHAUSTED, False) and kwargs.get("tools"):
        kwargs = {**kwargs, "tools": None, "tool_choice": None}
    return kwargs


def apply_agno_patches() -> None:
    """Apply all agno runtime patches. Safe to call more than once."""
    if getattr(Model.create_tool_call_limit_error_result, _PATCHED_FLAG, False):
        return

    original_limit_result = Model.create_tool_call_limit_error_result
    original_process = Model._process_model_response
    original_aprocess = Model._aprocess_model_response

    def create_tool_call_limit_error_result(self, function_call):
        message = original_limit_result(self, function_call)
        already_exhausted = getattr(self, _EXHAUSTED, False)
        setattr(self, _EXHAUSTED, True)
        if already_exhausted:
            # Unreachable while _strip_tools works: the previous call already
            # cleared the tools, so the model had none left to call. If it ever
            # does happen, end the run rather than risk the #269 loop.
            message.stop_after_tool_call = True
            logger.warning(
                "Tool call limit reached again after tools were withdrawn; "
                f"terminating agent run (tool={function_call.function.name})"
            )
        else:
            logger.warning(
                "Tool call limit reached; answering without further tools "
                f"(tool={function_call.function.name})"
            )
        return message

    def _process_model_response(self, *args, **kwargs):
        return original_process(self, *args, **_strip_tools(self, kwargs))

    async def _aprocess_model_response(self, *args, **kwargs):
        return await original_aprocess(self, *args, **_strip_tools(self, kwargs))

    setattr(create_tool_call_limit_error_result, _PATCHED_FLAG, True)
    Model.create_tool_call_limit_error_result = create_tool_call_limit_error_result
    Model._process_model_response = _process_model_response
    Model._aprocess_model_response = _aprocess_model_response
