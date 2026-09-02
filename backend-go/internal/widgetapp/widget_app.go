package widgetapp

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/komi/komi/backend-go/internal/auth"
)

type App struct {
	ID             uuid.UUID  `json:"id"`
	Name           string     `json:"name"`
	Description    *string    `json:"description"`
	OrganizationID uuid.UUID  `json:"organization_id"`
	CreatedBy      uuid.UUID  `json:"created_by"`
	IsActive       bool       `json:"is_active"`
	CreatedAt      *time.Time `json:"created_at"`
	UpdatedAt      *time.Time `json:"updated_at"`
	APIKeyHash     string     `json:"-"`
}

type Store interface {
	ValidateAPIKey(ctx context.Context, apiKey string) (*App, error)
}

type CreateInput struct {
	Name           string
	Description    *string
	OrganizationID uuid.UUID
	CreatedBy      uuid.UUID
}

type UpdateInput struct {
	Name        *string
	Description *string
	IsActive    *bool
}

type ManagementStore interface {
	Store
	Create(ctx context.Context, input CreateInput) (*App, string, error)
	List(ctx context.Context, organizationID uuid.UUID, includeInactive bool) ([]*App, error)
	Get(ctx context.Context, id, organizationID uuid.UUID) (*App, error)
	Update(ctx context.Context, id, organizationID uuid.UUID, input UpdateInput) (*App, error)
	Deactivate(ctx context.Context, id, organizationID uuid.UUID) (bool, error)
	Delete(ctx context.Context, id, organizationID uuid.UUID) (bool, error)
	Regenerate(ctx context.Context, id, organizationID uuid.UUID) (*App, string, error)
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

func (r *Repository) ValidateAPIKey(ctx context.Context, apiKey string) (*App, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	rows, err := r.pool.Query(ctx, `
SELECT id, name, description, organization_id, created_by, is_active, created_at, updated_at, api_key_hash
FROM widget_apps WHERE is_active = TRUE`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		found, err := scanApp(rows)
		if err != nil {
			return nil, err
		}
		if auth.VerifyPassword(apiKey, found.APIKeyHash) {
			return found, nil
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return nil, pgx.ErrNoRows
}

func (r *Repository) Create(ctx context.Context, input CreateInput) (*App, string, error) {
	if r == nil || r.pool == nil {
		return nil, "", errors.New("database is not configured")
	}
	plainKey, err := generateAPIKey()
	if err != nil {
		return nil, "", err
	}
	hash, err := auth.HashPassword(plainKey)
	if err != nil {
		return nil, "", err
	}
	app, err := scanApp(r.pool.QueryRow(ctx, `
INSERT INTO widget_apps (id, name, description, organization_id, api_key_hash, created_by, is_active)
VALUES ($1, $2, $3, $4, $5, $6, TRUE)
RETURNING id, name, description, organization_id, created_by, is_active, created_at, updated_at, api_key_hash`,
		uuid.New(), input.Name, input.Description, input.OrganizationID, hash, input.CreatedBy))
	if err != nil {
		return nil, "", err
	}
	return app, plainKey, nil
}

func (r *Repository) List(ctx context.Context, organizationID uuid.UUID, includeInactive bool) ([]*App, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	query := `SELECT id, name, description, organization_id, created_by, is_active, created_at, updated_at, api_key_hash FROM widget_apps WHERE organization_id = $1`
	if !includeInactive {
		query += ` AND is_active = TRUE`
	}
	query += ` ORDER BY created_at DESC`
	rows, err := r.pool.Query(ctx, query, organizationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]*App, 0)
	for rows.Next() {
		app, err := scanApp(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, app)
	}
	return result, rows.Err()
}

func (r *Repository) Get(ctx context.Context, id, organizationID uuid.UUID) (*App, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	return scanApp(r.pool.QueryRow(ctx, `
SELECT id, name, description, organization_id, created_by, is_active, created_at, updated_at, api_key_hash
FROM widget_apps WHERE id = $1 AND organization_id = $2`, id, organizationID))
}

func (r *Repository) Update(ctx context.Context, id, organizationID uuid.UUID, input UpdateInput) (*App, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	parts := make([]string, 0, 3)
	args := make([]any, 0, 5)
	if input.Name != nil {
		args = append(args, *input.Name)
		parts = append(parts, fmt.Sprintf("name = $%d", len(args)))
	}
	if input.Description != nil {
		args = append(args, *input.Description)
		parts = append(parts, fmt.Sprintf("description = $%d", len(args)))
	}
	if input.IsActive != nil {
		args = append(args, *input.IsActive)
		parts = append(parts, fmt.Sprintf("is_active = $%d", len(args)))
	}
	if len(parts) > 0 {
		args = append(args, id, organizationID)
		query := "UPDATE widget_apps SET " + strings.Join(parts, ", ") + ", updated_at = NOW() WHERE id = $" + fmt.Sprint(len(args)-1) + " AND organization_id = $" + fmt.Sprint(len(args))
		if _, err := r.pool.Exec(ctx, query, args...); err != nil {
			return nil, err
		}
	}
	return r.Get(ctx, id, organizationID)
}

func (r *Repository) Deactivate(ctx context.Context, id, organizationID uuid.UUID) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("database is not configured")
	}
	result, err := r.pool.Exec(ctx, `UPDATE widget_apps SET is_active = FALSE, updated_at = NOW() WHERE id = $1 AND organization_id = $2`, id, organizationID)
	if err != nil {
		return false, err
	}
	return result.RowsAffected() > 0, nil
}

func (r *Repository) Delete(ctx context.Context, id, organizationID uuid.UUID) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("database is not configured")
	}
	result, err := r.pool.Exec(ctx, `DELETE FROM widget_apps WHERE id = $1 AND organization_id = $2`, id, organizationID)
	if err != nil {
		return false, err
	}
	return result.RowsAffected() > 0, nil
}

func (r *Repository) Regenerate(ctx context.Context, id, organizationID uuid.UUID) (*App, string, error) {
	if r == nil || r.pool == nil {
		return nil, "", errors.New("database is not configured")
	}
	plainKey, err := generateAPIKey()
	if err != nil {
		return nil, "", err
	}
	hash, err := auth.HashPassword(plainKey)
	if err != nil {
		return nil, "", err
	}
	result, err := r.pool.Exec(ctx, `UPDATE widget_apps SET api_key_hash = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3`, hash, id, organizationID)
	if err != nil {
		return nil, "", err
	}
	if result.RowsAffected() == 0 {
		return nil, "", pgx.ErrNoRows
	}
	app, err := r.Get(ctx, id, organizationID)
	return app, plainKey, err
}

func scanApp(row interface{ Scan(...any) error }) (*App, error) {
	var (
		app                  App
		description          pgtype.Text
		createdAt, updatedAt pgtype.Timestamptz
	)
	err := row.Scan(&app.ID, &app.Name, &description, &app.OrganizationID, &app.CreatedBy, &app.IsActive, &createdAt, &updatedAt, &app.APIKeyHash)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if description.Valid {
		value := description.String
		app.Description = &value
	}
	if createdAt.Valid {
		value := createdAt.Time
		app.CreatedAt = &value
	}
	if updatedAt.Valid {
		value := updatedAt.Time
		app.UpdatedAt = &value
	}
	return &app, nil
}

func generateAPIKey() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return "wak_" + base64.RawURLEncoding.EncodeToString(bytes), nil
}
