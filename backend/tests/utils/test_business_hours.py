"""
Copyright 2024-2026 Komi AI

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Whether the organization is open right now. Shared by the widget's presence
line and the AI's transfer wording, so the two cannot contradict each other.
"""
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.utils.business_hours import is_within_business_hours


def _org(business_hours=None, timezone='UTC'):
    return SimpleNamespace(business_hours=business_hours, timezone=timezone)


def _at(day, hour, minute=0):
    """Freeze the clock inside the helper, in the org's timezone."""
    now = MagicMock()
    now.strftime.return_value = day
    now.hour = hour
    now.minute = minute
    return patch('app.utils.business_hours.datetime', **{'now.return_value': now})


HOURS = {'monday': {'start': '09:00', 'end': '17:00', 'enabled': True},
         'sunday': {'start': '09:00', 'end': '17:00', 'enabled': False}}


def test_open_inside_the_window():
    with _at('monday', 12):
        assert is_within_business_hours(_org(HOURS)) is True


def test_closed_before_and_after():
    with _at('monday', 8, 59):
        assert is_within_business_hours(_org(HOURS)) is False
    with _at('monday', 17, 1):
        assert is_within_business_hours(_org(HOURS)) is False


def test_boundaries_count_as_open():
    for hour, minute in ((9, 0), (17, 0)):
        with _at('monday', hour, minute):
            assert is_within_business_hours(_org(HOURS)) is True


def test_a_disabled_day_is_closed_all_day():
    with _at('sunday', 12):
        assert is_within_business_hours(_org(HOURS)) is False


def test_a_day_missing_from_the_table_is_closed():
    with _at('saturday', 12):
        assert is_within_business_hours(_org(HOURS)) is False


def test_unconfigured_organization_falls_back_to_weekdays_nine_to_five():
    with _at('monday', 12):
        assert is_within_business_hours(_org(None)) is True
    with _at('sunday', 12):
        assert is_within_business_hours(_org(None)) is False


def test_unparsable_hours_fall_back_rather_than_raising():
    broken = {'monday': {'start': 'lunchtime', 'end': '17:00', 'enabled': True}}
    with _at('monday', 12):
        assert is_within_business_hours(_org(broken)) is True


def test_an_unknown_timezone_does_not_raise():
    with _at('monday', 12):
        assert is_within_business_hours(_org(HOURS, timezone='Invalid/Zone')) is True
