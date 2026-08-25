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
from typing import List, Optional, Dict, Any
from app.models.chat_history import ChatHistory
from app.models.customer import Customer
from uuid import UUID
from sqlalchemy import func, or_, select, text, and_
from sqlalchemy.sql import case
from app.models.agent import Agent
from app.models.session_to_agent import SessionToAgent
from app.repositories.channels import ChannelConversationRepository
from app.core.logger import get_logger
from app.channels.constants import is_widget_channel
from app.models.user import User
from app.repositories.customer import CustomerRepository
from sqlalchemy.orm import joinedload
from datetime import datetime
from pydantic import BaseModel
from app.core.s3 import get_s3_signed_url
from app.core.config import settings
from app.services.sentiment import analyze_sentiment, compute_session_sentiment
from app.utils.attachment_urls import local_attachment_download_url

logger = get_logger(__name__)

class ChatRepository:
    def __init__(self, db: Session):
        self.db = db

    def has_customer_messages(self, session_id: UUID | str) -> bool:
        """Whether the customer has said anything in this session yet.

        The widget opens its session on socket connect, before the visitor
        types, so this is what distinguishes a real new chat from someone
        merely opening the chat window.
        """
        if isinstance(session_id, str):
            session_id = UUID(session_id)
        return self.db.query(ChatHistory.id).filter(
            ChatHistory.session_id == session_id,
            ChatHistory.message_type == 'user'
        ).first() is not None

    @staticmethod
    def effective_ai_auto_reply(session: Optional[SessionToAgent], agent_default: bool = True) -> bool:
        """Return the session override when one exists, otherwise the agent default.

        ``workflow_state`` predates this setting and is user/configuration data,
        so only a real boolean is accepted.  Treating strings such as ``"false"``
        as truthy would silently re-enable automated replies.
        """
        state = getattr(session, 'workflow_state', None) or {}
        return ChatRepository.effective_ai_auto_reply_from_state(state, agent_default)

    @staticmethod
    def effective_ai_auto_reply_from_state(state: Any, agent_default: bool = True) -> bool:
        """Return the effective setting when only the persisted JSON state is available."""
        override = state.get('ai_auto_reply') if isinstance(state, dict) else None
        return override if isinstance(override, bool) else bool(agent_default)

    def get_message_count_for_period(
        self,
        org_id: UUID | str,
        start_date: datetime,
        end_date: datetime
    ) -> int:
        """
        Get the total number of bot messages for an organization within a specific date range.
        Only counts messages with message_type='bot'.
        
        Args:
            org_id: Organization ID
            start_date: Start date of the period
            end_date: End date of the period
            
        Returns:
            int: Total number of bot messages in the period
        """
        if isinstance(org_id, str):
            org_id = UUID(org_id)
            
        try:
            # Build filter conditions
            conditions = [
                ChatHistory.organization_id == org_id,
                ChatHistory.message_type == 'bot'  # Only count bot messages
            ]
            
            # Add date range conditions if they are not None
            if start_date is not None:
                conditions.append(ChatHistory.created_at >= start_date)
            if end_date is not None:
                conditions.append(ChatHistory.created_at <= end_date)
            
            count = self.db.query(func.count(ChatHistory.id))\
                .filter(and_(*conditions))\
                .scalar()
            return count or 0
        except Exception as e:
            logger.error(f"Error getting message count: {str(e)}")
            return 0

    def create_message(self, message_data: Dict[str, Any], *, commit: bool = True) -> ChatHistory:
        """Create a new chat message.

        ``commit=False`` is used by state transitions that must persist the
        message and session update in one transaction (notably ending a chat).
        Existing callers keep the historical commit-on-success behaviour.
        """
        try:
            # Convert any Pydantic models in attributes to dict
            if 'attributes' in message_data:
                attributes = message_data['attributes']
                if 'shopify_output' in attributes and attributes['shopify_output'] is not None:
                    if isinstance(attributes['shopify_output'], BaseModel):
                        attributes['shopify_output'] = attributes['shopify_output'].dict()
                    elif isinstance(attributes['shopify_output'], dict):
                        # If it's already a dict, ensure all nested objects are serialized
                        if 'products' in attributes['shopify_output']:
                            products = attributes['shopify_output']['products']
                            attributes['shopify_output']['products'] = [
                                p.dict() if isinstance(p, BaseModel) else p 
                                for p in products
                            ]
            
            # Convert string UUIDs to UUID objects
            for field in ['organization_id', 'user_id', 'customer_id', 'agent_id', 'session_id']:
                if field in message_data and message_data[field] is not None:
                    if isinstance(message_data[field], str):
                        message_data[field] = UUID(message_data[field])

            # Analyze sentiment for customer messages ('user' type)
            if message_data.get('message_type') == 'user' and message_data.get('message'):
                try:
                    label, score = analyze_sentiment(message_data['message'])
                    message_data['sentiment_label'] = label
                    message_data['sentiment_score'] = score
                except Exception as e:
                    logger.error(f"Error analyzing message sentiment: {str(e)}")

            message = ChatHistory(**message_data)
            self.db.add(message)
            self.db.flush()
            self.db.refresh(message)

            if commit:
                self.db.commit()

            # Update session-level sentiment after saving a customer message
            if commit and message_data.get('message_type') == 'user' and message_data.get('session_id'):
                try:
                    self._update_session_sentiment(message_data['session_id'])
                except Exception as e:
                    logger.error(f"Error updating session sentiment: {str(e)}")

            return message
        except Exception as e:
            logger.error(f"Error creating message: {str(e)}")
            self.db.rollback()
            raise

    def update_message_attributes(self, message_id: int, attributes: Dict[str, Any]) -> None:
        """Merge keys into a message's attributes JSON (e.g. delivery_status)."""
        try:
            message = self.db.query(ChatHistory).filter(ChatHistory.id == message_id).first()
            if not message:
                return
            message.attributes = {**(message.attributes or {}), **attributes}
            self.db.commit()
        except Exception as e:
            logger.error(f"Error updating message attributes: {str(e)}")
            self.db.rollback()

    def mark_delivery_failed(self, message_id: int, reason: Optional[str]) -> None:
        """Flag a stored message as never delivered to the customer.

        Sole writer of delivery_status, which therefore only ever holds a
        failure reason — the inbox treats its presence as "not delivered".
        """
        self.update_message_attributes(message_id, {'delivery_status': reason or 'failed'})

    def find_message_by_client_id(
        self,
        session_id: UUID | str,
        client_message_id: str,
    ) -> Optional[ChatHistory]:
        """Find a message by the dashboard's idempotency key.

        The key lives in the existing JSON attributes column, so this small
        Python-side scan keeps the lookup portable across PostgreSQL and the
        SQLite test database. A session normally has only a few hundred rows,
        and this path is used only for retries of state-changing sends.
        """
        if isinstance(session_id, str):
            session_id = UUID(session_id)
        if not isinstance(client_message_id, str) or not client_message_id:
            return None
        rows = (
            self.db.query(ChatHistory)
            .filter(ChatHistory.session_id == session_id)
            .order_by(ChatHistory.id.desc())
            .all()
        )
        for row in rows:
            attributes = row.attributes if isinstance(row.attributes, dict) else {}
            if attributes.get("client_message_id") == client_message_id:
                return row
        return None

    def _channel_account_id(self, channel: Optional[str], session_id) -> Optional[str]:
        """Which connected account a channel conversation belongs to, so the
        inbox can call account-scoped endpoints (e.g. sending a template).

        Looked up separately rather than joined into the chat-detail query:
        session_id is not unique on channel_conversations, so an outer join
        would multiply that query's groups. Only fires for channel sessions,
        and get_chat_detail fetches one session at a time.
        """
        if is_widget_channel(channel):
            return None
        conversation = ChannelConversationRepository(self.db).get_by_session(session_id)
        return str(conversation.channel_account_id) if conversation else None

    def get_latest_bot_message(self, session_id: str | UUID) -> Optional[ChatHistory]:
        """Most recent bot reply in a session.

        The bot path persists its reply inside ChatAgent.get_response and never
        returns the row, so callers that need to annotate it (e.g. recording a
        delivery failure) read it back with this. Only 'bot' qualifies —
        'agent' is a human's message, never the AI's.

        Ordered by id, not created_at: created_at is a server default with
        coarse resolution, so two replies in the same second would tie and
        resolve arbitrarily.

        Caveat: this identifies the latest reply, not a specific one. Two turns
        processed concurrently on one session can read back each other's row.
        """
        if isinstance(session_id, str):
            session_id = UUID(session_id)
        return (
            self.db.query(ChatHistory)
            .filter(
                ChatHistory.session_id == session_id,
                ChatHistory.message_type == 'bot',
            )
            .order_by(ChatHistory.id.desc())
            .first()
        )

    def _update_session_sentiment(self, session_id) -> None:
        """Recompute and update the overall session sentiment from customer messages."""
        try:
            if isinstance(session_id, str):
                session_id = UUID(session_id)

            # Get all customer message sentiments for this session
            messages = self.db.query(
                ChatHistory.sentiment_score,
                ChatHistory.sentiment_label
            ).filter(
                ChatHistory.session_id == session_id,
                ChatHistory.message_type == 'user',
                ChatHistory.sentiment_score.isnot(None)
            ).all()

            scores = [m.sentiment_score for m in messages]
            labels = [m.sentiment_label for m in messages]

            overall_label, overall_score = compute_session_sentiment(scores, labels)

            if overall_label is not None:
                session = self.db.query(SessionToAgent).filter(
                    SessionToAgent.session_id == session_id
                ).first()
                if session:
                    session.sentiment_label = overall_label
                    session.sentiment_score = overall_score
                    self.db.commit()
        except Exception as e:
            logger.error(f"Error updating session sentiment: {str(e)}")
            self.db.rollback()

    async def get_session_history(self, session_id: str | UUID) -> List[ChatHistory]:
        """Get chat history for a session with joined relationships"""
        if isinstance(session_id, str):
            session_id = UUID(session_id)
        
        messages = (
            self.db.query(ChatHistory)
            .options(
                joinedload(ChatHistory.user),
                joinedload(ChatHistory.agent),
                joinedload(ChatHistory.attachments)
            )
            .filter(ChatHistory.session_id == session_id)
            # id breaks ties — see get_last_messages.
            .order_by(ChatHistory.created_at.asc(), ChatHistory.id.asc())
            .all()
        )
        
        # Generate signed URLs for S3 attachments
        if settings.S3_FILE_STORAGE:
            for message in messages:
                if message.attachments:
                    for attachment in message.attachments:
                        if attachment.file_url:
                            try:
                                signed_url = await get_s3_signed_url(attachment.file_url)
                                # Store the signed URL in a temporary attribute
                                attachment.file_url = signed_url
                            except Exception as e:
                                logger.error(f"Error generating signed URL for attachment {attachment.id}: {str(e)}")
                                
        
        return messages

    def get_last_messages(self, session_ids: List[UUID]) -> Dict[UUID, str]:
        """Map each session to its most recent customer-visible message, decrypted.

        One query for the whole page rather than one per session, and the single
        definition of "most recent" — created_at is transaction time, so messages
        written together share it exactly and id has to break the tie. Internal
        notes never appear in an inbox or customer preview.
        """
        if not session_ids:
            return {}

        ranked = (
            select(
                ChatHistory.session_id,
                ChatHistory.message,
                func.row_number().over(
                    partition_by=ChatHistory.session_id,
                    order_by=(ChatHistory.created_at.desc(), ChatHistory.id.desc()),
                ).label('rank')
            )
            .where(
                ChatHistory.session_id.in_(session_ids),
                ChatHistory.message_type != 'private_note',
            )
            .subquery()
        )

        rows = self.db.execute(
            select(ranked.c.session_id, ranked.c.message).where(ranked.c.rank == 1)
        ).all()
        return {session_id: message for session_id, message in rows}

    def get_user_history(self, user_id: str | UUID) -> List[ChatHistory]:
        """Get chat history for a user"""
        if isinstance(user_id, str):
            user_id = UUID(user_id)
            
        return self.db.query(ChatHistory).filter(
            ChatHistory.user_id == user_id
        ).order_by(ChatHistory.created_at.desc()).all()

    def get_recent_chats(
        self,
        skip: int = 0,
        limit: int = 20,
        agent_id: Optional[str | UUID] = None,
        status: Optional[str] = None,
        user_id: Optional[str | UUID] = None,
        user_groups: Optional[List[str]] = None,
        include_unassigned: bool = False,
        organization_id: Optional[str | UUID] = None,
        user_name: Optional[str] = None,
        filter_user_id: Optional[str | UUID] = None,
        customer_email: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> List[dict]:
        """Get recent chat overviews grouped by conversation"""
        # Convert string IDs to UUID if needed
        if agent_id and isinstance(agent_id, str):
            agent_id = UUID(agent_id)
        if user_id and isinstance(user_id, str):
            user_id = UUID(user_id)
        if organization_id and isinstance(organization_id, str):
            organization_id = UUID(organization_id)
        if user_groups:
            user_groups = [UUID(g) if isinstance(g, str) else g for g in user_groups]

        query = self.db.query(
            Customer.id.label('customer_id'),
            Customer.email.label('customer_email'),
            Customer.full_name.label('customer_full_name'),
            Agent.id.label('agent_id'),
            Agent.name.label('agent_name'),
            Agent.display_name.label('agent_display_name'),
            Agent.ai_replies_enabled.label('agent_ai_replies_enabled'),
            SessionToAgent.status.label('status'),
            SessionToAgent.channel.label('channel'),
            SessionToAgent.group_id.label('group_id'),
            # Who is handling the chat. Without these the list cannot tell an
            # AI-handled conversation from one a human has taken over — the
            # detail view has always known, the overview never did.
            SessionToAgent.user_id.label('user_id'),
            User.full_name.label('user_name'),
            func.max(ChatHistory.created_at).label('updated_at'),
            func.count(ChatHistory.id).label('message_count'),
            SessionToAgent.session_id.label('session_id')
        ).join(
            Agent, ChatHistory.agent_id == Agent.id
        ).join(
            Customer, ChatHistory.customer_id == Customer.id
        ).join(
            SessionToAgent, ChatHistory.session_id == SessionToAgent.session_id
        ).outerjoin(
            User, SessionToAgent.user_id == User.id
        )

        # Filter conditions
        if agent_id:
            query = query.filter(Agent.id == agent_id)
        
        # Filter by status if provided
        if status and status != 'all':
            # Handle comma-separated status values
            if ',' in status:
                status_values = [s.strip() for s in status.split(',')]
                query = query.filter(SessionToAgent.status.in_(status_values))
            else:
                query = query.filter(SessionToAgent.status == status)
        
        # Filter by organization
        if organization_id:
            query = query.filter(SessionToAgent.organization_id == organization_id)
        
        # Filter by user name
        if user_name:
            query = query.filter(User.full_name.ilike(f'%{user_name}%'))
        
        # Filter by specific user ID (for agent dropdown)
        if filter_user_id:
            if isinstance(filter_user_id, str):
                filter_user_id = UUID(filter_user_id)
            query = query.filter(SessionToAgent.user_id == filter_user_id)
        
        # Filter by customer email
        if customer_email:
            query = query.filter(Customer.email.ilike(f'%{customer_email}%'))
        
        # Filter by date range
        if date_from:
            query = query.filter(ChatHistory.created_at >= date_from)
        if date_to:
            query = query.filter(ChatHistory.created_at <= date_to)
        
        # Scope to what this user may see: their own sessions, their groups'
        # queue, and — with view_unassigned_chats — the unclaimed AI queue.
        # Callers who may see everything pass none of these.
        visibility = []
        if user_id:
            visibility.append(SessionToAgent.user_id == user_id)
        if user_groups:
            visibility.append(SessionToAgent.group_id.in_(user_groups))
        if include_unassigned:
            # Nobody has taken it yet — the AI is still handling it. group_id
            # is irrelevant: a chat transferred to another group is still
            # claimable, and it is exactly what "unassigned" means.
            visibility.append(SessionToAgent.user_id.is_(None))

        if visibility:
            query = query.filter(or_(*visibility))

        # Group by and order
        query = query.group_by(
            Customer.id,
            Customer.email,
            Customer.full_name,
            Agent.id,
            Agent.name,
            Agent.display_name,
            Agent.ai_replies_enabled,
            SessionToAgent.status,
            SessionToAgent.channel,
            SessionToAgent.group_id,
            SessionToAgent.user_id,
            User.full_name,
            SessionToAgent.session_id
        ).order_by(
            # Create a custom ordering to prioritize transferred conversations
            # Using direct SQL expression for the CASE statement with uppercase status values
            text("CASE WHEN session_to_agents.status = 'TRANSFERRED' THEN 0 "
                 "WHEN session_to_agents.status = 'OPEN' THEN 1 "
                 "ELSE 2 END"),
            # Then order by most recent activity
            func.max(ChatHistory.created_at).desc()
        ).offset(skip).limit(limit)

        results = query.all()
        # Previews are fetched for the returned page only. Inlining them as a
        # correlated subquery would evaluate once per session in the org, since the
        # LIMIT applies after grouping.
        last_messages = self.get_last_messages([r.session_id for r in results])
        workflow_states = dict(
            self.db.query(SessionToAgent.session_id, SessionToAgent.workflow_state)
            .filter(SessionToAgent.session_id.in_([r.session_id for r in results]))
            .all()
        ) if results else {}
        customer_metadata = dict(
            self.db.query(Customer.id, Customer.meta_data)
            .filter(Customer.id.in_([r.customer_id for r in results]))
            .all()
        ) if results else {}

        return [{
            'customer': {
                'id': r.customer_id,
                'email': CustomerRepository.display_email(r.customer_email),
                'full_name': r.customer_full_name,
                'meta_data': customer_metadata.get(r.customer_id),
            },
            'agent': {
                'id': r.agent_id,
                'name': r.agent_name,
                'display_name': r.agent_display_name,
                'ai_replies_enabled': r.agent_ai_replies_enabled,
            },
            'ai_auto_reply': self.effective_ai_auto_reply_from_state(
                workflow_states.get(r.session_id), r.agent_ai_replies_enabled
            ),
            'last_message': last_messages.get(r.session_id),
            'updated_at': r.updated_at,
            'message_count': r.message_count,
            'status': r.status,
            'channel': r.channel,
            'group_id': str(r.group_id) if r.group_id else None,
            'user_id': r.user_id,
            'user_name': r.user_name,
            'session_id': r.session_id
        } for r in results]

    async def check_session_access(
        self,
        session_id: str | UUID,
        user_id: Optional[str | UUID],
        user_groups: Optional[List[str]],
        include_unassigned: bool = False
    ) -> bool:
        """Check if user has access to a chat session.

        Mirrors the visibility filter in get_recent_chats — the two must agree,
        or a session shows in the list and 404s when opened. A None user_id
        means "this caller has no assigned-chat grant"; it must never be
        compared against session.user_id, since both being NULL would silently
        hand over every unclaimed session.
        """
        if isinstance(session_id, str):
            session_id = UUID(session_id)
        if isinstance(user_id, str):
            user_id = UUID(user_id)

        session = (
            self.db.query(SessionToAgent)
            .filter(SessionToAgent.session_id == session_id)
            .first()
        )

        if not session:
            return False

        if include_unassigned and session.user_id is None:
            return True

        if user_id is not None and session.user_id == user_id:
            return True

        return bool(
            session.group_id and user_groups and str(session.group_id) in user_groups
        )

    async def get_chat_detail(
        self,
        session_id: str | UUID,
        org_id: str | UUID
    ) -> Optional[dict]:
        """Get detailed chat information for a session"""
        if isinstance(session_id, str):
            session_id = UUID(session_id)
        if isinstance(org_id, str):
            org_id = UUID(org_id)

        result = (
            self.db.query(
                Customer.id.label('customer_id'),
                Customer.email.label('customer_email'),
                Customer.full_name.label('customer_full_name'),
                Customer.meta_data.label('customer_meta_data'),
                Agent.id.label('agent_id'),
                Agent.name.label('agent_name'),
                Agent.display_name.label('agent_display_name'),
                Agent.ai_replies_enabled.label('agent_ai_replies_enabled'),
                Agent.allow_attachments.label('agent_allow_attachments'),
                Agent.allowed_attachment_types.label('agent_allowed_attachment_types'),
                SessionToAgent.status.label('status'),
                SessionToAgent.channel.label('channel'),
                SessionToAgent.group_id.label('group_id'),
                SessionToAgent.session_id.label('session_id'),
                SessionToAgent.user_id.label('user_id'),
                User.full_name.label('user_name'),
                func.min(ChatHistory.created_at).label('created_at'),
                func.max(ChatHistory.created_at).label('updated_at')
            )
            .join(Agent, ChatHistory.agent_id == Agent.id)
            .join(Customer, ChatHistory.customer_id == Customer.id)
            .join(SessionToAgent, ChatHistory.session_id == SessionToAgent.session_id)
            .outerjoin(User, SessionToAgent.user_id == User.id)
            .filter(
                ChatHistory.session_id == session_id,
                SessionToAgent.organization_id == org_id
            )
            .group_by(
                # Customer.meta_data is deliberately NOT grouped: Postgres' `json` type
                # has no equality operator, so grouping by it raises "could not identify
                # an equality operator for type json". Customer.id (the PK) is already
                # grouped, so Postgres' functional-dependency rule lets other columns of
                # the same table (email, full_name, meta_data) be selected ungrouped.
                Customer.id,
                Customer.email,
                Customer.full_name,
                Agent.id,
                Agent.name,
                Agent.display_name,
                Agent.ai_replies_enabled,
                Agent.allow_attachments,
                SessionToAgent.status,
                SessionToAgent.channel,
                SessionToAgent.group_id,
                SessionToAgent.session_id,
                SessionToAgent.user_id,
                User.full_name
            )
            .first()
        )

        if not result:
            return None

        # Get messages for the session
        messages = await self.get_session_history(session_id)
        
        # Build messages list with attachments
        messages_list = []
        for msg in messages:
            attributes = msg.attributes or {}
            msg_dict = {
                'id': msg.id,
                'message': msg.message,
                'message_type': msg.message_type,
                'created_at': msg.created_at,
                'session_id': msg.session_id,
                'client_message_id': attributes.get('client_message_id'),
                'attributes': attributes,
                'user_name': msg.user.full_name if msg.user else None,
                'agent_name': msg.agent.display_name or msg.agent.name if msg.agent else None,
            }
            
            # Add attachments with file info if they exist
            if msg.attachments:
                attachments = []
                for attachment in msg.attachments:
                    att_dict = {
                        'id': attachment.id,
                        'filename': attachment.filename,
                        'file_url': (
                            attachment.file_url
                            if settings.S3_FILE_STORAGE
                            else local_attachment_download_url(
                                attachment.file_url.lstrip('/').removeprefix('uploads/')
                            )
                        ),
                        'content_type': attachment.content_type,
                        'file_size': attachment.file_size
                    }
                    attachments.append(att_dict)
                msg_dict['attachments'] = attachments
            
            messages_list.append(msg_dict)

        session = self.get_session_by_id(session_id, org_id)
        state = getattr(session, 'workflow_state', None) if session else None
        raw_tags = state.get('conversation_tags', []) if isinstance(state, dict) else []
        tags = [tag for tag in raw_tags if isinstance(tag, str)] if isinstance(raw_tags, list) else []
        
        # Convert result to dict
        return {
            'customer': {
                'id': result.customer_id,
                'email': CustomerRepository.display_email(result.customer_email),
                'full_name': result.customer_full_name,
                'meta_data': result.customer_meta_data
            },
            'agent': {
                'id': result.agent_id,
                'name': result.agent_name,
                'display_name': result.agent_display_name,
                'ai_replies_enabled': result.agent_ai_replies_enabled,
                'allow_attachments': bool(result.agent_allow_attachments),
                'allowed_attachment_types': result.agent_allowed_attachment_types,
            },
            'status': result.status,
            'channel': result.channel,
            'channel_account_id': self._channel_account_id(result.channel, result.session_id),
            'group_id': str(result.group_id) if result.group_id else None,
            'session_id': result.session_id,
            'user_id': result.user_id,
            'user_name': result.user_name,
            'ai_auto_reply': self.effective_ai_auto_reply(
                session, result.agent_ai_replies_enabled
            ),
            'tags': tags,
            'created_at': result.created_at,
            'updated_at': result.updated_at,
            'messages': messages_list
        }

    def get_session_by_id(
        self,
        session_id: UUID,
        org_id: UUID
    ) -> Optional[SessionToAgent]:
        """Fetch a single SessionToAgent row scoped to the organisation.

        Returns None when the session does not exist or belongs to a different
        organisation (caller should surface this as a 404 rather than a 403
        so as not to reveal whether the id exists elsewhere).
        """
        return (
            self.db.query(SessionToAgent)
            .filter(
                SessionToAgent.session_id == session_id,
                SessionToAgent.organization_id == org_id,
            )
            .first()
        )

    def set_ai_auto_reply(
        self,
        session_id: UUID,
        org_id: UUID,
        enabled: bool,
    ) -> bool:
        """Persist the AI auto-reply toggle for *session_id*.

        The setting is stored inside the session's ``workflow_state`` JSON
        column under the key ``"ai_auto_reply"``.  This avoids a schema
        migration while still being durable and queryable.

        TODO: once a dedicated ``ai_auto_reply`` boolean column is added to
        ``session_to_agents``, write directly to that column instead.

        Returns True on success, False when the session was not found.
        """
        session = self.get_session_by_id(session_id, org_id)
        if not session:
            return False
        try:
            # workflow_state may be None if never written before
            state: dict = dict(session.workflow_state or {})
            state["ai_auto_reply"] = enabled
            session.workflow_state = state
            self.db.commit()
            return True
        except Exception as e:
            logger.error(f"Error setting ai_auto_reply for session {session_id}: {e}")
            self.db.rollback()
            raise

    def get_open_counts_by_channel(self, org_id: UUID | str) -> dict:
        """Return open/transferred session counts grouped by channel name.

        Used by the Inbox page to display per-channel badges without an
        expensive per-channel query.  The dict has the shape::

            {"web": 3, "whatsapp": 1, ...}

        Both OPEN and TRANSFERRED sessions are counted — a transferred chat
        still needs attention even though a human is nominally on it.
        """
        if isinstance(org_id, str):
            org_id = UUID(org_id)

        from app.models.session_to_agent import SessionStatus as _SS

        rows = (
            self.db.query(
                SessionToAgent.channel,
                func.count(SessionToAgent.session_id).label("cnt"),
            )
            .filter(
                SessionToAgent.organization_id == org_id,
                SessionToAgent.status.in_([_SS.OPEN, _SS.TRANSFERRED]),
            )
            .group_by(SessionToAgent.channel)
            .all()
        )
        return {row.channel: row.cnt for row in rows}

