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

import enum
from typing import Iterable, Optional

from sqlalchemy.orm import Session

from app.core.logger import get_logger
from app.models.notification import Notification, NotificationType
from app.models.notification_settings import (
    NOTIFY_CHAT_ASSIGNED,
    NOTIFY_CHAT_TRANSFER,
    NOTIFY_NEW_CHAT,
)
from app.repositories.notification_settings import UserNotificationSettingsRepository
from app.services.user import send_fcm_notification

logger = get_logger(__name__)


class ChatNotificationEvent(str, enum.Enum):
    """Chat events a user can mute. The value is both the preference column
    and the `event` discriminator carried in the push metadata.
    """
    NEW_CHAT = NOTIFY_NEW_CHAT
    CHAT_TRANSFER = NOTIFY_CHAT_TRANSFER
    CHAT_ASSIGNED = NOTIFY_CHAT_ASSIGNED


async def notify_user(
    db: Session,
    user_id,
    type_: NotificationType,
    title: str,
    message: str,
    metadata: Optional[dict] = None,
) -> None:
    """Persist an in-app notification and send its FCM push.

    Never raises and no-ops without a user (background jobs may have none) —
    a notification failure must not fail the work it reports on.

    NOTE: this commits (and, on error, rolls back) the caller's `db` session,
    so call it only once any work you want persisted is already committed.
    Every current caller either commits first or has nothing pending.
    """
    if not user_id:
        return
    try:
        notification = Notification(
            user_id=user_id,
            type=type_,
            title=title,
            message=message,
            notification_metadata=metadata,
        )
        db.add(notification)
        db.commit()
        await send_fcm_notification(user_id, notification, db)
    except Exception as e:
        logger.error(f"Error sending notification '{title}' to user {user_id}: {e}")
        try:
            db.rollback()
        except Exception:
            pass


async def notify_chat_event(
    db: Session,
    user_ids: Iterable,
    event: ChatNotificationEvent,
    title: str,
    message: str,
    metadata: Optional[dict] = None,
) -> None:
    """Notify every user in `user_ids` who hasn't muted `event`.

    Recipients are resolved in a single query, so fanning out to a whole group
    or org costs one lookup rather than one per user. Like notify_user, this
    never raises — a notification must not fail the chat it reports on.
    """
    try:
        recipients = UserNotificationSettingsRepository(db).filter_enabled(
            user_ids, event.value
        )
        if not recipients:
            return

        payload = {**(metadata or {}), "event": event.value}
        for user_id in recipients:
            await notify_user(
                db=db,
                user_id=user_id,
                type_=NotificationType.CHAT,
                title=title,
                message=message,
                metadata=payload,
            )
    except Exception as e:
        logger.error(f"Error sending '{event.value}' notification: {e}")
