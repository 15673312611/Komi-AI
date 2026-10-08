package agent

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

type Knowledge struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
}

type Group struct {
	ID             uuid.UUID `json:"id"`
	Name           string    `json:"name"`
	Description    *string   `json:"description"`
	OrganizationID uuid.UUID `json:"organization_id"`
}

type Customization struct {
	ID                     int64          `json:"id"`
	AgentID                uuid.UUID      `json:"agent_id"`
	PhotoURL               *string        `json:"photo_url"`
	ChatBackgroundColor    *string        `json:"chat_background_color"`
	ChatBubbleColor        *string        `json:"chat_bubble_color"`
	ChatTextColor          *string        `json:"chat_text_color"`
	IconURL                *string        `json:"icon_url"`
	IconColor              *string        `json:"icon_color"`
	AccentColor            *string        `json:"accent_color"`
	FontFamily             *string        `json:"font_family"`
	CustomCSS              *string        `json:"custom_css"`
	CustomizationMetadata  map[string]any `json:"customization_metadata"`
	ChatStyle              *string        `json:"chat_style"`
	WidgetPosition         *string        `json:"widget_position"`
	WelcomeTitle           *string        `json:"welcome_title"`
	WelcomeSubtitle        *string        `json:"welcome_subtitle"`
	WelcomeMessage         *string        `json:"welcome_message"`
	ChatInitiationMessages []string       `json:"chat_initiation_messages"`
	QuickActions           []string       `json:"quick_actions"`
	ShowCitations          bool           `json:"show_citations"`
	CollectEmail           bool           `json:"collect_email"`
	ShowAIDisclaimer       bool           `json:"show_ai_disclaimer"`
	AllowNewChat           bool           `json:"allow_new_chat"`
}

type Agent struct {
	ID                     uuid.UUID      `json:"id"`
	Name                   string         `json:"name"`
	DisplayName            *string        `json:"display_name"`
	Description            *string        `json:"description"`
	AgentType              string         `json:"agent_type"`
	Instructions           []string       `json:"instructions"`
	IsActive               bool           `json:"is_active"`
	OrganizationID         uuid.UUID      `json:"organization_id"`
	TransferToHuman        bool           `json:"transfer_to_human"`
	AIRepliesEnabled       bool           `json:"ai_replies_enabled"`
	AskForRating           bool           `json:"ask_for_rating"`
	HandoffCollectEmail    bool           `json:"handoff_collect_email"`
	HandoffCollectName     bool           `json:"handoff_collect_name"`
	EnableRateLimiting     bool           `json:"enable_rate_limiting"`
	OverallLimitPerIP      int32          `json:"overall_limit_per_ip"`
	RequestsPerSecond      float64        `json:"requests_per_sec"`
	UseWorkflow            bool           `json:"use_workflow"`
	ActiveWorkflowID       *uuid.UUID     `json:"active_workflow_id"`
	AllowAttachments       bool           `json:"allow_attachments"`
	AllowedAttachmentTypes []string       `json:"allowed_attachment_types"`
	RequireTokenAuth       bool           `json:"require_token_auth"`
	TicketingEnabled       bool           `json:"ticketing_enabled"`
	TopicScope             *string        `json:"topic_scope"`
	GuardrailPrompt        *string        `json:"guardrail_prompt"`
	GuardrailEnabled       bool           `json:"guardrail_enabled"`
	CreatedAt              *time.Time     `json:"created_at"`
	UpdatedAt              *time.Time     `json:"updated_at"`
	Knowledge              []Knowledge    `json:"knowledge"`
	Customization          *Customization `json:"customization"`
	Groups                 []Group        `json:"groups"`
}

type RosterItem struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	DisplayName *string   `json:"display_name"`
	IsActive    bool      `json:"is_active"`
}

type CreateInput struct {
	Name                   string
	Description            *string
	AgentType              string
	Instructions           []string
	Tools                  json.RawMessage
	IsActive               bool
	IsDefault              bool
	TransferToHuman        bool
	AIRepliesEnabled       bool
	AskForRating           bool
	HandoffCollectEmail    bool
	HandoffCollectName     bool
	EnableRateLimiting     bool
	OverallLimitPerIP      int32
	RequestsPerSecond      float64
	UseWorkflow            bool
	ActiveWorkflowID       *uuid.UUID
	AllowAttachments       bool
	AllowedAttachmentTypes json.RawMessage
	RequireTokenAuth       bool
	TicketingEnabled       bool
	TopicScope             *string
	GuardrailPrompt        *string
	GuardrailEnabled       bool
	DisplayName            *string
}

type UpdateInput map[string]json.RawMessage
type CustomizationInput map[string]json.RawMessage

type Store interface {
	Create(ctx context.Context, organizationID uuid.UUID, input CreateInput) (*Agent, error)
	Get(ctx context.Context, id, organizationID uuid.UUID) (*Agent, error)
	List(ctx context.Context, organizationID uuid.UUID) ([]*Agent, error)
	Roster(ctx context.Context, organizationID uuid.UUID) ([]RosterItem, error)
	Update(ctx context.Context, id, organizationID uuid.UUID, input UpdateInput) (*Agent, error)
	UpdateGroups(ctx context.Context, id, organizationID uuid.UUID, groupIDs []uuid.UUID) (*Agent, error)
	UpsertCustomization(ctx context.Context, id, organizationID uuid.UUID, input CustomizationInput) (*Customization, error)
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

const agentProjection = `
SELECT a.id, a.name, a.display_name, a.description, a.agent_type::text,
       COALESCE(a.instructions, '[]'), COALESCE(a.is_active, FALSE),
       a.organization_id, COALESCE(a.transfer_to_human, FALSE),
       COALESCE(a.ai_replies_enabled, TRUE), COALESCE(a.ask_for_rating, FALSE),
       COALESCE(a.handoff_collect_email, TRUE), COALESCE(a.handoff_collect_name, TRUE),
       COALESCE(a.enable_rate_limiting, FALSE), COALESCE(a.overall_limit_per_ip, 100),
       COALESCE(a.requests_per_sec, 1.0), COALESCE(a.use_workflow, FALSE),
       a.active_workflow_id, COALESCE(a.allow_attachments, FALSE),
       a.allowed_attachment_types, COALESCE(a.require_token_auth, FALSE),
       COALESCE(a.ticketing_enabled, TRUE), a.topic_scope, a.guardrail_prompt,
       COALESCE(a.guardrail_enabled, TRUE), a.created_at, a.updated_at
FROM agents a
`

func (r *Repository) Create(ctx context.Context, organizationID uuid.UUID, input CreateInput) (*Agent, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	instructions, err := json.Marshal(input.Instructions)
	if err != nil {
		return nil, err
	}
	displayName := input.DisplayName
	if displayName == nil || strings.TrimSpace(*displayName) == "" {
		value := input.Name
		displayName = &value
	}
	agentType, err := databaseEnum(input.AgentType)
	if err != nil {
		return nil, err
	}
	id := uuid.New()
	_, err = r.pool.Exec(ctx, `
INSERT INTO agents (
    id, name, display_name, description, agent_type, instructions, tools,
    is_active, is_default, transfer_to_human, ai_replies_enabled, ask_for_rating,
    handoff_collect_email, handoff_collect_name, enable_rate_limiting,
    overall_limit_per_ip, requests_per_sec, use_workflow, active_workflow_id,
    allow_attachments, allowed_attachment_types, require_token_auth,
    ticketing_enabled, topic_scope, guardrail_prompt, guardrail_enabled,
    organization_id
	) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)`,
		id, input.Name, displayName, input.Description, agentType, string(instructions), nullableJSON(input.Tools),
		input.IsActive, input.IsDefault, input.TransferToHuman, input.AIRepliesEnabled, input.AskForRating,
		input.HandoffCollectEmail, input.HandoffCollectName, input.EnableRateLimiting,
		input.OverallLimitPerIP, input.RequestsPerSecond, input.UseWorkflow, input.ActiveWorkflowID,
		input.AllowAttachments, nullableJSON(input.AllowedAttachmentTypes), input.RequireTokenAuth,
		input.TicketingEnabled, input.TopicScope, input.GuardrailPrompt, input.GuardrailEnabled,
		organizationID,
	)
	if err != nil {
		return nil, err
	}
	return r.GetByName(ctx, organizationID, input.Name)
}

func (r *Repository) GetByName(ctx context.Context, organizationID uuid.UUID, name string) (*Agent, error) {
	row := r.pool.QueryRow(ctx, agentProjection+`WHERE a.organization_id = $1 AND a.name = $2`, organizationID, name)
	agent, err := scanAgent(row)
	if err != nil || agent == nil {
		return agent, err
	}
	if err := r.loadRelations(ctx, agent); err != nil {
		return nil, err
	}
	return agent, nil
}

func (r *Repository) Get(ctx context.Context, id, organizationID uuid.UUID) (*Agent, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	row := r.pool.QueryRow(ctx, agentProjection+`WHERE a.id = $1 AND a.organization_id = $2`, id, organizationID)
	agent, err := scanAgent(row)
	if err != nil || agent == nil {
		return agent, err
	}
	if err := r.loadRelations(ctx, agent); err != nil {
		return nil, err
	}
	return agent, nil
}

func (r *Repository) List(ctx context.Context, organizationID uuid.UUID) ([]*Agent, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	rows, err := r.pool.Query(ctx, agentProjection+`WHERE a.organization_id = $1 ORDER BY a.created_at DESC`, organizationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]*Agent, 0)
	for rows.Next() {
		agent, err := scanAgent(rows)
		if err != nil {
			return nil, err
		}
		if err := r.loadRelations(ctx, agent); err != nil {
			return nil, err
		}
		result = append(result, agent)
	}
	return result, rows.Err()
}

func (r *Repository) Roster(ctx context.Context, organizationID uuid.UUID) ([]RosterItem, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	rows, err := r.pool.Query(ctx, `SELECT id, name, display_name, COALESCE(is_active, FALSE) FROM agents WHERE organization_id = $1 ORDER BY created_at DESC`, organizationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]RosterItem, 0)
	for rows.Next() {
		var item RosterItem
		if err := rows.Scan(&item.ID, &item.Name, &item.DisplayName, &item.IsActive); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

func (r *Repository) Update(ctx context.Context, id, organizationID uuid.UUID, input UpdateInput) (*Agent, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	columns := map[string]string{
		"display_name": "display_name", "instructions": "instructions", "is_active": "is_active",
		"transfer_to_human": "transfer_to_human", "ai_replies_enabled": "ai_replies_enabled",
		"ask_for_rating": "ask_for_rating", "handoff_collect_email": "handoff_collect_email",
		"handoff_collect_name": "handoff_collect_name", "enable_rate_limiting": "enable_rate_limiting",
		"overall_limit_per_ip": "overall_limit_per_ip", "requests_per_sec": "requests_per_sec",
		"use_workflow": "use_workflow", "active_workflow_id": "active_workflow_id",
		"allow_attachments": "allow_attachments", "allowed_attachment_types": "allowed_attachment_types",
		"require_token_auth": "require_token_auth", "ticketing_enabled": "ticketing_enabled",
		"topic_scope": "topic_scope", "guardrail_prompt": "guardrail_prompt", "guardrail_enabled": "guardrail_enabled",
	}
	setParts := make([]string, 0, len(input)+1)
	args := make([]any, 0, len(input)+3)
	for key, raw := range input {
		column, ok := columns[key]
		if !ok {
			return nil, fmt.Errorf("field %q cannot be updated", key)
		}
		value, err := updateValue(key, raw)
		if err != nil {
			return nil, err
		}
		args = append(args, value)
		setParts = append(setParts, fmt.Sprintf("%s = $%d", column, len(args)))
	}
	if len(setParts) > 0 {
		args = append(args, id, organizationID)
		query := "UPDATE agents SET " + strings.Join(setParts, ", ") + ", updated_at = NOW() WHERE id = $" + fmt.Sprint(len(args)-1) + " AND organization_id = $" + fmt.Sprint(len(args))
		if _, err := r.pool.Exec(ctx, query, args...); err != nil {
			return nil, err
		}
	}
	return r.Get(ctx, id, organizationID)
}

func (r *Repository) UpdateGroups(ctx context.Context, id, organizationID uuid.UUID, groupIDs []uuid.UUID) (*Agent, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	var exists bool
	if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM agents WHERE id = $1 AND organization_id = $2)`, id, organizationID).Scan(&exists); err != nil {
		return nil, err
	}
	if !exists {
		return nil, pgx.ErrNoRows
	}
	var count int
	if err := tx.QueryRow(ctx, `SELECT COUNT(*) FROM groups WHERE organization_id = $1 AND id = ANY($2)`, organizationID, groupIDs).Scan(&count); err != nil {
		return nil, err
	}
	if count != len(groupIDs) {
		return nil, errors.New("invalid group IDs provided")
	}
	if _, err := tx.Exec(ctx, `DELETE FROM agent_usergroup WHERE agent_id = $1`, id); err != nil {
		return nil, err
	}
	for _, groupID := range groupIDs {
		if _, err := tx.Exec(ctx, `INSERT INTO agent_usergroup (agent_id, group_id) VALUES ($1, $2)`, id, groupID); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.Get(ctx, id, organizationID)
}

func (r *Repository) UpsertCustomization(ctx context.Context, id, organizationID uuid.UUID, input CustomizationInput) (*Customization, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	var agentExists bool
	if err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM agents WHERE id = $1 AND organization_id = $2)`, id, organizationID).Scan(&agentExists); err != nil {
		return nil, err
	}
	if !agentExists {
		return nil, pgx.ErrNoRows
	}
	columns := map[string]string{
		"photo_url": "photo_url", "chat_background_color": "chat_background_color", "chat_bubble_color": "chat_bubble_color",
		"chat_text_color": "chat_text_color", "icon_url": "icon_url", "icon_color": "icon_color", "accent_color": "accent_color",
		"font_family": "font_family", "custom_css": "custom_css", "customization_metadata": "customization_metadata",
		"chat_style": "chat_style", "widget_position": "widget_position", "welcome_title": "welcome_title",
		"welcome_subtitle": "welcome_subtitle", "welcome_message": "welcome_message", "chat_initiation_messages": "chat_initiation_messages",
		"quick_actions": "quick_actions", "show_citations": "show_citations", "collect_email": "collect_email",
		"show_ai_disclaimer": "show_ai_disclaimer", "allow_new_chat": "allow_new_chat",
	}
	setParts := make([]string, 0, len(input))
	args := make([]any, 0, len(input)+1)
	for key, raw := range input {
		column, ok := columns[key]
		if !ok {
			return nil, fmt.Errorf("field %q cannot be updated", key)
		}
		value, err := customizationValue(key, raw)
		if err != nil {
			return nil, err
		}
		args = append(args, value)
		switch key {
		case "chat_style":
			setParts = append(setParts, fmt.Sprintf("%s = $%d::chatstyle", column, len(args)))
		case "widget_position":
			setParts = append(setParts, fmt.Sprintf("%s = $%d::widgetposition", column, len(args)))
		default:
			setParts = append(setParts, fmt.Sprintf("%s = $%d", column, len(args)))
		}
	}
	if len(setParts) == 0 {
		return r.getCustomization(ctx, id)
	}
	args = append(args, id)
	query := "UPDATE agent_customizations SET " + strings.Join(setParts, ", ") + " WHERE agent_id = $" + fmt.Sprint(len(args))
	result, err := r.pool.Exec(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	if result.RowsAffected() == 0 {
		columnsSQL := []string{"agent_id"}
		placeholders := []string{"$1"}
		insertArgs := []any{id}
		for index, part := range setParts {
			key := strings.SplitN(part, " = ", 2)[0]
			columnsSQL = append(columnsSQL, key)
			placeholder := fmt.Sprintf("$%d", index+2)
			switch key {
			case "chat_style":
				placeholder += "::chatstyle"
			case "widget_position":
				placeholder += "::widgetposition"
			}
			placeholders = append(placeholders, placeholder)
			insertArgs = append(insertArgs, args[index])
		}
		if _, err := r.pool.Exec(ctx, "INSERT INTO agent_customizations ("+strings.Join(columnsSQL, ", ")+") VALUES ("+strings.Join(placeholders, ", ")+")", insertArgs...); err != nil {
			return nil, err
		}
	}
	return r.getCustomization(ctx, id)
}

func (r *Repository) loadRelations(ctx context.Context, agent *Agent) error {
	agent.Knowledge = []Knowledge{}
	knowledgeRows, err := r.pool.Query(ctx, `SELECT k.id, k.source, k.source_type::text FROM knowledge k JOIN knowledge_to_agents link ON link.knowledge_id = k.id WHERE link.agent_id = $1 ORDER BY k.id`, agent.ID)
	if err != nil {
		return err
	}
	for knowledgeRows.Next() {
		var item Knowledge
		if err := knowledgeRows.Scan(&item.ID, &item.Name, &item.Type); err != nil {
			knowledgeRows.Close()
			return err
		}
		item.Type = enumValue(item.Type)
		agent.Knowledge = append(agent.Knowledge, item)
	}
	knowledgeRows.Close()
	if err := knowledgeRows.Err(); err != nil {
		return err
	}
	agent.Groups = []Group{}
	groupRows, err := r.pool.Query(ctx, `SELECT g.id, g.name, g.description, g.organization_id FROM groups g JOIN agent_usergroup link ON link.group_id = g.id WHERE link.agent_id = $1 ORDER BY g.name`, agent.ID)
	if err != nil {
		return err
	}
	for groupRows.Next() {
		var group Group
		if err := groupRows.Scan(&group.ID, &group.Name, &group.Description, &group.OrganizationID); err != nil {
			groupRows.Close()
			return err
		}
		agent.Groups = append(agent.Groups, group)
	}
	groupRows.Close()
	if err := groupRows.Err(); err != nil {
		return err
	}
	agent.Customization, err = r.getCustomization(ctx, agent.ID)
	return err
}

func scanAgent(row interface{ Scan(...any) error }) (*Agent, error) {
	var (
		agent                                     Agent
		displayName, description, instructionText pgtype.Text
		agentType                                 string
		activeWorkflowID                          pgtype.UUID
		allowedAttachmentTypes                    []byte
		topicScope, guardrailPrompt               pgtype.Text
		createdAt, updatedAt                      pgtype.Timestamptz
	)
	err := row.Scan(
		&agent.ID, &agent.Name, &displayName, &description, &agentType, &instructionText,
		&agent.IsActive, &agent.OrganizationID, &agent.TransferToHuman, &agent.AIRepliesEnabled,
		&agent.AskForRating, &agent.HandoffCollectEmail, &agent.HandoffCollectName,
		&agent.EnableRateLimiting, &agent.OverallLimitPerIP, &agent.RequestsPerSecond,
		&agent.UseWorkflow, &activeWorkflowID, &agent.AllowAttachments, &allowedAttachmentTypes,
		&agent.RequireTokenAuth, &agent.TicketingEnabled, &topicScope, &guardrailPrompt,
		&agent.GuardrailEnabled, &createdAt, &updatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	agent.DisplayName = textValue(displayName)
	agent.Description = textValue(description)
	agent.TopicScope = textValue(topicScope)
	agent.GuardrailPrompt = textValue(guardrailPrompt)
	agent.AgentType = enumValue(agentType)
	agent.Instructions = stringList(instructionText.String)
	agent.ActiveWorkflowID = uuidValue(activeWorkflowID)
	agent.AllowedAttachmentTypes = stringListJSON(allowedAttachmentTypes)
	agent.CreatedAt = timeValue(createdAt)
	agent.UpdatedAt = timeValue(updatedAt)
	agent.Knowledge = []Knowledge{}
	agent.Groups = []Group{}
	return &agent, nil
}

func (r *Repository) getCustomization(ctx context.Context, agentID uuid.UUID) (*Customization, error) {
	row := r.pool.QueryRow(ctx, `
SELECT id, agent_id, photo_url, chat_background_color, chat_bubble_color, chat_text_color,
       icon_url, icon_color, accent_color, font_family, custom_css, customization_metadata,
       chat_style::text, widget_position::text, welcome_title, welcome_subtitle, welcome_message,
       chat_initiation_messages, quick_actions, COALESCE(show_citations, FALSE),
       COALESCE(collect_email, FALSE), COALESCE(show_ai_disclaimer, TRUE), COALESCE(allow_new_chat, FALSE)
FROM agent_customizations WHERE agent_id = $1 ORDER BY id LIMIT 1`, agentID)
	return scanCustomization(row)
}

func scanCustomization(row interface{ Scan(...any) error }) (*Customization, error) {
	var (
		customization                             Customization
		photoURL, background, bubble, textColor   pgtype.Text
		iconURL, iconColor, accent, fontFamily    pgtype.Text
		customCSS, welcomeTitle, welcomeSubtitle  pgtype.Text
		welcomeMessage, chatStyle, widgetPosition pgtype.Text
		metadata, initiations, quickActions       []byte
	)
	err := row.Scan(
		&customization.ID, &customization.AgentID, &photoURL, &background, &bubble, &textColor,
		&iconURL, &iconColor, &accent, &fontFamily, &customCSS, &metadata,
		&chatStyle, &widgetPosition, &welcomeTitle, &welcomeSubtitle, &welcomeMessage,
		&initiations, &quickActions, &customization.ShowCitations, &customization.CollectEmail,
		&customization.ShowAIDisclaimer, &customization.AllowNewChat,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	customization.PhotoURL = textValue(photoURL)
	customization.ChatBackgroundColor = textValue(background)
	customization.ChatBubbleColor = textValue(bubble)
	customization.ChatTextColor = textValue(textColor)
	customization.IconURL = textValue(iconURL)
	customization.IconColor = textValue(iconColor)
	customization.AccentColor = textValue(accent)
	customization.FontFamily = textValue(fontFamily)
	customization.CustomCSS = textValue(customCSS)
	customization.ChatStyle = textValue(chatStyle)
	customization.WidgetPosition = textValue(widgetPosition)
	customization.WelcomeTitle = textValue(welcomeTitle)
	customization.WelcomeSubtitle = textValue(welcomeSubtitle)
	customization.WelcomeMessage = textValue(welcomeMessage)
	customization.CustomizationMetadata = objectJSON(metadata)
	customization.ChatInitiationMessages = stringListJSON(initiations)
	customization.QuickActions = stringListJSON(quickActions)
	return &customization, nil
}

func updateValue(key string, raw json.RawMessage) (any, error) {
	if string(raw) == "null" {
		return nil, nil
	}
	switch key {
	case "instructions":
		var values []string
		if err := json.Unmarshal(raw, &values); err != nil {
			return nil, err
		}
		return json.Marshal(values)
	case "allowed_attachment_types":
		return []byte(raw), nil
	case "active_workflow_id":
		var value string
		if err := json.Unmarshal(raw, &value); err != nil {
			return nil, err
		}
		return uuid.Parse(value)
	case "display_name", "topic_scope", "guardrail_prompt":
		var value string
		return value, json.Unmarshal(raw, &value)
	case "overall_limit_per_ip":
		var value int32
		return value, json.Unmarshal(raw, &value)
	case "requests_per_sec":
		var value float64
		return value, json.Unmarshal(raw, &value)
	default:
		var value bool
		return value, json.Unmarshal(raw, &value)
	}
}

func customizationValue(key string, raw json.RawMessage) (any, error) {
	if string(raw) == "null" {
		return nil, nil
	}
	if key == "customization_metadata" || key == "chat_initiation_messages" || key == "quick_actions" {
		return []byte(raw), nil
	}
	if key == "chat_style" || key == "widget_position" {
		var value string
		return value, json.Unmarshal(raw, &value)
	}
	if key == "show_citations" || key == "collect_email" || key == "show_ai_disclaimer" || key == "allow_new_chat" {
		var value bool
		return value, json.Unmarshal(raw, &value)
	}
	var value string
	return value, json.Unmarshal(raw, &value)
}

func databaseEnum(value string) (string, error) {
	switch strings.ToLower(value) {
	case "customer_support", "sales", "tech_support", "general", "custom":
		return strings.ToUpper(value), nil
	default:
		return "", fmt.Errorf("invalid agent_type %q", value)
	}
}

func nullableJSON(value json.RawMessage) any {
	if len(value) == 0 || string(value) == "null" {
		return nil
	}
	return []byte(value)
}

func enumValue(value string) string {
	return strings.ToLower(value)
}

func stringList(value string) []string {
	var result []string
	if json.Unmarshal([]byte(value), &result) == nil && result != nil {
		return result
	}
	if strings.TrimSpace(value) == "" || strings.TrimSpace(value) == "null" {
		return []string{}
	}
	return []string{value}
}

func stringListJSON(value []byte) []string {
	if len(value) == 0 || string(value) == "null" {
		return nil
	}
	var result []string
	if json.Unmarshal(value, &result) != nil {
		return nil
	}
	return result
}

func objectJSON(value []byte) map[string]any {
	if len(value) == 0 || string(value) == "null" {
		return nil
	}
	var result map[string]any
	if json.Unmarshal(value, &result) != nil {
		return nil
	}
	return result
}

func textValue(value pgtype.Text) *string {
	if !value.Valid {
		return nil
	}
	result := value.String
	return &result
}

func uuidValue(value pgtype.UUID) *uuid.UUID {
	if !value.Valid {
		return nil
	}
	result := uuid.UUID(value.Bytes)
	return &result
}

func timeValue(value pgtype.Timestamptz) *time.Time {
	if !value.Valid {
		return nil
	}
	result := value.Time
	return &result
}
