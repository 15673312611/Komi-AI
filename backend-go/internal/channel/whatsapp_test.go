package channel

import (
	"net/http"
	"testing"
)

func TestNormalizeWhatsAppPhone(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{"decorated e164", "+91 12345-67890", "+911234567890"},
		{"bare digits rejected", "911234567890", ""},
		{"zero country code rejected", "+01 23456789", ""},
		{"too short rejected", "+1234567", ""},
		{"too long rejected", "+1234567890123456", ""},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := NormalizeWhatsAppPhone(test.input); got != test.want {
				t.Fatalf("NormalizeWhatsAppPhone(%q) = %q, want %q", test.input, got, test.want)
			}
		})
	}
}

func TestValidateWhatsAppTemplate(t *testing.T) {
	base := map[string]any{
		"name": "order_update", "language": "en_US", "status": "APPROVED", "category": "UTILITY",
	}
	if _, err := ValidateWhatsAppTemplate([]map[string]any{base}, "order_update", "en_US", true); err != nil {
		t.Fatalf("approved utility template rejected: %v", err)
	}
	marketing := map[string]any{"name": "order_update", "language": "en_US", "status": "APPROVED", "category": "MARKETING"}
	err := func() error {
		_, err := ValidateWhatsAppTemplate([]map[string]any{marketing}, "order_update", "en_US", true)
		return err
	}()
	if policy, ok := err.(*WhatsAppTemplateError); !ok || policy.Status != http.StatusBadRequest {
		t.Fatalf("marketing template error = %#v, want HTTP 400 policy error", err)
	}
	if _, err := ValidateWhatsAppTemplate([]map[string]any{{"name": "order_update", "language": "en_US", "status": "PENDING", "category": "UTILITY"}}, "order_update", "en_US", false); err == nil {
		t.Fatal("pending template was accepted")
	}
}

func TestRenderWhatsAppTemplateBody(t *testing.T) {
	template := map[string]any{
		"components": []any{map[string]any{"type": "BODY", "text": "Hi {{1}}, order {{2}} shipped."}},
	}
	components := []map[string]any{{
		"type":       "body",
		"parameters": []any{map[string]any{"type": "text", "text": "Priya"}, map[string]any{"type": "text", "text": "A-12"}},
	}}
	if got := RenderWhatsAppTemplateBody(template, components); got != "Hi Priya, order A-12 shipped." {
		t.Fatalf("rendered body = %q", got)
	}
	if got := WhatsAppID("+911234567890"); got != "911234567890" {
		t.Fatalf("WhatsAppID = %q", got)
	}
}
