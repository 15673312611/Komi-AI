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

import pytest
from uuid import uuid4

from app.models.fcm_token import FCMToken
from app.models.user import User
from app.repositories.fcm_token import FCMTokenRepository


@pytest.fixture
def repo(db):
    return FCMTokenRepository(db)


@pytest.fixture
def other_user(db, test_organization, test_role) -> User:
    user = User(
        email="other@example.com",
        hashed_password="x",
        full_name="Other User",
        organization_id=test_organization.id,
        role_id=test_role.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


class TestRegister:
    def test_stores_token(self, repo, test_user):
        assert repo.register(test_user.id, "phone_token") is True
        assert repo.get_tokens(test_user.id) == ["phone_token"]

    def test_is_idempotent(self, repo, test_user):
        """The client posts on every app load — that must not create duplicates"""
        for _ in range(3):
            repo.register(test_user.id, "phone_token")
        assert repo.get_tokens(test_user.id) == ["phone_token"]

    def test_keeps_other_devices(self, repo, test_user):
        repo.register(test_user.id, "phone_token")
        repo.register(test_user.id, "laptop_token")
        assert set(repo.get_tokens(test_user.id)) == {"phone_token", "laptop_token"}

    def test_survives_a_lost_insert_race(self, repo, test_user, db, monkeypatch):
        """Two tabs post the same token at once; the loser must still succeed.

        The client posts on every app load, so a concurrent duplicate insert is
        routine — failing it would leave that browser unregistered.
        """
        from sqlalchemy.exc import IntegrityError

        real_commit = db.commit
        calls = {"n": 0}

        def commit_once_conflicting():
            calls["n"] += 1
            if calls["n"] == 1:
                # Simulate the other tab having committed the row first.
                raise IntegrityError("duplicate", None, Exception("conflict"))
            return real_commit()

        monkeypatch.setattr(db, "commit", commit_once_conflicting)
        assert repo.register(test_user.id, "raced_token") is True
        monkeypatch.undo()

        assert repo.get_tokens(test_user.id) == ["raced_token"]

    def test_reassigns_shared_browser(self, repo, test_user, other_user):
        """FCM hands the same token to a browser whichever account signs in, so
        the row moves rather than delivering to the previous owner."""
        repo.register(test_user.id, "shared_browser_token")
        repo.register(other_user.id, "shared_browser_token")

        assert repo.get_tokens(test_user.id) == []
        assert repo.get_tokens(other_user.id) == ["shared_browser_token"]


class TestGetTokens:
    def test_empty_for_unknown_user(self, repo):
        assert repo.get_tokens(uuid4()) == []


class TestRemove:
    def test_removes_only_that_device(self, repo, test_user):
        repo.register(test_user.id, "phone_token")
        repo.register(test_user.id, "laptop_token")

        assert repo.remove(test_user.id, "laptop_token") is True
        assert repo.get_tokens(test_user.id) == ["phone_token"]

    def test_unknown_token_is_not_an_error(self, repo, test_user):
        assert repo.remove(test_user.id, "never_registered") is False

    def test_cannot_remove_another_users_token(self, repo, test_user, other_user):
        repo.register(other_user.id, "their_token")

        assert repo.remove(test_user.id, "their_token") is False
        assert repo.get_tokens(other_user.id) == ["their_token"]


class TestRemoveTokens:
    def test_prunes_listed_tokens(self, repo, test_user):
        repo.register(test_user.id, "live")
        repo.register(test_user.id, "dead_one")
        repo.register(test_user.id, "dead_two")

        assert repo.remove_tokens(["dead_one", "dead_two"]) == 2
        assert repo.get_tokens(test_user.id) == ["live"]

    def test_empty_list_is_a_no_op(self, repo, test_user):
        repo.register(test_user.id, "live")
        assert repo.remove_tokens([]) == 0
        assert repo.get_tokens(test_user.id) == ["live"]


class TestCascade:
    def test_tokens_die_with_the_user(self, db, repo, other_user):
        repo.register(other_user.id, "doomed_token")

        db.delete(other_user)
        db.commit()

        assert db.query(FCMToken).filter(
            FCMToken.token == "doomed_token").first() is None
