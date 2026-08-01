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

from app.utils.agno_patches import _strip_tools, apply_agno_patches


def _model_stub():
    # create_tool_call_limit_error_result only reads tool_message_role from self,
    # and the patch only sets its own attribute, so a stub is enough.
    return SimpleNamespace(tool_message_role="tool")


def _limit_error_message(model_stub, call_id="call_1"):
    apply_agno_patches()
    function_call = FunctionCall(
        function=Function(name="search_knowledge_base"),
        arguments={"query": "hello"},
        call_id=call_id,
    )
    return Model.create_tool_call_limit_error_result(model_stub, function_call)


def test_limit_does_not_end_the_run_before_the_model_answers():
    """The whole point of the limit handling: bound the run WITHOUT costing the
    answer.

    Stopping at the tool result ends the loop before the model writes anything,
    so the turn comes back empty and the visitor gets the generic
    "I didn't quite catch that" fallback. That was the production regression this
    replaces — most turns on any agent with a few knowledge sources.
    """
    message = _limit_error_message(_model_stub())
    assert not message.stop_after_tool_call


def test_tools_are_withdrawn_once_the_budget_is_spent():
    """With tools cleared, the next completion has to be plain text — which both
    produces an answer and makes the runaway loop of #269 impossible."""
    model = _model_stub()
    _limit_error_message(model)

    kwargs = _strip_tools(model, {"tools": [{"name": "search"}], "tool_choice": "auto"})
    assert kwargs["tools"] is None
    assert kwargs["tool_choice"] is None


def test_tools_survive_until_the_limit_is_hit():
    """Before the limit, the model call must be completely untouched."""
    model = _model_stub()
    original = {"tools": [{"name": "search"}], "tool_choice": "auto"}
    assert _strip_tools(model, original) == original


def test_stripping_leaves_the_other_arguments_alone():
    model = _model_stub()
    _limit_error_message(model)

    kwargs = _strip_tools(
        model, {"tools": [{"name": "search"}], "tool_choice": "auto", "messages": ["m"]}
    )
    assert kwargs["messages"] == ["m"]


def test_second_limit_hit_terminates_as_a_backstop():
    """Unreachable while withdrawal works — a model with no tools cannot call
    one. If it ever is reached, end the run rather than risk the #269 loop."""
    model = _model_stub()
    _limit_error_message(model)
    second = _limit_error_message(model, call_id="call_2")
    assert second.stop_after_tool_call is True


def test_exhaustion_does_not_leak_between_runs():
    """The flag lives on the Model instance, and create_model() builds a fresh
    one per request. A limit hit in one conversation must not withdraw tools from
    the next."""
    spent = _model_stub()
    _limit_error_message(spent)
    fresh = _model_stub()

    original = {"tools": [{"name": "search"}], "tool_choice": "auto"}
    assert _strip_tools(fresh, original) == original


def test_limit_error_result_keeps_original_shape():
    """The patch only adds behaviour; the message agno built is unchanged."""
    message = _limit_error_message(_model_stub())
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
