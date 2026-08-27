package rating

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Rating struct {
	ID             uuid.UUID  `json:"id"`
	SessionID      uuid.UUID  `json:"session_id"`
	CustomerID     *uuid.UUID `json:"customer_id,omitempty"`
	AgentID        *uuid.UUID `json:"agent_id,omitempty"`
	UserID         *uuid.UUID `json:"user_id,omitempty"`
	OrganizationID uuid.UUID  `json:"organization_id"`
	Rating         int        `json:"rating"`
	Feedback       *string    `json:"feedback,omitempty"`
	CreatedAt      *string    `json:"created_at,omitempty"`
}

type Input struct {
	SessionID      uuid.UUID
	CustomerID     *uuid.UUID
	AgentID        *uuid.UUID
	UserID         *uuid.UUID
	OrganizationID uuid.UUID
	Rating         int
	Feedback       *string
}

type Store interface {
	Upsert(ctx context.Context, input Input) (*Rating, error)
}

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	if pool == nil {
		return nil
	}
	return &Repository{pool: pool}
}

func (r *Repository) Upsert(ctx context.Context, input Input) (*Rating, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	if input.Rating < 1 || input.Rating > 5 {
		return nil, errors.New("rating must be between 1 and 5")
	}
	if input.Feedback != nil {
		value := strings.TrimSpace(*input.Feedback)
		if value == "" {
			input.Feedback = nil
		} else {
			input.Feedback = &value
		}
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// The Python repository implements one rating per session by reading first
	// and then updating. Locking on the session key preserves that behavior even
	// when a widget retries the event concurrently.
	if _, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtext($1))`, input.SessionID.String()); err != nil {
		return nil, err
	}

	found, err := scan(tx.QueryRow(ctx, `
SELECT id, session_id, customer_id, agent_id, user_id, organization_id,
       rating, feedback, created_at
FROM ratings
WHERE session_id = $1 AND organization_id = $2
FOR UPDATE`, input.SessionID, input.OrganizationID))
	if errors.Is(err, pgx.ErrNoRows) {
		found, err = scan(tx.QueryRow(ctx, `
INSERT INTO ratings (
    id, session_id, customer_id, agent_id, user_id, organization_id, rating, feedback
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, session_id, customer_id, agent_id, user_id, organization_id,
          rating, feedback, created_at`,
			uuid.New(), input.SessionID, input.CustomerID, input.AgentID, input.UserID,
			input.OrganizationID, input.Rating, input.Feedback))
	}
	if err != nil {
		return nil, err
	}
	if found != nil && found.ID != uuid.Nil {
		if _, err := tx.Exec(ctx, `
UPDATE ratings
SET rating = $1, feedback = $2
WHERE id = $3 AND session_id = $4 AND organization_id = $5`,
			input.Rating, input.Feedback, found.ID, input.SessionID, input.OrganizationID); err != nil {
			return nil, err
		}
		found.Rating = input.Rating
		found.Feedback = input.Feedback
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return found, nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scan(row rowScanner) (*Rating, error) {
	var (
		found               Rating
		customerID, agentID pgtype.UUID
		userID              pgtype.UUID
		feedback            pgtype.Text
		createdAt           pgtype.Timestamptz
	)
	err := row.Scan(
		&found.ID, &found.SessionID, &customerID, &agentID, &userID,
		&found.OrganizationID, &found.Rating, &feedback, &createdAt,
	)
	if err != nil {
		return nil, err
	}
	found.CustomerID = uuidPointer(customerID)
	found.AgentID = uuidPointer(agentID)
	found.UserID = uuidPointer(userID)
	if feedback.Valid {
		value := feedback.String
		found.Feedback = &value
	}
	if createdAt.Valid {
		value := createdAt.Time.UTC().Format("2006-01-02T15:04:05.999999Z07:00")
		found.CreatedAt = &value
	}
	return &found, nil
}

func uuidPointer(value pgtype.UUID) *uuid.UUID {
	if !value.Valid {
		return nil
	}
	result := uuid.UUID(value.Bytes)
	return &result
}
