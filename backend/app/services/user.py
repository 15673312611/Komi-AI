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

import json

from app.models.notification import Notification
from app.repositories.fcm_token import FCMTokenRepository
from app.core.logger import get_logger
from firebase_admin import messaging

logger = get_logger(__name__)

# Errors that identify the *token* as dead rather than the send as failed: the
# browser revoked the subscription or cleared site data (Unregistered), or the
# token belongs to a different Firebase project (SenderIdMismatch). Retrying
# these never succeeds, so the row is pruned and the browser re-registers on
# its next load.
#
# InvalidArgumentError is deliberately NOT here. FCM also returns it for a bad
# *message* — an oversized data payload, say — which fails identically for
# every token in the batch and would prune every device the user owns.
DEAD_TOKEN_ERRORS = (
    messaging.UnregisteredError,
    messaging.SenderIdMismatchError,
)

# send_each rejects a longer list outright. Chunking keeps an account that has
# somehow accumulated more devices than this from raising before a single
# message is sent — which would also stop the dead-token pruning below from
# ever running, leaving that user permanently without push.
FCM_SEND_BATCH_SIZE = 500


async def send_fcm_notification(user_id: str, notification: Notification, db):
    """Push a notification to every browser the user has signed in on."""
    try:
        token_repo = FCMTokenRepository(db)
        tokens = token_repo.get_tokens(user_id)
        if not tokens:
            # Logged, not silent: an account with notifications enabled but no
            # registered device looks identical to a broken push pipeline from
            # the outside, and used to leave no trace at all.
            logger.info(
                f"No FCM tokens registered for user {user_id}; "
                f"skipping push for notification {notification.id}"
            )
            return

        metadata = notification.notification_metadata or {}

        # Data-only FCM message (no messaging.Notification): with a notification
        # payload the Firebase web SDK auto-displays its own copy in the service
        # worker AND swallows clicks on it, so the app's tagged, deep-linking
        # notification would appear as a duplicate. The service worker renders
        # the notification itself from this data. session_id is flattened out of
        # the metadata so a click can deep-link to /conversations?session=<id>;
        # metadata is JSON (str() produced a Python repr the frontend could
        # never parse).
        data = {
            'title': notification.title or '',
            'body': notification.message or '',
            'type': notification.type,
            'notification_id': str(notification.id),
            'session_id': str(metadata.get('session_id') or ''),
            'metadata': json.dumps(metadata, default=str)
        }

        messages = [
            messaging.Message(
                data=data,
                token=token,
                # These are web-push tokens, so the priority knob is the WebPush
                # `Urgency` header — NOT AndroidConfig/APNSConfig, which only
                # apply to native FCM SDK tokens and are ignored for web push.
                # High urgency asks the push service to deliver promptly even
                # while the device is idle / in battery-saver instead of
                # batching it; TTL keeps it deliverable for a day if the device
                # is offline.
                webpush=messaging.WebpushConfig(
                    headers={'Urgency': 'high', 'TTL': '86400'},
                ),
            )
            for token in tokens
        ]

        # send_each reports per-token outcomes, so one dead device does not
        # stop the others from being delivered to.
        dead_tokens = []
        delivered = 0
        for start in range(0, len(messages), FCM_SEND_BATCH_SIZE):
            chunk = messages[start:start + FCM_SEND_BATCH_SIZE]
            batch = messaging.send_each(chunk)
            delivered += batch.success_count

            for token, result in zip(tokens[start:start + FCM_SEND_BATCH_SIZE],
                                     batch.responses):
                if result.success:
                    continue
                if isinstance(result.exception, DEAD_TOKEN_ERRORS):
                    dead_tokens.append(token)
                else:
                    logger.error(
                        f"Failed to send FCM notification {notification.id} to a device "
                        f"of user {user_id}: {str(result.exception)}"
                    )

        if dead_tokens:
            removed = token_repo.remove_tokens(dead_tokens)
            logger.info(
                f"Pruned {removed} dead FCM token(s) for user {user_id}")

        logger.info(
            f"Sent FCM notification {notification.id} to {delivered}/"
            f"{len(tokens)} device(s) of user {user_id}"
        )

    except Exception as e:
        logger.error(f"Failed to send FCM notification: {str(e)}")
