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

The agno agent session store keeps its own copy of the transcript, so these tests
guard the seam that keeps that copy encrypted.
"""

import pytest
from agno.storage.session.agent import AgentSession

from app.agents.encrypted_storage import EncryptedPostgresAgentStorage
from app.core.encryption import CURRENT_KEY_ID, ENCRYPTED_PREFIX, JSON_MARKER, SEPARATOR

MEMORY = {"runs": [{"content": "my card number is 4111 1111 1111 1111"}]}


class FakeStorage(EncryptedPostgresAgentStorage):
    """The subclass under test, with only the database swapped for a dict.

    `rows` holds what Postgres would hold, so every assertion about ciphertext at
    rest is an assertion about the real column value.
    """

    def __init__(self):
        self.rows = {}


@pytest.fixture
def storage(monkeypatch):
    """Patch agno's own read/upsert — the supers — so the subclass's overrides,
    not a hand-written stand-in, are what the tests exercise."""
    def fake_upsert(self, session, create_and_retry=True):
        self.rows[session.session_id] = session.memory
        return self.read(session_id=session.session_id)

    def fake_read(self, session_id, user_id=None):
        if session_id not in self.rows:
            return None
        return AgentSession(session_id=session_id, memory=self.rows[session_id])

    monkeypatch.setattr("agno.storage.postgres.PostgresStorage.upsert", fake_upsert)
    monkeypatch.setattr("agno.storage.postgres.PostgresStorage.read", fake_read)
    return FakeStorage()


def test_memory_is_encrypted_at_rest(storage):
    session = AgentSession(session_id="s1", agent_id="a1", memory=dict(MEMORY))

    returned = storage.upsert(session)

    stored = storage.rows["s1"]
    assert list(stored) == [JSON_MARKER]
    assert "4111" not in str(stored)
    assert stored[JSON_MARKER].startswith(
        f"{ENCRYPTED_PREFIX}{SEPARATOR}{CURRENT_KEY_ID}{SEPARATOR}")
    # The caller gets plaintext back, and the live object it still holds is untouched.
    assert returned.memory == MEMORY
    assert session.memory == MEMORY


def test_legacy_plaintext_memory_still_loads(storage):
    """Sessions agno wrote before this change hold a plain dict."""
    storage.rows["legacy"] = dict(MEMORY)
    assert storage.read("legacy").memory == MEMORY


def test_undecryptable_memory_degrades_to_no_history(storage):
    """A damaged blob must not stop the agent answering the customer."""
    storage.rows["broken"] = {JSON_MARKER: f"{ENCRYPTED_PREFIX}{SEPARATOR}{CURRENT_KEY_ID}{SEPARATOR}x"}
    assert storage.read("broken").memory is None


def test_missing_memory_is_left_alone(storage):
    storage.upsert(AgentSession(session_id="empty", memory=None))
    assert storage.rows["empty"] is None
    assert storage.read("empty").memory is None
