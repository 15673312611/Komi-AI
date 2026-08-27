package widget

import (
	"context"
	"encoding/json"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Widget struct {
	ID             string     `json:"id"`
	Name           string     `json:"name"`
	OrganizationID uuid.UUID  `json:"organization_id"`
	AgentID        *uuid.UUID `json:"agent_id"`
}

type Store interface {
	Create(ctx context.Context, organizationID uuid.UUID, name string, agentID *uuid.UUID) (*Widget, error)
	Get(ctx context.Context, id string) (*Widget, error)
	List(ctx context.Context, organizationID uuid.UUID) ([]*Widget, error)
	ListByAgent(ctx context.Context, organizationID, agentID uuid.UUID) ([]*Widget, error)
	Delete(ctx context.Context, id string, organizationID uuid.UUID) error
}

type OrganizationSchedule struct {
	Timezone      string
	BusinessHours map[string]map[string]any
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

func (r *Repository) Create(ctx context.Context, organizationID uuid.UUID, name string, agentID *uuid.UUID) (*Widget, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	id := uuid.NewString()
	return scanWidget(r.pool.QueryRow(ctx, `INSERT INTO widgets (id,name,organization_id,agent_id) VALUES ($1,$2,$3,$4) RETURNING id,name,organization_id,agent_id`, id, name, organizationID, agentID))
}

func (r *Repository) Get(ctx context.Context, id string) (*Widget, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	return scanWidget(r.pool.QueryRow(ctx, `SELECT id,name,organization_id,agent_id FROM widgets WHERE id = $1`, id))
}

func (r *Repository) List(ctx context.Context, organizationID uuid.UUID) ([]*Widget, error) {
	return r.list(ctx, `WHERE organization_id = $1 ORDER BY id`, organizationID)
}

func (r *Repository) ListByAgent(ctx context.Context, organizationID, agentID uuid.UUID) ([]*Widget, error) {
	return r.list(ctx, `WHERE organization_id = $1 AND agent_id = $2 ORDER BY id`, organizationID, agentID)
}

func (r *Repository) list(ctx context.Context, predicate string, args ...any) ([]*Widget, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	rows, err := r.pool.Query(ctx, `SELECT id,name,organization_id,agent_id FROM widgets `+predicate, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]*Widget, 0)
	for rows.Next() {
		found, err := scanWidget(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, found)
	}
	return result, rows.Err()
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanWidget(row rowScanner) (*Widget, error) {
	var (
		found   Widget
		agentID pgtype.UUID
	)
	err := row.Scan(&found.ID, &found.Name, &found.OrganizationID, &agentID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if agentID.Valid {
		value := uuid.UUID(agentID.Bytes)
		found.AgentID = &value
	}
	return &found, nil
}

func (r *Repository) Delete(ctx context.Context, id string, organizationID uuid.UUID) error {
	if r == nil || r.pool == nil {
		return errors.New("database is not configured")
	}
	result, err := r.pool.Exec(ctx, `DELETE FROM widgets WHERE id = $1 AND organization_id = $2`, id, organizationID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (r *Repository) Schedule(ctx context.Context, organizationID uuid.UUID) (OrganizationSchedule, error) {
	if r == nil || r.pool == nil {
		return OrganizationSchedule{}, errors.New("database is not configured")
	}
	var schedule OrganizationSchedule
	var businessHours []byte
	err := r.pool.QueryRow(ctx, `
SELECT COALESCE(timezone, 'UTC'), business_hours
FROM organizations WHERE id = $1`, organizationID).Scan(&schedule.Timezone, &businessHours)
	if errors.Is(err, pgx.ErrNoRows) {
		return OrganizationSchedule{}, pgx.ErrNoRows
	}
	if err != nil {
		return OrganizationSchedule{}, err
	}
	if len(businessHours) > 0 && string(businessHours) != "null" {
		if err := json.Unmarshal(businessHours, &schedule.BusinessHours); err != nil {
			return OrganizationSchedule{}, err
		}
	}
	return schedule, nil
}

func NormalizeWidgetID(value string) string {
	return strings.TrimSpace(value)
}
