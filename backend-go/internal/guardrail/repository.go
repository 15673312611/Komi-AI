package guardrail

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/komi/komi/backend-go/internal/encryption"
)

// Repository is the append-only persistence side of the runtime guardrail.
// It intentionally lives behind EventStore so unit tests and deployments that
// do not yet have the telemetry table can keep the chat path usable.
type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	if pool == nil {
		return nil
	}
	return &Repository{pool: pool}
}

func (r *Repository) Record(ctx context.Context, input EventInput) error {
	if r == nil || r.pool == nil {
		return errors.New("database is not configured")
	}
	if len(input.Rules) == 0 {
		return nil
	}
	matched, err := json.Marshal(input.Rules)
	if err != nil {
		return err
	}

	var excerpt any
	if input.Excerpt != "" {
		sealed, sealErr := encryption.EncryptAtRest(input.Excerpt)
		if sealErr != nil {
			return sealErr
		}
		excerpt = sealed
	}
	var organizationID, agentID, sessionID any
	if input.OrganizationID != uuid.Nil {
		organizationID = input.OrganizationID
	}
	if input.AgentID != uuid.Nil {
		agentID = input.AgentID
	}
	if input.SessionID != uuid.Nil {
		sessionID = input.SessionID
	}
	charLen := any(input.CharLen)
	if input.CharLen <= 0 {
		charLen = nil
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	for _, rule := range input.Rules {
		if rule == "" {
			continue
		}
		if _, err := tx.Exec(ctx, `
INSERT INTO guardrail_events (
    id, organization_id, agent_id, session_id, surface, layer, rule,
    action, matched, char_len, excerpt
)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)`,
			uuid.New(), organizationID, agentID, sessionID, input.Surface, input.Layer,
			rule, input.Action, string(matched), charLen, excerpt); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

var _ EventStore = (*Repository)(nil)
