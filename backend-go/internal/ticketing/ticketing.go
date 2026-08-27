package ticketing

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound      = errors.New("ticket not found")
	ErrRunNotFound   = errors.New("run not found")
	ErrNoProposal    = errors.New("no pending proposal for this ticket")
	ErrInvalid       = errors.New("invalid ticket data")
	ErrIllegalStatus = errors.New("illegal ticket status transition")
	ErrActiveRun     = errors.New("an AI run is already active for this ticket, or its run limit was reached")
)

const (
	StatusOpen                        = "open"
	StatusTriaging                    = "triaging"
	StatusInvestigating               = "investigating"
	StatusAwaitingApproval            = "awaiting_approval"
	StatusInProgress                  = "in_progress"
	StatusResolvedPendingConfirmation = "resolved_pending_confirmation"
	StatusResolved                    = "resolved"
	StatusClosed                      = "closed"
	StatusReopened                    = "reopened"
)

var statusTransitions = map[string]map[string]bool{
	StatusOpen:                        {StatusTriaging: true, StatusInvestigating: true, StatusAwaitingApproval: true, StatusInProgress: true, StatusResolvedPendingConfirmation: true, StatusResolved: true, StatusClosed: true},
	StatusTriaging:                    {StatusOpen: true, StatusInvestigating: true, StatusInProgress: true, StatusAwaitingApproval: true, StatusResolved: true, StatusClosed: true},
	StatusInvestigating:               {StatusOpen: true, StatusAwaitingApproval: true, StatusInProgress: true, StatusResolvedPendingConfirmation: true, StatusResolved: true, StatusClosed: true},
	StatusAwaitingApproval:            {StatusOpen: true, StatusInvestigating: true, StatusInProgress: true, StatusResolvedPendingConfirmation: true, StatusResolved: true, StatusClosed: true},
	StatusInProgress:                  {StatusOpen: true, StatusInvestigating: true, StatusAwaitingApproval: true, StatusResolvedPendingConfirmation: true, StatusResolved: true, StatusClosed: true},
	StatusResolvedPendingConfirmation: {StatusResolved: true, StatusClosed: true, StatusReopened: true},
	StatusResolved:                    {StatusClosed: true, StatusReopened: true},
	StatusClosed:                      {StatusReopened: true},
	StatusReopened:                    {StatusTriaging: true, StatusInvestigating: true, StatusAwaitingApproval: true, StatusInProgress: true, StatusResolvedPendingConfirmation: true, StatusResolved: true, StatusClosed: true},
}

type UserView struct {
	ID       uuid.UUID `json:"id"`
	FullName *string   `json:"full_name"`
	Email    *string   `json:"email"`
}
type CustomerView struct {
	ID       uuid.UUID `json:"id"`
	Email    *string   `json:"email"`
	FullName *string   `json:"full_name"`
}

type Ticket struct {
	ID                        uuid.UUID     `json:"id"`
	TicketNumber              int           `json:"ticket_number"`
	DisplayNumber             string        `json:"display_number"`
	OrganizationID            uuid.UUID     `json:"organization_id"`
	CustomerID                *uuid.UUID    `json:"customer_id"`
	Title                     string        `json:"title"`
	OriginalTitle             *string       `json:"original_title"`
	Description               *string       `json:"description"`
	Status                    string        `json:"status"`
	Priority                  string        `json:"priority"`
	Severity                  *int          `json:"severity"`
	Source                    string        `json:"source"`
	Intent                    *string       `json:"intent"`
	TriageConfidence          *float64      `json:"triage_confidence"`
	AISummary                 *string       `json:"ai_summary"`
	Tags                      []string      `json:"tags"`
	AssigneeUserID            *uuid.UUID    `json:"assignee_user_id"`
	GroupID                   *uuid.UUID    `json:"group_id"`
	AgentID                   *uuid.UUID    `json:"agent_id"`
	DuplicateOfTicketID       *uuid.UUID    `json:"duplicate_of_ticket_id"`
	ResolutionOutcome         *string       `json:"resolution_outcome"`
	ResolutionSummary         *string       `json:"resolution_summary"`
	CustomerResolutionMessage *string       `json:"customer_resolution_message"`
	ResolvedByActor           *string       `json:"resolved_by_actor"`
	FirstResponseAt           *time.Time    `json:"first_response_at"`
	ResolvedAt                *time.Time    `json:"resolved_at"`
	ClosedAt                  *time.Time    `json:"closed_at"`
	ConfirmationRequestedAt   *time.Time    `json:"confirmation_requested_at"`
	ReopenedCount             int           `json:"reopened_count"`
	CSATRequestedAt           *time.Time    `json:"csat_requested_at"`
	CSATScore                 *int          `json:"csat_score"`
	CSATRespondedAt           *time.Time    `json:"csat_responded_at"`
	ExternalRefType           *string       `json:"external_ref_type"`
	ExternalRefID             *string       `json:"external_ref_id"`
	ExternalRefURL            *string       `json:"external_ref_url"`
	CreatedByUserID           *uuid.UUID    `json:"created_by_user_id"`
	CreatedAt                 *time.Time    `json:"created_at"`
	UpdatedAt                 *time.Time    `json:"updated_at"`
	AIState                   string        `json:"ai_state,omitempty"`
	SLADueAt                  *time.Time    `json:"sla_due_at,omitempty"`
	Assignee                  *UserView     `json:"assignee"`
	Customer                  *CustomerView `json:"customer"`
}

type TicketListItem struct {
	ID             uuid.UUID  `json:"id"`
	TicketNumber   int        `json:"ticket_number"`
	DisplayNumber  string     `json:"display_number"`
	Title          string     `json:"title"`
	Status         string     `json:"status"`
	Priority       string     `json:"priority"`
	Tags           []string   `json:"tags"`
	AssigneeUserID *uuid.UUID `json:"assignee_user_id"`
	AssigneeName   *string    `json:"assignee_name"`
	AIState        string     `json:"ai_state"`
	SLADueAt       *time.Time `json:"sla_due_at"`
	ResolvedAt     *time.Time `json:"resolved_at"`
	CreatedAt      *time.Time `json:"created_at"`
	UpdatedAt      *time.Time `json:"updated_at"`
}

type Pagination struct {
	Total      int64 `json:"total"`
	Page       int   `json:"page"`
	PageSize   int   `json:"page_size"`
	TotalPages int   `json:"total_pages"`
}
type ListResponse struct {
	Tickets    []TicketListItem `json:"tickets"`
	Pagination Pagination       `json:"pagination"`
}

type Activity struct {
	ID           uuid.UUID      `json:"id"`
	ActivityType string         `json:"activity_type"`
	ActorType    string         `json:"actor_type"`
	ActorUserID  *uuid.UUID     `json:"actor_user_id"`
	ActorName    *string        `json:"actor_name,omitempty"`
	Body         *string        `json:"body"`
	IsInternal   bool           `json:"is_internal"`
	Metadata     map[string]any `json:"activity_metadata"`
	CreatedAt    *time.Time     `json:"created_at"`
}
type Run struct {
	ID              uuid.UUID      `json:"id"`
	TicketID        uuid.UUID      `json:"ticket_id,omitempty"`
	RunType         string         `json:"run_type"`
	Status          string         `json:"status"`
	Trigger         string         `json:"trigger"`
	Error           *string        `json:"error"`
	ToolCallsUsed   int            `json:"tool_calls_used"`
	MaxToolCalls    int            `json:"max_tool_calls"`
	LLMCalls        int            `json:"llm_calls"`
	InputTokens     int64          `json:"input_tokens"`
	OutputTokens    int64          `json:"output_tokens"`
	Metered         bool           `json:"metered"`
	ModelName       *string        `json:"model_name"`
	ConnectorStatus map[string]any `json:"connector_status"`
	StartedAt       *time.Time     `json:"started_at"`
	FinishedAt      *time.Time     `json:"finished_at"`
	CreatedAt       *time.Time     `json:"created_at"`
}
type Hypothesis struct {
	ID         uuid.UUID  `json:"id"`
	Idx        int        `json:"idx"`
	Title      string     `json:"title"`
	Rationale  *string    `json:"rationale"`
	Status     string     `json:"status"`
	Confidence *float64   `json:"confidence"`
	Conclusion *string    `json:"conclusion"`
	CreatedAt  *time.Time `json:"created_at"`
	UpdatedAt  *time.Time `json:"updated_at"`
}
type Event struct {
	ID            uuid.UUID  `json:"id"`
	HypothesisID  *uuid.UUID `json:"hypothesis_id"`
	Seq           int        `json:"seq"`
	EventType     string     `json:"event_type"`
	Label         *string    `json:"label"`
	ToolName      *string    `json:"tool_name"`
	ConnectorName *string    `json:"connector_name"`
	ToolInput     *string    `json:"tool_input"`
	ToolResult    *string    `json:"tool_result"`
	DurationMS    *int       `json:"duration_ms"`
	Error         *string    `json:"error"`
	CreatedAt     *time.Time `json:"created_at"`
}
type RCA struct {
	ID                  uuid.UUID  `json:"id"`
	RunID               *uuid.UUID `json:"run_id"`
	Version             int        `json:"version"`
	Summary             *string    `json:"summary"`
	Impact              *string    `json:"impact"`
	Timeline            []any      `json:"timeline"`
	InvestigationLog    *string    `json:"investigation_log"`
	ContributingFactors []any      `json:"contributing_factors"`
	Conclusion          *string    `json:"conclusion"`
	Remediation         *string    `json:"remediation"`
	Prevention          *string    `json:"prevention"`
	CustomerSummary     *string    `json:"customer_summary"`
	Confidence          *float64   `json:"confidence"`
	IsPartial           bool       `json:"is_partial"`
	GeneratedBy         string     `json:"generated_by"`
	ReviewedByUserID    *uuid.UUID `json:"reviewed_by_user_id"`
	ReviewedByName      *string    `json:"reviewed_by_name,omitempty"`
	ReviewedAt          *time.Time `json:"reviewed_at"`
	CreatedAt           *time.Time `json:"created_at"`
	UpdatedAt           *time.Time `json:"updated_at"`
}
type Proposal struct {
	ID              uuid.UUID  `json:"id"`
	RunID           *uuid.UUID `json:"run_id"`
	Summary         string     `json:"summary"`
	CustomerMessage *string    `json:"customer_message"`
	Confidence      *float64   `json:"confidence"`
	Status          string     `json:"status"`
	DecidedByUserID *uuid.UUID `json:"decided_by_user_id"`
	DecidedByName   *string    `json:"decided_by_name,omitempty"`
	DecidedAt       *time.Time `json:"decided_at"`
	RejectReason    *string    `json:"reject_reason"`
	CreatedAt       *time.Time `json:"created_at"`
}
type InvestigationDetail struct {
	Run        *Run         `json:"run"`
	Hypotheses []Hypothesis `json:"hypotheses"`
	Events     []Event      `json:"events"`
	RCA        *RCA         `json:"rca"`
	Proposal   *Proposal    `json:"proposal"`
}
type DetailResponse struct {
	Ticket             Ticket           `json:"ticket"`
	Activities         []Activity       `json:"activities"`
	Runs               []Run            `json:"runs"`
	LinkedSessionIDs   []uuid.UUID      `json:"linked_session_ids"`
	PossibleDuplicates []TicketListItem `json:"possible_duplicates"`
	CanNotifyCustomer  bool             `json:"can_notify_customer"`
}

type Stats struct {
	Open             int      `json:"open"`
	AwaitingApproval int      `json:"awaiting_approval"`
	SLABreaching     int      `json:"sla_breaching"`
	AIResolvedPct7d  *float64 `json:"ai_resolved_pct_7d"`
	CSATAvg          *float64 `json:"csat_avg"`
	CSATAIAvg        *float64 `json:"csat_ai_avg"`
	CSATHumanAvg     *float64 `json:"csat_human_avg"`
	CSATResponses    int      `json:"csat_responses"`
	CSATWindowDays   int      `json:"csat_window_days"`
}
type Settings struct {
	OrganizationID             uuid.UUID      `json:"organization_id,omitempty"`
	AutonomyLevel              int            `json:"autonomy_level"`
	AutoInvestigateOnCreate    bool           `json:"auto_investigate_on_create"`
	MinConfidenceToAutoResolve float64        `json:"min_confidence_to_auto_resolve"`
	ConfirmationTimeoutHours   int            `json:"confirmation_timeout_hours"`
	CSATEnabled                bool           `json:"csat_enabled"`
	SLATargets                 map[string]any `json:"sla_targets"`
	CreatedTemplate            *string        `json:"created_template"`
	ResolvedTemplate           *string        `json:"resolved_template"`
	JiraEscalationEnabled      bool           `json:"jira_escalation_enabled"`
	JiraEscalationPriority     *string        `json:"jira_escalation_priority"`
	InvestigationMCPToolIDs    []int          `json:"investigation_mcp_tool_ids"`
	AlertWebhookEnabled        bool           `json:"alert_webhook_enabled"`
	AlertWebhookSecret         *string        `json:"alert_webhook_secret,omitempty"`
	MaxToolCallsPerRun         int            `json:"max_tool_calls_per_run"`
	MaxRunsPerTicket           int            `json:"max_runs_per_ticket"`
}

type ListFilter struct {
	Status     []string
	Priority   string
	AssigneeID *uuid.UUID
	Unassigned bool
	AIState    string
	Search     string
	Sort       string
	Page       int
	PageSize   int
}
type CreateInput struct {
	Title           string
	Description     *string
	Source          string
	Priority        string
	Severity        *int
	Tags            []string
	CustomerID      *uuid.UUID
	CustomerEmail   *string
	CustomerName    *string
	SessionID       *uuid.UUID
	AgentID         *uuid.UUID
	AssigneeUserID  *uuid.UUID
	GroupID         *uuid.UUID
	CreatedByUserID *uuid.UUID
	// Embedding is an optional pgvector literal used by alert intake. Keeping
	// it optional preserves compatibility with databases that predate the
	// ticket embedding migration for ordinary ticket creation.
	Embedding *string
}
type UpdateInput struct {
	Title                     *string
	Description               *string
	CustomerEmail             *string
	CustomerName              *string
	Status                    *string
	Priority                  *string
	Severity                  *int
	Tags                      *[]string
	AssigneeUserID            *uuid.UUID
	GroupID                   *uuid.UUID
	ResolutionOutcome         *string
	ResolutionSummary         *string
	CustomerResolutionMessage *string
}
type ResolveInput struct {
	Outcome           string
	ResolutionSummary *string
	CustomerMessage   *string
}
type CommentInput struct {
	Body       string
	IsInternal bool
	// ActorType is normally "user". AI-created ticket updates use "ai" and
	// intentionally do not carry a user foreign key.
	ActorType string
}
type SettingsUpdate struct {
	AutonomyLevel              *int
	AutoInvestigateOnCreate    *bool
	MinConfidenceToAutoResolve *float64
	ConfirmationTimeoutHours   *int
	CSATEnabled                *bool
	SLATargets                 map[string]any
	CreatedTemplate            *string
	ResolvedTemplate           *string
	JiraEscalationEnabled      *bool
	JiraEscalationPriority     *string
	InvestigationMCPToolIDs    []int
	AlertWebhookEnabled        *bool
	MaxToolCallsPerRun         *int
	MaxRunsPerTicket           *int
}

type Store interface {
	List(context.Context, uuid.UUID, ListFilter) (ListResponse, error)
	Stats(context.Context, uuid.UUID) (Stats, error)
	GetSettings(context.Context, uuid.UUID) (Settings, error)
	UpdateSettings(context.Context, uuid.UUID, SettingsUpdate) (Settings, error)
	GetBySession(context.Context, uuid.UUID, uuid.UUID) (*Ticket, error)
	DraftFromSession(context.Context, uuid.UUID, uuid.UUID) (string, string, error)
	Create(context.Context, uuid.UUID, CreateInput) (*DetailResponse, error)
	Get(context.Context, uuid.UUID, uuid.UUID) (*DetailResponse, error)
	Update(context.Context, uuid.UUID, uuid.UUID, UpdateInput, uuid.UUID) (*Ticket, error)
	AddComment(context.Context, uuid.UUID, uuid.UUID, CommentInput, uuid.UUID) (*Activity, error)
	Resolve(context.Context, uuid.UUID, uuid.UUID, ResolveInput, uuid.UUID) (*Ticket, error)
	Reopen(context.Context, uuid.UUID, uuid.UUID, *string, uuid.UUID) (*Ticket, error)
	Investigate(context.Context, uuid.UUID, uuid.UUID, string, string, *string, uuid.UUID) (*Run, error)
	GetInvestigation(context.Context, uuid.UUID, uuid.UUID, *uuid.UUID) (InvestigationDetail, error)
	ApproveProposal(context.Context, uuid.UUID, uuid.UUID, uuid.UUID) (*Proposal, error)
	RejectProposal(context.Context, uuid.UUID, uuid.UUID, uuid.UUID, *string, bool) (*Proposal, error)
	UpdateRCA(context.Context, uuid.UUID, uuid.UUID, uuid.UUID, *string, bool) (*RCA, error)
	SendRCA(context.Context, uuid.UUID, uuid.UUID, uuid.UUID) (*Activity, error)
}

// AlertDuplicate is the small projection needed by the unauthenticated alert
// intake endpoint. It avoids exposing the full ticket detail query there.
type AlertDuplicate struct {
	TicketID      uuid.UUID
	DisplayNumber string
	Similarity    float64
}

// AlertStore extends Store with the operations used by the alert webhook.
// It is deliberately separate so existing Store implementations used by
// callers and tests do not need to grow alert-specific methods.
type AlertStore interface {
	FindSimilarOpenAlerts(context.Context, uuid.UUID, string, float64) ([]AlertDuplicate, error)
	AddSystemComment(context.Context, uuid.UUID, uuid.UUID, string, float64) error
	CreateAlert(context.Context, uuid.UUID, CreateInput) (*DetailResponse, error)
}

type Repository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *Repository {
	if pool == nil {
		return nil
	}
	return &Repository{pool: pool}
}

func (r *Repository) Create(ctx context.Context, org uuid.UUID, input CreateInput) (*DetailResponse, error) {
	if r == nil || r.pool == nil || strings.TrimSpace(input.Title) == "" || len([]rune(input.Title)) > 500 {
		return nil, ErrInvalid
	}
	if input.Priority == "" {
		input.Priority = "medium"
	}
	if !validPriority(input.Priority) || input.Severity != nil && (*input.Severity < 1 || *input.Severity > 3) || len(input.Tags) > 5 {
		return nil, ErrInvalid
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	customerID := input.CustomerID
	if input.CustomerEmail != nil && strings.TrimSpace(*input.CustomerEmail) != "" {
		resolved, err := customerByEmail(ctx, tx, org, strings.ToLower(strings.TrimSpace(*input.CustomerEmail)), input.CustomerName)
		if err != nil {
			return nil, err
		}
		customerID = &resolved
	}
	var sessionCustomer, sessionAgent pgtype.UUID
	if input.SessionID != nil {
		if err := tx.QueryRow(ctx, `SELECT customer_id, agent_id FROM session_to_agents WHERE session_id=$1 AND organization_id=$2`, *input.SessionID, org).Scan(&sessionCustomer, &sessionAgent); errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		} else if err != nil {
			return nil, err
		}
		if customerID == nil {
			customerID = uuidPtr(sessionCustomer)
		}
		if input.AgentID == nil {
			input.AgentID = uuidPtr(sessionAgent)
		}
	}
	if customerID != nil {
		var exists bool
		if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM customers WHERE id=$1 AND organization_id=$2)`, *customerID, org).Scan(&exists); err != nil || !exists {
			if err != nil {
				return nil, err
			}
			return nil, ErrNotFound
		}
	}
	if input.AssigneeUserID != nil {
		var exists bool
		if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE id=$1 AND organization_id=$2)`, *input.AssigneeUserID, org).Scan(&exists); err != nil || !exists {
			if err != nil {
				return nil, err
			}
			return nil, ErrNotFound
		}
	}
	if input.GroupID != nil {
		var exists bool
		if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM groups WHERE id=$1 AND organization_id=$2)`, *input.GroupID, org).Scan(&exists); err != nil || !exists {
			if err != nil {
				return nil, err
			}
			return nil, ErrNotFound
		}
	}
	if err := tx.QueryRow(ctx, `INSERT INTO ticket_sequences (organization_id,next_number) VALUES ($1,1) ON CONFLICT (organization_id) DO NOTHING RETURNING organization_id`, org).Scan(new(uuid.UUID)); err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}
	var number int32
	if err := tx.QueryRow(ctx, `SELECT next_number FROM ticket_sequences WHERE organization_id=$1 FOR UPDATE`, org).Scan(&number); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `UPDATE ticket_sequences SET next_number=next_number+1 WHERE organization_id=$1`, org); err != nil {
		return nil, err
	}
	id := uuid.New()
	tags := mustJSON(input.Tags)
	source := input.Source
	if source == "" {
		source = "manual"
		if input.SessionID != nil {
			source = "human_agent"
		}
	}
	insertSQL := `INSERT INTO tickets (id,ticket_number,organization_id,customer_id,title,description,status,priority,severity,source,tags,assignee_user_id,group_id,agent_id,created_by_user_id,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,'open',$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW())`
	insertArgs := []any{id, number, org, customerID, strings.TrimSpace(input.Title), input.Description, input.Priority, input.Severity, source, tags, input.AssigneeUserID, input.GroupID, input.AgentID, input.CreatedByUserID}
	if input.Embedding != nil {
		insertSQL = `INSERT INTO tickets (id,ticket_number,organization_id,customer_id,title,description,status,priority,severity,source,tags,assignee_user_id,group_id,agent_id,created_by_user_id,embedding,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,'open',$7,$8,$9,$10,$11,$12,$13,$14,$15::vector,NOW(),NOW())`
		insertArgs = append(insertArgs, *input.Embedding)
	}
	_, err = tx.Exec(ctx, insertSQL, insertArgs...)
	if err != nil {
		return nil, err
	}
	activityID := uuid.New()
	body := "Ticket created"
	if input.SessionID != nil {
		body = "Ticket created from conversation"
	}
	metadata := mustJSON(map[string]any{"to": "open", "source": source})
	if _, err := tx.Exec(ctx, `INSERT INTO ticket_activities (id,ticket_id,activity_type,actor_type,actor_user_id,body,is_internal,activity_metadata,created_at) VALUES ($1,$2,'status_change',$3,$4,$5,TRUE,$6,NOW())`, activityID, id, actorForCreate(input.CreatedByUserID, input.SessionID), input.CreatedByUserID, body, metadata); err != nil {
		return nil, err
	}
	if input.SessionID != nil {
		if _, err := tx.Exec(ctx, `INSERT INTO ticket_sessions (ticket_id,session_id,linked_at) VALUES ($1,$2,NOW()) ON CONFLICT DO NOTHING`, id, *input.SessionID); err != nil {
			return nil, err
		}
		_, _ = tx.Exec(ctx, `UPDATE session_to_agents SET ticket_id=$1,ticket_status='open',ticket_summary=$2,ticket_description=$3,ticket_priority=$4,integration_type='NATIVE',updated_at=NOW() WHERE session_id=$5 AND organization_id=$6 AND (integration_type IS NULL OR integration_type='NATIVE')`, fmt.Sprintf("TKT-%d", number), truncate(input.Title, 255), truncate(valueOrEmpty(input.Description), 1000), input.Priority, *input.SessionID, org)
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	settings, err := r.GetSettings(ctx, org)
	if err != nil {
		return nil, err
	}
	if settings.AutoInvestigateOnCreate {
		_, _ = r.Investigate(ctx, org, id, "triage", "auto_on_create", nil, uuid.Nil)
	}
	return r.Get(ctx, org, id)
}

func (r *Repository) CreateAlert(ctx context.Context, org uuid.UUID, input CreateInput) (*DetailResponse, error) {
	return r.Create(ctx, org, input)
}

func (r *Repository) FindSimilarOpenAlerts(ctx context.Context, org uuid.UUID, embedding string, minSimilarity float64) ([]AlertDuplicate, error) {
	if r == nil || r.pool == nil || strings.TrimSpace(embedding) == "" {
		return nil, errors.New("ticket storage is not configured")
	}
	rows, err := r.pool.Query(ctx, `
SELECT id, ticket_number, 1 - (embedding <=> $2::vector) AS similarity
FROM tickets
WHERE organization_id = $1
  AND embedding IS NOT NULL
  AND status NOT IN ('resolved','closed')
  AND 1 - (embedding <=> $2::vector) >= $3
ORDER BY embedding <=> $2::vector
LIMIT 1`, org, embedding, minSimilarity)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]AlertDuplicate, 0, 1)
	for rows.Next() {
		var id uuid.UUID
		var number int32
		var similarity float64
		if err := rows.Scan(&id, &number, &similarity); err != nil {
			return nil, err
		}
		result = append(result, AlertDuplicate{TicketID: id, DisplayNumber: fmt.Sprintf("TKT-%d", number), Similarity: similarity})
	}
	return result, rows.Err()
}

func (r *Repository) AddSystemComment(ctx context.Context, org, ticketID uuid.UUID, body string, similarity float64) error {
	if r == nil || r.pool == nil {
		return errors.New("ticket storage is not configured")
	}
	var exists bool
	if err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM tickets WHERE id=$1 AND organization_id=$2)`, ticketID, org).Scan(&exists); err != nil {
		return err
	}
	if !exists {
		return ErrNotFound
	}
	metadata := mustJSON(map[string]any{"source": "alert_webhook", "similarity": math.Round(similarity*1000) / 1000})
	_, err := r.pool.Exec(ctx, `INSERT INTO ticket_activities (id,ticket_id,activity_type,actor_type,body,is_internal,activity_metadata,created_at) VALUES ($1,$2,'comment','system',$3,TRUE,$4,NOW())`, uuid.New(), ticketID, body, metadata)
	return err
}

// AlertEmbedding is a deterministic local fallback for installations where
// the Python FastEmbed runtime is absent. New Go-created alert tickets remain
// mutually deduplicable without adding a native ML runtime to the service.
func AlertEmbedding(title, description string) string {
	content := title
	if description != "" {
		content += "\n\n" + description
	}
	return hashedEmbedding(content, 384)
}

func hashedEmbedding(content string, dimension int) string {
	if dimension < 1 {
		dimension = 384
	}
	values := make([]float64, dimension)
	for i := 0; i < dimension; i++ {
		digest := sha256.Sum256([]byte(fmt.Sprintf("%d:%s", i, content)))
		var raw uint64
		for _, value := range digest[:8] {
			raw = (raw << 8) | uint64(value)
		}
		values[i] = float64(raw%2000000)/1000000.0 - 1.0
	}
	norm := 0.0
	for _, value := range values {
		norm += value * value
	}
	norm = math.Sqrt(norm)
	parts := make([]string, dimension)
	for i, value := range values {
		parts[i] = fmt.Sprintf("%.8f", value/norm)
	}
	return "[" + strings.Join(parts, ",") + "]"
}

func actorForCreate(userID, sessionID *uuid.UUID) string {
	if userID != nil {
		return "user"
	}
	if sessionID != nil {
		return "ai"
	}
	return "system"
}
func validPriority(value string) bool {
	return value == "urgent" || value == "high" || value == "medium" || value == "low"
}
func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}
func truncate(value string, max int) string {
	runes := []rune(value)
	if len(runes) > max {
		return string(runes[:max])
	}
	return value
}
func mustJSON(value any) []byte { encoded, _ := json.Marshal(value); return encoded }
func customerByEmail(ctx context.Context, tx pgx.Tx, org uuid.UUID, email string, name *string) (uuid.UUID, error) {
	var id uuid.UUID
	err := tx.QueryRow(ctx, `INSERT INTO customers (id,email,full_name,organization_id,is_active,is_authenticated,lead_stage,created_at,updated_at) VALUES ($1,$2,$3,$4,TRUE,FALSE,'VISITOR',NOW(),NOW()) ON CONFLICT (email,organization_id) DO UPDATE SET full_name=COALESCE(customers.full_name,EXCLUDED.full_name),updated_at=NOW() RETURNING id`, uuid.New(), email, name, org).Scan(&id)
	return id, err
}

func (r *Repository) activities(ctx context.Context, ticketID uuid.UUID) ([]Activity, error) {
	rows, err := r.pool.Query(ctx, `SELECT a.id,a.activity_type,a.actor_type,a.actor_user_id,a.body,a.is_internal,a.activity_metadata,a.created_at,u.full_name FROM ticket_activities a LEFT JOIN users u ON u.id=a.actor_user_id WHERE a.ticket_id=$1 ORDER BY a.created_at,a.id LIMIT 200`, ticketID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]Activity, 0)
	for rows.Next() {
		var a Activity
		var metadata []byte
		var created pgtype.Timestamptz
		var name pgtype.Text
		if err := rows.Scan(&a.ID, &a.ActivityType, &a.ActorType, &a.ActorUserID, &a.Body, &a.IsInternal, &metadata, &created, &name); err != nil {
			return nil, err
		}
		a.Metadata = object(metadata)
		a.CreatedAt = timePtr(created)
		if name.Valid {
			a.ActorName = &name.String
		} else if a.ActorType == "ai" {
			value := "ChatterMate AI"
			a.ActorName = &value
		}
		result = append(result, a)
	}
	return result, rows.Err()
}
func (r *Repository) runs(ctx context.Context, ticketID uuid.UUID) ([]Run, error) {
	rows, err := r.pool.Query(ctx, `SELECT id,ticket_id,run_type,status,trigger,error,tool_calls_used,max_tool_calls,llm_calls,input_tokens,output_tokens,metered,model_name,connector_status,started_at,finished_at,created_at FROM investigation_runs WHERE ticket_id=$1 ORDER BY created_at DESC`, ticketID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]Run, 0)
	for rows.Next() {
		run, err := scanRun(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, *run)
	}
	return result, rows.Err()
}
func (r *Repository) sessionIDs(ctx context.Context, ticketID uuid.UUID) ([]uuid.UUID, error) {
	rows, err := r.pool.Query(ctx, `SELECT session_id FROM ticket_sessions WHERE ticket_id=$1 ORDER BY linked_at`, ticketID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]uuid.UUID, 0)
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		result = append(result, id)
	}
	return result, rows.Err()
}

func (r *Repository) GetBySession(ctx context.Context, org, sessionID uuid.UUID) (*Ticket, error) {
	value, err := scanTicket(r.pool.QueryRow(ctx, ticketSelect+` JOIN ticket_sessions ts ON ts.ticket_id=t.id WHERE ts.session_id=$1 AND t.organization_id=$2 ORDER BY t.created_at DESC LIMIT 1`, sessionID, org))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return value, err
}

// GetByNumber is kept outside Store because the HTTP ticket contract does not
// need it, while the customer-facing AI status tool accepts a TKT-nnn value.
func (r *Repository) GetByNumber(ctx context.Context, org uuid.UUID, number int) (*Ticket, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("ticket storage is not configured")
	}
	value, err := scanTicket(r.pool.QueryRow(ctx, ticketSelect+` WHERE t.ticket_number=$1 AND t.organization_id=$2 LIMIT 1`, number, org))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return value, err
}

func (r *Repository) DraftFromSession(ctx context.Context, org, sessionID uuid.UUID) (string, string, error) {
	var exists bool
	if err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM session_to_agents WHERE session_id=$1 AND organization_id=$2)`, sessionID, org).Scan(&exists); err != nil {
		return "", "", err
	}
	if !exists {
		return "", "", ErrNotFound
	}
	var title string
	_ = r.pool.QueryRow(ctx, `SELECT COALESCE(NULLIF(split_part(message,E'\n',1),''),'') FROM chat_history WHERE session_id=$1 AND message_type='user' ORDER BY created_at DESC,id DESC LIMIT 1`, sessionID).Scan(&title)
	rows, err := r.pool.Query(ctx, `SELECT message_type,message FROM chat_history WHERE session_id=$1 ORDER BY created_at DESC,id DESC LIMIT 10`, sessionID)
	if err != nil {
		return "", "", err
	}
	defer rows.Close()
	lines := make([]string, 0)
	for rows.Next() {
		var kind, msg string
		if err := rows.Scan(&kind, &msg); err != nil {
			return "", "", err
		}
		who := "Agent"
		if kind == "user" {
			who = "Customer"
		}
		msg = truncate(strings.TrimSpace(msg), 300)
		if msg != "" {
			lines = append(lines, who+": "+msg)
		}
	}
	for i, j := 0, len(lines)-1; i < j; i, j = i+1, j-1 {
		lines[i], lines[j] = lines[j], lines[i]
	}
	return firstLine(title, 200), truncate(strings.Join(lines, "\n"), 5000), rows.Err()
}
func firstLine(value string, max int) string {
	value = strings.TrimSpace(value)
	if index := strings.IndexByte(value, '\n'); index >= 0 {
		value = value[:index]
	}
	return truncate(value, max)
}

func (r *Repository) Stats(ctx context.Context, org uuid.UUID) (Stats, error) {
	var result Stats
	result.CSATWindowDays = 30
	var totalResolved, aiResolved int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FILTER (WHERE status NOT IN ('resolved','closed')),COUNT(*) FILTER (WHERE status='awaiting_approval'),COUNT(*) FILTER (WHERE status NOT IN ('resolved','closed') AND created_at + CASE priority WHEN 'urgent' THEN INTERVAL '120 minutes' WHEN 'high' THEN INTERVAL '240 minutes' WHEN 'medium' THEN INTERVAL '1440 minutes' ELSE INTERVAL '4320 minutes' END <= NOW()+INTERVAL '30 minutes'),COUNT(*) FILTER (WHERE resolved_at >= NOW()-INTERVAL '7 days'),COUNT(*) FILTER (WHERE resolved_at >= NOW()-INTERVAL '7 days' AND resolved_by_actor='ai') FROM tickets WHERE organization_id=$1`, org).Scan(&result.Open, &result.AwaitingApproval, &result.SLABreaching, &totalResolved, &aiResolved); err != nil {
		return result, err
	}
	if totalResolved > 0 {
		value := 100 * float64(aiResolved) / float64(totalResolved)
		result.AIResolvedPct7d = &value
	}
	var avg, aiAvg, humanAvg pgtype.Float8
	var responses int
	_ = r.pool.QueryRow(ctx, `SELECT COUNT(*),AVG(csat_score),AVG(csat_score) FILTER (WHERE resolved_by_actor='ai'),AVG(csat_score) FILTER (WHERE resolved_by_actor='user') FROM tickets WHERE organization_id=$1 AND csat_score IS NOT NULL AND csat_responded_at >= NOW()-INTERVAL '30 days'`, org).Scan(&responses, &avg, &aiAvg, &humanAvg)
	result.CSATResponses = responses
	result.CSATAvg = floatPtr(avg)
	result.CSATAIAvg = floatPtr(aiAvg)
	result.CSATHumanAvg = floatPtr(humanAvg)
	return result, nil
}

func (r *Repository) GetSettings(ctx context.Context, org uuid.UUID) (Settings, error) {
	if _, err := r.pool.Exec(ctx, `INSERT INTO organization_ticket_settings (organization_id) VALUES ($1) ON CONFLICT (organization_id) DO NOTHING`, org); err != nil {
		return Settings{}, err
	}
	return r.scanSettings(r.pool.QueryRow(ctx, `SELECT organization_id,autonomy_level,auto_investigate_on_create,min_confidence_to_auto_resolve,confirmation_timeout_hours,csat_enabled,sla_targets,created_template,resolved_template,jira_escalation_enabled,jira_escalation_priority,investigation_mcp_tool_ids,alert_webhook_enabled,alert_webhook_secret,max_tool_calls_per_run,max_runs_per_ticket FROM organization_ticket_settings WHERE organization_id=$1`, org))
}

func (r *Repository) scanSettings(row interface{ Scan(...any) error }) (Settings, error) {
	var s Settings
	var sla, toolIDs []byte
	if err := row.Scan(&s.OrganizationID, &s.AutonomyLevel, &s.AutoInvestigateOnCreate, &s.MinConfidenceToAutoResolve, &s.ConfirmationTimeoutHours, &s.CSATEnabled, &sla, &s.CreatedTemplate, &s.ResolvedTemplate, &s.JiraEscalationEnabled, &s.JiraEscalationPriority, &toolIDs, &s.AlertWebhookEnabled, &s.AlertWebhookSecret, &s.MaxToolCallsPerRun, &s.MaxRunsPerTicket); err != nil {
		return s, err
	}
	s.SLATargets = object(sla)
	var ids []int
	_ = json.Unmarshal(toolIDs, &ids)
	if ids == nil {
		ids = []int{}
	}
	s.InvestigationMCPToolIDs = ids
	return s, nil
}

func (r *Repository) UpdateSettings(ctx context.Context, org uuid.UUID, input SettingsUpdate) (Settings, error) {
	if _, err := r.GetSettings(ctx, org); err != nil {
		return Settings{}, err
	}
	sets := make([]string, 0)
	args := []any{org}
	add := func(column string, value any) {
		args = append(args, value)
		sets = append(sets, fmt.Sprintf("%s=$%d", column, len(args)))
	}
	if input.AutonomyLevel != nil {
		if *input.AutonomyLevel < 1 || *input.AutonomyLevel > 3 {
			return Settings{}, ErrInvalid
		}
		add("autonomy_level", *input.AutonomyLevel)
	}
	if input.AutoInvestigateOnCreate != nil {
		add("auto_investigate_on_create", *input.AutoInvestigateOnCreate)
	}
	if input.MinConfidenceToAutoResolve != nil {
		if *input.MinConfidenceToAutoResolve < 0 || *input.MinConfidenceToAutoResolve > 1 {
			return Settings{}, ErrInvalid
		}
		add("min_confidence_to_auto_resolve", *input.MinConfidenceToAutoResolve)
	}
	if input.ConfirmationTimeoutHours != nil {
		add("confirmation_timeout_hours", *input.ConfirmationTimeoutHours)
	}
	if input.CSATEnabled != nil {
		add("csat_enabled", *input.CSATEnabled)
	}
	if input.SLATargets != nil {
		add("sla_targets", mustJSON(input.SLATargets))
	}
	if input.CreatedTemplate != nil {
		add("created_template", *input.CreatedTemplate)
	}
	if input.ResolvedTemplate != nil {
		add("resolved_template", *input.ResolvedTemplate)
	}
	if input.JiraEscalationEnabled != nil {
		add("jira_escalation_enabled", *input.JiraEscalationEnabled)
	}
	if input.JiraEscalationPriority != nil {
		add("jira_escalation_priority", *input.JiraEscalationPriority)
	}
	if input.InvestigationMCPToolIDs != nil {
		add("investigation_mcp_tool_ids", mustJSON(input.InvestigationMCPToolIDs))
	}
	if input.AlertWebhookEnabled != nil {
		add("alert_webhook_enabled", *input.AlertWebhookEnabled)
		if *input.AlertWebhookEnabled {
			var secret string
			_ = r.pool.QueryRow(ctx, `SELECT COALESCE(alert_webhook_secret,'') FROM organization_ticket_settings WHERE organization_id=$1`, org).Scan(&secret)
			if secret == "" {
				generated, err := newSecret()
				if err != nil {
					return Settings{}, err
				}
				add("alert_webhook_secret", generated)
			}
		}
	}
	if input.MaxToolCallsPerRun != nil {
		if *input.MaxToolCallsPerRun < 1 || *input.MaxToolCallsPerRun > 100 {
			return Settings{}, ErrInvalid
		}
		add("max_tool_calls_per_run", *input.MaxToolCallsPerRun)
	}
	if input.MaxRunsPerTicket != nil {
		if *input.MaxRunsPerTicket < 1 || *input.MaxRunsPerTicket > 10 {
			return Settings{}, ErrInvalid
		}
		add("max_runs_per_ticket", *input.MaxRunsPerTicket)
	}
	if len(sets) > 0 {
		sets = append(sets, "updated_at=NOW()")
		if _, err := r.pool.Exec(ctx, "UPDATE organization_ticket_settings SET "+strings.Join(sets, ",")+" WHERE organization_id=$1", args...); err != nil {
			return Settings{}, err
		}
	}
	return r.GetSettings(ctx, org)
}
func newSecret() (string, error) {
	raw := make([]byte, 24)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(raw), nil
}

func (r *Repository) Update(ctx context.Context, org, id uuid.UUID, input UpdateInput, actor uuid.UUID) (*Ticket, error) {
	ticket, err := r.getTicket(ctx, org, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	sets := make([]string, 0)
	args := []any{id, org}
	add := func(column string, value any) {
		args = append(args, value)
		sets = append(sets, fmt.Sprintf("%s=$%d", column, len(args)))
	}
	if input.Title != nil {
		if strings.TrimSpace(*input.Title) == "" || len([]rune(*input.Title)) > 500 {
			return nil, ErrInvalid
		}
		add("title", strings.TrimSpace(*input.Title))
	}
	if input.Description != nil {
		add("description", *input.Description)
	}
	if input.Severity != nil {
		if *input.Severity < 1 || *input.Severity > 3 {
			return nil, ErrInvalid
		}
		add("severity", *input.Severity)
	}
	if input.Tags != nil {
		if len(*input.Tags) > 5 {
			return nil, ErrInvalid
		}
		add("tags", mustJSON(*input.Tags))
	}
	if input.ResolutionOutcome != nil {
		add("resolution_outcome", *input.ResolutionOutcome)
	}
	if input.ResolutionSummary != nil {
		add("resolution_summary", *input.ResolutionSummary)
	}
	if input.CustomerResolutionMessage != nil {
		add("customer_resolution_message", *input.CustomerResolutionMessage)
	}
	if input.CustomerEmail != nil && strings.TrimSpace(*input.CustomerEmail) != "" {
		customer, err := customerByEmail(ctx, tx, org, strings.ToLower(strings.TrimSpace(*input.CustomerEmail)), input.CustomerName)
		if err != nil {
			return nil, err
		}
		add("customer_id", customer)
	}
	if input.AssigneeUserID != nil {
		if !input.AssigneeUserIDIsNil() {
			var exists bool
			if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE id=$1 AND organization_id=$2)`, *input.AssigneeUserID, org).Scan(&exists); err != nil || !exists {
				if err != nil {
					return nil, err
				}
				return nil, ErrNotFound
			}
		}
		add("assignee_user_id", *input.AssigneeUserID)
	}
	if input.GroupID != nil {
		var exists bool
		if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM groups WHERE id=$1 AND organization_id=$2)`, *input.GroupID, org).Scan(&exists); err != nil || !exists {
			if err != nil {
				return nil, err
			}
			return nil, ErrNotFound
		}
		add("group_id", *input.GroupID)
	}
	if input.Priority != nil {
		if !validPriority(*input.Priority) {
			return nil, ErrInvalid
		}
		if *input.Priority != ticket.Priority {
			if err := insertActivity(ctx, tx, id, "priority_change", "user", &actor, nil, true, map[string]any{"from": ticket.Priority, "to": *input.Priority}); err != nil {
				return nil, err
			}
		}
		add("priority", *input.Priority)
	}
	if input.Status != nil && *input.Status != ticket.Status {
		if allowed := statusTransitions[ticket.Status][*input.Status]; !allowed {
			return nil, fmt.Errorf("%w: %s -> %s", ErrIllegalStatus, ticket.Status, *input.Status)
		}
		now := time.Now().UTC()
		add("status", *input.Status)
		if *input.Status == StatusResolved {
			add("resolved_at", now)
			add("resolved_by_actor", "user")
		}
		if *input.Status == StatusResolvedPendingConfirmation {
			add("confirmation_requested_at", now)
		}
		if *input.Status == StatusClosed {
			add("closed_at", now)
			add("resolved_at", now)
			add("resolved_by_actor", "user")
		}
		if err := insertActivity(ctx, tx, id, "status_change", "user", &actor, ptrString(fmt.Sprintf("Status changed %s -> %s", ticket.Status, *input.Status)), true, map[string]any{"from": ticket.Status, "to": *input.Status}); err != nil {
			return nil, err
		}
	}
	if len(sets) > 0 {
		sets = append(sets, "updated_at=NOW()")
		if _, err := tx.Exec(ctx, "UPDATE tickets SET "+strings.Join(sets, ",")+" WHERE id=$1 AND organization_id=$2", args...); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.getTicket(ctx, org, id)
}

func (i UpdateInput) AssigneeUserIDIsNil() bool { return i.AssigneeUserID == nil }
func ptrString(value string) *string            { return &value }

func (r *Repository) AddComment(ctx context.Context, org, id uuid.UUID, input CommentInput, actor uuid.UUID) (*Activity, error) {
	ticket, err := r.getTicket(ctx, org, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(input.Body) == "" || len([]rune(input.Body)) > 10000 {
		return nil, ErrInvalid
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	activityID := uuid.New()
	isInternal := input.IsInternal
	actorType := strings.TrimSpace(input.ActorType)
	if actorType == "" {
		actorType = "user"
	}
	var actorUserID *uuid.UUID
	if actor != uuid.Nil {
		actorUserID = &actor
	}
	if err := insertActivityWithID(ctx, tx, activityID, id, "comment", actorType, actorUserID, ptrString(strings.TrimSpace(input.Body)), isInternal, nil); err != nil {
		return nil, err
	}
	if !isInternal && ticket.FirstResponseAt == nil {
		if _, err := tx.Exec(ctx, `UPDATE tickets SET first_response_at=NOW(),updated_at=NOW() WHERE id=$1 AND organization_id=$2`, id, org); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.activityByID(ctx, activityID)
}

func (r *Repository) Resolve(ctx context.Context, org, id uuid.UUID, input ResolveInput, actor uuid.UUID) (*Ticket, error) {
	if input.Outcome == "" {
		input.Outcome = "fixed"
	}
	ticket, err := r.getTicket(ctx, org, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if ticket.Status == StatusResolvedPendingConfirmation {
		return ticket, nil
	}
	if !statusTransitions[ticket.Status][StatusResolvedPendingConfirmation] {
		return nil, fmt.Errorf("%w: %s -> %s", ErrIllegalStatus, ticket.Status, StatusResolvedPendingConfirmation)
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	sets := []string{"status='resolved_pending_confirmation'", "resolution_outcome=$3", "resolved_by_actor='user'", "confirmation_requested_at=NOW()", "resolved_at=NOW()", "updated_at=NOW()"}
	args := []any{id, org, input.Outcome}
	if input.ResolutionSummary != nil {
		args = append(args, *input.ResolutionSummary)
		sets = append(sets, fmt.Sprintf("resolution_summary=$%d", len(args)))
	}
	if input.CustomerMessage != nil {
		args = append(args, *input.CustomerMessage)
		sets = append(sets, fmt.Sprintf("customer_resolution_message=$%d", len(args)))
	}
	if _, err := tx.Exec(ctx, "UPDATE tickets SET "+strings.Join(sets, ",")+" WHERE id=$1 AND organization_id=$2", args...); err != nil {
		return nil, err
	}
	metadata := map[string]any{"from": ticket.Status, "to": StatusResolvedPendingConfirmation}
	if err := insertActivity(ctx, tx, id, "status_change", "user", &actor, nil, true, metadata); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.getTicket(ctx, org, id)
}

func (r *Repository) Reopen(ctx context.Context, org, id uuid.UUID, reason *string, actor uuid.UUID) (*Ticket, error) {
	ticket, err := r.getTicket(ctx, org, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if ticket.Status != StatusResolved && ticket.Status != StatusClosed && ticket.Status != StatusResolvedPendingConfirmation {
		return nil, ErrInvalid
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `UPDATE tickets SET status='reopened',reopened_count=reopened_count+1,resolved_at=NULL,closed_at=NULL,confirmation_requested_at=NULL,resolved_by_actor=NULL,updated_at=NOW() WHERE id=$1 AND organization_id=$2`, id, org); err != nil {
		return nil, err
	}
	if err := insertActivity(ctx, tx, id, "reopened", "user", &actor, reason, true, nil); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.getTicket(ctx, org, id)
}

func (r *Repository) Investigate(ctx context.Context, org, id uuid.UUID, runType, trigger string, note *string, actor uuid.UUID) (*Run, error) {
	ticket, err := r.getTicket(ctx, org, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if ticket.Status == StatusResolved || ticket.Status == StatusClosed || ticket.Status == StatusResolvedPendingConfirmation {
		return nil, ErrInvalid
	}
	settings, err := r.GetSettings(ctx, org)
	if err != nil {
		return nil, err
	}
	var active bool
	if err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM investigation_runs WHERE ticket_id=$1 AND status IN ('pending','running'))`, id).Scan(&active); err != nil {
		return nil, err
	}
	if active {
		return nil, ErrActiveRun
	}
	if runType == "investigation" {
		var count int
		if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM investigation_runs WHERE ticket_id=$1 AND run_type='investigation'`, id).Scan(&count); err != nil {
			return nil, err
		}
		if count >= settings.MaxRunsPerTicket {
			return nil, ErrActiveRun
		}
	}
	runID := uuid.New()
	if actor == uuid.Nil {
		actorValue := any(nil)
		_, err = r.pool.Exec(ctx, `INSERT INTO investigation_runs (id,ticket_id,organization_id,run_type,status,trigger,requested_by_user_id,context_note,max_tool_calls,created_at,updated_at) VALUES ($1,$2,$3,$4,'pending',$5,$6,$7,$8,NOW(),NOW())`, runID, id, org, runType, trigger, actorValue, note, settings.MaxToolCallsPerRun)
	} else {
		_, err = r.pool.Exec(ctx, `INSERT INTO investigation_runs (id,ticket_id,organization_id,run_type,status,trigger,requested_by_user_id,context_note,max_tool_calls,created_at,updated_at) VALUES ($1,$2,$3,$4,'pending',$5,$6,$7,$8,NOW(),NOW())`, runID, id, org, runType, trigger, actor, note, settings.MaxToolCallsPerRun)
	}
	if err != nil {
		return nil, err
	}
	return scanRun(r.pool.QueryRow(ctx, `SELECT id,ticket_id,run_type,status,trigger,error,tool_calls_used,max_tool_calls,llm_calls,input_tokens,output_tokens,metered,model_name,connector_status,started_at,finished_at,created_at FROM investigation_runs WHERE id=$1`, runID))
}

func (r *Repository) GetInvestigation(ctx context.Context, org, ticketID uuid.UUID, runID *uuid.UUID) (InvestigationDetail, error) {
	if _, err := r.getTicket(ctx, org, ticketID); errors.Is(err, pgx.ErrNoRows) {
		return InvestigationDetail{}, ErrNotFound
	} else if err != nil {
		return InvestigationDetail{}, err
	}
	var run *Run
	var err error
	if runID != nil {
		run, err = scanRun(r.pool.QueryRow(ctx, `SELECT id,ticket_id,run_type,status,trigger,error,tool_calls_used,max_tool_calls,llm_calls,input_tokens,output_tokens,metered,model_name,connector_status,started_at,finished_at,created_at FROM investigation_runs WHERE id=$1 AND ticket_id=$2`, *runID, ticketID))
		if errors.Is(err, pgx.ErrNoRows) {
			return InvestigationDetail{}, ErrRunNotFound
		}
		if err != nil {
			return InvestigationDetail{}, err
		}
	} else {
		run, err = r.latestRun(ctx, ticketID, "investigation")
		if err != nil {
			return InvestigationDetail{}, err
		}
	}
	result := InvestigationDetail{Run: run, Hypotheses: []Hypothesis{}, Events: []Event{}}
	if run != nil {
		result.Hypotheses, err = r.hypotheses(ctx, run.ID)
		if err != nil {
			return result, err
		}
		result.Events, err = r.events(ctx, run.ID)
		if err != nil {
			return result, err
		}
	}
	result.RCA, err = r.latestRCA(ctx, ticketID)
	if err != nil {
		return result, err
	}
	result.Proposal, err = r.latestProposal(ctx, ticketID)
	return result, err
}
func (r *Repository) latestRun(ctx context.Context, ticketID uuid.UUID, runType string) (*Run, error) {
	return scanRun(r.pool.QueryRow(ctx, `SELECT id,ticket_id,run_type,status,trigger,error,tool_calls_used,max_tool_calls,llm_calls,input_tokens,output_tokens,metered,model_name,connector_status,started_at,finished_at,created_at FROM investigation_runs WHERE ticket_id=$1 AND run_type=$2 ORDER BY created_at DESC LIMIT 1`, ticketID, runType))
}
func (r *Repository) hypotheses(ctx context.Context, runID uuid.UUID) ([]Hypothesis, error) {
	rows, err := r.pool.Query(ctx, `SELECT id,idx,title,rationale,status,confidence,conclusion,created_at,updated_at FROM investigation_hypotheses WHERE run_id=$1 ORDER BY idx`, runID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]Hypothesis, 0)
	for rows.Next() {
		var h Hypothesis
		var rationale, conclusion pgtype.Text
		var confidence pgtype.Float8
		var created, updated pgtype.Timestamptz
		if err := rows.Scan(&h.ID, &h.Idx, &h.Title, &rationale, &h.Status, &confidence, &conclusion, &created, &updated); err != nil {
			return nil, err
		}
		h.Rationale = textPtr(rationale)
		h.Confidence = floatPtr(confidence)
		h.Conclusion = textPtr(conclusion)
		h.CreatedAt = timePtr(created)
		h.UpdatedAt = timePtr(updated)
		result = append(result, h)
	}
	return result, rows.Err()
}
func (r *Repository) events(ctx context.Context, runID uuid.UUID) ([]Event, error) {
	rows, err := r.pool.Query(ctx, `SELECT id,hypothesis_id,seq,event_type,label,tool_name,connector_name,tool_input,tool_result,duration_ms,error,created_at FROM investigation_events WHERE run_id=$1 ORDER BY seq LIMIT 500`, runID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]Event, 0)
	for rows.Next() {
		var e Event
		var hypothesis pgtype.UUID
		var label, tool, connector, input, output, problem pgtype.Text
		var duration pgtype.Int4
		var created pgtype.Timestamptz
		if err := rows.Scan(&e.ID, &hypothesis, &e.Seq, &e.EventType, &label, &tool, &connector, &input, &output, &duration, &problem, &created); err != nil {
			return nil, err
		}
		e.HypothesisID = uuidPtr(hypothesis)
		e.Label = textPtr(label)
		e.ToolName = textPtr(tool)
		e.ConnectorName = textPtr(connector)
		e.ToolInput = textPtr(input)
		e.ToolResult = textPtr(output)
		e.DurationMS = intPtr(duration)
		e.Error = textPtr(problem)
		e.CreatedAt = timePtr(created)
		result = append(result, e)
	}
	return result, rows.Err()
}
func (r *Repository) latestRCA(ctx context.Context, ticketID uuid.UUID) (*RCA, error) {
	return scanRCA(r.pool.QueryRow(ctx, `SELECT id,run_id,version,summary,impact,timeline,investigation_log,contributing_factors,conclusion,remediation,prevention,customer_summary,confidence,is_partial,generated_by,reviewed_by_user_id,reviewed_at,created_at,updated_at FROM rca_documents WHERE ticket_id=$1 ORDER BY version DESC LIMIT 1`, ticketID))
}
func (r *Repository) latestProposal(ctx context.Context, ticketID uuid.UUID) (*Proposal, error) {
	return scanProposal(r.pool.QueryRow(ctx, `SELECT id,run_id,summary,customer_message,confidence,status,decided_by_user_id,decided_at,reject_reason,created_at FROM ticket_proposals WHERE ticket_id=$1 ORDER BY created_at DESC LIMIT 1`, ticketID))
}

func (r *Repository) ApproveProposal(ctx context.Context, org, ticketID, userID uuid.UUID) (*Proposal, error) {
	if _, err := r.getTicket(ctx, org, ticketID); errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	} else if err != nil {
		return nil, err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	var proposalID uuid.UUID
	var runID pgtype.UUID
	var summary string
	var customerMessage pgtype.Text
	var confidence pgtype.Float8
	err = tx.QueryRow(ctx, `SELECT id,run_id,summary,customer_message,confidence FROM ticket_proposals WHERE ticket_id=$1 AND organization_id=$2 AND status='pending' ORDER BY created_at DESC LIMIT 1 FOR UPDATE`, ticketID, org).Scan(&proposalID, &runID, &summary, &customerMessage, &confidence)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNoProposal
	}
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	if _, err := tx.Exec(ctx, `UPDATE ticket_proposals SET status='approved',decided_by_user_id=$2,decided_at=$3,updated_at=NOW() WHERE id=$1`, proposalID, userID, now); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `UPDATE tickets SET status='resolved_pending_confirmation',resolution_outcome='fixed',resolution_summary=$2,customer_resolution_message=$3,resolved_by_actor='ai',resolved_at=$4,confirmation_requested_at=$4,updated_at=NOW() WHERE id=$1 AND organization_id=$5`, ticketID, summary, nullableText(customerMessage), now, org); err != nil {
		return nil, err
	}
	if err := insertActivity(ctx, tx, ticketID, "ai_resolution_approved", "user", &userID, ptrString(summary), true, map[string]any{"proposal_id": proposalID.String()}); err != nil {
		return nil, err
	}
	if err := insertActivity(ctx, tx, ticketID, "status_change", "ai", nil, nil, true, map[string]any{"to": StatusResolvedPendingConfirmation}); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return scanProposal(r.pool.QueryRow(ctx, `SELECT id,run_id,summary,customer_message,confidence,status,decided_by_user_id,decided_at,reject_reason,created_at FROM ticket_proposals WHERE id=$1`, proposalID))
}

func (r *Repository) RejectProposal(ctx context.Context, org, ticketID, userID uuid.UUID, reason *string, reinvestigate bool) (*Proposal, error) {
	if _, err := r.getTicket(ctx, org, ticketID); errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	} else if err != nil {
		return nil, err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	var proposalID uuid.UUID
	err = tx.QueryRow(ctx, `SELECT id FROM ticket_proposals WHERE ticket_id=$1 AND organization_id=$2 AND status='pending' ORDER BY created_at DESC LIMIT 1 FOR UPDATE`, ticketID, org).Scan(&proposalID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNoProposal
	}
	if err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `UPDATE ticket_proposals SET status='rejected',decided_by_user_id=$2,decided_at=NOW(),reject_reason=$3,updated_at=NOW() WHERE id=$1`, proposalID, userID, reason); err != nil {
		return nil, err
	}
	var currentStatus string
	_ = tx.QueryRow(ctx, `SELECT status FROM tickets WHERE id=$1`, ticketID).Scan(&currentStatus)
	if currentStatus == StatusAwaitingApproval {
		if _, err := tx.Exec(ctx, `UPDATE tickets SET status='open',updated_at=NOW() WHERE id=$1`, ticketID); err != nil {
			return nil, err
		}
	}
	if err := insertActivity(ctx, tx, ticketID, "ai_resolution_rejected", "user", &userID, reason, true, map[string]any{"proposal_id": proposalID.String(), "reinvestigate": reinvestigate}); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	if reinvestigate {
		_, _ = r.Investigate(ctx, org, ticketID, "investigation", "rejection_feedback", reason, userID)
	}
	return scanProposal(r.pool.QueryRow(ctx, `SELECT id,run_id,summary,customer_message,confidence,status,decided_by_user_id,decided_at,reject_reason,created_at FROM ticket_proposals WHERE id=$1`, proposalID))
}

func (r *Repository) UpdateRCA(ctx context.Context, org, ticketID, userID uuid.UUID, customerSummary *string, markReviewed bool) (*RCA, error) {
	if _, err := r.getTicket(ctx, org, ticketID); errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	} else if err != nil {
		return nil, err
	}
	rca, err := r.latestRCA(ctx, ticketID)
	if errors.Is(err, pgx.ErrNoRows) || rca == nil {
		return nil, ErrRunNotFound
	}
	if err != nil {
		return nil, err
	}
	sets := make([]string, 0)
	args := []any{rca.ID}
	if customerSummary != nil {
		args = append(args, *customerSummary)
		sets = append(sets, fmt.Sprintf("customer_summary=$%d", len(args)))
	}
	if markReviewed {
		args = append(args, userID)
		sets = append(sets, fmt.Sprintf("reviewed_by_user_id=$%d", len(args)), "reviewed_at=NOW()")
	}
	if len(sets) > 0 {
		sets = append(sets, "updated_at=NOW()")
		if _, err := r.pool.Exec(ctx, "UPDATE rca_documents SET "+strings.Join(sets, ",")+" WHERE id=$1", args...); err != nil {
			return nil, err
		}
	}
	return rcaReload(ctx, r.pool, rca.ID)
}

func (r *Repository) SendRCA(ctx context.Context, org, ticketID, userID uuid.UUID) (*Activity, error) {
	if _, err := r.getTicket(ctx, org, ticketID); errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	} else if err != nil {
		return nil, err
	}
	rca, err := r.latestRCA(ctx, ticketID)
	if errors.Is(err, pgx.ErrNoRows) || rca == nil || rca.CustomerSummary == nil || strings.TrimSpace(*rca.CustomerSummary) == "" {
		return nil, ErrRunNotFound
	}
	_, _ = r.pool.Exec(ctx, `UPDATE rca_documents SET reviewed_by_user_id=$2,reviewed_at=NOW(),updated_at=NOW() WHERE id=$1`, rca.ID, userID)
	id := uuid.New()
	if err := insertActivityWithID(ctx, r.pool, id, ticketID, "comment", "user", &userID, rca.CustomerSummary, false, nil); err != nil {
		return nil, err
	}
	return r.activityByID(ctx, id)
}

func scanRun(row interface{ Scan(...any) error }) (*Run, error) {
	var run Run
	var toolCalls, maxToolCalls, llmCalls pgtype.Int4
	var inputTokens, outputTokens pgtype.Int8
	var problem, model pgtype.Text
	var metered bool
	var connector []byte
	var started, finished, created pgtype.Timestamptz
	if err := row.Scan(&run.ID, &run.TicketID, &run.RunType, &run.Status, &run.Trigger, &problem, &toolCalls, &maxToolCalls, &llmCalls, &inputTokens, &outputTokens, &metered, &model, &connector, &started, &finished, &created); err != nil {
		return nil, err
	}
	run.Error = textPtr(problem)
	if toolCalls.Valid {
		run.ToolCallsUsed = int(toolCalls.Int32)
	}
	if maxToolCalls.Valid {
		run.MaxToolCalls = int(maxToolCalls.Int32)
	}
	if llmCalls.Valid {
		run.LLMCalls = int(llmCalls.Int32)
	}
	if inputTokens.Valid {
		run.InputTokens = inputTokens.Int64
	}
	if outputTokens.Valid {
		run.OutputTokens = outputTokens.Int64
	}
	run.Metered = metered
	run.ModelName = textPtr(model)
	run.ConnectorStatus = object(connector)
	run.StartedAt = timePtr(started)
	run.FinishedAt = timePtr(finished)
	run.CreatedAt = timePtr(created)
	return &run, nil
}
func scanRCA(row interface{ Scan(...any) error }) (*RCA, error) {
	var rca RCA
	var run, reviewer pgtype.UUID
	var summary, impact, log, conclusion, remediation, prevention, customerSummary, generated pgtype.Text
	var timeline, factors []byte
	var confidence pgtype.Float8
	var partial bool
	var reviewed, created, updated pgtype.Timestamptz
	if err := row.Scan(&rca.ID, &run, &rca.Version, &summary, &impact, &timeline, &log, &factors, &conclusion, &remediation, &prevention, &customerSummary, &confidence, &partial, &generated, &reviewer, &reviewed, &created, &updated); err != nil {
		return nil, err
	}
	rca.RunID = uuidPtr(run)
	rca.Summary = textPtr(summary)
	rca.Impact = textPtr(impact)
	rca.Timeline = array(timeline)
	rca.InvestigationLog = textPtr(log)
	rca.ContributingFactors = array(factors)
	rca.Conclusion = textPtr(conclusion)
	rca.Remediation = textPtr(remediation)
	rca.Prevention = textPtr(prevention)
	rca.CustomerSummary = textPtr(customerSummary)
	rca.Confidence = floatPtr(confidence)
	rca.IsPartial = partial
	rca.GeneratedBy = "ai"
	if generated.Valid {
		rca.GeneratedBy = generated.String
	}
	rca.ReviewedByUserID = uuidPtr(reviewer)
	rca.ReviewedAt = timePtr(reviewed)
	rca.CreatedAt = timePtr(created)
	rca.UpdatedAt = timePtr(updated)
	return &rca, nil
}
func scanProposal(row interface{ Scan(...any) error }) (*Proposal, error) {
	var p Proposal
	var run, decided pgtype.UUID
	var customerMessage, reject pgtype.Text
	var confidence pgtype.Float8
	var decidedAt, created pgtype.Timestamptz
	if err := row.Scan(&p.ID, &run, &p.Summary, &customerMessage, &confidence, &p.Status, &decided, &decidedAt, &reject, &created); err != nil {
		return nil, err
	}
	p.RunID = uuidPtr(run)
	p.CustomerMessage = textPtr(customerMessage)
	p.Confidence = floatPtr(confidence)
	p.DecidedByUserID = uuidPtr(decided)
	p.DecidedAt = timePtr(decidedAt)
	p.RejectReason = textPtr(reject)
	p.CreatedAt = timePtr(created)
	return &p, nil
}
func rcaReload(ctx context.Context, pool *pgxpool.Pool, id uuid.UUID) (*RCA, error) {
	return scanRCA(pool.QueryRow(ctx, `SELECT id,run_id,version,summary,impact,timeline,investigation_log,contributing_factors,conclusion,remediation,prevention,customer_summary,confidence,is_partial,generated_by,reviewed_by_user_id,reviewed_at,created_at,updated_at FROM rca_documents WHERE id=$1`, id))
}
func nullableText(value pgtype.Text) any {
	if !value.Valid {
		return nil
	}
	return value.String
}

type dbExecer interface {
	Exec(context.Context, string, ...any) (pgconn.CommandTag, error)
}

func insertActivity(ctx context.Context, db dbExecer, ticketID uuid.UUID, activityType, actorType string, actorID *uuid.UUID, body *string, internal bool, metadata map[string]any) error {
	return insertActivityWithID(ctx, db, uuid.New(), ticketID, activityType, actorType, actorID, body, internal, metadata)
}
func insertActivityWithID(ctx context.Context, db dbExecer, id, ticketID uuid.UUID, activityType, actorType string, actorID *uuid.UUID, body *string, internal bool, metadata map[string]any) error {
	_, err := db.Exec(ctx, `INSERT INTO ticket_activities (id,ticket_id,activity_type,actor_type,actor_user_id,body,is_internal,activity_metadata,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`, id, ticketID, activityType, actorType, actorID, body, internal, mustJSON(metadata))
	return err
}
func (r *Repository) activityByID(ctx context.Context, id uuid.UUID) (*Activity, error) {
	var a Activity
	var metadata []byte
	var created pgtype.Timestamptz
	var name pgtype.Text
	if err := r.pool.QueryRow(ctx, `SELECT a.id,a.activity_type,a.actor_type,a.actor_user_id,a.body,a.is_internal,a.activity_metadata,a.created_at,u.full_name FROM ticket_activities a LEFT JOIN users u ON u.id=a.actor_user_id WHERE a.id=$1`, id).Scan(&a.ID, &a.ActivityType, &a.ActorType, &a.ActorUserID, &a.Body, &a.IsInternal, &metadata, &created, &name); err != nil {
		return nil, err
	}
	a.Metadata = object(metadata)
	a.CreatedAt = timePtr(created)
	if name.Valid {
		a.ActorName = &name.String
	}
	return &a, nil
}

const ticketSelect = `SELECT t.id,t.ticket_number,t.organization_id,t.customer_id,t.title,t.original_title,t.description,t.status,t.priority,t.severity,t.source,t.intent,t.triage_confidence,t.ai_summary,t.tags,t.assignee_user_id,t.group_id,t.agent_id,t.duplicate_of_ticket_id,t.resolution_outcome,t.resolution_summary,t.customer_resolution_message,t.resolved_by_actor,t.first_response_at,t.resolved_at,t.closed_at,t.confirmation_requested_at,t.reopened_count,t.csat_requested_at,t.csat_score,t.csat_responded_at,t.external_ref_type,t.external_ref_id,t.external_ref_url,t.created_by_user_id,t.created_at,t.updated_at,u.full_name,u.email,c.email,c.full_name FROM tickets t LEFT JOIN users u ON u.id=t.assignee_user_id LEFT JOIN customers c ON c.id=t.customer_id`

func (r *Repository) Get(ctx context.Context, org, id uuid.UUID) (*DetailResponse, error) {
	ticket, err := r.getTicket(ctx, org, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	activities, err := r.activities(ctx, id)
	if err != nil {
		return nil, err
	}
	runs, err := r.runs(ctx, id)
	if err != nil {
		return nil, err
	}
	sessions, err := r.sessionIDs(ctx, id)
	if err != nil {
		return nil, err
	}
	return &DetailResponse{Ticket: *ticket, Activities: activities, Runs: runs, LinkedSessionIDs: sessions, PossibleDuplicates: []TicketListItem{}, CanNotifyCustomer: len(sessions) > 0 || ticket.Customer != nil && ticket.Customer.Email != nil && strings.TrimSpace(*ticket.Customer.Email) != ""}, nil
}

func (r *Repository) getTicket(ctx context.Context, org, id uuid.UUID) (*Ticket, error) {
	return scanTicket(r.pool.QueryRow(ctx, ticketSelect+` WHERE t.id=$1 AND t.organization_id=$2`, id, org))
}

func (r *Repository) List(ctx context.Context, org uuid.UUID, filter ListFilter) (ListResponse, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 {
		filter.PageSize = 25
	}
	if filter.PageSize > 100 {
		filter.PageSize = 100
	}
	where, args := ticketWhere(org, filter)
	var total int64
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM tickets t WHERE "+where, args...).Scan(&total); err != nil {
		return ListResponse{}, err
	}
	args = append(args, filter.PageSize, (filter.Page-1)*filter.PageSize)
	order := "t.updated_at DESC"
	if filter.Sort == "created" {
		order = "t.created_at DESC"
	}
	if filter.Sort == "priority" {
		order = "CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END, t.updated_at DESC"
	}
	rows, err := r.pool.Query(ctx, ticketSelect+" WHERE "+where+" ORDER BY "+order+fmt.Sprintf(" LIMIT $%d OFFSET $%d", len(args)-1, len(args)), args...)
	if err != nil {
		return ListResponse{}, err
	}
	defer rows.Close()
	items := make([]TicketListItem, 0)
	for rows.Next() {
		ticket, err := scanTicket(rows)
		if err != nil {
			return ListResponse{}, err
		}
		items = append(items, listItem(ticket))
	}
	if err := rows.Err(); err != nil {
		return ListResponse{}, err
	}
	pages := 0
	if total > 0 {
		pages = int(math.Ceil(float64(total) / float64(filter.PageSize)))
	}
	return ListResponse{Tickets: items, Pagination: Pagination{Total: total, Page: filter.Page, PageSize: filter.PageSize, TotalPages: pages}}, nil
}

func ticketWhere(org uuid.UUID, filter ListFilter) (string, []any) {
	args := []any{org}
	conditions := []string{"t.organization_id=$1"}
	if len(filter.Status) > 0 {
		placeholders := make([]string, len(filter.Status))
		for i, v := range filter.Status {
			args = append(args, v)
			placeholders[i] = fmt.Sprintf("$%d", len(args))
		}
		conditions = append(conditions, "t.status IN ("+strings.Join(placeholders, ",")+")")
	}
	if filter.Priority != "" {
		args = append(args, filter.Priority)
		conditions = append(conditions, fmt.Sprintf("t.priority=$%d", len(args)))
	}
	if filter.AssigneeID != nil {
		args = append(args, *filter.AssigneeID)
		conditions = append(conditions, fmt.Sprintf("t.assignee_user_id=$%d", len(args)))
	}
	if filter.Unassigned {
		conditions = append(conditions, "t.assignee_user_id IS NULL")
	}
	if filter.Search != "" {
		term := "%" + strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(strings.TrimSpace(filter.Search), "\\", "\\\\"), "%", "\\%"), "_", "\\_") + "%"
		args = append(args, term)
		p := fmt.Sprintf("$%d", len(args))
		search := "(t.title ILIKE " + p + " ESCAPE '\\' OR t.description ILIKE " + p + " ESCAPE '\\')"
		digits := strings.TrimPrefix(strings.ToUpper(strings.TrimSpace(filter.Search)), "TKT-")
		if n, err := parsePositive(digits); err == nil {
			args = append(args, n)
			search = "(" + search + fmt.Sprintf(" OR t.ticket_number=$%d", len(args)) + ")"
		}
		conditions = append(conditions, search)
	}
	if filter.AIState != "" {
		active := "EXISTS (SELECT 1 FROM investigation_runs ir WHERE ir.ticket_id=t.id AND ir.status IN ('pending','running'))"
		resolved := "t.status IN ('resolved','closed','resolved_pending_confirmation')"
		switch filter.AIState {
		case "investigating":
			conditions = append(conditions, "(("+active+" OR t.status IN ('triaging','investigating')) AND NOT ("+resolved+"))")
		case "awaiting":
			conditions = append(conditions, "t.status='awaiting_approval' AND NOT ("+active+")")
		case "resolved":
			conditions = append(conditions, "("+resolved+") AND t.resolved_by_actor='ai'")
		}
	}
	return strings.Join(conditions, " AND "), args
}

func parsePositive(value string) (int, error) {
	if value == "" {
		return 0, errors.New("empty")
	}
	var n int
	_, err := fmt.Sscanf(value, "%d", &n)
	if err != nil || n < 1 {
		return 0, errors.New("invalid")
	}
	return n, nil
}

func listItem(ticket *Ticket) TicketListItem {
	return TicketListItem{ID: ticket.ID, TicketNumber: ticket.TicketNumber, DisplayNumber: ticket.DisplayNumber, Title: ticket.Title, Status: ticket.Status, Priority: ticket.Priority, Tags: ticket.Tags, AssigneeUserID: ticket.AssigneeUserID, AssigneeName: func() *string {
		if ticket.Assignee == nil {
			return nil
		}
		return ticket.Assignee.FullName
	}(), AIState: ticket.AIState, SLADueAt: ticket.SLADueAt, ResolvedAt: ticket.ResolvedAt, CreatedAt: ticket.CreatedAt, UpdatedAt: ticket.UpdatedAt}
}

func scanTicket(row interface{ Scan(...any) error }) (*Ticket, error) {
	var t Ticket
	var number int32
	var customer, assignee, group, agent, duplicate, createdBy pgtype.UUID
	var severity, csatScore pgtype.Int4
	var confidence pgtype.Float8
	var original, description, intent, summary, resolutionOutcome, resolutionSummary, customerMessage, resolvedBy, externalType, externalID, externalURL, assigneeName, assigneeEmail, customerEmail, customerName pgtype.Text
	var firstResponse, resolved, closed, confirmation, csatRequested, csatResponded, created, updated pgtype.Timestamptz
	var tags []byte
	err := row.Scan(&t.ID, &number, &t.OrganizationID, &customer, &t.Title, &original, &description, &t.Status, &t.Priority, &severity, &t.Source, &intent, &confidence, &summary, &tags, &assignee, &group, &agent, &duplicate, &resolutionOutcome, &resolutionSummary, &customerMessage, &resolvedBy, &firstResponse, &resolved, &closed, &confirmation, &t.ReopenedCount, &csatRequested, &csatScore, &csatResponded, &externalType, &externalID, &externalURL, &createdBy, &created, &updated, &assigneeName, &assigneeEmail, &customerEmail, &customerName)
	if err != nil {
		return nil, err
	}
	t.TicketNumber = int(number)
	t.DisplayNumber = fmt.Sprintf("TKT-%d", number)
	t.CustomerID = uuidPtr(customer)
	t.OriginalTitle = textPtr(original)
	t.Description = textPtr(description)
	t.Severity = intPtr(severity)
	t.Intent = textPtr(intent)
	t.TriageConfidence = floatPtr(confidence)
	t.AISummary = textPtr(summary)
	t.Tags = stringSlice(tags)
	t.AssigneeUserID = uuidPtr(assignee)
	t.GroupID = uuidPtr(group)
	t.AgentID = uuidPtr(agent)
	t.DuplicateOfTicketID = uuidPtr(duplicate)
	t.ResolutionOutcome = textPtr(resolutionOutcome)
	t.ResolutionSummary = textPtr(resolutionSummary)
	t.CustomerResolutionMessage = textPtr(customerMessage)
	t.ResolvedByActor = textPtr(resolvedBy)
	t.FirstResponseAt = timePtr(firstResponse)
	t.ResolvedAt = timePtr(resolved)
	t.ClosedAt = timePtr(closed)
	t.ConfirmationRequestedAt = timePtr(confirmation)
	t.CSATRequestedAt = timePtr(csatRequested)
	t.CSATScore = intPtr(csatScore)
	t.CSATRespondedAt = timePtr(csatResponded)
	t.ExternalRefType = textPtr(externalType)
	t.ExternalRefID = textPtr(externalID)
	t.ExternalRefURL = textPtr(externalURL)
	t.CreatedByUserID = uuidPtr(createdBy)
	t.CreatedAt = timePtr(created)
	t.UpdatedAt = timePtr(updated)
	if aid := uuidPtr(assignee); aid != nil {
		t.Assignee = &UserView{ID: *aid, FullName: textPtr(assigneeName), Email: textPtr(assigneeEmail)}
	}
	if cid := uuidPtr(customer); cid != nil {
		t.Customer = &CustomerView{ID: *cid, Email: textPtr(customerEmail), FullName: textPtr(customerName)}
	}
	t.AIState = aiState(&t)
	return &t, nil
}

func aiState(t *Ticket) string {
	if t.Status == StatusResolved || t.Status == StatusClosed || t.Status == StatusResolvedPendingConfirmation {
		if t.ResolvedByActor != nil && *t.ResolvedByActor == "ai" {
			return "resolved"
		}
		return "human"
	}
	if t.Status == StatusTriaging || t.Status == StatusInvestigating {
		return "investigating"
	}
	if t.Status == StatusAwaitingApproval {
		return "awaiting"
	}
	return "human"
}
func uuidPtr(v pgtype.UUID) *uuid.UUID {
	if !v.Valid {
		return nil
	}
	x := uuid.UUID(v.Bytes)
	return &x
}
func textPtr(v pgtype.Text) *string {
	if !v.Valid {
		return nil
	}
	x := v.String
	return &x
}
func intPtr(v pgtype.Int4) *int {
	if !v.Valid {
		return nil
	}
	x := int(v.Int32)
	return &x
}
func floatPtr(v pgtype.Float8) *float64 {
	if !v.Valid {
		return nil
	}
	x := v.Float64
	return &x
}
func timePtr(v pgtype.Timestamptz) *time.Time {
	if !v.Valid {
		return nil
	}
	x := v.Time
	return &x
}
func stringSlice(raw []byte) []string {
	var x []string
	_ = json.Unmarshal(raw, &x)
	if x == nil {
		x = []string{}
	}
	return x
}
func object(raw []byte) map[string]any {
	var x map[string]any
	_ = json.Unmarshal(raw, &x)
	if x == nil {
		x = map[string]any{}
	}
	return x
}
func array(raw []byte) []any {
	var x []any
	_ = json.Unmarshal(raw, &x)
	if x == nil {
		x = []any{}
	}
	return x
}
