package customer

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Customer struct {
	ID              uuid.UUID      `json:"id"`
	Email           string         `json:"email"`
	FullName        *string        `json:"full_name"`
	Phone           *string        `json:"phone,omitempty"`
	OrganizationID  uuid.UUID      `json:"organization_id"`
	MetaData        map[string]any `json:"meta_data"`
	IsAuthenticated bool           `json:"is_authenticated"`
}

type Store interface {
	GetByEmail(ctx context.Context, email string, organizationID uuid.UUID) (*Customer, error)
	Create(ctx context.Context, email string, fullName *string, organizationID uuid.UUID, metadata map[string]any, authenticated bool) (*Customer, error)
	UpdateIdentity(ctx context.Context, id uuid.UUID, fullName *string, authenticated bool) (*Customer, error)
	UpdateMetaData(ctx context.Context, id uuid.UUID, values map[string]any) (*Customer, error)
}

// ChannelIdentityStore contains the optional identity operations used by
// phone-bearing channels. Keeping it separate preserves the small Store
// contract used by the widget and existing HTTP fakes.
type ChannelIdentityStore interface {
	Store
	GetByPhone(ctx context.Context, phone string, organizationID uuid.UUID) (*Customer, error)
	SetPhoneIfAbsent(ctx context.Context, id uuid.UUID, phone string) (*Customer, error)
}

// WhatsAppOutboundStore contains the extra identity writes needed by a
// business-initiated WhatsApp conversation. It is separate from Store so
// existing widget fakes and integrations keep their smaller contract.
type WhatsAppOutboundStore interface {
	DetailStore
	ChannelIdentityStore
	CreateWithPhone(ctx context.Context, email string, fullName *string, organizationID uuid.UUID, phone string, metadata, leadSource map[string]any) (*Customer, error)
	SetLeadSourceIfAbsent(ctx context.Context, id uuid.UUID, source map[string]any) error
}

type DetailStore interface {
	Store
	GetByID(ctx context.Context, id uuid.UUID) (*Customer, error)
}

type ContactStore interface {
	DetailStore
	UpdateEmail(ctx context.Context, id uuid.UUID, email string) (*Customer, error)
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

func (r *Repository) GetByEmail(ctx context.Context, email string, organizationID uuid.UUID) (*Customer, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	return r.get(ctx, `email = $1 AND organization_id = $2`, email, organizationID)
}

func (r *Repository) GetByPhone(ctx context.Context, phone string, organizationID uuid.UUID) (*Customer, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	phone = NormalizePhone(phone)
	if phone == "" {
		return nil, nil
	}
	return r.get(ctx, `phone = $1 AND organization_id = $2 AND merged_into_customer_id IS NULL`, phone, organizationID)
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*Customer, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	return r.get(ctx, `id = $1`, id)
}

func (r *Repository) Create(ctx context.Context, email string, fullName *string, organizationID uuid.UUID, metadata map[string]any, authenticated bool) (*Customer, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return nil, err
	}
	id := uuid.New()
	var customer Customer
	var metadataBytes []byte
	var fullNameValue pgtype.Text
	var authenticatedValue pgtype.Bool
	err = r.pool.QueryRow(ctx, `
INSERT INTO customers (id, email, full_name, meta_data, is_authenticated, organization_id)
VALUES ($1, $2, $3, $4, $5, $6)
	RETURNING id, email, full_name, organization_id, meta_data, is_authenticated`,
		id, email, fullName, metadataJSON, authenticated, organizationID,
	).Scan(&customer.ID, &customer.Email, &fullNameValue, &customer.OrganizationID, &metadataBytes, &authenticatedValue)
	if err != nil {
		return nil, err
	}
	if len(metadataBytes) > 0 && string(metadataBytes) != "null" {
		if err := json.Unmarshal(metadataBytes, &customer.MetaData); err != nil {
			return nil, err
		}
	}
	if customer.MetaData == nil {
		customer.MetaData = map[string]any{}
	}
	if fullNameValue.Valid {
		value := fullNameValue.String
		customer.FullName = &value
	}
	customer.IsAuthenticated = authenticatedValue.Valid && authenticatedValue.Bool
	return &customer, nil
}

func (r *Repository) CreateWithPhone(ctx context.Context, email string, fullName *string, organizationID uuid.UUID, phone string, metadata, leadSource map[string]any) (*Customer, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	phone = NormalizePhone(phone)
	if phone == "" {
		return nil, errors.New("invalid phone number")
	}
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return nil, err
	}
	leadSourceJSON, err := json.Marshal(leadSource)
	if err != nil {
		return nil, err
	}
	id := uuid.New()
	if _, err := r.pool.Exec(ctx, `
INSERT INTO customers (id, email, full_name, phone, meta_data, lead_source, is_authenticated, organization_id)
VALUES ($1,$2,$3,$4,$5,$6,FALSE,$7)`, id, email, fullName, phone, metadataJSON, leadSourceJSON, organizationID); err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *Repository) SetLeadSourceIfAbsent(ctx context.Context, id uuid.UUID, source map[string]any) error {
	if r == nil || r.pool == nil {
		return errors.New("database is not configured")
	}
	encoded, err := json.Marshal(source)
	if err != nil {
		return err
	}
	_, err = r.pool.Exec(ctx, `
UPDATE customers SET lead_source=$2::jsonb, updated_at=NOW()
WHERE id=$1 AND (lead_source IS NULL OR lead_source = 'null'::jsonb)`, id, encoded)
	return err
}

func (r *Repository) UpdateMetaData(ctx context.Context, id uuid.UUID, values map[string]any) (*Customer, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	current, err := r.get(ctx, `id = $1`, id)
	if err != nil || current == nil {
		return current, err
	}
	if current.MetaData == nil {
		current.MetaData = make(map[string]any)
	}
	for key, value := range values {
		current.MetaData[key] = value
	}
	metadataJSON, err := json.Marshal(current.MetaData)
	if err != nil {
		return nil, err
	}
	if _, err := r.pool.Exec(ctx, `UPDATE customers SET meta_data = $2, updated_at = NOW() WHERE id = $1`, id, metadataJSON); err != nil {
		return nil, err
	}
	return r.get(ctx, `id = $1`, id)
}

func (r *Repository) SetPhoneIfAbsent(ctx context.Context, id uuid.UUID, phone string) (*Customer, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	phone = NormalizePhone(phone)
	if phone == "" {
		return r.GetByID(ctx, id)
	}
	if _, err := r.pool.Exec(ctx, `
UPDATE customers
SET phone = $2, updated_at = NOW()
WHERE id = $1 AND (phone IS NULL OR phone = '')
  AND NOT EXISTS (
      SELECT 1 FROM customers other
      WHERE other.organization_id = customers.organization_id
        AND other.phone = $2
        AND other.id <> customers.id
        AND other.merged_into_customer_id IS NULL
  )`, id, phone); err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *Repository) UpdateIdentity(ctx context.Context, id uuid.UUID, fullName *string, authenticated bool) (*Customer, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	if _, err := r.pool.Exec(ctx, `
UPDATE customers SET full_name = COALESCE($2, full_name), is_authenticated = $3, updated_at = NOW()
WHERE id = $1`, id, fullName, authenticated); err != nil {
		return nil, err
	}
	return r.get(ctx, `id = $1`, id)
}

func (r *Repository) UpdateEmail(ctx context.Context, id uuid.UUID, email string) (*Customer, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return nil, errors.New("email is required")
	}
	if _, err := r.pool.Exec(ctx, `UPDATE customers SET email = $2, updated_at = NOW() WHERE id = $1`, id, email); err != nil {
		return nil, err
	}
	return r.get(ctx, `id = $1`, id)
}

func (r *Repository) get(ctx context.Context, predicate string, args ...any) (*Customer, error) {
	var customer Customer
	var fullName pgtype.Text
	var metadata []byte
	var authenticated pgtype.Bool
	var phone pgtype.Text
	err := r.pool.QueryRow(ctx, fmt.Sprintf(`
SELECT id, email, full_name, phone, organization_id, meta_data, COALESCE(is_authenticated, FALSE)
FROM customers WHERE %s`, predicate), args...).Scan(
		&customer.ID, &customer.Email, &fullName, &phone, &customer.OrganizationID, &metadata, &authenticated,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if fullName.Valid {
		value := fullName.String
		customer.FullName = &value
	}
	if phone.Valid {
		value := phone.String
		customer.Phone = &value
	}
	if len(metadata) > 0 && string(metadata) != "null" {
		if err := json.Unmarshal(metadata, &customer.MetaData); err != nil {
			return nil, err
		}
	}
	if customer.MetaData == nil {
		customer.MetaData = map[string]any{}
	}
	customer.IsAuthenticated = authenticated.Valid && authenticated.Bool
	return &customer, nil
}

func PlaceholderEmail() string {
	return fmt.Sprintf("%d-%s@noemail.com", unixMilli(), strings.Split(uuid.NewString(), "-")[0])
}

func unixMilli() int64 {
	return timeNow().UnixMilli()
}

// NormalizePhone accepts the E.164-like values delivered by Meta/SMS and the
// optional leading '+' used by Telegram and human-entered setup forms.
func NormalizePhone(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	var builder strings.Builder
	for index, r := range value {
		if r >= '0' && r <= '9' {
			builder.WriteRune(r)
		} else if r == '+' && index == 0 {
			builder.WriteRune(r)
		}
	}
	result := builder.String()
	if strings.HasPrefix(result, "+") {
		if len(result) < 8 {
			return ""
		}
		return result
	}
	if len(result) < 8 {
		return ""
	}
	return "+" + result
}

var timeNow = func() time.Time { return time.Now() }
