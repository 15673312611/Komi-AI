package leadcapture

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound              = errors.New("lead capture config not found")
	ErrInvalidField          = errors.New("invalid lead capture field configuration")
	ErrTooManyFields         = errors.New("lead capture supports at most 30 fields")
	ErrAssignmentTarget      = errors.New("assignment target user not found in this organization")
	ErrInvalidAssignmentMode = errors.New("invalid assignment mode")
	ErrInvalidCRMTarget      = errors.New("invalid CRM sync target")
)

type Field struct {
	Key      string   `json:"key"`
	Standard bool     `json:"standard"`
	Enabled  bool     `json:"enabled"`
	Required bool     `json:"required"`
	Label    *string  `json:"label"`
	Options  []string `json:"options"`
}

type Config struct {
	AgentID                uuid.UUID  `json:"agent_id"`
	Enabled                bool       `json:"enabled"`
	RequireConsent         bool       `json:"require_consent"`
	Guidance               *string    `json:"guidance"`
	Fields                 []Field    `json:"fields"`
	AssignmentMode         string     `json:"assignment_mode"`
	AssignmentTargetUserID *uuid.UUID `json:"assignment_target_user_id"`
	CRMSyncTarget          string     `json:"crm_sync_target"`
	SlackNotifyEnabled     bool       `json:"slack_notify_enabled"`
}

type UpdateInput struct {
	Enabled                bool
	RequireConsent         bool
	Guidance               *string
	Fields                 []Field
	AssignmentMode         string
	AssignmentTargetUserID *uuid.UUID
	CRMSyncTarget          string
	SlackNotifyEnabled     bool
}

type Store interface {
	GetOrCreate(ctx context.Context, agentID, organizationID uuid.UUID) (*Config, error)
	Update(ctx context.Context, agentID, organizationID uuid.UUID, input UpdateInput) (*Config, error)
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

func (r *Repository) GetOrCreate(ctx context.Context, agentID, organizationID uuid.UUID) (*Config, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	config, err := r.get(ctx, agentID, organizationID)
	if err != nil || config != nil {
		return config, err
	}
	var exists bool
	if err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM agents WHERE id = $1 AND organization_id = $2)`, agentID, organizationID).Scan(&exists); err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrNotFound
	}
	_, err = r.pool.Exec(ctx, `INSERT INTO lead_capture_configs (agent_id, enabled) VALUES ($1, FALSE) ON CONFLICT (agent_id) DO NOTHING`, agentID)
	if err != nil {
		return nil, err
	}
	return r.get(ctx, agentID, organizationID)
}

func (r *Repository) Update(ctx context.Context, agentID, organizationID uuid.UUID, input UpdateInput) (*Config, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	if err := validate(input); err != nil {
		return nil, err
	}
	if input.AssignmentTargetUserID != nil {
		var exists bool
		if err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE id = $1 AND organization_id = $2)`, *input.AssignmentTargetUserID, organizationID).Scan(&exists); err != nil {
			return nil, err
		}
		if !exists {
			return nil, ErrAssignmentTarget
		}
	}
	if _, err := r.GetOrCreate(ctx, agentID, organizationID); err != nil {
		return nil, err
	}
	fields, err := json.Marshal(input.Fields)
	if err != nil {
		return nil, err
	}
	assignmentMode := strings.ToUpper(input.AssignmentMode)
	crmTarget := strings.ToUpper(input.CRMSyncTarget)
	_, err = r.pool.Exec(ctx, `
UPDATE lead_capture_configs
SET enabled = $3,
    require_consent = $4,
    guidance = $5,
    fields = $6,
	assignment_mode = $7::leadassignmentmode,
    assignment_target_user_id = $8,
	crm_sync_target = $9::crmsynctarget,
    slack_notify_enabled = $10,
    updated_at = NOW()
WHERE agent_id = $1
  AND EXISTS (SELECT 1 FROM agents WHERE id = $1 AND organization_id = $2)`,
		agentID, organizationID, input.Enabled, input.RequireConsent, input.Guidance, fields,
		assignmentMode, input.AssignmentTargetUserID, crmTarget, input.SlackNotifyEnabled)
	if err != nil {
		return nil, err
	}
	return r.get(ctx, agentID, organizationID)
}

func (r *Repository) get(ctx context.Context, agentID, organizationID uuid.UUID) (*Config, error) {
	var (
		config           Config
		guidance         pgtype.Text
		fields           []byte
		assignmentMode   string
		assignmentTarget pgtype.UUID
		crmSyncTarget    string
	)
	err := r.pool.QueryRow(ctx, `
SELECT l.agent_id, l.enabled, l.require_consent, l.guidance, l.fields,
       l.assignment_mode::text, l.assignment_target_user_id,
       l.crm_sync_target::text, l.slack_notify_enabled
FROM lead_capture_configs l
JOIN agents a ON a.id = l.agent_id
WHERE l.agent_id = $1 AND a.organization_id = $2`, agentID, organizationID).
		Scan(&config.AgentID, &config.Enabled, &config.RequireConsent, &guidance, &fields,
			&assignmentMode, &assignmentTarget, &crmSyncTarget, &config.SlackNotifyEnabled)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if guidance.Valid {
		value := guidance.String
		config.Guidance = &value
	}
	if assignmentTarget.Valid {
		value := uuid.UUID(assignmentTarget.Bytes)
		config.AssignmentTargetUserID = &value
	}
	config.AssignmentMode = strings.ToLower(assignmentMode)
	config.CRMSyncTarget = strings.ToLower(crmSyncTarget)
	if len(fields) == 0 || string(fields) == "null" {
		config.Fields = []Field{}
	} else if err := json.Unmarshal(fields, &config.Fields); err != nil {
		return nil, err
	}
	if config.Fields == nil {
		config.Fields = []Field{}
	}
	return &config, nil
}

func validate(input UpdateInput) error {
	if len(input.Fields) > 30 {
		return ErrTooManyFields
	}
	if !validAssignmentMode(input.AssignmentMode) {
		return ErrInvalidAssignmentMode
	}
	if !validCRMTarget(input.CRMSyncTarget) {
		return ErrInvalidCRMTarget
	}
	seen := make(map[string]struct{}, len(input.Fields))
	for _, field := range input.Fields {
		key := strings.TrimSpace(field.Key)
		if key == "" || len(key) > 100 {
			return ErrInvalidField
		}
		if _, ok := seen[key]; ok {
			return fmt.Errorf("duplicate lead capture field: %s", key)
		}
		seen[key] = struct{}{}
		if field.Label != nil && len([]rune(strings.TrimSpace(*field.Label))) > 100 {
			return ErrInvalidField
		}
	}
	return nil
}

func validAssignmentMode(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "none", "sales_team", "specific_person", "round_robin":
		return true
	default:
		return false
	}
}

func validCRMTarget(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "none", "hubspot", "pipedrive", "salesforce":
		return true
	default:
		return false
	}
}
