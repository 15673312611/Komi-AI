package shopify

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotConfigured = errors.New("shopify storage is not configured")
	ErrNotFound      = errors.New("shop not found")
	ErrConflict      = errors.New("shop belongs to another organization")
)

type Shop struct {
	ID             string     `json:"id"`
	ShopDomain     string     `json:"shop_domain"`
	Scope          *string    `json:"scope"`
	IsInstalled    bool       `json:"is_installed"`
	OrganizationID *uuid.UUID `json:"organization_id"`
	CreatedAt      *time.Time `json:"created_at"`
	UpdatedAt      *time.Time `json:"updated_at"`
	AccessToken    string     `json:"-"`
	OAuthState     string     `json:"-"`
	OAuthStateExp  *time.Time `json:"-"`
}

type AgentConfig struct {
	ID        string     `json:"id"`
	AgentID   uuid.UUID  `json:"agent_id"`
	ShopID    *string    `json:"shop_id"`
	Enabled   bool       `json:"enabled"`
	CreatedAt *time.Time `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
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

const shopProjection = `
SELECT id, shop_domain, access_token, scope, COALESCE(is_installed,FALSE),
       organization_id, oauth_state, oauth_state_expiry, created_at, updated_at
FROM shopify_shops`

func (r *Repository) Get(ctx context.Context, id string) (*Shop, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanShop(r.pool.QueryRow(ctx, shopProjection+` WHERE id=$1`, id))
}

func (r *Repository) GetByDomain(ctx context.Context, domain string) (*Shop, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanShop(r.pool.QueryRow(ctx, shopProjection+` WHERE shop_domain=$1`, domain))
}

func (r *Repository) ListByOrganization(ctx context.Context, organizationID uuid.UUID, offset, limit int) ([]Shop, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	if offset < 0 {
		offset = 0
	}
	if limit < 1 || limit > 1000 {
		limit = 100
	}
	rows, err := r.pool.Query(ctx, shopProjection+` WHERE organization_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, organizationID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]Shop, 0)
	for rows.Next() {
		item, err := scanShop(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, *item)
	}
	return result, rows.Err()
}

func (r *Repository) Create(ctx context.Context, domain string, organizationID *uuid.UUID, installed bool) (*Shop, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	id := uuid.NewString()
	_, err := r.pool.Exec(ctx, `INSERT INTO shopify_shops (id,shop_domain,is_installed,organization_id) VALUES ($1,$2,$3,$4)`, id, domain, installed, organizationID)
	if err != nil {
		return nil, err
	}
	return r.Get(ctx, id)
}

func (r *Repository) SaveOAuth(ctx context.Context, domain, accessToken, scope string, organizationID *uuid.UUID) (*Shop, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	var current *Shop
	current, err := r.GetByDomain(ctx, domain)
	if err != nil && !errors.Is(err, ErrNotFound) {
		return nil, err
	}
	if current == nil {
		current, err = r.Create(ctx, domain, organizationID, true)
		if err != nil {
			return nil, err
		}
	}
	if organizationID != nil && current.OrganizationID != nil && *current.OrganizationID != *organizationID {
		return nil, ErrConflict
	}
	if organizationID != nil && current.OrganizationID == nil {
		_, err = r.pool.Exec(ctx, `UPDATE shopify_shops SET organization_id=$2 WHERE id=$1`, current.ID, organizationID)
		if err != nil {
			return nil, err
		}
	}
	_, err = r.pool.Exec(ctx, `UPDATE shopify_shops SET access_token=$2, scope=$3, is_installed=TRUE, oauth_state=NULL, oauth_state_expiry=NULL, updated_at=NOW() WHERE id=$1`, current.ID, accessToken, nullableString(scope))
	if err != nil {
		return nil, err
	}
	return r.Get(ctx, current.ID)
}

func (r *Repository) SetOAuthState(ctx context.Context, shopID, state string, expiry time.Time) error {
	if err := r.ready(); err != nil {
		return err
	}
	_, err := r.pool.Exec(ctx, `UPDATE shopify_shops SET oauth_state=$2, oauth_state_expiry=$3, updated_at=NOW() WHERE id=$1`, shopID, state, expiry)
	return err
}

func (r *Repository) ClearOAuthState(ctx context.Context, shopID string) error {
	if err := r.ready(); err != nil {
		return err
	}
	_, err := r.pool.Exec(ctx, `UPDATE shopify_shops SET oauth_state=NULL, oauth_state_expiry=NULL, updated_at=NOW() WHERE id=$1`, shopID)
	return err
}

func (r *Repository) LinkOrganization(ctx context.Context, shopID string, organizationID uuid.UUID) (*Shop, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	shop, err := r.Get(ctx, shopID)
	if err != nil {
		return nil, err
	}
	if shop.OrganizationID != nil && *shop.OrganizationID != organizationID {
		return nil, ErrConflict
	}
	if _, err := r.pool.Exec(ctx, `UPDATE shopify_shops SET organization_id=$2, updated_at=NOW() WHERE id=$1`, shopID, organizationID); err != nil {
		return nil, err
	}
	return r.Get(ctx, shopID)
}

func (r *Repository) UpdateDomainOrganization(ctx context.Context, organizationID uuid.UUID, domain string) error {
	if err := r.ready(); err != nil {
		return err
	}
	_, err := r.pool.Exec(ctx, `UPDATE organizations SET domain=$2, updated_at=NOW() WHERE id=$1`, organizationID, domain)
	return err
}

func (r *Repository) Delete(ctx context.Context, shopID string, organizationID uuid.UUID) error {
	if err := r.ready(); err != nil {
		return err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	result, err := tx.Exec(ctx, `UPDATE agent_shopify_configs SET enabled=FALSE, shop_id=NULL WHERE shop_id=$1 AND EXISTS (SELECT 1 FROM shopify_shops WHERE id=$1 AND organization_id=$2)`, shopID, organizationID)
	_ = result
	if err != nil {
		return err
	}
	result, err = tx.Exec(ctx, `DELETE FROM shopify_shops WHERE id=$1 AND organization_id=$2`, shopID, organizationID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return tx.Commit(ctx)
}

func (r *Repository) DeleteByDomain(ctx context.Context, domain string) error {
	if err := r.ready(); err != nil {
		return err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var id string
	if err := tx.QueryRow(ctx, `SELECT id FROM shopify_shops WHERE shop_domain=$1`, domain).Scan(&id); errors.Is(err, pgx.ErrNoRows) {
		return nil
	} else if err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `UPDATE agent_shopify_configs SET enabled=FALSE, shop_id=NULL WHERE shop_id=$1`, id); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM shopify_shops WHERE id=$1`, id); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *Repository) AgentConfig(ctx context.Context, agentID uuid.UUID) (*AgentConfig, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	var item AgentConfig
	var shopID pgtype.Text
	err := r.pool.QueryRow(ctx, `SELECT id, agent_id, shop_id, enabled, created_at, updated_at FROM agent_shopify_configs WHERE agent_id=$1 ORDER BY id LIMIT 1`, agentID.String()).Scan(&item.ID, &item.AgentID, &shopID, &item.Enabled, &item.CreatedAt, &item.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if shopID.Valid {
		item.ShopID = &shopID.String
	}
	return &item, nil
}

func (r *Repository) UpsertAgentConfig(ctx context.Context, agentID uuid.UUID, shopID *string, enabled bool) (*AgentConfig, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	id := uuid.NewString()
	_, err := r.pool.Exec(ctx, `
INSERT INTO agent_shopify_configs (id,agent_id,shop_id,enabled)
VALUES ($1,$2,$3,$4)
ON CONFLICT (agent_id) DO UPDATE SET shop_id=EXCLUDED.shop_id, enabled=EXCLUDED.enabled, updated_at=NOW()`, id, agentID.String(), shopID, enabled)
	if err != nil {
		// Older installations do not have a unique agent_id constraint. Keep
		// the same single-config behavior with an explicit update fallback.
		if _, updateErr := r.pool.Exec(ctx, `UPDATE agent_shopify_configs SET shop_id=$2, enabled=$3, updated_at=NOW() WHERE agent_id=$1`, agentID.String(), shopID, enabled); updateErr != nil {
			return nil, err
		}
	}
	return r.AgentConfig(ctx, agentID)
}

func (r *Repository) EnabledConfigsByShop(ctx context.Context, shopID string) ([]AgentConfig, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, `SELECT id,agent_id,shop_id,enabled,created_at,updated_at FROM agent_shopify_configs WHERE shop_id=$1 AND enabled=TRUE ORDER BY created_at`, shopID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]AgentConfig, 0)
	for rows.Next() {
		var item AgentConfig
		var shop pgtype.Text
		if err := rows.Scan(&item.ID, &item.AgentID, &shop, &item.Enabled, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, err
		}
		if shop.Valid {
			item.ShopID = &shop.String
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

func scanShop(row interface{ Scan(...any) error }) (*Shop, error) {
	var item Shop
	var token, scope, state pgtype.Text
	var organizationID pgtype.UUID
	var stateExpiry, created, updated pgtype.Timestamptz
	err := row.Scan(&item.ID, &item.ShopDomain, &token, &scope, &item.IsInstalled, &organizationID, &state, &stateExpiry, &created, &updated)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	item.AccessToken = token.String
	if scope.Valid {
		item.Scope = &scope.String
	}
	if state.Valid {
		item.OAuthState = state.String
	}
	if organizationID.Valid {
		value := uuid.UUID(organizationID.Bytes)
		item.OrganizationID = &value
	}
	item.OAuthStateExp = timestamptzPointer(stateExpiry)
	item.CreatedAt = timestamptzPointer(created)
	item.UpdatedAt = timestamptzPointer(updated)
	return &item, nil
}

func timestamptzPointer(value pgtype.Timestamptz) *time.Time {
	if !value.Valid {
		return nil
	}
	result := value.Time
	return &result
}

func nullableString(value string) any {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}

var _ = fmt.Sprintf
var _ = sql.ErrNoRows
