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
# ever-growing payload on every iteration (issue #269). The response loops in
# agno.models.base already break when any tool-result message has
# stop_after_tool_call=True, so setting that flag on the limit-error message
# ends the run cleanly at the limit — the behavior agno 2.x ships by default.

from agno.models.base import Model

from app.core.logger import get_logger

logger = get_logger(__name__)

_PATCHED_FLAG = "_chattermate_stops_run"


def apply_agno_patches() -> None:
    """Apply all agno runtime patches. Safe to call more than once."""
    if getattr(Model.create_tool_call_limit_error_result, _PATCHED_FLAG, False):
        return

    original = Model.create_tool_call_limit_error_result

    def create_tool_call_limit_error_result(self, function_call):
        message = original(self, function_call)
        message.stop_after_tool_call = True
        logger.warning(
            f"Tool call limit reached; terminating agent run "
            f"(tool={function_call.function.name})"
        )
        return message

    setattr(create_tool_call_limit_error_result, _PATCHED_FLAG, True)
    Model.create_tool_call_limit_error_result = create_tool_call_limit_error_result
