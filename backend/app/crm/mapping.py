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

import html
from typing import Optional, Tuple

from app.crm.base import LeadPayload
from app.models.customer import Customer
from app.models.lead_capture import LeadCaptureConfig, LeadCaptureResponse

# Standard field keys the agent collects; everything else is a custom field.
_STANDARD_KEYS = {"email", "name", "company", "phone"}


def _payload_from_values(
    values: dict,
    customer: Optional[Customer],
    config: Optional[LeadCaptureConfig],
    summary: Optional[str],
    ref_id,
) -> LeadPayload:
    """Fold captured field values into the provider-agnostic push payload.

    `values` holds what the agent extracted conversationally (email/name/
    company/phone + custom_N); the Customer row backfills anything blank. Custom
    answers are labeled from the agent's field config. Company has no Customer
    column, so it comes from the captured values only.
    """
    values = values or {}
    email = (values.get("email") or (customer.email if customer else "") or "").strip().lower()

    labels = _custom_field_labels(config)
    custom_fields = {
        labels.get(key, key): str(value)
        for key, value in values.items()
        if key not in _STANDARD_KEYS and value not in (None, "")
    }

    lead_source = (customer.lead_source if customer else None) or {}

    return LeadPayload(
        lead_response_id=ref_id,
        email=email,
        name=_first_truthy(values.get("name"), customer.full_name if customer else None),
        company=values.get("company") or None,
        phone=_first_truthy(values.get("phone"), customer.phone if customer else None),
        summary=summary,
        custom_fields=custom_fields,
        source_url=lead_source.get("page_url"),
    )


def build_lead_payload(
    response: LeadCaptureResponse,
    config: Optional[LeadCaptureConfig],
    customer: Optional[Customer],
) -> LeadPayload:
    """Auto path: fold one captured lead response into the push payload."""
    return _payload_from_values(
        response.field_values, customer, config, response.summary, response.id)


def build_customer_payload(
    customer: Customer,
    attributes: Optional[dict] = None,
    summary: Optional[str] = None,
    config: Optional[LeadCaptureConfig] = None,
) -> LeadPayload:
    """Manual "Sync now": build from the person's captured attributes (the same
    merged field_values the People drawer shows) so name/company/phone/custom
    answers all sync — not just the sparse Customer columns. Integrator-supplied
    meta_data is folded in as extra custom fields."""
    payload = _payload_from_values(attributes, customer, config, summary, customer.id)
    meta = customer.meta_data if isinstance(customer.meta_data, dict) else {}
    for key, value in meta.items():
        if value not in (None, "") and str(key) not in payload.custom_fields:
            payload.custom_fields[str(key)] = str(value)
    return payload


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
    custom answers, and where the lead came from. Shared across providers.

    Returns HTML — both HubSpot (hs_note_body) and Pipedrive (note content)
    render notes as HTML, so plain newlines would collapse and run the summary
    into the header. Labelled lines keep the AI summary unmistakable; dynamic
    values are escaped."""
    lines = ["<b>Lead captured by ChatterMate</b>"]
    if payload.summary:
        lines.append(f"<b>AI summary:</b> {html.escape(payload.summary)}")
    for label, value in (payload.custom_fields or {}).items():
        lines.append(f"<b>{html.escape(str(label))}:</b> {html.escape(str(value))}")
    if payload.source_url:
        url = html.escape(payload.source_url)
        # Only render an anchor for http(s); a javascript:/data: page_url would
        # otherwise become a clickable link in the CRM note.
        if payload.source_url.lower().startswith(("http://", "https://")):
            lines.append(f'Captured on: <a href="{url}">{url}</a>')
        else:
            lines.append(f"Captured on: {url}")
    return "<br>".join(lines)


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
