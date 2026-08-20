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

from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Sequence

from app.models.fcm_token import FCMToken
from app.core.logger import get_logger

logger = get_logger(__name__)


class FCMTokenRepository:
    """Web-push tokens, one row per signed-in browser."""

    def __init__(self, db: Session):
        self.db = db

    def register(self, user_id: UUID, token: str) -> bool:
        """Store `token` for `user_id`, creating or reassigning its row.

        FCM hands the same token back to a given browser install no matter who
        is signed in, so an existing row is moved to the current user rather
        than duplicated — otherwise a shared browser would keep receiving the
        previous account's notifications.
        """
        try:
            existing = self.db.query(FCMToken).filter(
                FCMToken.token == token).first()

            if existing:
                if existing.user_id == user_id:
                    return True
                logger.info(
                    f"Reassigning FCM token from user {existing.user_id} to {user_id}")
                existing.user_id = user_id
            else:
                self.db.add(FCMToken(user_id=user_id, token=token))

            self.db.commit()
            return True
        except Exception as e:
            logger.error(f"Error registering FCM token: {str(e)}")
            self.db.rollback()
            return False

    def get_tokens(self, user_id: UUID) -> List[str]:
        """Every device token registered for a user."""
        try:
            rows = self.db.query(FCMToken.token).filter(
                FCMToken.user_id == user_id).all()
            return [row.token for row in rows]
        except Exception as e:
            logger.error(f"Error getting FCM tokens: {str(e)}")
            return []

    def remove(self, user_id: UUID, token: str) -> bool:
        """Drop a single device's token — used on logout.

        Scoped to the owner so a stolen token can't be used to silence someone
        else's notifications.
        """
        try:
            deleted = self.db.query(FCMToken).filter(
                FCMToken.user_id == user_id,
                FCMToken.token == token,
            ).delete(synchronize_session=False)
            self.db.commit()
            return deleted > 0
        except Exception as e:
            logger.error(f"Error removing FCM token: {str(e)}")
            self.db.rollback()
            return False

    def remove_tokens(self, tokens: Sequence[str]) -> int:
        """Drop tokens FCM has told us are dead. Returns the number removed."""
        if not tokens:
            return 0
        try:
            deleted = self.db.query(FCMToken).filter(
                FCMToken.token.in_(list(tokens))).delete(synchronize_session=False)
            self.db.commit()
            return deleted
        except Exception as e:
            logger.error(f"Error pruning FCM tokens: {str(e)}")
            self.db.rollback()
            return 0
