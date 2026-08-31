package store

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound = errors.New("store not found")
	ErrInvalid  = errors.New("invalid store data")
)

type Store struct {
	ID               uuid.UUID  `json:"id"`
	OrganizationID   uuid.UUID  `json:"organization_id"`
	Name             string     `json:"name"`
	Platform         string     `json:"platform"`
	ShopDomain       *string    `json:"shop_domain,omitempty"`
	EmailAccountID   *uuid.UUID `json:"email_account_id,omitempty"`
	EmailAddress     *string    `json:"email_address,omitempty"`
	EmailDisplayName *string    `json:"email_display_name,omitempty"`
	AgentID          *uuid.UUID `json:"agent_id,omitempty"`
	AgentName        *string    `json:"agent_name,omitempty"`
	AgentDisplayName *string    `json:"agent_display_name,omitempty"`
	KnowledgeTag     *string    `json:"knowledge_tag,omitempty"`
	Currency         string     `json:"currency"`
	Timezone         string     `json:"timezone"`
	IsActive         bool       `json:"is_active"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type CreateInput struct {
	Name           string     `json:"name"`
	Platform       string     `json:"platform"`
	ShopDomain     *string    `json:"shop_domain"`
	EmailAccountID *uuid.UUID `json:"email_account_id"`
	AgentID        *uuid.UUID `json:"agent_id"`
	KnowledgeTag   *string    `json:"knowledge_tag"`
	Currency       string     `json:"currency"`
	Timezone       string     `json:"timezone"`
	IsActive       bool       `json:"is_active"`
}

type UpdateInput struct {
	Name           *string    `json:"name"`
	Platform       *string    `json:"platform"`
	ShopDomain     *string    `json:"shop_domain"`
	EmailAccountID *uuid.UUID `json:"email_account_id"`
	AgentID        *uuid.UUID `json:"agent_id"`
	KnowledgeTag   *string    `json:"knowledge_tag"`
	Currency       *string    `json:"currency"`
	Timezone       *string    `json:"timezone"`
	IsActive       *bool      `json:"is_active"`
}

type ChannelOption struct {
	ID             uuid.UUID  `json:"id"`
	ChannelType    string     `json:"channel_type"`
	DisplayName    string     `json:"display_name"`
	ExternalID     string     `json:"external_id"`
	BoundStoreID   *uuid.UUID `json:"bound_store_id,omitempty"`
	BoundStoreName *string    `json:"bound_store_name,omitempty"`
}

type AgentOption struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	DisplayName *string   `json:"display_name"`
	IsActive    bool      `json:"is_active"`
}

type ShopifyOption struct {
	ID         string `json:"id"`
	ShopDomain string `json:"shop_domain"`
}

type StoreOptions struct {
	Channels []ChannelOption `json:"channels"`
	Agents   []AgentOption   `json:"agents"`
	Shopify  []ShopifyOption `json:"shopify"`
}

type Service interface {
	EnsureSchema(ctx context.Context) error
	List(ctx context.Context, orgID uuid.UUID) ([]Store, error)
	GetByID(ctx context.Context, id uuid.UUID, orgID uuid.UUID) (*Store, error)
	Create(ctx context.Context, orgID uuid.UUID, input CreateInput) (*Store, error)
	Update(ctx context.Context, id uuid.UUID, orgID uuid.UUID, input UpdateInput) (*Store, error)
	Delete(ctx context.Context, id uuid.UUID, orgID uuid.UUID) error
	GetByEmailAccountID(ctx context.Context, accountID uuid.UUID) (*Store, error)
	GetByShopDomain(ctx context.Context, domain string) (*Store, error)
	GetOptions(ctx context.Context, orgID uuid.UUID) (*StoreOptions, error)
}

type StoreService = Service
type StoreStore = Service

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	r := &Repository{pool: pool}
	if pool != nil {
		_ = r.EnsureSchema(context.Background())
	}
	return r
}

func (r *Repository) EnsureSchema(ctx context.Context) error {
	if r.pool == nil {
		return nil
	}
	query := `
	CREATE TABLE IF NOT EXISTS stores (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
		name VARCHAR(255) NOT NULL,
		platform VARCHAR(50) NOT NULL DEFAULT 'shopify',
		shop_domain VARCHAR(255),
		email_account_id UUID REFERENCES channel_accounts(id) ON DELETE SET NULL,
		agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
		knowledge_tag VARCHAR(100),
		currency VARCHAR(20) DEFAULT 'USD',
		timezone VARCHAR(100) DEFAULT 'America/New_York',
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);
	CREATE INDEX IF NOT EXISTS idx_stores_org_id ON stores(organization_id);
	CREATE INDEX IF NOT EXISTS idx_stores_domain ON stores(shop_domain);
	CREATE INDEX IF NOT EXISTS idx_stores_email_account_id ON stores(email_account_id);
	`
	_, err := r.pool.Exec(ctx, query)
	return err
}

func (r *Repository) List(ctx context.Context, orgID uuid.UUID) ([]Store, error) {
	if r.pool == nil {
		return nil, errors.New("db not configured")
	}

	query := `
	SELECT s.id, s.organization_id, s.name, s.platform, s.shop_domain,
	       s.email_account_id, ca.display_name, ca.external_account_id,
	       s.agent_id, a.name, a.display_name,
	       s.knowledge_tag, COALESCE(s.currency, 'USD'), COALESCE(s.timezone, 'America/New_York'),
	       s.is_active, s.created_at, s.updated_at
	FROM stores s
	LEFT JOIN channel_accounts ca ON ca.id = s.email_account_id
	LEFT JOIN agents a ON a.id = s.agent_id
	WHERE s.organization_id = $1
	ORDER BY s.created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stores []Store
	for rows.Next() {
		var s Store
		var emailDisplayName, emailAddress, agentName, agentDisplayName *string
		if err := rows.Scan(
			&s.ID, &s.OrganizationID, &s.Name, &s.Platform, &s.ShopDomain,
			&s.EmailAccountID, &emailDisplayName, &emailAddress,
			&s.AgentID, &agentName, &agentDisplayName,
			&s.KnowledgeTag, &s.Currency, &s.Timezone,
			&s.IsActive, &s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			return nil, err
		}
		s.EmailDisplayName = emailDisplayName
		s.EmailAddress = emailAddress
		s.AgentName = agentName
		s.AgentDisplayName = agentDisplayName
		stores = append(stores, s)
	}
	if stores == nil {
		stores = []Store{}
	}
	return stores, nil
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID, orgID uuid.UUID) (*Store, error) {
	if r.pool == nil {
		return nil, errors.New("db not configured")
	}

	query := `
	SELECT s.id, s.organization_id, s.name, s.platform, s.shop_domain,
	       s.email_account_id, ca.display_name, ca.external_account_id,
	       s.agent_id, a.name, a.display_name,
	       s.knowledge_tag, COALESCE(s.currency, 'USD'), COALESCE(s.timezone, 'America/New_York'),
	       s.is_active, s.created_at, s.updated_at
	FROM stores s
	LEFT JOIN channel_accounts ca ON ca.id = s.email_account_id
	LEFT JOIN agents a ON a.id = s.agent_id
	WHERE s.id = $1 AND s.organization_id = $2
	`
	row := r.pool.QueryRow(ctx, query, id, orgID)

	var s Store
	var emailDisplayName, emailAddress, agentName, agentDisplayName *string
	if err := row.Scan(
		&s.ID, &s.OrganizationID, &s.Name, &s.Platform, &s.ShopDomain,
		&s.EmailAccountID, &emailDisplayName, &emailAddress,
		&s.AgentID, &agentName, &agentDisplayName,
		&s.KnowledgeTag, &s.Currency, &s.Timezone,
		&s.IsActive, &s.CreatedAt, &s.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	s.EmailDisplayName = emailDisplayName
	s.EmailAddress = emailAddress
	s.AgentName = agentName
	s.AgentDisplayName = agentDisplayName
	return &s, nil
}

func (r *Repository) Create(ctx context.Context, orgID uuid.UUID, input CreateInput) (*Store, error) {
	if r.pool == nil {
		return nil, errors.New("db not configured")
	}
	if strings.TrimSpace(input.Name) == "" {
		return nil, errors.New("store name is required")
	}
	if strings.TrimSpace(input.Platform) == "" {
		input.Platform = "shopify"
	}
	if strings.TrimSpace(input.Currency) == "" {
		input.Currency = "USD"
	}
	if strings.TrimSpace(input.Timezone) == "" {
		input.Timezone = "America/New_York"
	}
	if input.EmailAccountID != nil && *input.EmailAccountID != uuid.Nil {
		var count int
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM stores WHERE organization_id = $1 AND email_account_id = $2`, orgID, *input.EmailAccountID).Scan(&count)
		if count > 0 {
			return nil, errors.New("该客服邮箱已被其他店铺绑定，请选择其他空闲邮箱或配置新专属邮箱")
		}
	}

	query := `
	INSERT INTO stores (
		organization_id, name, platform, shop_domain,
		email_account_id, agent_id, knowledge_tag,
		currency, timezone, is_active, created_at, updated_at
	) VALUES (
		$1, $2, $3, $4,
		$5, $6, $7,
		$8, $9, $10, NOW(), NOW()
	)
	RETURNING id, organization_id, name, platform, shop_domain,
	          email_account_id, agent_id, knowledge_tag,
	          currency, timezone, is_active, created_at, updated_at
	`
	var s Store
	err := r.pool.QueryRow(ctx, query,
		orgID, input.Name, input.Platform, input.ShopDomain,
		input.EmailAccountID, input.AgentID, input.KnowledgeTag,
		input.Currency, input.Timezone, input.IsActive,
	).Scan(
		&s.ID, &s.OrganizationID, &s.Name, &s.Platform, &s.ShopDomain,
		&s.EmailAccountID, &s.AgentID, &s.KnowledgeTag,
		&s.Currency, &s.Timezone, &s.IsActive, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, s.ID, orgID)
}

func (r *Repository) Update(ctx context.Context, id uuid.UUID, orgID uuid.UUID, input UpdateInput) (*Store, error) {
	if r.pool == nil {
		return nil, errors.New("db not configured")
	}

	existing, err := r.GetByID(ctx, id, orgID)
	if err != nil {
		return nil, err
	}

	name := existing.Name
	if input.Name != nil && strings.TrimSpace(*input.Name) != "" {
		name = strings.TrimSpace(*input.Name)
	}
	platform := existing.Platform
	if input.Platform != nil && strings.TrimSpace(*input.Platform) != "" {
		platform = strings.TrimSpace(*input.Platform)
	}
	shopDomain := existing.ShopDomain
	if input.ShopDomain != nil {
		shopDomain = input.ShopDomain
	}
	emailAccountID := existing.EmailAccountID
	if input.EmailAccountID != nil {
		if *input.EmailAccountID == uuid.Nil {
			emailAccountID = nil
		} else {
			var count int
			_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM stores WHERE organization_id = $1 AND email_account_id = $2 AND id != $3`, orgID, *input.EmailAccountID, id).Scan(&count)
			if count > 0 {
				return nil, errors.New("该客服邮箱已被其他店铺绑定，请选择其他空闲邮箱或配置新专属邮箱")
			}
			emailAccountID = input.EmailAccountID
		}
	}
	agentID := existing.AgentID
	if input.AgentID != nil {
		if *input.AgentID == uuid.Nil {
			agentID = nil
		} else {
			agentID = input.AgentID
		}
	}
	knowledgeTag := existing.KnowledgeTag
	if input.KnowledgeTag != nil {
		knowledgeTag = input.KnowledgeTag
	}
	currency := existing.Currency
	if input.Currency != nil && strings.TrimSpace(*input.Currency) != "" {
		currency = strings.TrimSpace(*input.Currency)
	}
	timezone := existing.Timezone
	if input.Timezone != nil && strings.TrimSpace(*input.Timezone) != "" {
		timezone = strings.TrimSpace(*input.Timezone)
	}
	isActive := existing.IsActive
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	query := `
	UPDATE stores SET
		name = $1,
		platform = $2,
		shop_domain = $3,
		email_account_id = $4,
		agent_id = $5,
		knowledge_tag = $6,
		currency = $7,
		timezone = $8,
		is_active = $9,
		updated_at = NOW()
	WHERE id = $10 AND organization_id = $11
	`
	_, err = r.pool.Exec(ctx, query,
		name, platform, shopDomain,
		emailAccountID, agentID, knowledgeTag,
		currency, timezone, isActive,
		id, orgID,
	)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id, orgID)
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID, orgID uuid.UUID) error {
	if r.pool == nil {
		return errors.New("db not configured")
	}
	res, err := r.pool.Exec(ctx, `DELETE FROM stores WHERE id = $1 AND organization_id = $2`, id, orgID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *Repository) GetByEmailAccountID(ctx context.Context, accountID uuid.UUID) (*Store, error) {
	if r.pool == nil {
		return nil, errors.New("db not configured")
	}
	query := `
	SELECT s.id, s.organization_id, s.name, s.platform, s.shop_domain,
	       s.email_account_id, s.agent_id, s.knowledge_tag,
	       COALESCE(s.currency, 'USD'), COALESCE(s.timezone, 'America/New_York'),
	       s.is_active, s.created_at, s.updated_at
	FROM stores s
	WHERE s.email_account_id = $1 AND s.is_active = TRUE
	LIMIT 1
	`
	var s Store
	err := r.pool.QueryRow(ctx, query, accountID).Scan(
		&s.ID, &s.OrganizationID, &s.Name, &s.Platform, &s.ShopDomain,
		&s.EmailAccountID, &s.AgentID, &s.KnowledgeTag,
		&s.Currency, &s.Timezone, &s.IsActive, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &s, nil
}

func (r *Repository) GetByShopDomain(ctx context.Context, domain string) (*Store, error) {
	if r.pool == nil {
		return nil, errors.New("db not configured")
	}
	domain = strings.TrimSpace(strings.ToLower(domain))
	query := `
	SELECT s.id, s.organization_id, s.name, s.platform, s.shop_domain,
	       s.email_account_id, s.agent_id, s.knowledge_tag,
	       COALESCE(s.currency, 'USD'), COALESCE(s.timezone, 'America/New_York'),
	       s.is_active, s.created_at, s.updated_at
	FROM stores s
	WHERE LOWER(s.shop_domain) = $1 AND s.is_active = TRUE
	LIMIT 1
	`
	var s Store
	err := r.pool.QueryRow(ctx, query, domain).Scan(
		&s.ID, &s.OrganizationID, &s.Name, &s.Platform, &s.ShopDomain,
		&s.EmailAccountID, &s.AgentID, &s.KnowledgeTag,
		&s.Currency, &s.Timezone, &s.IsActive, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &s, nil
}

func (r *Repository) GetOptions(ctx context.Context, orgID uuid.UUID) (*StoreOptions, error) {
	if r.pool == nil {
		return nil, errors.New("db not configured")
	}
	opts := &StoreOptions{
		Channels: []ChannelOption{},
		Agents:   []AgentOption{},
		Shopify:  []ShopifyOption{},
	}

	// 1. Fetch channel accounts (Email, WhatsApp, etc.) with bound store info
	cRows, err := r.pool.Query(ctx, `
		SELECT ca.id, ca.channel_type, COALESCE(ca.display_name, ''), COALESCE(ca.external_account_id, ''),
		       s.id, s.name
		FROM channel_accounts ca
		LEFT JOIN stores s ON s.email_account_id = ca.id AND s.organization_id = $1
		WHERE ca.organization_id = $1 AND ca.is_active = TRUE
		ORDER BY ca.channel_type ASC, ca.display_name ASC
	`, orgID)
	if err == nil {
		defer cRows.Close()
		for cRows.Next() {
			var (
				co    ChannelOption
				sID   *uuid.UUID
				sName *string
			)
			if err := cRows.Scan(&co.ID, &co.ChannelType, &co.DisplayName, &co.ExternalID, &sID, &sName); err == nil {
				co.BoundStoreID = sID
				co.BoundStoreName = sName
				opts.Channels = append(opts.Channels, co)
			}
		}
	}

	// 2. Fetch AI Agents
	aRows, err := r.pool.Query(ctx, `
		SELECT id, name, display_name, COALESCE(is_active, TRUE)
		FROM agents
		WHERE organization_id = $1
		ORDER BY is_active DESC, name ASC
	`, orgID)
	if err == nil {
		defer aRows.Close()
		for aRows.Next() {
			var ao AgentOption
			var displayName *string
			if err := aRows.Scan(&ao.ID, &ao.Name, &displayName, &ao.IsActive); err == nil {
				ao.DisplayName = displayName
				opts.Agents = append(opts.Agents, ao)
			}
		}
	}

	// 3. Fetch connected Shopify shops
	sRows, err := r.pool.Query(ctx, `
		SELECT id, shop_domain
		FROM shopify_shops
		WHERE organization_id = $1 AND is_installed = TRUE
		ORDER BY shop_domain ASC
	`, orgID)
	if err == nil {
		defer sRows.Close()
		for sRows.Next() {
			var so ShopifyOption
			if err := sRows.Scan(&so.ID, &so.ShopDomain); err == nil {
				opts.Shopify = append(opts.Shopify, so)
			}
		}
	}

	return opts, nil
}
