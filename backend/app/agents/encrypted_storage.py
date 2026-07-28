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

Agent session storage with the conversation memory encrypted at rest.

agno keeps its own copy of the transcript in `agent_sessions.memory`, so encrypting
`chat_history.message` alone would leave every conversation readable in the database.
This subclass encrypts that blob on the way in and decrypts it on the way out,
overriding only the four public entry points so no agno internals are duplicated.

Tracks agno 1.x: `PostgresAgentStorage` and upsert's `create_and_retry` keyword are
1.x API. On an agno 2.x upgrade this file must be revisited — tests/agents/
test_encrypted_storage.py fails loudly rather than silently storing plaintext.
"""

from copy import copy
from typing import List, Optional

from agno.storage.agent.postgres import PostgresAgentStorage
from agno.storage.session import Session

from app.core.encryption import decrypt_json, encrypt_json
from app.core.logger import get_logger

logger = get_logger(__name__)


class EncryptedPostgresAgentStorage(PostgresAgentStorage):
    """PostgresAgentStorage whose `memory` column is stored as ciphertext."""

    @staticmethod
    def _decrypt_session(session: Optional[Session]) -> Optional[Session]:
        """Restore plaintext memory on a session read from the database.

        Sessions written before this change hold a plaintext dict and are returned
        untouched. A blob we cannot decrypt degrades to no memory — the agent then
        answers without history rather than failing the customer's message.
        """
        if session is None:
            return None

        memory = getattr(session, "memory", None)
        if memory is None:
            return session

        decrypted = decrypt_json(memory)
        if decrypted is None:
            logger.error(
                f"Could not decrypt agent memory for session {session.session_id}; "
                "continuing without history"
            )
        session.memory = decrypted
        return session

    def upsert(self, session: Session, create_and_retry: bool = True) -> Optional[Session]:
        # Copy rather than mutate: agno keeps using the live session object after
        # the write, and it expects plaintext memory there.
        to_store = copy(session)
        to_store.memory = encrypt_json(getattr(session, "memory", None))
        return super().upsert(to_store, create_and_retry=create_and_retry)

    def read(self, session_id: str, user_id: Optional[str] = None) -> Optional[Session]:
        return self._decrypt_session(super().read(session_id=session_id, user_id=user_id))

    def get_all_sessions(
        self, user_id: Optional[str] = None, entity_id: Optional[str] = None
    ) -> List[Session]:
        sessions = super().get_all_sessions(user_id=user_id, entity_id=entity_id)
        return [self._decrypt_session(s) for s in sessions]

    def get_recent_sessions(
        self,
        user_id: Optional[str] = None,
        entity_id: Optional[str] = None,
        limit: Optional[int] = 2,
    ) -> List[Session]:
        sessions = super().get_recent_sessions(user_id=user_id, entity_id=entity_id, limit=limit)
        return [self._decrypt_session(s) for s in sessions]
