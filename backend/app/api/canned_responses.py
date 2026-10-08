"""Organization-scoped canned responses for the inbox composer."""

from copy import deepcopy
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.auth import INBOX_PERMISSIONS, get_current_user, has_any_permission, require_permissions
from app.database import get_db
from app.models.organization import Organization
from app.models.user import User
from app.utils.sanitize import sanitize_message

router = APIRouter()

# These are safe, generic starting points for a new organization. They only
# become persisted when an administrator creates, changes, or removes one.
DEFAULT_RESPONSES = [
    {"id": "default-greeting", "category": "问候", "title": "标准欢迎语", "shortcut": "/hello", "content": "您好，{{customer_name}}！请问有什么可以帮您处理？"},
    {"id": "default-shipping", "category": "物流", "title": "物流核实说明", "shortcut": "/shipping", "content": "我正在为您核实订单 {{order_number}} 的最新物流信息，确认后会尽快回复您。"},
    {"id": "default-return", "category": "售后", "title": "退换货协助", "shortcut": "/return", "content": "我可以协助您核实退换货条件。请提供订单号和商品情况，我会为您继续处理。"},
    {"id": "default-closing", "category": "结束", "title": "服务结束语", "shortcut": "/bye", "content": "感谢您的联系。后续如有问题，欢迎随时再次咨询。"},
]


class CannedResponsePayload(BaseModel):
    category: str
    title: str
    content: str
    shortcut: Optional[str] = None


class CannedResponse(CannedResponsePayload):
    id: str


def _normalise_text(value: str, label: str, maximum: int, *, multiline: bool = False) -> str:
    if not isinstance(value, str):
        raise HTTPException(status_code=422, detail=f"{label} must be text")
    clean = sanitize_message(value).strip()
    if not multiline:
        clean = " ".join(clean.split())
    if not clean:
        raise HTTPException(status_code=422, detail=f"{label} is required")
    if len(clean) > maximum:
        raise HTTPException(status_code=422, detail=f"{label} cannot exceed {maximum} characters")
    return clean


def _normalise_payload(payload: CannedResponsePayload) -> dict:
    shortcut = (payload.shortcut or "").strip()
    if shortcut:
        if not shortcut.startswith('/') or len(shortcut) > 40 or any(char.isspace() for char in shortcut):
            raise HTTPException(status_code=422, detail="Shortcut must start with /, contain no spaces, and be at most 40 characters")
    return {
        "category": _normalise_text(payload.category, "Category", 64),
        "title": _normalise_text(payload.title, "Title", 120),
        "content": _normalise_text(payload.content, "Content", 8000, multiline=True),
        "shortcut": shortcut or None,
    }


def _responses_for(organization: Organization) -> list[dict]:
    settings = organization.settings if isinstance(organization.settings, dict) else {}
    stored = settings.get("canned_responses")
    if not isinstance(stored, list):
        return deepcopy(DEFAULT_RESPONSES)
    responses = []
    for item in stored:
        if not isinstance(item, dict) or not isinstance(item.get("id"), str):
            continue
        try:
            response = _normalise_payload(CannedResponsePayload(**item))
        except (HTTPException, ValueError, TypeError):
            continue
        responses.append({"id": item["id"], **response})
    return responses


def _save_responses(db: Session, organization: Organization, responses: list[dict]) -> None:
    settings = dict(organization.settings) if isinstance(organization.settings, dict) else {}
    settings["canned_responses"] = responses
    organization.settings = settings
    db.commit()


def _require_inbox_access(current_user: User) -> None:
    if not has_any_permission(current_user, INBOX_PERMISSIONS):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")


@router.get("", response_model=list[CannedResponse])
async def list_canned_responses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_inbox_access(current_user)
    organization = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    return _responses_for(organization)


@router.post("", response_model=CannedResponse, status_code=status.HTTP_201_CREATED)
async def create_canned_response(
    payload: CannedResponsePayload,
    current_user: User = Depends(require_permissions("manage_organization")),
    db: Session = Depends(get_db),
):
    organization = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    responses = _responses_for(organization)
    response = {"id": str(uuid4()), **_normalise_payload(payload)}
    if response["shortcut"] and any(item.get("shortcut") == response["shortcut"] for item in responses):
        raise HTTPException(status_code=409, detail="Shortcut already exists")
    responses.append(response)
    _save_responses(db, organization, responses)
    return response


@router.put("/{response_id}", response_model=CannedResponse)
async def update_canned_response(
    response_id: str,
    payload: CannedResponsePayload,
    current_user: User = Depends(require_permissions("manage_organization")),
    db: Session = Depends(get_db),
):
    organization = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    responses = _responses_for(organization)
    index = next((i for i, item in enumerate(responses) if item["id"] == response_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Canned response not found")
    updated = {"id": response_id, **_normalise_payload(payload)}
    if updated["shortcut"] and any(item["id"] != response_id and item.get("shortcut") == updated["shortcut"] for item in responses):
        raise HTTPException(status_code=409, detail="Shortcut already exists")
    responses[index] = updated
    _save_responses(db, organization, responses)
    return updated


@router.delete("/{response_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_canned_response(
    response_id: str,
    current_user: User = Depends(require_permissions("manage_organization")),
    db: Session = Depends(get_db),
):
    organization = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    responses = _responses_for(organization)
    remaining = [item for item in responses if item["id"] != response_id]
    if len(remaining) == len(responses):
        raise HTTPException(status_code=404, detail="Canned response not found")
    _save_responses(db, organization, remaining)

