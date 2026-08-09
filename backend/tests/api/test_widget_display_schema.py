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

import pytest
from pydantic import ValidationError

from app.models.schemas.agent_customization import CustomizationCreate


def _create(metadata):
    return CustomizationCreate(customization_metadata=metadata)


class TestWidgetDisplayValidation:
    def test_valid_full_config_is_normalized(self):
        result = _create({
            "widget_display": {
                "mode": "sidebar-left",
                "side": "left",
                "launcher": False,
                "width": 420,
                "height": 700,
                "sidebar_width": 480,
                "search_placeholder": "Ask us anything",
                "offset_bottom": 40,
                "offset_side": 24,
                "z_index": 5000,
                "junk_key": "dropped",
            }
        })
        display = result.customization_metadata["widget_display"]
        assert display["mode"] == "sidebar-left"
        assert display["launcher"] is False
        assert display["sidebar_width"] == 480
        # Unknown keys are dropped on write.
        assert "junk_key" not in display

    def test_partial_config_stores_only_set_keys(self):
        result = _create({"widget_display": {"mode": "search-bar"}})
        assert result.customization_metadata["widget_display"] == {"mode": "search-bar"}

    def test_metadata_without_widget_display_passes_through(self):
        result = _create({"avatar_style": "orb"})
        assert result.customization_metadata == {"avatar_style": "orb"}

    def test_explicit_null_clears_settings(self):
        result = _create({"widget_display": None, "avatar_style": "orb"})
        assert result.customization_metadata["widget_display"] is None

    def test_other_metadata_keys_survive_alongside(self):
        result = _create({
            "avatar_style": "orb",
            "widget_display": {"side": "right"},
        })
        assert result.customization_metadata["avatar_style"] == "orb"
        assert result.customization_metadata["widget_display"] == {"side": "right"}

    @pytest.mark.parametrize("bad_display", [
        {"mode": "popup"},                     # unknown mode
        {"side": "top"},                       # unknown side
        {"width": 100},                        # below minimum
        {"width": 2000},                       # above maximum
        {"height": 200},                       # below minimum
        {"sidebar_width": 10_000},             # above maximum
        {"offset_bottom": -5},                 # negative offset
        {"offset_side": 9999},                 # above maximum
        {"z_index": 0},                        # below minimum
        {"search_placeholder": "x" * 200},     # too long
        {"launcher": "maybe"},                 # not bool-coercible
        "not-a-dict",                          # wrong shape entirely
    ])
    def test_invalid_values_rejected(self, bad_display):
        with pytest.raises(ValidationError):
            _create({"widget_display": bad_display})

    def test_no_metadata_is_fine(self):
        assert CustomizationCreate().customization_metadata == {}

    def test_allow_new_chat_defaults_off_and_round_trips(self):
        """Off by default: starting a new chat closes the session, which would cut
        off a human agent mid-handover."""
        assert CustomizationCreate().allow_new_chat is False
        assert CustomizationCreate(allow_new_chat=True).allow_new_chat is True

    def test_normalized_values_are_json_primitives(self):
        """The dict is stored in a JSON column — enum members must not leak in."""
        import json

        result = _create({"widget_display": {"mode": "sidebar-left", "side": "left"}})
        display = result.customization_metadata["widget_display"]
        assert type(display["mode"]) is str
        assert type(display["side"]) is str
        # Round-trips through the stdlib serializer the DB engine uses.
        assert json.loads(json.dumps(display)) == display
