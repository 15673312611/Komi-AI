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

from typing import Optional, Tuple

from app.crm.base import LeadPayload
from app.models.customer import Customer
from app.models.lead_capture import LeadCaptureConfig, LeadCaptureResponse

# Standard field keys the agent collects; everything else is a custom field.
_STANDARD_KEYS = {"email", "name", "company", "phone"}


def build_lead_payload(
    response: LeadCaptureResponse,
    config: Optional[LeadCaptureConfig],
    customer: Optional[Customer],
) -> LeadPayload:
    """Fold a captured lead into the provider-agnostic push payload.

    field_values holds what the agent extracted conversationally; the Customer
    row backfills anything blank (it may know the email/phone from an earlier
    session). Custom answers are labeled from the agent's field config.
    """
    values = response.field_values or {}
    email = (values.get("email") or (customer.email if customer else "") or "").strip().lower()

    labels = _custom_field_labels(config)
    custom_fields = {
        labels.get(key, key): str(value)
        for key, value in values.items()
        if key not in _STANDARD_KEYS and value not in (None, "")
    }

    lead_source = (customer.lead_source if customer else None) or {}

    return LeadPayload(
        lead_response_id=response.id,
        email=email,
        name=_first_truthy(values.get("name"), customer.full_name if customer else None),
        company=values.get("company") or None,
        phone=_first_truthy(values.get("phone"), customer.phone if customer else None),
        summary=response.summary,
        custom_fields=custom_fields,
        source_url=lead_source.get("page_url"),
    )


def build_customer_payload(customer: Customer) -> LeadPayload:
    """Build a push payload straight from a person (manual "Sync now"), for a
    customer that may have no captured-lead row. meta_data holds integrator-set
    attributes, surfaced as custom fields."""
    meta = customer.meta_data if isinstance(customer.meta_data, dict) else {}
    custom_fields = {str(k): str(v) for k, v in meta.items() if v not in (None, "")}
    lead_source = customer.lead_source if isinstance(customer.lead_source, dict) else {}
    return LeadPayload(
        lead_response_id=customer.id,   # metadata only; no lead row exists here
        email=(customer.email or "").strip().lower(),
        name=(customer.full_name or None),
        company=None,
        phone=(customer.phone or None),
        summary=None,
        custom_fields=custom_fields,
        source_url=lead_source.get("page_url"),
    )


def split_name(name: Optional[str]) -> Tuple[str, str]:
    """Best-effort (first, last) split for CRMs with separate name fields."""
    if not name or not name.strip():
        return "", ""
    parts = name.strip().split()
    if len(parts) == 1:
        return parts[0], ""
    return " ".join(parts[:-1]), parts[-1]


def build_note_body(payload: LeadPayload) -> str:
    """The context note attached to the CRM record: AI qualification summary,
    custom answers, and where the lead came from. Shared across providers."""
    lines = ["Lead captured by ChatterMate"]
    if payload.summary:
        lines += ["", payload.summary]
    if payload.custom_fields:
        lines.append("")
        lines += [f"{label}: {value}" for label, value in payload.custom_fields.items()]
    if payload.source_url:
        lines += ["", f"Captured on: {payload.source_url}"]
    return "\n".join(lines)


def _custom_field_labels(config: Optional[LeadCaptureConfig]) -> dict:
    """key -> human label for the agent's configured custom fields."""
    if config is None or not config.fields:
        return {}
    return {
        f["key"]: f.get("label") or f["key"]
        for f in config.fields
        if isinstance(f, dict) and f.get("key")
    }


def _first_truthy(*values: Optional[str]) -> Optional[str]:
    for value in values:
        if value and str(value).strip():
            return str(value).strip()
    return None
