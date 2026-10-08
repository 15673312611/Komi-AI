package realtime

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/komi/komi/backend-go/internal/config"
)

func TestSocketIOHandlerCompletesEngineHandshake(t *testing.T) {
	server := New(Dependencies{Config: config.Config{CORSOrigins: []string{"http://localhost:5173"}}})
	defer server.Close()

	req := httptest.NewRequest(http.MethodGet, "/socket.io/?EIO=4&transport=polling", nil)
	res := httptest.NewRecorder()
	server.Handler().ServeHTTP(res, req)
	if res.Code != http.StatusOK {
		t.Fatalf("handshake status = %d, body = %s", res.Code, res.Body.String())
	}
	if !strings.HasPrefix(res.Body.String(), "0{") {
		t.Fatalf("unexpected engine handshake = %q", res.Body.String())
	}
}

func TestSanitizeMessageRemovesLinksTagsAndDangerousSchemes(t *testing.T) {
	got := sanitizeMessage(`[hello](https://example.com) <script>alert(1)</script> javascript:alert(2)`)
	if strings.Contains(got, "script") || strings.Contains(strings.ToLower(got), "javascript:") || strings.Contains(got, "https://") {
		t.Fatalf("unsafe message survived sanitization: %q", got)
	}
	if !strings.Contains(got, "hello") {
		t.Fatalf("safe text was lost: %q", got)
	}
}

func TestDecodeMessagePayloadAcceptsWidgetAndRoomFields(t *testing.T) {
	payload := decodeMessagePayload(map[string]any{
		"message":        "hello",
		"session_id":     "session-1",
		"room":           "user-agent",
		"rating":         float64(5),
		"request_rating": true,
	})
	if payload.Message != "hello" || payload.SessionID != "session-1" || payload.Room != "user-agent" || payload.Rating != 5 || !payload.RequestRating {
		t.Fatalf("decoded payload = %#v", payload)
	}
}
