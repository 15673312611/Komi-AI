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

from sqlalchemy import Column, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.database import Base


class FCMToken(Base):
    """One web-push token per signed-in browser.

    Replaces the old single `users.fcm_token_web` column, which held one token
    for the whole account: signing in on a laptop overwrote the phone's token
    and signing out anywhere cleared it for every device, so the phone silently
    stopped receiving pushes.

    The token is minted by the browser, not by us, and FCM returns the *same*
    value for a given browser install regardless of who is signed in — hence the
    unique constraint plus reassign-on-register in the repository, so a shared
    browser moves its token to the new owner instead of delivering that user's
    notifications to the previous one.
    """

    __tablename__ = "fcm_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="fcm_tokens")
