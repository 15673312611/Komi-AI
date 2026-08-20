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

from datetime import datetime

import pytz

from app.core.logger import get_logger

logger = get_logger(__name__)

# Used when an organization has never configured its hours. Weekdays 9-5 in the
# org's timezone, weekend closed.
DEFAULT_BUSINESS_HOURS = {
    'monday': {'start': '09:00', 'end': '17:00', 'enabled': True},
    'tuesday': {'start': '09:00', 'end': '17:00', 'enabled': True},
    'wednesday': {'start': '09:00', 'end': '17:00', 'enabled': True},
    'thursday': {'start': '09:00', 'end': '17:00', 'enabled': True},
    'friday': {'start': '09:00', 'end': '17:00', 'enabled': True},
    'saturday': {'start': '09:00', 'end': '17:00', 'enabled': False},
    'sunday': {'start': '09:00', 'end': '17:00', 'enabled': False},
}

_DEFAULT_START = '09:00'
_DEFAULT_END = '17:00'


def organization_timezone(organization) -> pytz.BaseTzInfo:
    """The org's timezone, falling back to UTC for a missing or bad value."""
    tz_name = getattr(organization, 'timezone', None) or 'UTC'
    try:
        return pytz.timezone(tz_name)
    except pytz.UnknownTimeZoneError:
        logger.warning(f"Invalid timezone {tz_name}, using UTC")
        return pytz.UTC


def is_within_business_hours(organization) -> bool:
    """Whether the organization is open right now, in its own timezone.

    Pure and cheap — no database work and no model call — so it can answer the
    widget's "are you around?" on every page load, not just when the AI is
    deciding whether to hand a chat over.

    Note: hours are compared as minutes-of-day, so a window that wraps midnight
    (22:00-02:00) never matches. That is the behaviour this was extracted from;
    changing it would change when the AI offers a transfer.
    """
    business_hours = getattr(organization, 'business_hours', None) or DEFAULT_BUSINESS_HOURS

    now = datetime.now(organization_timezone(organization))
    today = business_hours.get(now.strftime('%A').lower(), {
        'start': _DEFAULT_START,
        'end': _DEFAULT_END,
        'enabled': False,
    })

    if not today.get('enabled', False):
        return False

    try:
        start_hour, start_minute = map(int, today.get('start', _DEFAULT_START).split(':'))
        end_hour, end_minute = map(int, today.get('end', _DEFAULT_END).split(':'))
    except (ValueError, AttributeError) as e:
        logger.error(f"Error parsing business hours: {str(e)}")
        start_hour, start_minute = 9, 0
        end_hour, end_minute = 17, 0

    minutes_now = now.hour * 60 + now.minute
    return (start_hour * 60 + start_minute) <= minutes_now <= (end_hour * 60 + end_minute)
