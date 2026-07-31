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

from types import SimpleNamespace

from agno.models.base import Model
from agno.tools.function import Function, FunctionCall

from app.utils.agno_patches import apply_agno_patches


def _limit_error_message():
    apply_agno_patches()
    function_call = FunctionCall(
        function=Function(name="search_knowledge_base"),
        arguments={"query": "hello"},
        call_id="call_1",
    )
    # The method only reads tool_message_role from self, so a stub suffices.
    model_stub = SimpleNamespace(tool_message_role="tool")
    return Model.create_tool_call_limit_error_result(model_stub, function_call)


def test_limit_error_result_terminates_run():
    """The limit-error message must carry stop_after_tool_call so the model
    response loop in agno.models.base breaks instead of re-invoking the model
    forever (issue #269)."""
    message = _limit_error_message()
    assert message.stop_after_tool_call is True
    # agno's loops break on: any(m.stop_after_tool_call for m in function_call_results)
    assert any(m.stop_after_tool_call for m in [message])


def test_limit_error_result_keeps_original_shape():
    """The patch only adds the stop flag; the message agno built is otherwise
    unchanged."""
    message = _limit_error_message()
    assert message.role == "tool"
    assert message.tool_call_error is True
    assert message.tool_call_id == "call_1"
    assert message.tool_name == "search_knowledge_base"
    assert "Tool call limit reached" in message.content


def test_apply_is_idempotent():
    """Repeated application must not stack wrappers."""
    apply_agno_patches()
    patched_once = Model.create_tool_call_limit_error_result
    apply_agno_patches()
    assert Model.create_tool_call_limit_error_result is patched_once
