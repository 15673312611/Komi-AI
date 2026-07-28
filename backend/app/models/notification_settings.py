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

from sqlalchemy import Boolean, Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import expression, func

from app.database import Base

# Preference column per chat event, and the value assumed for a user who has
# no row yet. Transfer/assignment default on so existing users keep the
# notifications they already get; new-chat is opt-in because it fires on every
# conversation, including the ones the AI handles alone.
NOTIFY_NEW_CHAT = "notify_new_chat"
NOTIFY_CHAT_TRANSFER = "notify_chat_transfer"
NOTIFY_CHAT_ASSIGNED = "notify_chat_assigned"

NOTIFICATION_PREFERENCE_DEFAULTS = {
    NOTIFY_NEW_CHAT: False,
    NOTIFY_CHAT_TRANSFER: True,
    NOTIFY_CHAT_ASSIGNED: True,
}


class UserNotificationSettings(Base):
    """Per-user chat push preferences. One row per user, created lazily with
    defaults on first read — absence of a row means the defaults above apply.
    """
    __tablename__ = "user_notification_settings"

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    notify_new_chat = Column(Boolean, nullable=False, default=False, server_default=expression.false())
    notify_chat_transfer = Column(Boolean, nullable=False, default=True, server_default=expression.true())
    notify_chat_assigned = Column(Boolean, nullable=False, default=True, server_default=expression.true())

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
