package crm

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/chattermate/chattermate/backend-go/internal/encryption"
)

var (
	ErrNotConfigured = errors.New("CRM storage is not configured")
	ErrNotFound      = errors.New("CRM connection not found")
	ErrConflict      = errors.New("CRM account is connected to another organization")
	ErrCredentials   = errors.New("CRM credentials could not be decrypted")
)

type Connection struct {
	ID                    uuid.UUID  `json:"id"`
	OrganizationID        uuid.UUID  `json:"organization_id"`
	Provider              string     `json:"provider"`
	ExternalAccountID     string     `json:"external_account_id"`
	DisplayName           *string    `json:"display_name"`
	Status                string     `json:"status"`
	LastError             *string    `json:"last_error"`
	AccessTokenExpiresAt  *time.Time `json:"access_token_expires_at,omitempty"`
	RefreshTokenExpiresAt *time.Time `json:"refresh_token_expires_at,omitempty"`
	LastRefreshedAt       *time.Time `json:"last_refreshed_at,omitempty"`
	ConnectedByUserID     *uuid.UUID `json:"connected_by_user_id,omitempty"`
	CreatedAt             *time.Time `json:"created_at,omitempty"`
	UpdatedAt             *time.Time `json:"updated_at,omitempty"`
	credentials           string
}

type Repository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *Repository {
	if pool == nil {
		return nil
	}
	return &Repository{pool: pool}
}

func (r *Repository) ready() error {
	if r == nil || r.pool == nil {
		return ErrNotConfigured
	}
	return nil
}

const connectionProjection = `
SELECT id, organization_id, provider, external_account_id, display_name,
       encrypted_credentials, status, last_error, access_token_expires_at,
       refresh_token_expires_at, last_refreshed_at, connected_by_user_id,
       created_at, updated_at
FROM crm_connections`

func (r *Repository) GetByOrganizationProvider(ctx context.Context, organizationID uuid.UUID, provider string) (*Connection, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanConnection(r.pool.QueryRow(ctx, connectionProjection+` WHERE organization_id=$1 AND provider=$2`, organizationID, provider))
}

func (r *Repository) GetByExternalID(ctx context.Context, provider, externalID string) (*Connection, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanConnection(r.pool.QueryRow(ctx, connectionProjection+` WHERE provider=$1 AND external_account_id=$2`, provider, externalID))
}

func (r *Repository) ListByOrganization(ctx context.Context, organizationID uuid.UUID) ([]Connection, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, connectionProjection+` WHERE organization_id=$1 ORDER BY created_at`, organizationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]Connection, 0)
	for rows.Next() {
		item, err := scanConnection(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, *item)
	}
	return result, rows.Err()
}

func (r *Repository) RecentFailures(ctx context.Context, organizationID uuid.UUID, provider string, since time.Time) (int64, error) {
	if err := r.ready(); err != nil {
		return 0, err
	}
	var count int64
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM crm_sync_jobs WHERE organization_id=$1 AND provider=$2 AND status='failed' AND updated_at >= $3`, organizationID, provider, since).Scan(&count)
	return count, err
}

func (r *Repository) Upsert(ctx context.Context, value Connection, credentials map[string]any) (*Connection, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	encoded, err := json.Marshal(credentials)
	if err != nil {
		return nil, err
	}
	sealed, err := encryption.Encrypt(string(encoded))
	if err != nil {
		return nil, err
	}
	if value.ID == uuid.Nil {
		value.ID = uuid.New()
	}
	_, err = r.pool.Exec(ctx, `
INSERT INTO crm_connections
    (id, organization_id, provider, external_account_id, display_name,
     encrypted_credentials, status, last_error, access_token_expires_at,
     refresh_token_expires_at, last_refreshed_at, connected_by_user_id)
VALUES ($1,$2,$3,$4,$5,$6,'active',NULL,$7,$8,NOW(),$9)
ON CONFLICT (organization_id, provider) DO UPDATE SET
    external_account_id=EXCLUDED.external_account_id,
    display_name=EXCLUDED.display_name,
    encrypted_credentials=EXCLUDED.encrypted_credentials,
    status='active', last_error=NULL,
    access_token_expires_at=EXCLUDED.access_token_expires_at,
    refresh_token_expires_at=EXCLUDED.refresh_token_expires_at,
    last_refreshed_at=NOW(),
    connected_by_user_id=COALESCE(EXCLUDED.connected_by_user_id, crm_connections.connected_by_user_id),
    updated_at=NOW()`, value.ID, value.OrganizationID, value.Provider, value.ExternalAccountID, value.DisplayName, sealed, value.AccessTokenExpiresAt, value.RefreshTokenExpiresAt, value.ConnectedByUserID)
	if err != nil {
		return nil, err
	}
	return r.GetByOrganizationProvider(ctx, value.OrganizationID, value.Provider)
}

func (r *Repository) Credentials(connection *Connection) (map[string]any, error) {
	if connection == nil || connection.credentials == "" {
		return nil, ErrCredentials
	}
	plain, err := encryption.Decrypt(connection.credentials)
	if err != nil {
		return nil, ErrCredentials
	}
	var result map[string]any
	if err := json.Unmarshal([]byte(plain), &result); err != nil {
		return nil, ErrCredentials
	}
	if result == nil {
		result = map[string]any{}
	}
	return result, nil
}

func (r *Repository) SaveCredentials(ctx context.Context, connection *Connection, credentials map[string]any, accessExpiry, refreshExpiry *time.Time) (*Connection, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	encoded, err := json.Marshal(credentials)
	if err != nil {
		return nil, err
	}
	sealed, err := encryption.Encrypt(string(encoded))
	if err != nil {
		return nil, err
	}
	_, err = r.pool.Exec(ctx, `UPDATE crm_connections SET encrypted_credentials=$2, access_token_expires_at=$3, refresh_token_expires_at=COALESCE($4,refresh_token_expires_at), last_refreshed_at=NOW(), status='active', last_error=NULL, updated_at=NOW() WHERE id=$1`, connection.ID, sealed, accessExpiry, refreshExpiry)
	if err != nil {
		return nil, err
	}
	return r.GetByOrganizationProvider(ctx, connection.OrganizationID, connection.Provider)
}

func (r *Repository) SetStatus(ctx context.Context, connection *Connection, status, lastError string) error {
	if err := r.ready(); err != nil {
		return err
	}
	_, err := r.pool.Exec(ctx, `UPDATE crm_connections SET status=$2,last_error=$3,updated_at=NOW() WHERE id=$1`, connection.ID, status, nullableString(lastError))
	return err
}

func (r *Repository) Delete(ctx context.Context, connection *Connection) error {
	if err := r.ready(); err != nil {
		return err
	}
	_, err := r.pool.Exec(ctx, `DELETE FROM crm_connections WHERE id=$1`, connection.ID)
	return err
}

func (r *Repository) SkipPending(ctx context.Context, organizationID uuid.UUID, provider, reason string) error {
	if err := r.ready(); err != nil {
		return err
	}
	_, err := r.pool.Exec(ctx, `UPDATE crm_sync_jobs SET status='skipped',last_error=$3,updated_at=NOW() WHERE organization_id=$1 AND provider=$2 AND status IN ('pending','processing')`, organizationID, provider, reason)
	return err
}

// ReopenFailed puts terminal jobs back on the queue after an administrator
// reconnects a provider. The lead/provider uniqueness constraint means these
// rows cannot be replaced by a second enqueue.
func (r *Repository) ReopenFailed(ctx context.Context, organizationID uuid.UUID, provider string) error {
	if err := r.ready(); err != nil {
		return err
	}
	_, err := r.pool.Exec(ctx, `UPDATE crm_sync_jobs SET status='pending',attempts=0,started_at=NULL,next_attempt_at=NOW(),last_error=NULL,updated_at=NOW() WHERE organization_id=$1 AND provider=$2 AND status='failed'`, organizationID, provider)
	return err
}

func scanConnection(row interface{ Scan(...any) error }) (*Connection, error) {
	var item Connection
	var organizationID, connectedBy pgtype.UUID
	var displayName, credentials, lastError pgtype.Text
	var accessExpiry, refreshExpiry, refreshed, created, updated pgtype.Timestamptz
	err := row.Scan(&item.ID, &organizationID, &item.Provider, &item.ExternalAccountID, &displayName, &credentials, &item.Status, &lastError, &accessExpiry, &refreshExpiry, &refreshed, &connectedBy, &created, &updated)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	item.OrganizationID = uuid.UUID(organizationID.Bytes)
	item.DisplayName = textPointer(displayName)
	item.LastError = textPointer(lastError)
	item.AccessTokenExpiresAt = timePointer(accessExpiry)
	item.RefreshTokenExpiresAt = timePointer(refreshExpiry)
	item.LastRefreshedAt = timePointer(refreshed)
	item.ConnectedByUserID = uuidPointer(connectedBy)
	item.CreatedAt = timePointer(created)
	item.UpdatedAt = timePointer(updated)
	item.credentials = credentials.String
	return &item, nil
}

func nullableString(value string) any {
	if value == "" {
		return nil
	}
	return value
}

func textPointer(value pgtype.Text) *string {
	if !value.Valid {
		return nil
	}
	return &value.String
}

func uuidPointer(value pgtype.UUID) *uuid.UUID {
	if !value.Valid {
		return nil
	}
	result := uuid.UUID(value.Bytes)
	return &result
}

func timePointer(value pgtype.Timestamptz) *time.Time {
	if !value.Valid {
		return nil
	}
	result := value.Time
	return &result
}
