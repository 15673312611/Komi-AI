package httpapi

import (
	"net/http"
	"testing"

	"github.com/go-chi/chi/v5"
)

func TestDumpRoutesForMigrationAudit(t *testing.T) {
	router := NewRouter(Dependencies{Config: testConfig()})
	routes, ok := router.(chi.Routes)
	if !ok {
		t.Fatal("router does not expose chi routes")
	}
	if err := chi.Walk(routes, func(method, route string, _ http.Handler, _ ...func(http.Handler) http.Handler) error {
		t.Logf("%s %s", method, route)
		return nil
	}); err != nil {
		t.Fatal(err)
	}
}
