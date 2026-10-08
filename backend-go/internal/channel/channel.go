package channel

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/komi/komi/backend-go/internal/encryption"
)

var (
	ErrNotConfigured = errors.New("channel storage is not configured")
	ErrNotFound      = errors.New("channel account not found")
	ErrConflict      = errors.New("channel account already belongs to another organization")
	ErrCredentials   = errors.New("channel credentials could not be decrypted")
)

type Account struct {
	ID                   uuid.UUID      `json:"id"`
	OrganizationID       uuid.UUID      `json:"organization_id,omitempty"`
	ChannelType          string         `json:"channel_type"`
	ExternalAccountID    string         `json:"external_account_id"`
	DisplayName          *string        `json:"display_name"`
	Settings             map[string]any `json:"settings,omitempty"`
	IsActive             bool           `json:"is_active"`
	WebhookSecret        string         `json:"-"`
	CreatedAt            *time.Time     `json:"created_at,omitempty"`
	UpdatedAt            *time.Time     `json:"updated_at,omitempty"`
	encryptedCredentials string
}

type AccountWithAgent struct {
	Account
	AgentID *uuid.UUID `json:"agent_id"`
}

type Conversation struct {
	ID                     uuid.UUID      `json:"id"`
	ChannelAccountID       uuid.UUID      `json:"channel_account_id"`
	ChannelType            string         `json:"channel_type"`
	ExternalConversationID string         `json:"external_conversation_id"`
	ExternalUserID         string         `json:"external_user_id"`
	SessionID              uuid.UUID      `json:"session_id"`
	OrganizationID         uuid.UUID      `json:"organization_id"`
	AgentID                *uuid.UUID     `json:"agent_id"`
	CustomerID             *uuid.UUID     `json:"customer_id"`
	Status                 string         `json:"status"`
	UserID                 *uuid.UUID     `json:"user_id"`
	GroupID                *uuid.UUID     `json:"group_id"`
	LastInboundAt          *time.Time     `json:"last_inbound_at"`
	Extra                  map[string]any `json:"extra"`
	OutboundIdempotencyKey *string        `json:"outbound_idempotency_key,omitempty"`
}

type Repository struct {
	pool     *pgxpool.Pool
	initOnce sync.Once
}

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
	r.initOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_, _ = r.pool.Exec(ctx, `
ALTER TABLE IF EXISTS channel_conversations ADD COLUMN IF NOT EXISTS outbound_idempotency_key TEXT;
`)
	})
	return nil
}

func (r *Repository) List(ctx context.Context, organizationID uuid.UUID) ([]AccountWithAgent, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, `
SELECT ca.id, ca.organization_id, ca.channel_type, ca.external_account_id,
       ca.display_name, ca.webhook_secret, ca.settings, ca.is_active,
       ca.created_at, ca.updated_at,
       CASE WHEN acc.is_active THEN acc.agent_id ELSE NULL END
FROM channel_accounts ca
LEFT JOIN agent_channel_configs acc ON acc.channel_account_id = ca.id
WHERE ca.organization_id = $1
ORDER BY ca.created_at`, organizationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]AccountWithAgent, 0)
	for rows.Next() {
		item, err := scanAccountWithAgent(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*Account, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanAccount(r.pool.QueryRow(ctx, accountProjection+` WHERE id=$1`, id))
}

func (r *Repository) GetByExternal(ctx context.Context, channelType, externalID string) (*Account, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanAccount(r.pool.QueryRow(ctx, accountProjection+` WHERE channel_type=$1 AND external_account_id=$2`, channelType, externalID))
}

func (r *Repository) GetOwned(ctx context.Context, id, organizationID uuid.UUID) (*Account, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanAccount(r.pool.QueryRow(ctx, accountProjection+` WHERE id=$1 AND organization_id=$2`, id, organizationID))
}

func (r *Repository) Create(ctx context.Context, organizationID uuid.UUID, channelType, externalID string, credentials map[string]any, displayName *string, settings map[string]any) (*Account, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	if settings == nil {
		settings = map[string]any{}
	}
	credentialJSON, err := json.Marshal(credentials)
	if err != nil {
		return nil, err
	}
	sealed, err := encryption.Encrypt(string(credentialJSON))
	if err != nil {
		return nil, err
	}
	secret, err := randomSecret()
	if err != nil {
		return nil, err
	}
	id := uuid.New()
	if _, err := r.pool.Exec(ctx, `
INSERT INTO channel_accounts
    (id, organization_id, channel_type, external_account_id, display_name,
     encrypted_credentials, webhook_secret, settings, is_active)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,TRUE)`,
		id, organizationID, channelType, externalID, displayName, sealed, secret, mustJSON(settings)); err != nil {
		return nil, normalizeDBError(err)
	}
	return r.GetByID(ctx, id)
}

func (r *Repository) Credentials(account *Account) (map[string]any, error) {
	if account == nil || account.encryptedCredentials == "" {
		return nil, ErrCredentials
	}
	plain, err := encryption.Decrypt(account.encryptedCredentials)
	if err != nil {
		return nil, ErrCredentials
	}
	var values map[string]any
	if err := json.Unmarshal([]byte(plain), &values); err != nil {
		return nil, ErrCredentials
	}
	if values == nil {
		values = map[string]any{}
	}
	return values, nil
}

func (r *Repository) UpdateCredentials(ctx context.Context, account *Account, credentials map[string]any) (*Account, error) {
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
	if _, err := r.pool.Exec(ctx, `UPDATE channel_accounts SET encrypted_credentials=$2, updated_at=NOW() WHERE id=$1`, account.ID, sealed); err != nil {
		return nil, err
	}
	return r.GetByID(ctx, account.ID)
}

func (r *Repository) SetActive(ctx context.Context, account *Account, active bool) (*Account, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	if _, err := r.pool.Exec(ctx, `UPDATE channel_accounts SET is_active=$2, updated_at=NOW() WHERE id=$1`, account.ID, active); err != nil {
		return nil, err
	}
	return r.GetByID(ctx, account.ID)
}

func (r *Repository) UpdateSettings(ctx context.Context, account *Account, settings map[string]any) (*Account, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	if settings == nil {
		settings = map[string]any{}
	}
	if _, err := r.pool.Exec(ctx, `UPDATE channel_accounts SET settings=$2::jsonb, updated_at=NOW() WHERE id=$1`, account.ID, mustJSON(settings)); err != nil {
		return nil, err
	}
	return r.GetByID(ctx, account.ID)
}

func (r *Repository) Delete(ctx context.Context, account *Account) error {
	if err := r.ready(); err != nil {
		return err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `
UPDATE session_to_agents SET status='CLOSED', updated_at=NOW()
WHERE session_id IN (SELECT session_id FROM channel_conversations WHERE channel_account_id=$1)
  AND status::text <> 'CLOSED'`, account.ID); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM channel_accounts WHERE id=$1`, account.ID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *Repository) AgentID(ctx context.Context, accountID uuid.UUID) (*uuid.UUID, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	var id pgtype.UUID
	// 1. Direct channel config in agent_channel_configs
	err := r.pool.QueryRow(ctx, `SELECT CASE WHEN is_active THEN agent_id ELSE NULL END FROM agent_channel_configs WHERE channel_account_id=$1`, accountID).Scan(&id)
	if err == nil && id.Valid {
		value := uuid.UUID(id.Bytes)
		return &value, nil
	}

	// 2. Check if a Store is bound to this email channel account
	var storeAgentID pgtype.UUID
	err = r.pool.QueryRow(ctx, `SELECT agent_id FROM stores WHERE email_account_id=$1 AND is_active=true AND agent_id IS NOT NULL LIMIT 1`, accountID).Scan(&storeAgentID)
	if err == nil && storeAgentID.Valid {
		value := uuid.UUID(storeAgentID.Bytes)
		return &value, nil
	}

	// 3. Fallback to any active agent in the organization
	var orgID uuid.UUID
	err = r.pool.QueryRow(ctx, `SELECT organization_id FROM channel_accounts WHERE id=$1`, accountID).Scan(&orgID)
	if err == nil && orgID != uuid.Nil {
		var defaultAgentID pgtype.UUID
		err = r.pool.QueryRow(ctx, `SELECT id FROM agents WHERE organization_id=$1 AND is_active=true ORDER BY created_at ASC LIMIT 1`, orgID).Scan(&defaultAgentID)
		if err == nil && defaultAgentID.Valid {
			value := uuid.UUID(defaultAgentID.Bytes)
			return &value, nil
		}
	}

	return nil, nil
}

func (r *Repository) GetStoreName(ctx context.Context, accountID uuid.UUID) string {
	if r.ready() != nil {
		return ""
	}
	var name string
	err := r.pool.QueryRow(ctx, `SELECT name FROM stores WHERE email_account_id=$1 AND is_active=true LIMIT 1`, accountID).Scan(&name)
	if err == nil {
		return strings.TrimSpace(name)
	}
	return ""
}

func (r *Repository) SetAgent(ctx context.Context, accountID, organizationID, agentID uuid.UUID, active bool) error {
	if err := r.ready(); err != nil {
		return err
	}
	var accountOrg uuid.UUID
	if err := r.pool.QueryRow(ctx, `SELECT organization_id FROM channel_accounts WHERE id=$1`, accountID).Scan(&accountOrg); errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	} else if err != nil {
		return err
	} else if accountOrg != organizationID {
		return ErrNotFound
	}
	_, err := r.pool.Exec(ctx, `
INSERT INTO agent_channel_configs (id, agent_id, channel_account_id, is_active)
VALUES ($1,$2,$3,$4)
ON CONFLICT (channel_account_id) DO UPDATE
SET agent_id=EXCLUDED.agent_id, is_active=EXCLUDED.is_active, updated_at=NOW()`, uuid.New(), agentID, accountID, active)
	return err
}

func (r *Repository) ClearAgent(ctx context.Context, accountID, organizationID uuid.UUID) error {
	if err := r.ready(); err != nil {
		return err
	}
	result, err := r.pool.Exec(ctx, `DELETE FROM agent_channel_configs WHERE channel_account_id=$1 AND EXISTS (SELECT 1 FROM channel_accounts WHERE id=$1 AND organization_id=$2)`, accountID, organizationID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		var exists bool
		if err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM channel_accounts WHERE id=$1 AND organization_id=$2)`, accountID, organizationID).Scan(&exists); err != nil {
			return err
		}
		if !exists {
			return ErrNotFound
		}
	}
	return nil
}

func (r *Repository) GetActiveConversation(ctx context.Context, accountID uuid.UUID, externalID string) (*Conversation, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanConversation(r.pool.QueryRow(ctx, conversationProjection+`
WHERE cc.channel_account_id=$1 AND cc.external_conversation_id=$2
  AND s.status::text <> 'CLOSED'
ORDER BY cc.created_at DESC LIMIT 1`, accountID, externalID))
}

func (r *Repository) GetLatestConversation(ctx context.Context, accountID uuid.UUID, externalID string) (*Conversation, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanConversation(r.pool.QueryRow(ctx, conversationProjection+`
WHERE cc.channel_account_id=$1 AND cc.external_conversation_id=$2
ORDER BY cc.created_at DESC LIMIT 1`, accountID, externalID))
}

func (r *Repository) GetConversationBySession(ctx context.Context, sessionID uuid.UUID) (*Conversation, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanConversation(r.pool.QueryRow(ctx, conversationProjection+` WHERE cc.session_id=$1 ORDER BY cc.created_at DESC LIMIT 1`, sessionID))
}

func (r *Repository) GetByOutboundIdempotency(ctx context.Context, accountID uuid.UUID, key string) (*Conversation, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanConversation(r.pool.QueryRow(ctx, conversationProjection+`
WHERE cc.channel_account_id=$1 AND cc.outbound_idempotency_key=$2
ORDER BY cc.created_at DESC LIMIT 1`, accountID, key))
}

func (r *Repository) CreateConversation(ctx context.Context, value Conversation) (*Conversation, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	if value.ID == uuid.Nil {
		value.ID = uuid.New()
	}
	if value.Extra == nil {
		value.Extra = map[string]any{}
	}
	_, err := r.pool.Exec(ctx, `
INSERT INTO channel_conversations
    (id, channel_account_id, channel_type, external_conversation_id,
     external_user_id, session_id, organization_id, agent_id, customer_id,
     last_inbound_at, extra, outbound_idempotency_key)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12)`,
		value.ID, value.ChannelAccountID, value.ChannelType, value.ExternalConversationID,
		value.ExternalUserID, value.SessionID, value.OrganizationID, value.AgentID,
		value.CustomerID, value.LastInboundAt, mustJSON(value.Extra), value.OutboundIdempotencyKey)
	if err != nil {
		return nil, normalizeDBError(err)
	}
	return r.GetConversationBySession(ctx, value.SessionID)
}

func (r *Repository) TouchInbound(ctx context.Context, conversationID uuid.UUID, extra map[string]any) error {
	if err := r.ready(); err != nil {
		return err
	}
	if extra == nil {
		_, err := r.pool.Exec(ctx, `UPDATE channel_conversations SET last_inbound_at=NOW(), updated_at=NOW() WHERE id=$1`, conversationID)
		return err
	}
	_, err := r.pool.Exec(ctx, `UPDATE channel_conversations SET last_inbound_at=NOW(), extra=$2::jsonb, updated_at=NOW() WHERE id=$1`, conversationID, mustJSON(extra))
	return err
}

// SetExtra persists channel-specific state without touching the inbound
// timestamp. An optional key is used by outbound idempotency reservations and
// remains unchanged when callers only update ordinary conversation state.
func (r *Repository) SetExtra(ctx context.Context, conversationID uuid.UUID, extra map[string]any, idempotencyKey *string) error {
	if err := r.ready(); err != nil {
		return err
	}
	if extra == nil {
		extra = map[string]any{}
	}
	if idempotencyKey == nil {
		_, err := r.pool.Exec(ctx, `UPDATE channel_conversations SET extra=$2::jsonb, updated_at=NOW() WHERE id=$1`, conversationID, mustJSON(extra))
		return err
	}
	_, err := r.pool.Exec(ctx, `UPDATE channel_conversations
SET extra=$2::jsonb, outbound_idempotency_key=$3, updated_at=NOW()
WHERE id=$1`, conversationID, mustJSON(extra), idempotencyKey)
	return err
}

const accountProjection = `
SELECT id, organization_id, channel_type, external_account_id, display_name,
       encrypted_credentials, webhook_secret, settings, is_active, created_at, updated_at
FROM channel_accounts`

const conversationProjection = `
SELECT cc.id, cc.channel_account_id, cc.channel_type,
       cc.external_conversation_id, cc.external_user_id, cc.session_id,
       cc.organization_id, cc.agent_id, cc.customer_id, cc.last_inbound_at,
       s.status::text, s.user_id, s.group_id,
       cc.extra, cc.outbound_idempotency_key
FROM channel_conversations cc
JOIN session_to_agents s ON s.session_id=cc.session_id`

func scanAccount(row interface{ Scan(...any) error }) (*Account, error) {
	var (
		item                                   Account
		organizationID, id                     uuid.UUID
		channelType, externalID, webhookSecret string
		displayName, encrypted                 pgtype.Text
		settingsBytes                          []byte
		isActive                               bool
		createdAt, updatedAt                   pgtype.Timestamptz
	)
	err := row.Scan(&id, &organizationID, &channelType, &externalID, &displayName,
		&encrypted, &webhookSecret, &settingsBytes, &isActive, &createdAt, &updatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	item.ID, item.OrganizationID = id, organizationID
	item.ChannelType, item.ExternalAccountID, item.WebhookSecret = channelType, externalID, webhookSecret
	item.DisplayName = textPointer(displayName)
	item.Settings = decodeObject(settingsBytes)
	item.IsActive = isActive
	item.CreatedAt, item.UpdatedAt = timePointer(createdAt), timePointer(updatedAt)
	item.encryptedCredentials = encrypted.String
	return &item, nil
}

func scanAccountWithAgent(row interface{ Scan(...any) error }) (AccountWithAgent, error) {
	var item AccountWithAgent
	var (
		id, organizationID                     uuid.UUID
		channelType, externalID, webhookSecret string
		displayName                            pgtype.Text
		settings                               []byte
		isActive                               bool
		createdAt, updatedAt                   pgtype.Timestamptz
		agentID                                pgtype.UUID
	)
	if err := row.Scan(&id, &organizationID, &channelType, &externalID, &displayName, &webhookSecret, &settings, &isActive, &createdAt, &updatedAt, &agentID); err != nil {
		return item, err
	}
	item.ID, item.OrganizationID, item.ChannelType, item.ExternalAccountID = id, organizationID, channelType, externalID
	item.DisplayName, item.WebhookSecret, item.Settings, item.IsActive = textPointer(displayName), webhookSecret, decodeObject(settings), isActive
	item.CreatedAt, item.UpdatedAt = timePointer(createdAt), timePointer(updatedAt)
	if agentID.Valid {
		value := uuid.UUID(agentID.Bytes)
		item.AgentID = &value
	}
	return item, nil
}

func scanConversation(row interface{ Scan(...any) error }) (*Conversation, error) {
	var (
		item                                 Conversation
		extra                                []byte
		lastInbound                          pgtype.Timestamptz
		agentID, customerID, userID, groupID pgtype.UUID
		idempotency                          pgtype.Text
	)
	err := row.Scan(&item.ID, &item.ChannelAccountID, &item.ChannelType,
		&item.ExternalConversationID, &item.ExternalUserID, &item.SessionID,
		&item.OrganizationID, &agentID, &customerID, &lastInbound,
		&item.Status, &userID, &groupID, &extra, &idempotency)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	item.AgentID, item.CustomerID = uuidPointer(agentID), uuidPointer(customerID)
	item.UserID, item.GroupID = uuidPointer(userID), uuidPointer(groupID)
	item.LastInboundAt, item.Extra = timePointer(lastInbound), decodeObject(extra)
	if idempotency.Valid {
		item.OutboundIdempotencyKey = &idempotency.String
	}
	return &item, nil
}

func randomSecret() (string, error) {
	data := make([]byte, 32)
	if _, err := rand.Read(data); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(data), nil
}

func mustJSON(value any) string {
	data, _ := json.Marshal(value)
	return string(data)
}

func decodeObject(data []byte) map[string]any {
	result := map[string]any{}
	if len(data) > 0 {
		_ = json.Unmarshal(data, &result)
	}
	return result
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
	return &value.Time
}

func normalizeDBError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return ErrConflict
	}
	return err
}

func NormalizeChannel(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}
