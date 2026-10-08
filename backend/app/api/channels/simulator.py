"""
Copyright 2024-2026 Komi AI

Multi-Channel Testing Simulator Endpoint.
Allows simulating incoming customer messages from WhatsApp, Instagram, Telegram,
Messenger, LINE, TikTok, and SMS into the real Komi AI engine, routing to stores
and appearing live in the Conversations Workbench (会话中心).
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.channels import InboundMessage
from app.core.auth import get_current_organization, require_any_permission, INBOX_PERMISSIONS
from app.core.logger import get_logger
from app.database import get_db
from app.models.channels import ChannelAccount, ChannelType
from app.models.organization import Organization
from app.models.user import User
from app.repositories.agent import AgentRepository
from app.repositories.channels import ChannelAccountRepository, AgentChannelConfigRepository
from app.repositories.chat import ChatRepository
from app.services.channel_chat import process_channel_message

router = APIRouter()
logger = get_logger(__name__)


class ChannelSimulateRequest(BaseModel):
    channel_type: str = Field(..., description="whatsapp, instagram, messenger, telegram, line, tiktok, sms")
    store_name: Optional[str] = Field(default="欧美自营旗舰店", description="Associated store name")
    customer_name: Optional[str] = Field(default="Sarah Jenkins", description="Customer full name")
    customer_email: Optional[str] = Field(default="sarah.jenkins@example.com", description="Customer email")
    customer_phone: Optional[str] = Field(default="+1 (555) 234-5678", description="Customer phone number")
    message: str = Field(..., description="Message text sent by customer")
    agent_id: Optional[str] = Field(default=None, description="Optional target agent ID")


class ChannelSimulateResponse(BaseModel):
    ok: bool
    session_id: str
    channel_type: str
    store_name: str
    customer_name: str
    customer_message: str
    ai_response: Optional[str] = None
    agent_name: Optional[str] = None
    created_at: str


@router.post("/simulate", response_model=ChannelSimulateResponse)
async def simulate_channel_message(
    payload: ChannelSimulateRequest,
    current_user: User = Depends(require_any_permission("manage_organization", *INBOX_PERMISSIONS)),
    organization: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db),
):
    """Simulate a customer sending a message through any overseas channel.
    
    Routes through the real Agent & Knowledge pipeline, broadcasts to
    Conversations Workbench via Socket.IO, and returns the AI reply.
    """
    raw_channel = payload.channel_type.lower().strip()
    valid_channels = {
        "whatsapp": ChannelType.WHATSAPP.value,
        "instagram": ChannelType.INSTAGRAM.value,
        "messenger": ChannelType.MESSENGER.value,
        "telegram": ChannelType.TELEGRAM.value,
        "line": ChannelType.LINE.value,
        "sms": ChannelType.SMS.value,
        "tiktok": "tiktok",
    }
    channel_type = valid_channels.get(raw_channel, ChannelType.WHATSAPP.value)

    # 1. Resolve or auto-provision a simulator ChannelAccount
    account_repo = ChannelAccountRepository(db)
    external_account_id = f"sim_{channel_type}_{organization.id}"
    
    account = account_repo.get_by_external_id(channel_type, external_account_id)
    if account is None or account.organization_id != organization.id:
        account = ChannelAccount(
            organization_id=organization.id,
            channel_type=channel_type,
            external_account_id=external_account_id,
            display_name=f"{channel_type.capitalize()} - {payload.store_name} (模拟通道)",
            encrypted_credentials={"simulated": True, "store_name": payload.store_name},
            is_active=True,
        )
        db.add(account)
        db.commit()
        db.refresh(account)

    # 2. Resolve Agent
    agent_repo = AgentRepository(db)
    target_agent = None
    if payload.agent_id:
        try:
            target_agent = agent_repo.get_agent(uuid.UUID(payload.agent_id))
        except Exception:
            target_agent = None
    if target_agent is None:
        agents = agent_repo.get_active_agents_by_org(str(organization.id))
        if agents:
            target_agent = agents[0]

    if target_agent is None:
        raise HTTPException(status_code=400, detail="组织下尚未创建任何可用 AI 智能体，请先在智能体中心创建一个智能体。")

    # 3. Ensure AgentChannelConfig
    config_repo = AgentChannelConfigRepository(db)
    config = config_repo.get_by_account(account.id)
    if config is None or config.agent_id != target_agent.id:
        config_repo.set_agent(account.id, target_agent.id)

    # 4. Construct normalized InboundMessage
    clean_id = (payload.customer_phone or payload.customer_email or payload.customer_name or "cust_1").strip()
    clean_id = "".join(c for c in clean_id if c.isalnum() or c in "@_.-")
    external_user_id = f"sim_{clean_id}"
    external_conv_id = f"conv_{channel_type}_{clean_id}"

    inbound = InboundMessage(
        external_account_id=external_account_id,
        external_conversation_id=external_conv_id,
        external_user_id=external_user_id,
        external_message_id=f"msg_sim_{uuid.uuid4().hex[:12]}",
        text=payload.message.strip(),
        profile={
            "name": payload.customer_name.strip(),
            "email": payload.customer_email.strip() if payload.customer_email else None,
            "phone": payload.customer_phone.strip() if payload.customer_phone else None,
            "store_name": payload.store_name.strip(),
        },
        timestamp=datetime.now(timezone.utc),
    )

    # 5. Process through the full Komi AI pipeline
    await process_channel_message(account.id, inbound)

    # 6. Query resulting session and latest message to return immediate preview
    from app.models.session_to_agent import SessionToAgent
    from app.models.chat import Chat
    from app.models.customer import Customer

    customer_row = db.query(Customer).filter(
        Customer.organization_id == organization.id,
        Customer.full_name == payload.customer_name.strip(),
    ).order_by(Customer.created_at.desc()).first()

    session_id_str = ""
    ai_reply_text = "AI 智能体已接单并在会话中心同步。"

    if customer_row:
        # Check customer meta_data store_name
        meta = dict(customer_row.meta_data or {})
        if payload.store_name and meta.get("store_name") != payload.store_name:
            meta["store_name"] = payload.store_name
            customer_row.meta_data = meta
            db.commit()

        session_obj = db.query(SessionToAgent).filter(
            SessionToAgent.customer_id == customer_row.id
        ).order_by(SessionToAgent.updated_at.desc()).first()
        
        if session_obj:
            session_id_str = str(session_obj.session_id)
            # Find latest bot message
            latest_bot_msg = db.query(Chat).filter(
                Chat.session_id == session_id_str,
                Chat.message_type.in_(["bot", "agent", "system"]),
            ).order_by(Chat.created_at.desc()).first()
            if latest_bot_msg and latest_bot_msg.message:
                ai_reply_text = latest_bot_msg.message

    return ChannelSimulateResponse(
        ok=True,
        session_id=session_id_str or external_conv_id,
        channel_type=channel_type,
        store_name=payload.store_name,
        customer_name=payload.customer_name,
        customer_message=payload.message,
        ai_response=ai_reply_text,
        agent_name=target_agent.name,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
