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

import sys
from pathlib import Path
from uuid import uuid4

from sqlalchemy import text

from app.core.encryption import (
    CURRENT_KEY_ID,
    ENCRYPTED_PREFIX,
    JSON_MARKER,
    SEPARATOR,
    EncryptedText,
    decrypt_json,
    decrypt_value,
    encrypt_json,
    encrypt_value,
    is_encrypted,
)
from app.database import Base
from app.models.chat_history import ChatHistory
from app.models.session_to_agent import SessionToAgent, SessionStatus


def test_round_trip():
    token = encrypt_value("hello customer")
    assert token.startswith(f"{ENCRYPTED_PREFIX}{SEPARATOR}{CURRENT_KEY_ID}{SEPARATOR}")
    assert "hello customer" not in token
    assert decrypt_value(token) == "hello customer"


def test_encrypt_is_idempotent():
    token = encrypt_value("hello")
    assert encrypt_value(token) == token


def test_plaintext_passes_through():
    """Rows the backfill has not reached yet must keep reading."""
    assert decrypt_value("not yet encrypted") == "not yet encrypted"


def test_none_and_empty():
    assert encrypt_value(None) is None
    assert decrypt_value(None) is None
    assert decrypt_value("") == ""
    assert decrypt_value(encrypt_value("")) == ""


def test_unknown_key_id_returns_none():
    token = encrypt_value("secret").replace(CURRENT_KEY_ID, "v99", 1)
    assert decrypt_value(token) is None


def test_corrupt_token_returns_none():
    assert decrypt_value(f"{ENCRYPTED_PREFIX}{SEPARATOR}{CURRENT_KEY_ID}{SEPARATOR}nope") is None


def test_malformed_ciphertext_returns_none():
    assert decrypt_value(f"{ENCRYPTED_PREFIX}{SEPARATOR}{CURRENT_KEY_ID}") is None


def test_is_encrypted():
    assert is_encrypted(encrypt_value("x"))
    assert not is_encrypted("plain")
    assert not is_encrypted(None)


def test_json_round_trip():
    memory = {"runs": [{"content": "my secret transcript"}]}
    blob = encrypt_json(memory)
    assert list(blob) == [JSON_MARKER]
    assert "secret" not in str(blob)
    assert decrypt_json(blob) == memory


def test_json_plaintext_passes_through():
    legacy = {"runs": [{"content": "written before encryption"}]}
    assert decrypt_json(legacy) == legacy
    assert decrypt_json(None) is None
    assert encrypt_json(None) is None


def test_json_encrypt_is_idempotent():
    blob = encrypt_json({"a": 1})
    assert encrypt_json(blob) == blob


def test_undecryptable_json_returns_none():
    assert decrypt_json({JSON_MARKER: f"{ENCRYPTED_PREFIX}{SEPARATOR}{CURRENT_KEY_ID}{SEPARATOR}x"}) is None


def test_backfill_script_covers_every_encrypted_column():
    """The backfill lives outside the app tree and cannot import the models, so
    nothing but this test stops a newly encrypted column from shipping with its
    existing rows silently left in plaintext."""
    sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
    try:
        from encrypt_chat_at_rest import TARGETS
    finally:
        sys.path.pop(0)

    declared = {
        (table.name, column.name)
        for table in Base.metadata.tables.values()
        for column in table.columns
        if isinstance(column.type, EncryptedText)
    }
    covered = {
        (table, column)
        for table, _pk, columns, _kind in TARGETS
        for column in columns
    }
    assert declared <= covered, f"not backfilled: {declared - covered}"


def test_chat_message_is_ciphertext_in_the_database(db, test_organization_id):
    """The ORM must round-trip, and the stored bytes must not be readable."""
    message = ChatHistory(
        organization_id=test_organization_id,
        message="card number is 4111 1111 1111 1111",
        message_type="user",
    )
    db.add(message)
    db.commit()

    # Raw SQL: selecting the typed column would decrypt it again on the way out.
    raw = db.execute(
        text("SELECT message FROM chat_history WHERE id = :id"), {"id": message.id}
    ).scalar()
    assert is_encrypted(raw)
    assert "4111" not in raw

    db.expire_all()
    assert db.get(ChatHistory, message.id).message == "card number is 4111 1111 1111 1111"


def test_session_summary_is_ciphertext_in_the_database(db, test_organization_id):
    session = SessionToAgent(
        session_id=uuid4(),
        organization_id=test_organization_id,
        customer_id=uuid4(),
        status=SessionStatus.OPEN,
        ticket_summary="customer threatened to churn",
        transfer_description="needs a human",
    )
    db.add(session)
    db.commit()

    raw = db.execute(
        text("SELECT ticket_summary FROM session_to_agents "
             "WHERE ticket_summary IS NOT NULL")
    ).scalar()
    assert is_encrypted(raw)
    assert "churn" not in raw

    db.expire_all()
    reloaded = db.get(SessionToAgent, session.session_id)
    assert reloaded.ticket_summary == "customer threatened to churn"
    assert reloaded.transfer_description == "needs a human"


def test_legacy_plaintext_row_still_reads(db, test_organization_id):
    """A row written before this change has no prefix and must not break reads."""
    # Raw SQL on purpose: going through the ORM would encrypt it.
    db.execute(
        text("INSERT INTO chat_history (organization_id, message, message_type) "
             "VALUES (:org, :message, :message_type)"),
        {"org": str(test_organization_id), "message": "written before encryption",
         "message_type": "user"},
    )
    db.commit()

    stored = db.query(ChatHistory).filter(
        ChatHistory.message_type == "user"
    ).order_by(ChatHistory.id.desc()).first()
    assert stored.message == "written before encryption"
