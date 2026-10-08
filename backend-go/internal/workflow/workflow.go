package workflow

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

var (
	ErrNotFound          = errors.New("workflow resource not found")
	ErrInvalid           = errors.New("invalid workflow data")
	ErrConflict          = errors.New("workflow resource conflicts with existing data")
	ErrWrongOrganization = errors.New("resource does not belong to this organization")
)

type Workflow struct {
	ID              uuid.UUID      `json:"id"`
	Name            string         `json:"name"`
	Description     *string        `json:"description"`
	Status          string         `json:"status"`
	Version         int            `json:"version"`
	IsTemplate      bool           `json:"is_template"`
	DefaultLanguage string         `json:"default_language"`
	CanvasData      map[string]any `json:"canvas_data"`
	Settings        map[string]any `json:"settings"`
	OrganizationID  uuid.UUID      `json:"organization_id"`
	AgentID         uuid.UUID      `json:"agent_id"`
	CreatedBy       uuid.UUID      `json:"created_by"`
	CreatedAt       *time.Time     `json:"created_at"`
	UpdatedAt       *time.Time     `json:"updated_at"`
}

type Node struct {
	ID          uuid.UUID      `json:"id"`
	WorkflowID  uuid.UUID      `json:"workflow_id"`
	NodeType    string         `json:"node_type"`
	Name        string         `json:"name"`
	Description *string        `json:"description"`
	PositionX   float64        `json:"position_x"`
	PositionY   float64        `json:"position_y"`
	Config      map[string]any `json:"config"`
	CreatedAt   *time.Time     `json:"created_at"`
	UpdatedAt   *time.Time     `json:"updated_at"`
}

type Connection struct {
	ID                 uuid.UUID      `json:"id"`
	WorkflowID         uuid.UUID      `json:"workflow_id"`
	SourceNodeID       uuid.UUID      `json:"source_node_id"`
	TargetNodeID       uuid.UUID      `json:"target_node_id"`
	Label              *string        `json:"label"`
	Condition          *string        `json:"condition"`
	Priority           int            `json:"priority"`
	ConnectionMetadata map[string]any `json:"connection_metadata"`
	CreatedAt          *time.Time     `json:"created_at"`
	UpdatedAt          *time.Time     `json:"updated_at"`
}

type NodesResult struct {
	Nodes       []Node       `json:"nodes"`
	Connections []Connection `json:"connections"`
}

type CreateInput struct {
	Name            string
	Description     *string
	Status          string
	IsTemplate      bool
	DefaultLanguage string
	CanvasData      map[string]any
	Settings        map[string]any
	AgentID         uuid.UUID
	CreatedBy       uuid.UUID
	OrganizationID  uuid.UUID
}

type Store interface {
	Create(ctx context.Context, input CreateInput) (*Workflow, error)
	Get(ctx context.Context, workflowID, organizationID uuid.UUID) (*Workflow, error)
	GetByAgent(ctx context.Context, agentID, organizationID uuid.UUID) (*Workflow, error)
	Update(ctx context.Context, workflowID, organizationID uuid.UUID, fields map[string]json.RawMessage) (*Workflow, error)
	Delete(ctx context.Context, workflowID, organizationID uuid.UUID) error
	GetNodes(ctx context.Context, workflowID, organizationID uuid.UUID) (*NodesResult, error)
	ReplaceNodes(ctx context.Context, workflowID, organizationID uuid.UUID, nodes []map[string]any, connections []map[string]any) (*NodesResult, error)
	GetNode(ctx context.Context, workflowID, nodeID, organizationID uuid.UUID) (*Node, error)
	UpdateNode(ctx context.Context, workflowID, nodeID, organizationID uuid.UUID, fields map[string]json.RawMessage) (*Node, error)
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
		return errors.New("database is not configured")
	}
	return nil
}

const workflowProjection = `
SELECT id, name, description, status::text, version, is_template, default_language,
       canvas_data, settings, organization_id, agent_id, created_by, created_at, updated_at
FROM workflows `

func (r *Repository) Create(ctx context.Context, input CreateInput) (*Workflow, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	if strings.TrimSpace(input.Name) == "" || input.AgentID == uuid.Nil {
		return nil, ErrInvalid
	}
	if input.Status == "" {
		input.Status = "DRAFT"
	}
	input.Status = strings.ToUpper(input.Status)
	if input.DefaultLanguage == "" {
		input.DefaultLanguage = "en"
	}
	if input.CanvasData == nil {
		input.CanvasData = map[string]any{}
	}
	if input.Settings == nil {
		input.Settings = map[string]any{}
	}
	canvas, err := json.Marshal(input.CanvasData)
	if err != nil {
		return nil, err
	}
	settings, err := json.Marshal(input.Settings)
	if err != nil {
		return nil, err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	var agentOrganization uuid.UUID
	if err := tx.QueryRow(ctx, `SELECT organization_id FROM agents WHERE id = $1`, input.AgentID).Scan(&agentOrganization); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if agentOrganization != input.OrganizationID {
		return nil, ErrWrongOrganization
	}
	var exists bool
	if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM workflows WHERE agent_id = $1)`, input.AgentID).Scan(&exists); err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrConflict
	}
	if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM workflows WHERE name = $1 AND organization_id = $2)`, input.Name, input.OrganizationID).Scan(&exists); err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrConflict
	}
	workflowID := uuid.New()
	if _, err := tx.Exec(ctx, `
INSERT INTO workflows (id, name, description, status, version, is_template, default_language,
                       canvas_data, settings, created_by, organization_id, agent_id)
VALUES ($1,$2,$3,$4::workflowstatus,1,$5,$6,$7,$8,$9,$10,$11)`, workflowID,
		input.Name, input.Description, input.Status, input.IsTemplate, input.DefaultLanguage,
		string(canvas), string(settings), input.CreatedBy, input.OrganizationID, input.AgentID); err != nil {
		return nil, err
	}
	result, err := scanWorkflow(tx.QueryRow(ctx, workflowProjection+`WHERE id = $1`, workflowID))
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return result, nil
}

func (r *Repository) GetByAgent(ctx context.Context, agentID, organizationID uuid.UUID) (*Workflow, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	var agentOrganization uuid.UUID
	if err := r.pool.QueryRow(ctx, `SELECT organization_id FROM agents WHERE id = $1`, agentID).Scan(&agentOrganization); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if agentOrganization != organizationID {
		return nil, ErrWrongOrganization
	}
	workflow, err := scanWorkflow(r.pool.QueryRow(ctx, workflowProjection+`WHERE agent_id = $1 AND organization_id = $2`, agentID, organizationID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return workflow, err
}

func (r *Repository) Get(ctx context.Context, workflowID, organizationID uuid.UUID) (*Workflow, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	workflow, err := scanWorkflow(r.pool.QueryRow(ctx, workflowProjection+`WHERE id = $1 AND organization_id = $2`, workflowID, organizationID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return workflow, err
}

func (r *Repository) Update(ctx context.Context, workflowID, organizationID uuid.UUID, fields map[string]json.RawMessage) (*Workflow, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	current, err := scanWorkflow(tx.QueryRow(ctx, workflowProjection+`WHERE id = $1 AND organization_id = $2 FOR UPDATE`, workflowID, organizationID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if raw, ok := fields["name"]; ok {
		var name string
		if err := json.Unmarshal(raw, &name); err != nil || strings.TrimSpace(name) == "" {
			return nil, ErrInvalid
		}
		var exists bool
		if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM workflows WHERE name = $1 AND organization_id = $2 AND id <> $3)`, name, organizationID, workflowID).Scan(&exists); err != nil {
			return nil, err
		}
		if exists {
			return nil, ErrConflict
		}
	}
	if raw, ok := fields["agent_id"]; ok {
		var value uuid.UUID
		if err := json.Unmarshal(raw, &value); err != nil {
			return nil, ErrInvalid
		}
		var agentOrganization uuid.UUID
		if err := tx.QueryRow(ctx, `SELECT organization_id FROM agents WHERE id = $1`, value).Scan(&agentOrganization); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrNotFound
			}
			return nil, err
		}
		if agentOrganization != organizationID {
			return nil, ErrWrongOrganization
		}
		var exists bool
		if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM workflows WHERE agent_id = $1 AND id <> $2)`, value, workflowID).Scan(&exists); err != nil {
			return nil, err
		}
		if exists {
			return nil, ErrConflict
		}
	}
	parts := make([]string, 0, len(fields))
	args := make([]any, 0, len(fields)+1)
	for key, raw := range fields {
		var column string
		var value any
		switch key {
		case "name", "default_language":
			column = key
			var parsed string
			if err := json.Unmarshal(raw, &parsed); err != nil {
				return nil, ErrInvalid
			}
			value = parsed
		case "description":
			column = key
			if string(raw) != "null" {
				var parsed string
				if err := json.Unmarshal(raw, &parsed); err != nil {
					return nil, ErrInvalid
				}
				value = parsed
			}
		case "status":
			column = "status"
			var parsed string
			if err := json.Unmarshal(raw, &parsed); err != nil {
				return nil, ErrInvalid
			}
			value = strings.ToUpper(parsed)
		case "is_template":
			column = key
			var parsed bool
			if err := json.Unmarshal(raw, &parsed); err != nil {
				return nil, ErrInvalid
			}
			value = parsed
		case "canvas_data", "settings":
			column = key
			if !json.Valid(raw) {
				return nil, ErrInvalid
			}
			value = string(raw)
		case "agent_id":
			column = key
			var parsed uuid.UUID
			if err := json.Unmarshal(raw, &parsed); err != nil {
				return nil, ErrInvalid
			}
			value = parsed
		default:
			// WorkflowUpdate also contains node/connection operations. The
			// Python workflow repository ignores those keys; keep that behavior.
			continue
		}
		args = append(args, value)
		if key == "status" {
			parts = append(parts, fmt.Sprintf("status = $%d::workflowstatus", len(args)))
		} else {
			parts = append(parts, fmt.Sprintf("%s = $%d", column, len(args)))
		}
	}
	if raw, ok := fields["status"]; ok {
		var status string
		if err := json.Unmarshal(raw, &status); err == nil {
			switch strings.ToLower(status) {
			case "published":
				if _, err := tx.Exec(ctx, `UPDATE agents SET active_workflow_id = $1, use_workflow = TRUE WHERE id = $2`, workflowID, current.AgentID); err != nil {
					return nil, err
				}
			case "draft":
				if _, err := tx.Exec(ctx, `UPDATE agents SET active_workflow_id = NULL, use_workflow = FALSE WHERE id = $1 AND active_workflow_id = $2`, current.AgentID, workflowID); err != nil {
					return nil, err
				}
			}
		}
	}
	if len(parts) > 0 {
		args = append(args, workflowID, organizationID)
		parts = append(parts, "updated_at = NOW()")
		query := "UPDATE workflows SET " + strings.Join(parts, ", ") + " WHERE id = $" + fmt.Sprint(len(args)-1) + " AND organization_id = $" + fmt.Sprint(len(args))
		if _, err := tx.Exec(ctx, query, args...); err != nil {
			return nil, err
		}
	}
	updated, err := scanWorkflow(tx.QueryRow(ctx, workflowProjection+`WHERE id = $1`, workflowID))
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return updated, nil
}

func (r *Repository) Delete(ctx context.Context, workflowID, organizationID uuid.UUID) error {
	if err := r.ready(); err != nil {
		return err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var agentID uuid.UUID
	if err := tx.QueryRow(ctx, `SELECT agent_id FROM workflows WHERE id = $1 AND organization_id = $2 FOR UPDATE`, workflowID, organizationID).Scan(&agentID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}
	if _, err := tx.Exec(ctx, `UPDATE agents SET active_workflow_id = NULL, use_workflow = FALSE WHERE id = $1 AND active_workflow_id = $2`, agentID, workflowID); err != nil {
		return err
	}
	result, err := tx.Exec(ctx, `DELETE FROM workflows WHERE id = $1 AND organization_id = $2`, workflowID, organizationID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return tx.Commit(ctx)
}

func (r *Repository) GetNodes(ctx context.Context, workflowID, organizationID uuid.UUID) (*NodesResult, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	if err := r.ensureWorkflow(ctx, workflowID, organizationID); err != nil {
		return nil, err
	}
	nodes, err := r.queryNodes(ctx, r.pool, workflowID)
	if err != nil {
		return nil, err
	}
	connections, err := r.queryConnections(ctx, r.pool, workflowID)
	if err != nil {
		return nil, err
	}
	return &NodesResult{Nodes: nodes, Connections: connections}, nil
}

func (r *Repository) ReplaceNodes(ctx context.Context, workflowID, organizationID uuid.UUID, nodesData []map[string]any, connectionsData []map[string]any) (*NodesResult, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	if err := r.ensureWorkflowOn(ctx, tx, workflowID, organizationID); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM workflow_connections WHERE workflow_id = $1`, workflowID); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM workflow_nodes WHERE workflow_id = $1`, workflowID); err != nil {
		return nil, err
	}
	idMapping := make(map[string]uuid.UUID)
	for _, data := range nodesData {
		if id, ok := textID(data["id"]); ok {
			if _, isUUID := parseUUIDValue(id); !isUUID {
				idMapping[id] = uuid.New()
			}
		}
	}
	for _, data := range connectionsData {
		if id, ok := textID(data["id"]); ok {
			if _, isUUID := parseUUIDValue(id); !isUUID {
				if _, exists := idMapping[id]; !exists {
					idMapping[id] = uuid.New()
				}
			}
		}
	}
	for _, original := range nodesData {
		data := cloneMap(original)
		id, err := mappedIDOrNew(data["id"], idMapping)
		if err != nil {
			return nil, err
		}
		nodeType, _ := data["node_type"].(string)
		name, _ := data["name"].(string)
		if nodeType == "" || name == "" {
			return nil, ErrInvalid
		}
		description := stringPointer(data["description"])
		positionX := numberValue(data["position_x"])
		positionY := numberValue(data["position_y"])
		config := mapValue(data["config"])
		if config == nil {
			config = map[string]any{}
		}
		for _, field := range []string{
			"message_text", "system_prompt", "temperature", "model_id", "condition_expression", "action_type",
			"action_url", "action_config", "transfer_department", "transfer_message", "transfer_rules",
			"wait_duration", "wait_unit", "wait_until_condition", "final_message", "form_fields", "form_title",
			"form_description", "submit_button_text", "form_full_screen", "landing_page_heading", "landing_page_content",
			"enabled_guardrails", "pii_action", "jailbreak_sensitivity", "text_source", "block_message",
		} {
			if value, exists := data[field]; exists {
				if !isBlankValue(value) {
					config[field] = value
				}
				delete(data, field)
			}
		}
		configJSON, err := json.Marshal(config)
		if err != nil {
			return nil, err
		}
		if _, err := tx.Exec(ctx, `
INSERT INTO workflow_nodes (id, workflow_id, node_type, name, description, position_x, position_y, config)
VALUES ($1,$2,$3::nodetype,$4,$5,$6,$7,$8)`, id, workflowID, strings.ToUpper(nodeType), name, description, positionX, positionY, string(configJSON)); err != nil {
			return nil, err
		}
	}
	for _, data := range connectionsData {
		id, err := mappedIDOrNew(data["id"], idMapping)
		if err != nil {
			return nil, err
		}
		source, err := mappedID(data["source_node_id"], idMapping)
		if err != nil {
			return nil, err
		}
		target, err := mappedID(data["target_node_id"], idMapping)
		if err != nil {
			return nil, err
		}
		metadataValue := mapValue(data["connection_metadata"])
		if metadataValue == nil {
			metadataValue = map[string]any{}
		}
		metadata, err := json.Marshal(metadataValue)
		if err != nil {
			return nil, err
		}
		if _, err := tx.Exec(ctx, `
INSERT INTO workflow_connections (id, workflow_id, source_node_id, target_node_id, label, condition, priority, connection_metadata)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, id, workflowID, source, target, stringPointer(data["label"]), stringPointer(data["condition"]), int(numberValue(data["priority"])), string(metadata)); err != nil {
			return nil, err
		}
	}
	nodes, err := r.queryNodes(ctx, tx, workflowID)
	if err != nil {
		return nil, err
	}
	connections, err := r.queryConnections(ctx, tx, workflowID)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &NodesResult{Nodes: nodes, Connections: connections}, nil
}

func (r *Repository) GetNode(ctx context.Context, workflowID, nodeID, organizationID uuid.UUID) (*Node, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	if err := r.ensureWorkflow(ctx, workflowID, organizationID); err != nil {
		return nil, err
	}
	node, err := scanNode(r.pool.QueryRow(ctx, nodeProjection+`WHERE id = $1 AND workflow_id = $2`, nodeID, workflowID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return node, err
}

func (r *Repository) UpdateNode(ctx context.Context, workflowID, nodeID, organizationID uuid.UUID, fields map[string]json.RawMessage) (*Node, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	if err := r.ensureWorkflow(ctx, workflowID, organizationID); err != nil {
		return nil, err
	}
	var exists bool
	if err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM workflow_nodes WHERE id = $1 AND workflow_id = $2)`, nodeID, workflowID).Scan(&exists); err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrNotFound
	}
	if raw, ok := fields["name"]; ok {
		var name string
		if err := json.Unmarshal(raw, &name); err != nil {
			return nil, ErrInvalid
		}
		var duplicate bool
		if err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM workflow_nodes WHERE workflow_id = $1 AND id <> $2 AND LOWER(name) = LOWER($3))`, workflowID, nodeID, name).Scan(&duplicate); err != nil {
			return nil, err
		}
		if duplicate {
			name = r.uniqueNodeName(ctx, workflowID, nodeID, name)
			encoded, _ := json.Marshal(name)
			fields["name"] = encoded
		}
	}
	parts := make([]string, 0, len(fields))
	args := make([]any, 0, len(fields)+2)
	for key, raw := range fields {
		var value any
		column := key
		switch key {
		case "node_type":
			var parsed string
			if err := json.Unmarshal(raw, &parsed); err != nil {
				return nil, ErrInvalid
			}
			value = strings.ToUpper(parsed)
		case "name", "description":
			if string(raw) == "null" {
				value = nil
			} else {
				var parsed string
				if err := json.Unmarshal(raw, &parsed); err != nil {
					return nil, ErrInvalid
				}
				value = parsed
			}
		case "position_x", "position_y":
			var parsed float64
			if err := json.Unmarshal(raw, &parsed); err != nil {
				return nil, ErrInvalid
			}
			value = parsed
		case "config":
			if !json.Valid(raw) {
				return nil, ErrInvalid
			}
			value = string(raw)
		default:
			// Landing-page and other schema-only fields are stored in config by
			// the batch endpoint and are ignored by Python's SQLAlchemy model on
			// this single-node endpoint.
			continue
		}
		args = append(args, value)
		if key == "node_type" {
			parts = append(parts, fmt.Sprintf("node_type = $%d::nodetype", len(args)))
		} else {
			parts = append(parts, fmt.Sprintf("%s = $%d", column, len(args)))
		}
	}
	if len(parts) == 0 {
		return r.GetNode(ctx, workflowID, nodeID, organizationID)
	}
	args = append(args, nodeID, workflowID)
	parts = append(parts, "updated_at = NOW()")
	_, err := r.pool.Exec(ctx, "UPDATE workflow_nodes SET "+strings.Join(parts, ", ")+" WHERE id = $"+fmt.Sprint(len(args)-1)+" AND workflow_id = $"+fmt.Sprint(len(args)), args...)
	if err != nil {
		return nil, err
	}
	return r.GetNode(ctx, workflowID, nodeID, organizationID)
}

const nodeProjection = `
SELECT id, workflow_id, node_type::text, name, description, position_x, position_y, config, created_at, updated_at
FROM workflow_nodes `

const connectionProjection = `
SELECT id, workflow_id, source_node_id, target_node_id, label, condition, priority, connection_metadata, created_at, updated_at
FROM workflow_connections `

type queryer interface {
	Query(context.Context, string, ...any) (pgx.Rows, error)
	QueryRow(context.Context, string, ...any) pgx.Row
}

func (r *Repository) queryNodes(ctx context.Context, q queryer, workflowID uuid.UUID) ([]Node, error) {
	rows, err := q.Query(ctx, nodeProjection+`WHERE workflow_id = $1 ORDER BY created_at, id`, workflowID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]Node, 0)
	for rows.Next() {
		item, err := scanNode(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *item)
	}
	return items, rows.Err()
}

func (r *Repository) queryConnections(ctx context.Context, q queryer, workflowID uuid.UUID) ([]Connection, error) {
	rows, err := q.Query(ctx, connectionProjection+`WHERE workflow_id = $1 ORDER BY priority, created_at, id`, workflowID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]Connection, 0)
	for rows.Next() {
		item, err := scanConnection(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *item)
	}
	return items, rows.Err()
}

func (r *Repository) ensureWorkflow(ctx context.Context, workflowID, organizationID uuid.UUID) error {
	return r.ensureWorkflowOn(ctx, r.pool, workflowID, organizationID)
}

func (r *Repository) ensureWorkflowOn(ctx context.Context, q interface {
	QueryRow(context.Context, string, ...any) pgx.Row
}, workflowID, organizationID uuid.UUID) error {
	var exists bool
	if err := q.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM workflows WHERE id = $1 AND organization_id = $2)`, workflowID, organizationID).Scan(&exists); err != nil {
		return err
	}
	if !exists {
		return ErrNotFound
	}
	return nil
}

func scanWorkflow(row rowScanner) (*Workflow, error) {
	var (
		item                          Workflow
		description, defaultLanguage  pgtype.Text
		status                        string
		version                       pgtype.Int4
		isTemplate                    pgtype.Bool
		canvas, settings              []byte
		organizationID, agentID, byID pgtype.UUID
		createdAt, updatedAt          pgtype.Timestamp
	)
	err := row.Scan(&item.ID, &item.Name, &description, &status, &version, &isTemplate, &defaultLanguage,
		&canvas, &settings, &organizationID, &agentID, &byID, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}
	item.Description = textPointer(description)
	item.Status = strings.ToLower(status)
	if version.Valid {
		item.Version = int(version.Int32)
	} else {
		item.Version = 1
	}
	item.IsTemplate = isTemplate.Valid && isTemplate.Bool
	item.DefaultLanguage = defaultLanguage.String
	if item.DefaultLanguage == "" {
		item.DefaultLanguage = "en"
	}
	item.CanvasData = objectJSON(canvas)
	item.Settings = objectJSON(settings)
	if organizationID.Valid {
		item.OrganizationID = uuid.UUID(organizationID.Bytes)
	}
	if agentID.Valid {
		item.AgentID = uuid.UUID(agentID.Bytes)
	}
	if byID.Valid {
		item.CreatedBy = uuid.UUID(byID.Bytes)
	}
	item.CreatedAt = timestampPointer(createdAt)
	item.UpdatedAt = timestampPointer(updatedAt)
	return &item, nil
}

func scanNode(row rowScanner) (*Node, error) {
	var (
		item                 Node
		nodeType, name       string
		description          pgtype.Text
		positionX, positionY pgtype.Float8
		config               []byte
		createdAt, updatedAt pgtype.Timestamptz
	)
	if err := row.Scan(&item.ID, &item.WorkflowID, &nodeType, &name, &description, &positionX, &positionY, &config, &createdAt, &updatedAt); err != nil {
		return nil, err
	}
	item.NodeType = strings.ToLower(nodeType)
	item.Name = name
	item.Description = textPointer(description)
	if positionX.Valid {
		item.PositionX = positionX.Float64
	}
	if positionY.Valid {
		item.PositionY = positionY.Float64
	}
	item.Config = objectJSON(config)
	item.CreatedAt = timestamptzPointer(createdAt)
	item.UpdatedAt = timestamptzPointer(updatedAt)
	return &item, nil
}

func scanConnection(row rowScanner) (*Connection, error) {
	var (
		item                 Connection
		label, condition     pgtype.Text
		priority             pgtype.Int4
		metadata             []byte
		createdAt, updatedAt pgtype.Timestamptz
	)
	if err := row.Scan(&item.ID, &item.WorkflowID, &item.SourceNodeID, &item.TargetNodeID, &label, &condition, &priority, &metadata, &createdAt, &updatedAt); err != nil {
		return nil, err
	}
	item.Label = textPointer(label)
	item.Condition = textPointer(condition)
	if priority.Valid {
		item.Priority = int(priority.Int32)
	}
	item.ConnectionMetadata = objectJSON(metadata)
	item.CreatedAt = timestamptzPointer(createdAt)
	item.UpdatedAt = timestamptzPointer(updatedAt)
	return &item, nil
}

type rowScanner interface{ Scan(dest ...any) error }

func textPointer(value pgtype.Text) *string {
	if !value.Valid {
		return nil
	}
	result := value.String
	return &result
}

func timestampPointer(value pgtype.Timestamp) *time.Time {
	if !value.Valid {
		return nil
	}
	result := value.Time
	return &result
}

func timestamptzPointer(value pgtype.Timestamptz) *time.Time {
	if !value.Valid {
		return nil
	}
	result := value.Time
	return &result
}

func objectJSON(raw []byte) map[string]any {
	result := map[string]any{}
	if len(raw) > 0 {
		_ = json.Unmarshal(raw, &result)
	}
	return result
}

func textID(value any) (string, bool) {
	text, ok := value.(string)
	return strings.TrimSpace(text), ok && strings.TrimSpace(text) != ""
}

func parseUUIDValue(value string) (uuid.UUID, bool) {
	parsed, err := uuid.Parse(value)
	return parsed, err == nil
}

func mappedID(value any, mapping map[string]uuid.UUID) (uuid.UUID, error) {
	text, ok := textID(value)
	if !ok {
		return uuid.Nil, ErrInvalid
	}
	if mapped, exists := mapping[text]; exists {
		return mapped, nil
	}
	parsed, ok := parseUUIDValue(text)
	if !ok {
		return uuid.Nil, ErrInvalid
	}
	return parsed, nil
}

func mappedIDOrNew(value any, mapping map[string]uuid.UUID) (uuid.UUID, error) {
	if text, ok := textID(value); !ok {
		return uuid.New(), nil
	} else if mapped, exists := mapping[text]; exists {
		return mapped, nil
	} else if parsed, valid := parseUUIDValue(text); valid {
		return parsed, nil
	}
	return uuid.Nil, ErrInvalid
}

func cloneMap(value map[string]any) map[string]any {
	result := make(map[string]any, len(value))
	for key, item := range value {
		result[key] = item
	}
	return result
}

func mapValue(value any) map[string]any {
	result, _ := value.(map[string]any)
	return result
}

func stringPointer(value any) *string {
	if value == nil {
		return nil
	}
	text, ok := value.(string)
	if !ok {
		return nil
	}
	return &text
}

func numberValue(value any) float64 {
	switch parsed := value.(type) {
	case float64:
		return parsed
	case float32:
		return float64(parsed)
	case int:
		return float64(parsed)
	case int64:
		return float64(parsed)
	case json.Number:
		value, _ := parsed.Float64()
		return value
	default:
		return 0
	}
}

func isBlankValue(value any) bool {
	if value == nil {
		return true
	}
	if text, ok := value.(string); ok {
		return text == ""
	}
	if list, ok := value.([]any); ok {
		return len(list) == 0
	}
	return false
}

func (r *Repository) uniqueNodeName(ctx context.Context, workflowID, nodeID uuid.UUID, base string) string {
	for counter := 1; counter <= 999; counter++ {
		candidate := fmt.Sprintf("%s_%03d", base, counter)
		var exists bool
		if err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM workflow_nodes WHERE workflow_id = $1 AND id <> $2 AND LOWER(name) = LOWER($3))`, workflowID, nodeID, candidate).Scan(&exists); err == nil && !exists {
			return candidate
		}
	}
	return fmt.Sprintf("%s_%s", base, uuid.NewString()[:8])
}
