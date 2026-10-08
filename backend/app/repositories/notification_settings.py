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
"""

from typing import Iterable, List, Optional, Set
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.notification_settings import (
    NOTIFICATION_PREFERENCE_DEFAULTS,
    UserNotificationSettings,
)


def _to_uuid(value: UUID | str) -> UUID:
    return UUID(value) if isinstance(value, str) else value


class UserNotificationSettingsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: UUID | str) -> Optional[UserNotificationSettings]:
        return (
            self.db.query(UserNotificationSettings)
            .filter(UserNotificationSettings.user_id == _to_uuid(user_id))
            .first()
        )

    def get_or_create(self, user_id: UUID | str) -> UserNotificationSettings:
        settings = self.get(user_id)
        if settings is None:
            settings = UserNotificationSettings(user_id=_to_uuid(user_id))
            self.db.add(settings)
            try:
                self.db.commit()
                self.db.refresh(settings)
            except IntegrityError:
                # Two concurrent first-reads (e.g. two tabs) race on the
                # user_id PK; the loser re-reads the row the winner inserted
                # rather than surfacing a 500.
                self.db.rollback()
                settings = self.get(user_id)
        return settings

    def filter_enabled(self, user_ids: Iterable[UUID | str], field: str) -> Set[UUID]:
        """Of `user_ids`, return those who want notifications for `field`.

        One query regardless of recipient count — transfer fans out to a whole
        group and new chats fan out across the org. Users with no row yet fall
        back to the column default rather than being dropped, so nothing has to
        be backfilled.
        """
        if field not in NOTIFICATION_PREFERENCE_DEFAULTS:
            raise ValueError(f"Unknown notification preference: {field}")

        candidates = {_to_uuid(user_id) for user_id in user_ids if user_id}
        if not candidates:
            return set()

        rows = (
            self.db.query(
                UserNotificationSettings.user_id,
                getattr(UserNotificationSettings, field),
            )
            .filter(UserNotificationSettings.user_id.in_(candidates))
            .all()
        )

        stored = {user_id: enabled for user_id, enabled in rows}
        default = NOTIFICATION_PREFERENCE_DEFAULTS[field]
        return {
            user_id for user_id in candidates
            if stored.get(user_id, default)
        }
