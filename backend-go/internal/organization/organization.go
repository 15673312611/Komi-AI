package organization

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

	"github.com/chattermate/chattermate/backend-go/internal/auth"
	"github.com/chattermate/chattermate/backend-go/internal/user"
)

var ErrAlreadyExists = errors.New("organization already exists")

var defaultPermissions = []struct {
	Name        string
	Description string
}{
	{"view_all", "Can view all resources"},
	{"manage_users", "Can manage users"},
	{"manage_roles", "Can manage roles"},
	{"manage_agents", "Can manage chat agents"},
	{"view_agents", "Can view chat agents"},
	{"view_analytics", "Can view analytics"},
	{"view_assigned_chats", "Can view assigned chats only"},
	{"manage_assigned_chats", "Can manage assigned chats"},
	{"view_unassigned_chats", "Can view unassigned AI chats"},
	{"manage_knowledge", "Can manage knowledge base"},
	{"view_knowledge", "Can view knowledge base"},
	{"manage_ai_config", "Can manage AI configuration"},
	{"view_ai_config", "Can view AI configuration"},
	{"view_all_chats", "Can view all chat history"},
	{"manage_all_chats", "Can manage all chat sessions"},
	{"view_people", "Can view the people directory"},
	{"manage_organization", "Can manage organization settings"},
	{"view_organization", "Can view organization details"},
	{"manage_subscription", "Can manage subscription plans and billing"},
	{"view_subscription", "Can view subscription details"},
	{"view_tickets", "Can view tickets"},
	{"manage_tickets", "Can manage tickets"},
	{"approve_ticket_actions", "Can approve AI-proposed ticket resolutions"},
	{"manage_ticket_connectors", "Can manage ticket investigation connectors"},
	{"super_admin", "Has all permissions"},
}

var defaultAgentPermissions = []string{
	"view_assigned_chats", "manage_assigned_chats", "view_unassigned_chats", "view_people",
}

var defaultBusinessHours = map[string]any{
	"monday":    map[string]any{"start": "09:00", "end": "17:00", "enabled": true},
	"tuesday":   map[string]any{"start": "09:00", "end": "17:00", "enabled": true},
	"wednesday": map[string]any{"start": "09:00", "end": "17:00", "enabled": true},
	"thursday":  map[string]any{"start": "09:00", "end": "17:00", "enabled": true},
	"friday":    map[string]any{"start": "09:00", "end": "17:00", "enabled": true},
	"saturday":  map[string]any{"start": "09:00", "end": "17:00", "enabled": false},
	"sunday":    map[string]any{"start": "09:00", "end": "17:00", "enabled": false},
}

type Organization struct {
	ID            uuid.UUID      `json:"id"`
	Name          string         `json:"name"`
	Domain        string         `json:"domain"`
	Timezone      string         `json:"timezone"`
	BusinessHours map[string]any `json:"business_hours"`
	Settings      map[string]any `json:"settings"`
	IsActive      bool           `json:"is_active"`
	CreatedAt     *time.Time     `json:"created_at,omitempty"`
	UpdatedAt     *time.Time     `json:"updated_at,omitempty"`
}

type CreateInput struct {
	Name          string
	Domain        string
	Timezone      string
	BusinessHours map[string]any
	Settings      map[string]any
	AdminEmail    string
	AdminName     string
	AdminPassword string
}

type UpdateInput map[string]json.RawMessage

type Created struct {
	Organization *Organization
	Admin        *user.User
}

type Stats struct {
	TotalUsers             int64          `json:"total_users"`
	ActiveUsers            int64          `json:"active_users"`
	Settings               map[string]any `json:"settings"`
	MembersTotal           int64          `json:"members_total"`
	MembersAdmins          int64          `json:"members_admins"`
	MembersAgents          int64          `json:"members_agents"`
	ActiveNow              int64          `json:"active_now"`
	AgentsTotal            int64          `json:"agents_total"`
	AgentsLive             int64          `json:"agents_live"`
	AgentsDraft            int64          `json:"agents_draft"`
	Conversations30d       int64          `json:"conversations_30d"`
	ConversationsPrev30d   int64          `json:"conversations_prev_30d"`
	ConversationsChangePct int64          `json:"conversations_change_pct"`
}

type Store interface {
	Create(ctx context.Context, input CreateInput) (*Created, error)
	SetupStatus(ctx context.Context) (bool, error)
	DomainAvailable(ctx context.Context, domain string) (bool, error)
	Get(ctx context.Context, id uuid.UUID) (*Organization, error)
	Update(ctx context.Context, id uuid.UUID, input UpdateInput) (*Organization, error)
	Stats(ctx context.Context, id uuid.UUID) (*Stats, error)
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

func (r *Repository) Create(ctx context.Context, input CreateInput) (*Created, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	var exists bool
	if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM organizations)`).Scan(&exists); err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrAlreadyExists
	}
	businessHours := input.BusinessHours
	if businessHours == nil {
		businessHours = defaultBusinessHours
	}
	settings := input.Settings
	if settings == nil {
		settings = map[string]any{}
	}
	businessHoursJSON, err := json.Marshal(businessHours)
	if err != nil {
		return nil, err
	}
	settingsJSON, err := json.Marshal(settings)
	if err != nil {
		return nil, err
	}
	var org Organization
	if err := tx.QueryRow(ctx, `
INSERT INTO organizations (id, name, domain, timezone, business_hours, settings, is_active)
VALUES ($1,$2,$3,$4,$5,$6,TRUE)
RETURNING id, name, domain, timezone, business_hours, settings, is_active`,
		uuid.New(), input.Name, input.Domain, fallback(input.Timezone, "UTC"), businessHoursJSON, settingsJSON,
	).Scan(&org.ID, &org.Name, &org.Domain, &org.Timezone, &businessHoursJSON, &settingsJSON, &org.IsActive); err != nil {
		return nil, err
	}
	org.BusinessHours = objectJSON(businessHoursJSON)
	org.Settings = objectJSON(settingsJSON)

	permissionIDs := make(map[string]int64, len(defaultPermissions))
	for _, permission := range defaultPermissions {
		var id int64
		err := tx.QueryRow(ctx, `SELECT id FROM permissions WHERE name = $1`, permission.Name).Scan(&id)
		if errors.Is(err, pgx.ErrNoRows) {
			if err := tx.QueryRow(ctx, `INSERT INTO permissions (name, description) VALUES ($1,$2) RETURNING id`, permission.Name, permission.Description).Scan(&id); err != nil {
				return nil, err
			}
		} else if err != nil {
			return nil, err
		}
		permissionIDs[permission.Name] = id
	}
	var adminRoleID, agentRoleID int64
	if err := tx.QueryRow(ctx, `INSERT INTO roles (name, description, organization_id, is_default) VALUES ('Admin','Full access to all features',$1,FALSE) RETURNING id`, org.ID).Scan(&adminRoleID); err != nil {
		return nil, err
	}
	if err := tx.QueryRow(ctx, `INSERT INTO roles (name, description, organization_id, is_default) VALUES ('Agent','Access to assigned chats and the unclaimed AI queue',$1,TRUE) RETURNING id`, org.ID).Scan(&agentRoleID); err != nil {
		return nil, err
	}
	for _, permission := range defaultPermissions {
		if _, err := tx.Exec(ctx, `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1,$2)`, adminRoleID, permissionIDs[permission.Name]); err != nil {
			return nil, err
		}
	}
	for _, name := range defaultAgentPermissions {
		if _, err := tx.Exec(ctx, `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1,$2)`, agentRoleID, permissionIDs[name]); err != nil {
			return nil, err
		}
	}
	hash, err := auth.HashPassword(input.AdminPassword)
	if err != nil {
		return nil, err
	}
	var admin user.User
	var adminOrganizationID pgtype.UUID
	if err := tx.QueryRow(ctx, `
INSERT INTO users (id, email, full_name, hashed_password, organization_id, role_id, is_active, is_online)
VALUES ($1,$2,$3,$4,$5,$6,TRUE,FALSE)
RETURNING id, email, full_name, is_active, organization_id`, uuid.New(), input.AdminEmail, input.AdminName, hash, org.ID, adminRoleID).
		Scan(&admin.ID, &admin.Email, &admin.FullName, &admin.IsActive, &adminOrganizationID); err != nil {
		return nil, err
	}
	if adminOrganizationID.Valid {
		value := uuid.UUID(adminOrganizationID.Bytes)
		admin.OrganizationID = &value
	}
	admin.Role = &user.Role{ID: adminRoleID, Name: "Admin", Description: "Full access to all features", Permissions: make([]user.Permission, 0, len(defaultPermissions))}
	for _, permission := range defaultPermissions {
		admin.Role.Permissions = append(admin.Role.Permissions, user.Permission{ID: permissionIDs[permission.Name], Name: permission.Name, Description: permission.Description})
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &Created{Organization: &org, Admin: &admin}, nil
}

func (r *Repository) SetupStatus(ctx context.Context) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("database is not configured")
	}
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM organizations WHERE is_active = TRUE)`).Scan(&exists)
	return exists, err
}

func (r *Repository) DomainAvailable(ctx context.Context, domain string) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("database is not configured")
	}
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM organizations WHERE domain = $1)`, domain).Scan(&exists)
	return !exists, err
}

func (r *Repository) Get(ctx context.Context, id uuid.UUID) (*Organization, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	return r.scanOrganization(r.pool.QueryRow(ctx, `SELECT id,name,domain,timezone,business_hours,settings,is_active,created_at,updated_at FROM organizations WHERE id = $1`, id))
}

func (r *Repository) Update(ctx context.Context, id uuid.UUID, input UpdateInput) (*Organization, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	columns := map[string]string{"name": "name", "domain": "domain", "timezone": "timezone", "business_hours": "business_hours", "settings": "settings"}
	parts := make([]string, 0, len(input))
	args := make([]any, 0, len(input)+1)
	for key, raw := range input {
		column, ok := columns[key]
		if !ok {
			return nil, fmt.Errorf("field %q cannot be updated", key)
		}
		value := any(raw)
		if key == "name" || key == "domain" || key == "timezone" {
			var text string
			if err := json.Unmarshal(raw, &text); err != nil {
				return nil, err
			}
			value = text
		}
		args = append(args, value)
		parts = append(parts, fmt.Sprintf("%s = $%d", column, len(args)))
	}
	if len(parts) > 0 {
		args = append(args, id)
		if _, err := r.pool.Exec(ctx, "UPDATE organizations SET "+strings.Join(parts, ", ")+", updated_at = NOW() WHERE id = $"+fmt.Sprint(len(args)), args...); err != nil {
			return nil, err
		}
	}
	return r.Get(ctx, id)
}

func (r *Repository) Stats(ctx context.Context, id uuid.UUID) (*Stats, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	stats := &Stats{}
	var settingsJSON []byte
	if err := r.pool.QueryRow(ctx, `SELECT settings FROM organizations WHERE id = $1`, id).Scan(&settingsJSON); err != nil {
		return nil, err
	}
	stats.Settings = objectJSON(settingsJSON)
	queries := []struct {
		Target *int64
		SQL    string
	}{
		{&stats.TotalUsers, `SELECT COUNT(*) FROM users WHERE organization_id = $1`},
		{&stats.ActiveUsers, `SELECT COUNT(*) FROM users WHERE organization_id = $1 AND is_active = TRUE`},
		{&stats.ActiveNow, `SELECT COUNT(*) FROM users WHERE organization_id = $1 AND is_online = TRUE`},
		{&stats.AgentsTotal, `SELECT COUNT(*) FROM agents WHERE organization_id = $1`},
		{&stats.AgentsLive, `SELECT COUNT(*) FROM agents WHERE organization_id = $1 AND is_active = TRUE`},
		{&stats.Conversations30d, `SELECT COUNT(*) FROM session_to_agents WHERE organization_id = $1 AND assigned_at >= NOW() - INTERVAL '30 days'`},
		{&stats.ConversationsPrev30d, `SELECT COUNT(*) FROM session_to_agents WHERE organization_id = $1 AND assigned_at >= NOW() - INTERVAL '60 days' AND assigned_at < NOW() - INTERVAL '30 days'`},
	}
	for _, query := range queries {
		if err := r.pool.QueryRow(ctx, query.SQL, id).Scan(query.Target); err != nil {
			return nil, err
		}
	}
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(DISTINCT u.id) FROM users u JOIN roles ro ON ro.id = u.role_id LEFT JOIN role_permissions rp ON rp.role_id = ro.id LEFT JOIN permissions p ON p.id = rp.permission_id WHERE u.organization_id = $1 AND (ro.name = 'Admin' OR p.name IN ('manage_organization','super_admin'))`, id).Scan(&stats.MembersAdmins); err != nil {
		return nil, err
	}
	stats.MembersTotal = stats.TotalUsers
	stats.MembersAgents = stats.MembersTotal - stats.MembersAdmins
	stats.AgentsDraft = stats.AgentsTotal - stats.AgentsLive
	if stats.ConversationsPrev30d != 0 {
		stats.ConversationsChangePct = int64(float64(stats.Conversations30d-stats.ConversationsPrev30d)/float64(stats.ConversationsPrev30d)*100 + 0.5)
	} else if stats.Conversations30d != 0 {
		stats.ConversationsChangePct = 100
	}
	return stats, nil
}

func (r *Repository) scanOrganization(row interface{ Scan(...any) error }) (*Organization, error) {
	var (
		org                             Organization
		businessHoursJSON, settingsJSON []byte
		createdAt, updatedAt            pgtype.Timestamp
	)
	err := row.Scan(&org.ID, &org.Name, &org.Domain, &org.Timezone, &businessHoursJSON, &settingsJSON, &org.IsActive, &createdAt, &updatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	org.BusinessHours = objectJSON(businessHoursJSON)
	org.Settings = objectJSON(settingsJSON)
	org.CreatedAt = timeValue(createdAt)
	org.UpdatedAt = timeValue(updatedAt)
	return &org, nil
}

func objectJSON(value []byte) map[string]any {
	if len(value) == 0 || string(value) == "null" {
		return map[string]any{}
	}
	var result map[string]any
	if json.Unmarshal(value, &result) != nil || result == nil {
		return map[string]any{}
	}
	return result
}

func timeValue(value pgtype.Timestamp) *time.Time {
	if !value.Valid {
		return nil
	}
	result := value.Time
	return &result
}

func fallback(value, fallbackValue string) string {
	if value == "" {
		return fallbackValue
	}
	return value
}
