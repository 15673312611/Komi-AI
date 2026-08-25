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

from uuid import UUID
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

from app.repositories.session_to_agent import SessionToAgentRepository
from app.repositories.chat import ChatRepository
from app.repositories.user import UserRepository
from app.repositories.agent import AgentRepository
from app.repositories.ai_config import AIConfigRepository
from app.core.socketio import sio
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session, joinedload, selectinload
from app.core.logger import get_logger
from app.models.user import User
from app.models.role import Role
from app.models.session_to_agent import SessionStatus, EndChatReasonType as SessionEndChatReasonType, SessionToAgent
from app.core.auth import (
    CHAT_MANAGE_PERMISSIONS,
    get_current_user,
    has_any_permission,
)
from app.database import get_db
from app.services.chat_notifications import notify_chat_assigned
from app.services.human_routing import notify_customer, route_session_to_human
from app.services.message_delivery import deliver_to_customer
from app.utils.sanitize import sanitize_message
from app.models.schemas.chat import ChatDetailResponse, TransferReasonType
from app.models.schemas.user import TeammateResponse
from app.channels.constants import is_widget_channel


logger = get_logger(__name__)

router = APIRouter()

# Shown to the customer when a human takes over an external-channel chat. The
# widget surfaces the handover in its own UI, so only channels need a message.
HANDOVER_NOTICE = "You're now connected with a member of our team."


class AIAutoReplyToggle(BaseModel):
    enabled: bool


class ConversationTagsUpdate(BaseModel):
    """The complete ordered label set for one conversation."""

    tags: List[str]


class EndChatRequest(BaseModel):
    """Validated payload for a human closing a conversation.

    Closing is a state-changing action, so it is handled over the authenticated
    REST API instead of treating a fire-and-forget Socket.IO event as success.
    The optional client id still lets other dashboard tabs reconcile the
    canonical system message without comparing timestamps.
    """

    message: Optional[str] = None
    request_rating: bool = False
    end_chat_reason: Optional[str] = None
    end_chat_description: Optional[str] = None
    client_message_id: Optional[str] = None


class ReassignChatRequest(BaseModel):
    """Optional JSON body for a reassignment, including its internal handoff note."""

    to_user_id: Optional[str] = None
    note: Optional[str] = Field(default=None, max_length=2000)


def _visible_inbox_users(db: Session, session: SessionToAgent) -> list[User]:
    """Return active organization users allowed to open ``session``.

    Conversation snapshots and composer mentions must agree on visibility. A
    mention notification contains a deep link and may originate from a private
    note, so returning the general organization directory here would leak
    conversation existence to teammates without inbox access.
    """
    users = (
        db.query(User)
        .options(
            joinedload(User.role).joinedload(Role.permissions),
            selectinload(User.groups),
        )
        .filter(
            User.organization_id == session.organization_id,
            User.is_active.is_(True),
        )
        .all()
    )
    result: list[User] = []
    for user in users:
        permissions = {
            permission.name
            for permission in ((getattr(user, 'role', None) and getattr(user.role, 'permissions', None)) or [])
            if getattr(permission, 'name', None)
        }
        is_super_admin = 'super_admin' in permissions
        can_view_all = is_super_admin or bool({'view_all_chats', 'manage_all_chats'} & permissions)
        can_view_assigned = is_super_admin or 'view_assigned_chats' in permissions
        can_manage_assigned = is_super_admin or 'manage_assigned_chats' in permissions
        can_view_unassigned = is_super_admin or 'view_unassigned_chats' in permissions

        visible = can_view_all
        if not visible and session.user_id is not None:
            visible = (
                (str(session.user_id) == str(user.id) and (can_view_assigned or can_manage_assigned))
                or (
                    session.group_id is not None
                    and can_view_assigned
                    and any(str(group.id) == str(session.group_id) for group in (user.groups or []))
                )
            )
        if not visible and session.user_id is None:
            visible = can_view_unassigned
            if (
                not visible
                and session.group_id is not None
                and can_view_assigned
            ):
                visible = any(
                    str(group.id) == str(session.group_id)
                    for group in (user.groups or [])
                )
        if visible:
            result.append(user)
    return result


async def _emit_conversation_updated(
    db: Session,
    chat: ChatDetailResponse,
    *,
    recipient_user_ids: Optional[list] = None,
) -> None:
    """Publish a canonical conversation snapshot to affected inbox clients.

    Assignment actions previously emitted several incompatible ``room_event``
    payloads.  A single JSON-safe snapshot lets an already-open thread update
    without relying on a delayed list refetch.  Failure to notify must not make
    a successful state transition fail, so callers deliberately use it after
    committing their database work.
    """
    payload = {
        'type': 'conversation_updated',
        'session_id': str(chat.session_id),
        'chat': chat.model_dump(mode='json'),
    }

    # A state change can move a conversation into or out of another agent's
    # queue. Sending only to the actor/new assignee leaves stale rows in every
    # other open inbox. Resolve recipients from the same visibility rules used
    # by GET /chats/recent, and merge explicit users (old/new assignees and the
    # actor) so a row is removed promptly when ownership changes.
    session = (
        db.query(SessionToAgent)
        .filter(SessionToAgent.session_id == chat.session_id)
        .first()
    )
    explicit_recipients = {str(user_id) for user_id in (recipient_user_ids or []) if user_id}
    visible_recipients: set[str] = set()
    if session is not None:
        visible_recipients = {str(user.id) for user in _visible_inbox_users(db, session)}
    recipients = explicit_recipients | visible_recipients

    for user_id in recipients:
        # Explicit recipients include the former assignee on a transfer. They
        # need an event to remove their row, but must not receive the fresh
        # detail after the reassignment made it inaccessible to them.
        event = payload if user_id in visible_recipients else {
            'type': 'conversation_removed',
            'session_id': str(chat.session_id),
        }
        await sio.emit('room_event', event, room=f"user_{user_id}", namespace='/agent')


def _is_uuid(value: str) -> bool:
    """Guard the repository lookup: a malformed id is a 404, not a 500."""
    try:
        UUID(str(value))
        return True
    except (ValueError, TypeError, AttributeError):
        return False


def _normalise_conversation_tags(tags: List[str]) -> list[str]:
    """Validate labels before storing them in the session JSON state.

    Tags are operator-authored display text, not arbitrary metadata. Keeping
    this narrow prevents a label edit from inflating a shared JSON field or
    preserving markup/control characters that later clients may render.
    """
    if not isinstance(tags, list):
        raise HTTPException(status_code=422, detail="Tags must be a list")
    if len(tags) > 20:
        raise HTTPException(status_code=422, detail="A conversation can have at most 20 tags")

    result: list[str] = []
    seen: set[str] = set()
    for tag in tags:
        if not isinstance(tag, str):
            raise HTTPException(status_code=422, detail="Every tag must be text")
        value = sanitize_message(tag).strip()
        value = " ".join(value.split())
        if not value:
            continue
        if len(value) > 64:
            raise HTTPException(status_code=422, detail="Tags cannot exceed 64 characters")
        key = value.casefold()
        if key not in seen:
            seen.add(key)
            result.append(value)
    return result


async def _notify_customer_of_handover(db: Session, session, user: User) -> None:
    """Tell a channel customer a human joined, and record it in the thread."""
    await notify_customer(db, session, HANDOVER_NOTICE, user_id=str(user.id))


async def _load_manageable_session(db: Session, session_id: str, current_user: User):
    """The session, if this user may act on it — or the right HTTPException.

    Shared by every action that changes who handles a chat, so they cannot
    drift apart: the permission grant, the organization scope and the
    visibility check are one sequence, checked in one place.
    """
    # manage_all_chats, not "manage_chats" — the latter is not a real
    # permission and never matched. has_any_permission also honours the
    # super_admin bypass the previous hand-rolled set check ignored.
    if not has_any_permission(current_user, CHAT_MANAGE_PERMISSIONS):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    session = SessionToAgentRepository(db).get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # A session id is guessable and was never scoped here: without this an
    # agent could act on a conversation belonging to another organization.
    if session.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # Acting is limited to what the caller may actually see, so widening the
    # inbox to the unclaimed queue can't be used to reach past it.
    user_permissions = {
        permission.name
        for permission in ((getattr(current_user, "role", None) and getattr(current_user.role, "permissions", None)) or [])
        if getattr(permission, "name", None)
    }
    is_super_admin = "super_admin" in user_permissions
    # manage_all_chats implies seeing them all — a role that may manage every
    # chat should not need a separate view grant to act on one.
    can_manage_all = is_super_admin or "manage_all_chats" in user_permissions
    can_view_all = can_manage_all or "view_all_chats" in user_permissions

    if not can_view_all:
        # ``manage_assigned_chats`` is an action grant, not a prerequisite
        # view grant. It always covers the caller's own assignments. Group
        # assignments still require the explicit view-assigned scope, while
        # the unclaimed queue is available when view-unassigned is granted.
        can_manage_assigned = is_super_admin or "manage_assigned_chats" in user_permissions
        can_view_assigned = is_super_admin or "view_assigned_chats" in user_permissions
        has_access = await ChatRepository(db).check_session_access(
            session_id=session_id,
            user_id=current_user.id if can_manage_assigned else None,
            user_groups=[str(group.id) for group in (getattr(current_user, "groups", None) or [])] if can_view_assigned else [],
            include_unassigned=is_super_admin or "view_unassigned_chats" in user_permissions
        )
        if not has_access:
            raise HTTPException(status_code=404, detail="Chat session not found")

    return session


@router.get("/{session_id}/mentionable-teammates", response_model=List[TeammateResponse])
async def list_mentionable_teammates(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List only teammates who may safely receive a mention for this chat."""
    session = await _load_manageable_session(db, session_id, current_user)
    return [user for user in _visible_inbox_users(db, session) if user.id != current_user.id]


@router.put("/{session_id}/tags", response_model=ChatDetailResponse)
async def update_conversation_tags(
    session_id: str,
    payload: ConversationTagsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Replace the labels on a conversation and broadcast its new snapshot.

    The same action/visibility gate as reassignment applies: labels reveal
    operational context and must not be writable merely because an id is
    known. Replacing the whole set makes retries naturally idempotent.
    """
    session = await _load_manageable_session(db, session_id, current_user)
    tags = _normalise_conversation_tags(payload.tags)
    state = dict(session.workflow_state) if isinstance(session.workflow_state, dict) else {}
    state['conversation_tags'] = tags
    session.workflow_state = state
    db.commit()

    detail = await ChatRepository(db).get_chat_detail(session.session_id, current_user.organization_id)
    if not detail:
        raise HTTPException(status_code=500, detail="Failed to load chat after updating tags")
    response = ChatDetailResponse(**detail)
    await _emit_conversation_updated(db, response, recipient_user_ids=[session.user_id, current_user.id])
    return response


@router.post("/{session_id}/takeover", response_model=ChatDetailResponse)
async def takeover_chat(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Take over a chat session"""
    try:
        session = await _load_manageable_session(db, session_id, current_user)
        session_repo = SessionToAgentRepository(db)
        chat_repo = ChatRepository(db)

        # Update session
        success = session_repo.takeover_session(
            session_id=session_id,
            user_id=str(current_user.id)
        )

        if not success:
            raise HTTPException(
                status_code=400,
                detail="Failed to take over chat"
            )

        # Let the customer know a human joined (external channels only), before
        # the detail is read back so the notice is part of the returned thread.
        await _notify_customer_of_handover(db, session, current_user)

        # Get updated chat details
        chat = await chat_repo.get_chat_detail(
            session_id=session_id,
            org_id=current_user.organization_id
        )

        if not chat:
            raise HTTPException(
                status_code=500,
                detail="Failed to get chat details after takeover"
            )

        response = ChatDetailResponse(**chat)
        await _emit_conversation_updated(
            db,
            response,
            recipient_user_ids=[session.user_id, current_user.id],
        )
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error taking over chat: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to take over chat"
        )


@router.post("/{session_id}/end", response_model=ChatDetailResponse)
async def end_chat(
    session_id: str,
    payload: EndChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Persist and deliver a human-initiated closing message.

    The agent message Socket.IO handler remains the path for ordinary replies,
    but closing needs an acknowledgement before the inbox removes the active
    thread.  This endpoint performs the same authorization, persistence and
    channel delivery work and returns the resulting conversation snapshot.
    """
    session = await _load_manageable_session(db, session_id, current_user)
    chat_repo = ChatRepository(db)
    client_message_id = (
        payload.client_message_id.strip()[:128]
        if isinstance(payload.client_message_id, str) and payload.client_message_id.strip()
        else None
    )

    # A retry after a network timeout should return the original canonical
    # conversation instead of creating a second closing message. Check before
    # the closed-state guard so the same request remains idempotent after the
    # first transaction has completed.
    if client_message_id:
        existing = chat_repo.find_message_by_client_id(session.session_id, client_message_id)
        if existing:
            detail = await chat_repo.get_chat_detail(session.session_id, current_user.organization_id)
            if detail:
                return ChatDetailResponse(**detail)

    # Serialize concurrent close requests on databases that support row locks;
    # SQLite simply ignores FOR UPDATE and the idempotency lookup still covers
    # sequential retries. Re-read after acquiring the lock because the first
    # lookup may have raced with another close transaction.
    locked = (
        db.query(SessionToAgent)
        .filter(
            SessionToAgent.session_id == session.session_id,
            SessionToAgent.organization_id == current_user.organization_id,
        )
        .with_for_update()
        .first()
    )
    if locked is not None:
        session = locked
    if client_message_id:
        existing = chat_repo.find_message_by_client_id(session.session_id, client_message_id)
        if existing:
            detail = await chat_repo.get_chat_detail(session.session_id, current_user.organization_id)
            if detail:
                return ChatDetailResponse(**detail)
    if session.status == SessionStatus.CLOSED:
        raise HTTPException(status_code=400, detail="This chat is already closed")
    if session.user_id is None or str(session.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only the assigned agent can end this chat")

    channel = getattr(session, "channel", None)
    request_rating = bool(payload.request_rating and is_widget_channel(channel))
    message = sanitize_message(payload.message or "Thank you for contacting us.") or "Thank you for contacting us."
    if len(message) > 8000:
        message = message[:8000]

    valid_reasons = {reason.value for reason in SessionEndChatReasonType}
    reason_value = payload.end_chat_reason if payload.end_chat_reason in valid_reasons else SessionEndChatReasonType.ISSUE_RESOLVED.value
    description = sanitize_message(payload.end_chat_description or "Agent manually ended the chat")
    if description:
        description = description[:2000]
    attributes = {
        "end_chat": True,
        "request_rating": request_rating,
        "end_chat_reason": reason_value,
        "end_chat_description": description,
    }
    if client_message_id:
        attributes["client_message_id"] = client_message_id

    created_message = chat_repo.create_message({
        "message": message,
        "message_type": "system",
        "session_id": session.session_id,
        "organization_id": session.organization_id,
        "agent_id": session.agent_id,
        "customer_id": session.customer_id,
        "user_id": current_user.id,
        "attributes": attributes,
    }, commit=False)

    session.status = SessionStatus.CLOSED
    session.closed_at = datetime.utcnow()
    session.end_chat_reason = SessionEndChatReasonType(reason_value)
    session.end_chat_description = description
    db.commit()

    canonical_payload = {
        "message_id": created_message.id,
        "client_message_id": client_message_id,
        "user_id": str(current_user.id),
        "message": message,
        "message_type": "system",
        "type": "agent_message",
        "session_id": str(session.session_id),
        "created_at": created_message.created_at.isoformat(),
        "user_name": current_user.full_name,
        "attributes": attributes,
        # Keep the legacy widget wire contract alongside the canonical
        # attributes object. The widget's Socket.IO handler still reads these
        # fields at the top level when deciding whether to close and request
        # CSAT, while dashboard clients use attributes for persistence.
        "end_chat": True,
        "request_rating": request_rating,
        "end_chat_reason": reason_value,
        "end_chat_description": description,
    }

    # Closing the session is durable even when an external channel rejects the
    # outbound text. Mark the stored message so the inbox can show the failure
    # instead of reporting an unqualified delivery success.
    try:
        delivery = await deliver_to_customer(db, session, canonical_payload)
    except Exception as exc:
        logger.error("Failed delivering closing message for %s: %s", session_id, exc)
        delivery = None
    if delivery is not None and not delivery.ok:
        reason = delivery.reason or "delivery_failed"
        chat_repo.mark_delivery_failed(created_message.id, reason)
        attributes["delivery_status"] = reason

    await sio.emit("chat_reply", canonical_payload, room=str(session.session_id), namespace="/agent")
    await sio.emit("chat_reply", canonical_payload, room=f"user_{current_user.id}", namespace="/agent")

    chat = await chat_repo.get_chat_detail(session.session_id, current_user.organization_id)
    if not chat:
        raise HTTPException(status_code=500, detail="Failed to get chat details after ending chat")
    response = ChatDetailResponse(**chat)
    await _emit_conversation_updated(db, response, recipient_user_ids=[current_user.id])
    return response


@router.post("/{session_id}/route-to-human", response_model=ChatDetailResponse)
async def route_chat_to_human(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stop the AI answering this chat and queue it for the team.

    Taking a chat over was the only way to silence the AI, which forces whoever
    spots the problem to handle it personally. This hands it to the queue
    instead, leaving it claimable by anyone.
    """
    try:
        session = await _load_manageable_session(db, session_id, current_user)

        if session.status == SessionStatus.CLOSED:
            raise HTTPException(
                status_code=400, detail="This chat is closed")
        if session.user_id is not None:
            raise HTTPException(
                status_code=400, detail="A human is already handling this chat")

        routed = await route_session_to_human(
            db,
            session,
            reason=TransferReasonType.DIRECT_REQUEST.value,
            description=f"Routed to the team by {current_user.full_name}",
        )
        if not routed:
            raise HTTPException(
                status_code=400, detail="This chat is already waiting for a human")

        chat = await ChatRepository(db).get_chat_detail(
            session_id=session_id,
            org_id=current_user.organization_id
        )
        if not chat:
            raise HTTPException(
                status_code=500,
                detail="Failed to get chat details after routing"
            )

        response = ChatDetailResponse(**chat)
        await _emit_conversation_updated(db, response, recipient_user_ids=[current_user.id])
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error routing chat to human: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to route chat to a human"
        )


@router.post("/{session_id}/ai-auto-reply", response_model=ChatDetailResponse)
async def toggle_ai_auto_reply(
    session_id: str,
    payload: AIAutoReplyToggle,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Set the durable per-session AI override and return the new snapshot."""
    session = await _load_manageable_session(db, session_id, current_user)
    if session.status == SessionStatus.CLOSED:
        raise HTTPException(status_code=400, detail="This chat is closed")

    # Enabling a session cannot bypass the agent/org configuration. Disabling
    # remains available for every manageable open conversation.
    agent = AgentRepository(db).get_agent(str(session.agent_id)) if session.agent_id else None
    if payload.enabled:
        if not agent or not agent.ai_replies_enabled:
            raise HTTPException(status_code=400, detail="AI auto-reply is disabled for this agent")
        if AIConfigRepository(db).get_active_config(current_user.organization_id) is None:
            raise HTTPException(status_code=400, detail="No active AI configuration is available")

    chat_repo = ChatRepository(db)
    if not chat_repo.set_ai_auto_reply(UUID(str(session.session_id)), current_user.organization_id, payload.enabled):
        raise HTTPException(status_code=404, detail="Chat session not found")

    chat = await chat_repo.get_chat_detail(session.session_id, current_user.organization_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found")
    response = ChatDetailResponse(**chat)
    await _emit_conversation_updated(db, response, recipient_user_ids=[session.user_id, current_user.id])
    return response


@router.post("/{session_id}/hand-back-to-ai", response_model=ChatDetailResponse)
async def hand_back_to_ai(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Release a human-owned conversation back to the configured AI agent."""
    session = await _load_manageable_session(db, session_id, current_user)
    if session.status == SessionStatus.CLOSED:
        raise HTTPException(status_code=400, detail="This chat is closed")

    agent = AgentRepository(db).get_agent(str(session.agent_id)) if session.agent_id else None
    if not agent or not agent.ai_replies_enabled:
        raise HTTPException(status_code=400, detail="AI auto-reply is disabled for this agent")
    if AIConfigRepository(db).get_active_config(current_user.organization_id) is None:
        raise HTTPException(status_code=400, detail="No active AI configuration is available")

    previous_user_id = session.user_id
    session_repo = SessionToAgentRepository(db)
    if not session_repo.update_session(session.session_id, {
        'user_id': None,
        'group_id': None,
        'status': SessionStatus.OPEN,
    }):
        raise HTTPException(status_code=400, detail="Failed to hand chat back to AI")
    if not ChatRepository(db).set_ai_auto_reply(session.session_id, current_user.organization_id, True):
        raise HTTPException(status_code=400, detail="Failed to enable AI auto-reply")

    chat = await ChatRepository(db).get_chat_detail(session.session_id, current_user.organization_id)
    if not chat:
        raise HTTPException(status_code=500, detail="Failed to get chat details after hand-back")
    response = ChatDetailResponse(**chat)
    await _emit_conversation_updated(
        db,
        response,
        recipient_user_ids=[previous_user_id, current_user.id],
    )
    await sio.emit('room_event', {
        'type': 'handed_back_to_ai',
        'session_id': str(session.session_id),
        'ai_auto_reply': True,
    }, room=str(session.session_id), namespace='/agent')
    return response


@router.post("/{session_id}/reassign", response_model=ChatDetailResponse)
async def reassign_chat(
    session_id: str,
    to_user_id: Optional[str] = None,
    payload: Optional[ReassignChatRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reassign a chat session to a different user"""
    try:
        session_repo = SessionToAgentRepository(db)
        session = await _load_manageable_session(db, session_id, current_user)

        target_user_id = payload.to_user_id if payload and payload.to_user_id else to_user_id
        if not target_user_id:
            raise HTTPException(status_code=422, detail="to_user_id is required")

        # The new owner must be a real, active member of the same org —
        # otherwise a chat (and its assignment notification) could be pushed
        # onto someone outside it. A 404 here doesn't confirm whether an id
        # exists elsewhere.
        target_user = UserRepository(db).get_user(target_user_id) if _is_uuid(target_user_id) else None
        if (target_user is None
                or not target_user.is_active
                or target_user.organization_id != current_user.organization_id
                or not has_any_permission(target_user, CHAT_MANAGE_PERMISSIONS)):
            raise HTTPException(status_code=404, detail="User not found")

        # Only allow reassignment for open sessions handled by a user (not AI)
        if str(session.status.name).lower() != 'open':
            raise HTTPException(status_code=400, detail="Only open sessions can be reassigned")
        if session.user_id is None:
            raise HTTPException(status_code=400, detail="Chat must be handled by a user to reassign")

        # Capture the previous assignee before changing the in-memory row so
        # the snapshot reaches both the person losing the chat and the one
        # receiving it.
        previous_user_id = session.user_id

        # Persist the optional note before changing the assignment, within the
        # same transaction. The old socket-first flow raced with reassignment:
        # if the reassignment won, the server correctly rejected the note
        # because its author no longer owned the chat.
        handoff_note = sanitize_message(payload.note or "")[:2000] if payload else ""
        if handoff_note:
            ChatRepository(db).create_message({
                "message": handoff_note,
                "message_type": "private_note",
                "session_id": session.session_id,
                "organization_id": session.organization_id,
                "agent_id": session.agent_id,
                "customer_id": session.customer_id,
                "user_id": current_user.id,
                "attributes": {
                    "is_private": True,
                    "handoff_to_user_id": str(target_user.id),
                },
            }, commit=False)

        session.user_id = target_user.id
        session.group_id = None
        session.status = SessionStatus.OPEN
        session.updated_at = datetime.utcnow()
        db.commit()

        # Fetch updated chat detail
        chat_repo = ChatRepository(db)
        chat = await chat_repo.get_chat_detail(
            session_id=session_id,
            org_id=current_user.organization_id
        )
        if not chat:
            raise HTTPException(status_code=500, detail="Failed to get chat details after reassignment")

        # Notify widget room (customer)
        await sio.emit('room_event', {
            'type': 'reassigned',
            'session_id': session_id,
            'message': 'Your conversation has been reassigned to another agent.'
        }, room=session_id, namespace='/widget')

        # Notify agent rooms (convention: user_{id})
        await sio.emit('room_event', {
            'type': 'reassigned',
            'session_id': session_id,
            'assigned_to': str(target_user.id)
        }, room=f"user_{target_user.id}")

        # Also notify the PREVIOUS assignee that the chat left their queue —
        # unless it was reassigned to themselves (a no-op).
        if previous_user_id and str(previous_user_id) != str(target_user.id):
            await sio.emit('room_event', {
                'type': 'reassigned_from_you',
                'session_id': session_id
            }, room=f"user_{previous_user_id}")

        # Push to the new assignee — a socket event only reaches them if the
        # dashboard is already open.
        await notify_chat_assigned(db, session, str(target_user.id), assigned_by=current_user.id)

        response = ChatDetailResponse(**chat)
        await _emit_conversation_updated(
            db,
            response,
            recipient_user_ids=[previous_user_id, target_user.id, current_user.id],
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reassigning chat: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reassign chat")
