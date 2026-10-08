"""
Copyright 2024-2026 Komi AI

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

import uuid

from app.crm.base import LeadPayload, summarize_provider_error
from app.crm.mapping import (
    build_customer_payload, build_lead_payload, build_note_body, split_name,
)
from app.models.customer import Customer
from app.models.lead_capture import LeadCaptureConfig, LeadCaptureResponse


def _response(**field_values) -> LeadCaptureResponse:
    response = LeadCaptureResponse(field_values=field_values, summary="Wants a demo")
    response.id = uuid.uuid4()
    return response


def _config_with_custom_label() -> LeadCaptureConfig:
    return LeadCaptureConfig(fields=[
        {"key": "email", "standard": True, "enabled": True},
        {"key": "custom_1", "standard": False, "label": "Team size", "enabled": True},
    ])


class TestBuildLeadPayload:

    def test_standard_and_custom_fields(self):
        payload = build_lead_payload(
            _response(email="Jane@Acme.COM", name="Jane Doe", company="Acme",
                      phone="+15550100", custom_1="40"),
            _config_with_custom_label(),
            None,
        )
        assert payload.email == "jane@acme.com"  # normalized for dedupe
        assert payload.name == "Jane Doe"
        assert payload.company == "Acme"
        assert payload.phone == "+15550100"
        assert payload.custom_fields == {"Team size": "40"}
        assert payload.summary == "Wants a demo"

    def test_customer_backfills_blanks(self):
        customer = Customer(email="known@acme.com", full_name="Known Name",
                            phone="+15550999",
                            lead_source={"page_url": "https://acme.com/pricing"})
        payload = build_lead_payload(_response(email=""), None, customer)
        assert payload.email == "known@acme.com"
        assert payload.name == "Known Name"
        assert payload.phone == "+15550999"
        assert payload.source_url == "https://acme.com/pricing"

    def test_unlabeled_custom_field_keeps_its_key(self):
        payload = build_lead_payload(_response(custom_2="yes"), None, None)
        assert payload.custom_fields == {"custom_2": "yes"}

    def test_empty_custom_values_dropped(self):
        payload = build_lead_payload(_response(custom_1="", custom_2=None), None, None)
        assert payload.custom_fields == {}


class TestBuildCustomerPayload:

    def test_from_customer_fields(self):
        customer = Customer(
            id=uuid.uuid4(), email="Nadia@Example.COM", full_name="Nadia Rahman",
            phone="+15550100", meta_data={"plan": "trial", "empty": ""},
            lead_source={"page_url": "https://acme.com/pricing"})
        payload = build_customer_payload(customer)
        assert payload.email == "nadia@example.com"   # normalized for dedupe
        assert payload.name == "Nadia Rahman"
        assert payload.phone == "+15550100"
        assert payload.custom_fields == {"plan": "trial"}   # blank dropped
        assert payload.source_url == "https://acme.com/pricing"

    def test_handles_missing_optional_fields(self):
        customer = Customer(id=uuid.uuid4(), email="x@y.com")
        payload = build_customer_payload(customer)
        assert payload.email == "x@y.com"
        assert payload.custom_fields == {}
        assert payload.source_url is None
        assert payload.summary is None

    def test_summary_passthrough(self):
        customer = Customer(id=uuid.uuid4(), email="x@y.com")
        payload = build_customer_payload(customer, summary="Wants a demo")
        assert payload.summary == "Wants a demo"


class TestSummarizeProviderError:

    def test_strips_html_collapses_and_bounds(self):
        s = summarize_provider_error("<b>Bad</b>\n  request  " + "x" * 500)
        assert "<b>" not in s
        assert "\n" not in s and "  " not in s
        assert len(s) <= 200

    def test_handles_none(self):
        assert summarize_provider_error(None) == ""


class TestSplitName:

    def test_first_and_last(self):
        assert split_name("Jane Doe") == ("Jane", "Doe")

    def test_multi_part_puts_tail_as_last(self):
        assert split_name("Jane van der Berg") == ("Jane van der", "Berg")

    def test_single_name(self):
        assert split_name("Cher") == ("Cher", "")

    def test_empty(self):
        assert split_name(None) == ("", "")
        assert split_name("  ") == ("", "")


class TestBuildNoteBody:

    def test_full_note_is_labelled_html(self):
        body = build_note_body(LeadPayload(
            lead_response_id=uuid.uuid4(), email="a@b.c",
            summary="40-person fintech, wants a demo",
            custom_fields={"Team size": "40"},
            source_url="https://acme.com/pricing",
        ))
        # HTML with <br> so the summary is a distinct, labelled line (notes render as HTML).
        assert "<br>" in body
        assert "<b>AI summary:</b> 40-person fintech, wants a demo" in body
        assert "<b>Team size:</b> 40" in body
        assert 'Captured on: <a href="https://acme.com/pricing">' in body

    def test_minimal_note(self):
        body = build_note_body(LeadPayload(lead_response_id=uuid.uuid4(), email="a@b.c"))
        assert body == "<b>Lead captured by Komi AI</b>"

    def test_non_http_source_url_is_not_a_link(self):
        body = build_note_body(LeadPayload(
            lead_response_id=uuid.uuid4(), email="a@b.c",
            source_url="javascript:alert(1)"))
        assert "<a href" not in body           # no clickable javascript: link
        assert "Captured on:" in body

    def test_http_source_url_is_a_link(self):
        body = build_note_body(LeadPayload(
            lead_response_id=uuid.uuid4(), email="a@b.c",
            source_url="https://acme.com/x"))
        assert '<a href="https://acme.com/x">' in body

    def test_dynamic_values_are_escaped(self):
        body = build_note_body(LeadPayload(
            lead_response_id=uuid.uuid4(), email="a@b.c",
            summary="wants <script>alert(1)</script> & more"))
        assert "<script>" not in body
        assert "&lt;script&gt;" in body and "&amp;" in body
