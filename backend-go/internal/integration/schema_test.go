package integration

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/chattermate/chattermate/backend-go/internal/agent"
	"github.com/chattermate/chattermate/backend-go/internal/customer"
	"github.com/chattermate/chattermate/backend-go/internal/session"
	"github.com/chattermate/chattermate/backend-go/internal/widget"
	"github.com/chattermate/chattermate/backend-go/internal/widgetapp"
)

func TestCurrentPostgresSchemaReadPaths(t *testing.T) {
	dsn := os.Getenv("GO_POSTGRES_URL")
	if dsn == "" {
		t.Skip("set GO_POSTGRES_URL to run PostgreSQL compatibility checks")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	if err := pool.Ping(ctx); err != nil {
		t.Fatal(err)
	}

	for _, check := range []struct {
		table   string
		columns []string
	}{
		{"widgets", []string{"id", "name", "organization_id", "agent_id"}},
		{"agent_customizations", []string{"chat_style", "widget_position", "customization_metadata", "collect_email"}},
		{"customers", []string{"email", "meta_data", "is_authenticated"}},
		{"session_to_agents", []string{"status", "end_chat_reason", "end_chat_description"}},
		{"widget_apps", []string{"api_key_hash", "organization_id", "is_active"}},
	} {
		for _, column := range check.columns {
			var count int
			if err := pool.QueryRow(ctx, `
SELECT COUNT(*) FROM information_schema.columns
WHERE table_schema = current_schema() AND table_name = $1 AND column_name = $2`, check.table, column).Scan(&count); err != nil {
				t.Fatalf("schema lookup %s.%s: %v", check.table, column, err)
			}
			if count != 1 {
				t.Fatalf("missing schema column %s.%s", check.table, column)
			}
		}
	}
	var hasClosedAt bool
	if err := pool.QueryRow(ctx, `
SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'session_to_agents'
      AND column_name = 'closed_at'
)`).Scan(&hasClosedAt); err != nil {
		t.Fatal(err)
	}
	t.Logf("session_to_agents.closed_at present: %t", hasClosedAt)

	orgID := uuid.New()
	if _, err := widget.NewRepository(pool).List(ctx, orgID); err != nil {
		t.Fatalf("widget list: %v", err)
	}
	if _, err := widget.NewRepository(pool).Schedule(ctx, orgID); !errors.Is(err, pgx.ErrNoRows) {
		t.Fatalf("widget schedule random org error=%v, want pgx.ErrNoRows", err)
	}
	if _, err := agent.NewRepository(pool).Roster(ctx, orgID); err != nil {
		t.Fatalf("agent roster: %v", err)
	}
	if found, err := customer.NewRepository(pool).GetByEmail(ctx, "go-compatibility-check@example.invalid", orgID); err != nil || found != nil {
		t.Fatalf("customer lookup found=%v err=%v", found, err)
	}
	if found, err := session.NewRepository(pool).Get(ctx, uuid.New()); err != nil || found != nil {
		t.Fatalf("session lookup found=%v err=%v", found, err)
	}
	if _, err := widgetapp.NewRepository(pool).ValidateAPIKey(ctx, "wak_compatibility_check"); !errors.Is(err, pgx.ErrNoRows) {
		t.Fatalf("widget app lookup error=%v, want pgx.ErrNoRows", err)
	}
}
