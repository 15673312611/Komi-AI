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

import pytest
from unittest.mock import Mock, patch
from uuid import uuid4

from firebase_admin import messaging as real_messaging
from firebase_admin.exceptions import InvalidArgumentError, UnavailableError

from app.services.user import send_fcm_notification
from app.models.notification import Notification, NotificationType


@pytest.fixture
def mock_db():
    """Create a mock database session"""
    return Mock()


@pytest.fixture
def user_id():
    return str(uuid4())


@pytest.fixture
def sample_notification():
    """Create a sample notification"""
    notification = Mock(spec=Notification)
    notification.id = 1
    notification.type = NotificationType.SYSTEM
    notification.title = "Test Notification"
    notification.message = "This is a test notification"
    notification.notification_metadata = {"key": "value"}
    return notification


def batch_response(*successes):
    """Fake a messaging.BatchResponse with one entry per token."""
    responses = []
    for success in successes:
        result = Mock()
        result.success = success is True
        result.exception = None if success is True else success
        responses.append(result)
    batch = Mock()
    batch.responses = responses
    batch.success_count = sum(1 for s in successes if s is True)
    return batch


@pytest.fixture
def token_repo():
    """Patch the repository and hand back the instance the service will use."""
    with patch('app.services.user.FCMTokenRepository') as repo_cls:
        repo = repo_cls.return_value
        repo.get_tokens.return_value = ["token_a"]
        repo.remove_tokens.return_value = 1
        yield repo


@pytest.mark.asyncio
async def test_send_fcm_notification_success(mock_db, user_id, sample_notification, token_repo):
    """A registered device gets exactly one message"""
    with patch('app.services.user.messaging') as mock_messaging:
        mock_messaging.send_each.return_value = batch_response(True)

        await send_fcm_notification(user_id, sample_notification, mock_db)

        mock_messaging.send_each.assert_called_once()
        assert len(mock_messaging.send_each.call_args[0][0]) == 1
        token_repo.remove_tokens.assert_not_called()


@pytest.mark.asyncio
async def test_send_fcm_notification_reaches_every_device(mock_db, user_id, sample_notification, token_repo):
    """The whole point of the per-device table: a user with three signed-in
    browsers gets three messages, not one."""
    token_repo.get_tokens.return_value = ["phone", "laptop", "tablet"]

    with patch('app.services.user.messaging') as mock_messaging:
        mock_messaging.send_each.return_value = batch_response(True, True, True)

        await send_fcm_notification(user_id, sample_notification, mock_db)

        messages = mock_messaging.send_each.call_args[0][0]
        assert len(messages) == 3
        assert [call.kwargs['token'] for call in mock_messaging.Message.call_args_list] == [
            "phone", "laptop", "tablet"]


@pytest.mark.asyncio
async def test_send_fcm_notification_chunks_beyond_the_batch_limit(
        mock_db, user_id, sample_notification, token_repo):
    """send_each rejects >500 messages outright.

    Without chunking that raises before anything is sent, and because pruning
    only reads per-token responses from a successful call, the account could
    never recover.
    """
    token_repo.get_tokens.return_value = [f"token_{i}" for i in range(750)]

    with patch('app.services.user.messaging') as mock_messaging:
        mock_messaging.send_each.side_effect = [
            batch_response(*([True] * 500)),
            batch_response(*([True] * 250)),
        ]

        await send_fcm_notification(user_id, sample_notification, mock_db)

        assert mock_messaging.send_each.call_count == 2
        assert [len(c[0][0]) for c in mock_messaging.send_each.call_args_list] == [500, 250]
        token_repo.remove_tokens.assert_not_called()


@pytest.mark.asyncio
async def test_send_fcm_notification_prunes_across_chunks(
        mock_db, user_id, sample_notification, token_repo):
    """A dead token in a later chunk is still matched to the right token."""
    token_repo.get_tokens.return_value = [f"token_{i}" for i in range(501)]

    with patch('app.services.user.messaging') as mock_messaging:
        mock_messaging.send_each.side_effect = [
            batch_response(*([True] * 500)),
            batch_response(real_messaging.UnregisteredError("gone")),
        ]

        await send_fcm_notification(user_id, sample_notification, mock_db)

        token_repo.remove_tokens.assert_called_once_with(["token_500"])


@pytest.mark.asyncio
async def test_send_fcm_notification_no_tokens_is_logged(mock_db, user_id, sample_notification, token_repo):
    """A user with no registered device leaves a trace instead of failing silently"""
    token_repo.get_tokens.return_value = []

    with patch('app.services.user.messaging') as mock_messaging, \
            patch('app.services.user.logger') as mock_logger:
        await send_fcm_notification(user_id, sample_notification, mock_db)

        mock_messaging.send_each.assert_not_called()
        assert mock_logger.info.called
        assert "No FCM tokens registered" in mock_logger.info.call_args[0][0]


@pytest.mark.asyncio
async def test_send_fcm_notification_prunes_dead_tokens(mock_db, user_id, sample_notification, token_repo):
    """Tokens FCM reports as dead are deleted so the browser can re-register"""
    token_repo.get_tokens.return_value = ["live", "unregistered", "wrong_project"]

    with patch('app.services.user.messaging') as mock_messaging:
        mock_messaging.send_each.return_value = batch_response(
            True,
            real_messaging.UnregisteredError("token no longer valid"),
            real_messaging.SenderIdMismatchError("wrong sender"),
        )

        await send_fcm_notification(user_id, sample_notification, mock_db)

        token_repo.remove_tokens.assert_called_once_with(
            ["unregistered", "wrong_project"])


@pytest.mark.asyncio
async def test_send_fcm_notification_keeps_tokens_on_payload_rejection(
        mock_db, user_id, sample_notification, token_repo):
    """A bad message (oversized payload) is rejected for every token at once.

    Pruning on that would unregister every device the user owns over a fault
    that has nothing to do with their tokens.
    """
    token_repo.get_tokens.return_value = ["phone", "laptop"]

    with patch('app.services.user.messaging') as mock_messaging, \
            patch('app.services.user.logger') as mock_logger:
        mock_messaging.send_each.return_value = batch_response(
            InvalidArgumentError("message is too big"),
            InvalidArgumentError("message is too big"),
        )

        await send_fcm_notification(user_id, sample_notification, mock_db)

        token_repo.remove_tokens.assert_not_called()
        assert mock_logger.error.called


@pytest.mark.asyncio
async def test_send_fcm_notification_keeps_tokens_on_transient_errors(
        mock_db, user_id, sample_notification, token_repo):
    """A network blip must not cost the user their registration"""
    token_repo.get_tokens.return_value = ["live", "flaky"]

    with patch('app.services.user.messaging') as mock_messaging, \
            patch('app.services.user.logger') as mock_logger:
        mock_messaging.send_each.return_value = batch_response(
            True, UnavailableError("try again"))

        await send_fcm_notification(user_id, sample_notification, mock_db)

        token_repo.remove_tokens.assert_not_called()
        assert mock_logger.error.called


@pytest.mark.asyncio
async def test_send_fcm_notification_message_structure(mock_db, user_id, sample_notification, token_repo):
    """Data-only payload (title/body in data so the web SDK doesn't auto-display
    a duplicate), metadata as JSON (not a Python repr), session_id flattened for
    SW deep links, and high-urgency webpush delivery."""
    sample_notification.notification_metadata = {"session_id": "abc-123"}

    with patch('app.services.user.messaging') as mock_messaging:
        mock_messaging.send_each.return_value = batch_response(True)

        await send_fcm_notification(user_id, sample_notification, mock_db)

        mock_messaging.WebpushConfig.assert_called_once_with(
            headers={'Urgency': 'high', 'TTL': '86400'}
        )
        mock_messaging.Message.assert_called_once_with(
            data={
                'title': sample_notification.title,
                'body': sample_notification.message,
                'type': sample_notification.type,
                'notification_id': str(sample_notification.id),
                'session_id': 'abc-123',
                'metadata': json.dumps({"session_id": "abc-123"})
            },
            token="token_a",
            webpush=mock_messaging.WebpushConfig.return_value,
        )


@pytest.mark.asyncio
async def test_send_fcm_notification_with_none_metadata(mock_db, user_id, token_repo):
    """Missing metadata falls back to an empty object, not a crash"""
    notification = Mock(spec=Notification)
    notification.id = 1
    notification.type = NotificationType.SYSTEM
    notification.title = "Test Notification"
    notification.message = "This is a test notification"
    notification.notification_metadata = None

    with patch('app.services.user.messaging') as mock_messaging:
        mock_messaging.send_each.return_value = batch_response(True)

        await send_fcm_notification(user_id, notification, mock_db)

        data = mock_messaging.Message.call_args.kwargs['data']
        assert data['session_id'] == ''
        assert data['metadata'] == '{}'


@pytest.mark.asyncio
async def test_send_fcm_notification_different_notification_types(mock_db, user_id, token_repo):
    """Every notification type is forwarded as-is"""
    for notification_type in NotificationType:
        notification = Mock(spec=Notification)
        notification.id = 1
        notification.type = notification_type
        notification.title = "Test"
        notification.message = "Test message"
        notification.notification_metadata = {}

        with patch('app.services.user.messaging') as mock_messaging:
            mock_messaging.send_each.return_value = batch_response(True)

            await send_fcm_notification(user_id, notification, mock_db)

            assert mock_messaging.Message.call_args.kwargs['data']['type'] == notification_type


@pytest.mark.asyncio
async def test_send_fcm_notification_firebase_exception(mock_db, user_id, sample_notification, token_repo):
    """A thrown send never propagates to the caller creating the notification"""
    with patch('app.services.user.messaging') as mock_messaging, \
            patch('app.services.user.logger') as mock_logger:
        mock_messaging.send_each.side_effect = Exception("Firebase error")

        await send_fcm_notification(user_id, sample_notification, mock_db)

        assert mock_logger.error.called


@pytest.mark.asyncio
async def test_send_fcm_notification_database_exception(sample_notification, user_id):
    """A repository failure is swallowed and logged"""
    with patch('app.services.user.FCMTokenRepository') as repo_cls, \
            patch('app.services.user.logger') as mock_logger:
        repo_cls.side_effect = Exception("Database error")

        await send_fcm_notification(user_id, sample_notification, Mock())

        assert mock_logger.error.called
