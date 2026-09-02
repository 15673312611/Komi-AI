"""
Copyright 2024-2026 Komi AI

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
"""

from sqlalchemy import Column, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class ChatReadState(Base):
    """The latest point at which one dashboard user read one conversation.

    This deliberately belongs to a user rather than the conversation. One
    support teammate opening a thread must not clear another teammate's inbox.
    ``last_read_at`` is enough because message creation timestamps are
    server-owned and the unread query only counts customer messages newer than
    this cursor.
    """

    __tablename__ = "chat_read_states"
    __table_args__ = (
        Index("ix_chat_read_states_user_org", "user_id", "organization_id"),
    )

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("session_to_agents.session_id", ondelete="CASCADE"),
        primary_key=True,
    )
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    last_read_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
