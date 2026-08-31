package session

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Session struct {
	ID         uuid.UUID `json:"session_id"`
	CustomerID uuid.UUID `json:"customer_id"`
	Status     string    `json:"status"`
}

type ManagedSession struct {
	ID             uuid.UUID
	OrganizationID uuid.UUID
	CustomerID     uuid.UUID
	AgentID        *uuid.UUID
	UserID         *uuid.UUID
	GroupID        *uuid.UUID
	Status         string
	Channel        string
	WorkflowID     *uuid.UUID
	CurrentNodeID  *uuid.UUID
	WorkflowState  map[string]any
}

// TicketInfo is the legacy session-level ticket projection used by the AI
// Jira tools. Native tickets additionally live in ticket_sessions, but Jira
// tickets are intentionally represented by the string fields on the session.
type TicketInfo struct {
	TicketID          string
	TicketStatus      string
	TicketSummary     string
	TicketDescription string
	IntegrationType   string
	TicketPriority    string
	TicketURL         string `json:"ticket_url,omitempty"`
}

type HumanAgent struct {
	Name       *string `json:"human_agent_name"`
	ProfilePic *string `json:"human_agent_profile_pic"`
}

type Store interface {
	Get(ctx context.Context, id uuid.UUID) (*Session, error)
	GetCustomerHumanAgent(ctx context.Context, customerID uuid.UUID) (*HumanAgent, error)
	Close(ctx context.Context, id uuid.UUID, reason, description *string) (bool, error)
}

type ManagementStore interface {
	Store
	UpdateTags(ctx context.Context, id, organizationID uuid.UUID, tags []string) (bool, error)
	Takeover(ctx context.Context, id, organizationID, userID uuid.UUID) (bool, error)
}

type ActionStore interface {
	ManagementStore
	GetManaged(ctx context.Context, id, organizationID uuid.UUID) (*ManagedSession, error)
	RouteToHuman(ctx context.Context, id, organizationID uuid.UUID, reason, description string) (bool, error)
	SetAIAutoReply(ctx context.Context, id, organizationID uuid.UUID, enabled bool) (bool, error)
	HandBackToAI(ctx context.Context, id, organizationID uuid.UUID) (bool, error)
	Reassign(ctx context.Context, id, organizationID, userID uuid.UUID) (bool, error)
}

type GroupStore interface {
	SetGroup(ctx context.Context, id, organizationID, groupID uuid.UUID) (bool, error)
}

// TicketStore is an optional session extension for AI integrations. It keeps
// Jira state updates behind the session repository instead of letting the AI
// runtime write organization-scoped SQL directly.
type TicketStore interface {
	GetTicketInfo(ctx context.Context, id, organizationID uuid.UUID) (*TicketInfo, error)
	UpdateTicketInfo(ctx context.Context, id, organizationID uuid.UUID, info TicketInfo) (bool, error)
}

// WidgetStore contains the customer-session operations used by the realtime
// widget. It is kept separate from Store so existing REST fakes and read-only
// integrations do not need to implement widget lifecycle methods.
type WidgetStore interface {
	Store
	GetActiveCustomerSession(ctx context.Context, customerID, agentID uuid.UUID) (*ManagedSession, error)
	CreateWidgetSession(ctx context.Context, sessionID, organizationID, customerID, agentID uuid.UUID, channel string) (*ManagedSession, error)
}

// CleanupStore is used only when an outbound operation created an empty
// session and the provider rejected the first message. The database cascade
// removes the channel conversation while chat history remains untouched for
// sessions that already contained messages.
type CleanupStore interface {
	Delete(ctx context.Context, id, organizationID uuid.UUID) (bool, error)
}

// WorkflowStore persists the durable state used while a widget workflow is
// executing. It is intentionally small so the workflow package does not need
// to depend on the session repository implementation.
type WorkflowStore interface {
	SetWorkflowState(ctx context.Context, id, organizationID uuid.UUID, currentNodeID *uuid.UUID, state map[string]any) (bool, error)
	AddWorkflowHistory(ctx context.Context, id, organizationID, nodeID uuid.UUID, eventType string, data map[string]any) error
}

type WorkflowHistoryReader interface {
	HasWorkflowHistory(ctx context.Context, id, organizationID uuid.UUID) (bool, error)
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

func (r *Repository) Get(ctx context.Context, id uuid.UUID) (*Session, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	var found Session
	err := r.pool.QueryRow(ctx, `
SELECT session_id, customer_id, status::text
FROM session_to_agents WHERE session_id = $1`, id).
		Scan(&found.ID, &found.CustomerID, &found.Status)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &found, nil
}

func (r *Repository) GetCustomerHumanAgent(ctx context.Context, customerID uuid.UUID) (*HumanAgent, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	var agent HumanAgent
	var name, profilePic pgtype.Text
	err := r.pool.QueryRow(ctx, `
SELECT u.full_name, u.profile_pic
FROM session_to_agents s
LEFT JOIN users u ON u.id = s.user_id
WHERE s.customer_id = $1 AND s.status::text = 'OPEN'
ORDER BY s.assigned_at DESC NULLS LAST
LIMIT 1`, customerID).Scan(&name, &profilePic)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if name.Valid {
		value := name.String
		agent.Name = &value
	}
	if profilePic.Valid {
		value := profilePic.String
		agent.ProfilePic = &value
	}
	if agent.Name == nil || strings.TrimSpace(*agent.Name) == "" {
		return nil, nil
	}
	return &agent, nil
}

func (r *Repository) Close(ctx context.Context, id uuid.UUID, reason, description *string) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("database is not configured")
	}
	current, err := r.Get(ctx, id)
	if err != nil || current == nil {
		return false, err
	}
	if strings.EqualFold(current.Status, "closed") {
		return true, nil
	}
	if reason != nil {
		value := strings.TrimSpace(*reason)
		if !validEndChatReason(value) {
			value = "ISSUE_RESOLVED"
		}
		reason = &value
	}
	var hasClosedAt bool
	if err := r.pool.QueryRow(ctx, `
SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'session_to_agents'
      AND column_name = 'closed_at'
)`).Scan(&hasClosedAt); err != nil {
		return false, err
	}
	query := `
UPDATE session_to_agents
SET status = 'CLOSED',
    end_chat_reason = CASE WHEN $2::text = '' THEN end_chat_reason ELSE $2::endchatreasontype END,
    end_chat_description = COALESCE($3, end_chat_description), updated_at = NOW()
WHERE session_id = $1`
	if hasClosedAt {
		query = `
UPDATE session_to_agents
SET status = 'CLOSED', closed_at = NOW(),
    end_chat_reason = CASE WHEN $2::text = '' THEN end_chat_reason ELSE $2::endchatreasontype END,
    end_chat_description = COALESCE($3, end_chat_description), updated_at = NOW()
WHERE session_id = $1`
	}
	_, err = r.pool.Exec(ctx, query, id, nullableString(reason), description)
	if err != nil {
		return false, err
	}
	return true, nil
}

func (r *Repository) UpdateTags(ctx context.Context, id, organizationID uuid.UUID, tags []string) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("database is not configured")
	}
	var raw []byte
	if err := r.pool.QueryRow(ctx, `
SELECT workflow_state FROM session_to_agents
WHERE session_id = $1 AND organization_id = $2`, id, organizationID).Scan(&raw); errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	} else if err != nil {
		return false, err
	}
	state := map[string]any{}
	if len(raw) > 0 && string(raw) != "null" {
		if err := json.Unmarshal(raw, &state); err != nil {
			return false, err
		}
	}
	state["conversation_tags"] = tags
	encoded, err := json.Marshal(state)
	if err != nil {
		return false, err
	}
	result, err := r.pool.Exec(ctx, `
UPDATE session_to_agents
SET workflow_state = $3, updated_at = NOW()
WHERE session_id = $1 AND organization_id = $2`, id, organizationID, encoded)
	return result.RowsAffected() > 0, err
}

func (r *Repository) Takeover(ctx context.Context, id, organizationID, userID uuid.UUID) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("database is not configured")
	}
	result, err := r.pool.Exec(ctx, `
UPDATE session_to_agents
SET user_id = $3, group_id = NULL, status = 'OPEN'::sessionstatus, updated_at = NOW()
WHERE session_id = $1 AND organization_id = $2 AND (user_id IS NULL OR user_id = $3 OR status = 'CLOSED'::sessionstatus)`, id, organizationID, userID)
	if err != nil {
		return false, err
	}
	return result.RowsAffected() > 0, nil
}

func (r *Repository) GetManaged(ctx context.Context, id, organizationID uuid.UUID) (*ManagedSession, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	var (
		found                     ManagedSession
		agentID, userID, groupID  pgtype.UUID
		channel                   pgtype.Text
		workflowID, currentNodeID pgtype.UUID
		rawWorkflowState          []byte
	)
	err := r.pool.QueryRow(ctx, `
SELECT session_id, organization_id, customer_id, agent_id, user_id, group_id,
       status::text, COALESCE(channel, 'web'), workflow_id, current_node_id, workflow_state
FROM session_to_agents
WHERE session_id = $1 AND organization_id = $2`, id, organizationID).Scan(
		&found.ID, &found.OrganizationID, &found.CustomerID, &agentID, &userID,
		&groupID, &found.Status, &channel, &workflowID, &currentNodeID, &rawWorkflowState,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	found.AgentID = sessionUUIDPointer(agentID)
	found.UserID = sessionUUIDPointer(userID)
	found.GroupID = sessionUUIDPointer(groupID)
	found.WorkflowID = sessionUUIDPointer(workflowID)
	found.CurrentNodeID = sessionUUIDPointer(currentNodeID)
	if channel.Valid {
		found.Channel = channel.String
	} else {
		found.Channel = "web"
	}
	found.WorkflowState = decodeState(rawWorkflowState)
	return &found, nil
}

func (r *Repository) GetTicketInfo(ctx context.Context, id, organizationID uuid.UUID) (*TicketInfo, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	var info TicketInfo
	var ticketID, status, summary, description, integration, priority pgtype.Text
	err := r.pool.QueryRow(ctx, `
SELECT ticket_id, ticket_status, ticket_summary, ticket_description,
       integration_type, ticket_priority
FROM session_to_agents
WHERE session_id=$1 AND organization_id=$2`, id, organizationID).Scan(
		&ticketID, &status, &summary, &description, &integration, &priority,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	info.TicketID = textValue(ticketID)
	info.TicketStatus = textValue(status)
	info.TicketSummary = textValue(summary)
	info.TicketDescription = textValue(description)
	info.IntegrationType = textValue(integration)
	info.TicketPriority = textValue(priority)
	return &info, nil
}

func (r *Repository) UpdateTicketInfo(ctx context.Context, id, organizationID uuid.UUID, info TicketInfo) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("database is not configured")
	}
	result, err := r.pool.Exec(ctx, `
UPDATE session_to_agents
SET ticket_id=NULLIF($3,''), ticket_status=NULLIF($4,''),
    ticket_summary=NULLIF($5,''), ticket_description=NULLIF($6,''),
    integration_type=NULLIF($7,''), ticket_priority=NULLIF($8,''), updated_at=NOW()
WHERE session_id=$1 AND organization_id=$2`, id, organizationID,
		info.TicketID, info.TicketStatus, info.TicketSummary, info.TicketDescription,
		info.IntegrationType, info.TicketPriority)
	if err != nil {
		return false, err
	}
	return result.RowsAffected() > 0, nil
}

func (r *Repository) GetActiveCustomerSession(ctx context.Context, customerID, agentID uuid.UUID) (*ManagedSession, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	var (
		found                ManagedSession
		agentIDValue, userID pgtype.UUID
		groupID, workflowID  pgtype.UUID
		currentNodeID        pgtype.UUID
		channel              pgtype.Text
		rawWorkflowState     []byte
	)
	query := `
SELECT session_id, organization_id, customer_id, agent_id, user_id, group_id,
       status::text, COALESCE(channel, 'web'), workflow_id, current_node_id,
       workflow_state
FROM session_to_agents
WHERE customer_id = $1
  AND agent_id = $2
  AND status::text IN ('OPEN', 'TRANSFERRED')
ORDER BY assigned_at DESC NULLS LAST
LIMIT 1`
	err := r.pool.QueryRow(ctx, query, customerID, agentID).Scan(
		&found.ID, &found.OrganizationID, &found.CustomerID, &agentIDValue,
		&userID, &groupID, &found.Status, &channel, &workflowID, &currentNodeID,
		&rawWorkflowState,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	found.AgentID = sessionUUIDPointer(agentIDValue)
	found.UserID = sessionUUIDPointer(userID)
	found.GroupID = sessionUUIDPointer(groupID)
	found.WorkflowID = sessionUUIDPointer(workflowID)
	found.CurrentNodeID = sessionUUIDPointer(currentNodeID)
	if channel.Valid {
		found.Channel = channel.String
	} else {
		found.Channel = "web"
	}
	found.WorkflowState = decodeState(rawWorkflowState)
	return &found, nil
}

func (r *Repository) CreateWidgetSession(ctx context.Context, sessionID, organizationID, customerID, agentID uuid.UUID, channel string) (*ManagedSession, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	channel = strings.TrimSpace(channel)
	if channel == "" {
		channel = "web"
	}
	_, err := r.pool.Exec(ctx, `
INSERT INTO session_to_agents (
    session_id, organization_id, customer_id, agent_id, status, channel, workflow_id
)
SELECT $1, $2, $3, $4, 'OPEN'::sessionstatus, $5,
       CASE WHEN COALESCE(a.use_workflow, FALSE) THEN a.active_workflow_id ELSE NULL END
FROM agents a
WHERE a.id = $4 AND a.organization_id = $2`,
		sessionID, organizationID, customerID, agentID, channel)
	if err != nil {
		return nil, err
	}
	managed, err := r.GetManaged(ctx, sessionID, organizationID)
	if err != nil {
		return nil, err
	}
	if managed == nil {
		return nil, errors.New("agent or organization was not found")
	}
	return managed, nil
}

func (r *Repository) Delete(ctx context.Context, id, organizationID uuid.UUID) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("database is not configured")
	}
	result, err := r.pool.Exec(ctx, `
DELETE FROM session_to_agents
WHERE session_id=$1 AND organization_id=$2`, id, organizationID)
	if err != nil {
		return false, err
	}
	return result.RowsAffected() > 0, nil
}

func (r *Repository) RouteToHuman(ctx context.Context, id, organizationID uuid.UUID, reason, description string) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("database is not configured")
	}
	result, err := r.pool.Exec(ctx, `
UPDATE session_to_agents
SET status = 'TRANSFERRED'::sessionstatus,
    transfer_reason = NULLIF($3, ''),
    transfer_description = NULLIF($4, ''),
    updated_at = NOW()
WHERE session_id = $1 AND organization_id = $2
  AND user_id IS NULL AND status = 'OPEN'::sessionstatus`, id, organizationID, reason, description)
	if err != nil {
		return false, err
	}
	return result.RowsAffected() > 0, nil
}

func (r *Repository) SetGroup(ctx context.Context, id, organizationID, groupID uuid.UUID) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("database is not configured")
	}
	result, err := r.pool.Exec(ctx, `
UPDATE session_to_agents
SET group_id = $3, updated_at = NOW()
WHERE session_id = $1 AND organization_id = $2
  AND status = 'TRANSFERRED'::sessionstatus`, id, organizationID, groupID)
	if err != nil {
		return false, err
	}
	return result.RowsAffected() > 0, nil
}

func (r *Repository) SetAIAutoReply(ctx context.Context, id, organizationID uuid.UUID, enabled bool) (bool, error) {
	return r.updateWorkflowState(ctx, id, organizationID, func(state map[string]any) {
		state["ai_auto_reply"] = enabled
	})
}

func (r *Repository) HandBackToAI(ctx context.Context, id, organizationID uuid.UUID) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("database is not configured")
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback(ctx)

	var raw []byte
	if err := tx.QueryRow(ctx, `
SELECT workflow_state FROM session_to_agents
WHERE session_id = $1 AND organization_id = $2
  AND status <> 'CLOSED'::sessionstatus`, id, organizationID).Scan(&raw); errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	} else if err != nil {
		return false, err
	}
	state := decodeState(raw)
	state["ai_auto_reply"] = true
	encoded, err := json.Marshal(state)
	if err != nil {
		return false, err
	}
	result, err := tx.Exec(ctx, `
UPDATE session_to_agents
SET user_id = NULL, group_id = NULL, status = 'OPEN'::sessionstatus,
    workflow_state = $3, updated_at = NOW()
WHERE session_id = $1 AND organization_id = $2
  AND status <> 'CLOSED'::sessionstatus`, id, organizationID, encoded)
	if err != nil {
		return false, err
	}
	if result.RowsAffected() == 0 {
		return false, nil
	}
	if err := tx.Commit(ctx); err != nil {
		return false, err
	}
	return true, nil
}

func (r *Repository) Reassign(ctx context.Context, id, organizationID, userID uuid.UUID) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("database is not configured")
	}
	result, err := r.pool.Exec(ctx, `
UPDATE session_to_agents
SET user_id = $3, group_id = NULL, status = 'OPEN'::sessionstatus, updated_at = NOW()
WHERE session_id = $1 AND organization_id = $2
  AND status <> 'CLOSED'::sessionstatus`, id, organizationID, userID)
	if err != nil {
		return false, err
	}
	return result.RowsAffected() > 0, nil
}

func (r *Repository) updateWorkflowState(ctx context.Context, id, organizationID uuid.UUID, mutate func(map[string]any)) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("database is not configured")
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback(ctx)
	var raw []byte
	if err := tx.QueryRow(ctx, `
SELECT workflow_state FROM session_to_agents
WHERE session_id = $1 AND organization_id = $2`, id, organizationID).Scan(&raw); errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	} else if err != nil {
		return false, err
	}
	state := decodeState(raw)
	mutate(state)
	encoded, err := json.Marshal(state)
	if err != nil {
		return false, err
	}
	result, err := tx.Exec(ctx, `
UPDATE session_to_agents
SET workflow_state = $3, updated_at = NOW()
WHERE session_id = $1 AND organization_id = $2`, id, organizationID, encoded)
	if err != nil {
		return false, err
	}
	if result.RowsAffected() == 0 {
		return false, nil
	}
	if err := tx.Commit(ctx); err != nil {
		return false, err
	}
	return true, nil
}

func (r *Repository) SetWorkflowState(ctx context.Context, id, organizationID uuid.UUID, currentNodeID *uuid.UUID, state map[string]any) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("database is not configured")
	}
	if state == nil {
		state = map[string]any{}
	}
	encoded, err := json.Marshal(state)
	if err != nil {
		return false, err
	}
	result, err := r.pool.Exec(ctx, `
UPDATE session_to_agents
SET current_node_id = $3, workflow_state = $4, updated_at = NOW()
WHERE session_id = $1 AND organization_id = $2`, id, organizationID, currentNodeID, encoded)
	if err != nil {
		return false, err
	}
	return result.RowsAffected() > 0, nil
}

func (r *Repository) AddWorkflowHistory(ctx context.Context, id, organizationID, nodeID uuid.UUID, eventType string, data map[string]any) error {
	if r == nil || r.pool == nil {
		return errors.New("database is not configured")
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var raw []byte
	if err := tx.QueryRow(ctx, `
SELECT workflow_history FROM session_to_agents
WHERE session_id = $1 AND organization_id = $2 FOR UPDATE`, id, organizationID).Scan(&raw); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return err
	}
	history := make([]map[string]any, 0)
	if len(raw) > 0 && string(raw) != "null" && json.Unmarshal(raw, &history) != nil {
		return errors.New("invalid workflow history")
	}
	if data == nil {
		data = map[string]any{}
	}
	history = append(history, map[string]any{
		"node_id": nodeID.String(), "event_type": eventType, "data": data, "timestamp": time.Now().UTC().Format(time.RFC3339Nano),
	})
	encoded, err := json.Marshal(history)
	if err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `
UPDATE session_to_agents SET workflow_history = $3, updated_at = NOW()
WHERE session_id = $1 AND organization_id = $2`, id, organizationID, encoded); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *Repository) HasWorkflowHistory(ctx context.Context, id, organizationID uuid.UUID) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("database is not configured")
	}
	var found bool
	err := r.pool.QueryRow(ctx, `
SELECT COALESCE(jsonb_array_length(workflow_history), 0) > 0
FROM session_to_agents
WHERE session_id = $1 AND organization_id = $2`, id, organizationID).Scan(&found)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}
	return found, err
}

func decodeState(raw []byte) map[string]any {
	state := make(map[string]any)
	if len(raw) > 0 && string(raw) != "null" {
		if err := json.Unmarshal(raw, &state); err != nil || state == nil {
			return make(map[string]any)
		}
	}
	return state
}

func textValue(value pgtype.Text) string {
	if !value.Valid {
		return ""
	}
	return value.String
}

func sessionUUIDPointer(value pgtype.UUID) *uuid.UUID {
	if !value.Valid {
		return nil
	}
	result := uuid.UUID(value.Bytes)
	return &result
}

func nullableString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func validEndChatReason(value string) bool {
	switch value {
	case "ISSUE_RESOLVED", "CUSTOMER_REQUEST", "CONFIRMATION_RECEIVED", "FAREWELL", "THANK_YOU", "NATURAL_CONCLUSION", "TASK_COMPLETED":
		return true
	default:
		return false
	}
}
