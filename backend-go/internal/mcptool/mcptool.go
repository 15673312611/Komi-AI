package mcptool

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound    = errors.New("MCP tool not found")
	ErrForbidden   = errors.New("not authorized to access MCP tool")
	ErrConflict    = errors.New("MCP tool with this name already exists")
	ErrAssociation = errors.New("MCP tool association not found")
	ErrInvalid     = errors.New("invalid MCP tool configuration")
)

type Tool struct {
	ID               int64             `json:"id"`
	Name             string            `json:"name"`
	Description      *string           `json:"description"`
	TransportType    string            `json:"transport_type"`
	Enabled          bool              `json:"enabled"`
	Command          *string           `json:"command"`
	Args             []string          `json:"args"`
	EnvVars          map[string]string `json:"env_vars"`
	URL              *string           `json:"url"`
	Headers          map[string]string `json:"headers"`
	Timeout          *int              `json:"timeout"`
	SSEReadTimeout   *int              `json:"sse_read_timeout"`
	TerminateOnClose *bool             `json:"terminate_on_close"`
	OrganizationID   uuid.UUID         `json:"organization_id"`
	CreatedAt        *time.Time        `json:"created_at"`
	UpdatedAt        *time.Time        `json:"updated_at"`
}

type Association struct {
	ID        int64      `json:"id"`
	MCPToolID int64      `json:"mcp_tool_id"`
	AgentID   uuid.UUID  `json:"agent_id"`
	CreatedAt *time.Time `json:"created_at"`
	MCPTool   *Tool      `json:"mcp_tool"`
}

type AgentTools struct {
	ID       uuid.UUID `json:"id"`
	Name     string    `json:"name"`
	MCPTools []Tool    `json:"mcp_tools"`
}

type CreateInput struct {
	Name             string
	Description      *string
	TransportType    string
	Enabled          bool
	Command          *string
	Args             []string
	EnvVars          map[string]string
	URL              *string
	Headers          map[string]string
	Timeout          *int
	SSEReadTimeout   *int
	TerminateOnClose *bool
	OrganizationID   uuid.UUID
}

type TestResult struct {
	Success   bool     `json:"success"`
	Functions []string `json:"functions"`
	Error     *string  `json:"error"`
}

type Store interface {
	Create(ctx context.Context, input CreateInput) (*Tool, error)
	List(ctx context.Context, organizationID uuid.UUID, enabledOnly bool) ([]Tool, error)
	Get(ctx context.Context, id int64) (*Tool, error)
	Update(ctx context.Context, id int64, organizationID uuid.UUID, fields map[string]json.RawMessage) (*Tool, error)
	Delete(ctx context.Context, id int64, organizationID uuid.UUID) error
	Test(ctx context.Context, id int64, organizationID uuid.UUID) TestResult
	AddToAgent(ctx context.Context, toolID int64, agentID, organizationID uuid.UUID) (*Association, error)
	RemoveFromAgent(ctx context.Context, toolID int64, agentID, organizationID uuid.UUID) error
	AgentTools(ctx context.Context, agentID, organizationID uuid.UUID) (*AgentTools, error)
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

const toolProjection = `
SELECT id, name, description, transport_type::text, enabled, command, args, env_vars,
       url, headers, timeout, sse_read_timeout, terminate_on_close, organization_id,
       created_at, updated_at
FROM mcp_tools `

func (r *Repository) Create(ctx context.Context, input CreateInput) (*Tool, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	if err := validateCreate(input); err != nil {
		return nil, err
	}
	var exists bool
	if err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM mcp_tools WHERE name = $1 AND organization_id = $2)`, input.Name, input.OrganizationID).Scan(&exists); err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrConflict
	}
	args, err := json.Marshal(input.Args)
	if err != nil {
		return nil, err
	}
	envVars, err := json.Marshal(input.EnvVars)
	if err != nil {
		return nil, err
	}
	headers, err := json.Marshal(input.Headers)
	if err != nil {
		return nil, err
	}
	var id int64
	if err := r.pool.QueryRow(ctx, `
INSERT INTO mcp_tools (name, description, transport_type, enabled, command, args, env_vars, url, headers,
                        timeout, sse_read_timeout, terminate_on_close, organization_id)
VALUES ($1,$2,$3::mcptransporttype,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
RETURNING id`, input.Name, input.Description, strings.ToUpper(input.TransportType), input.Enabled,
		input.Command, nullableJSON(args), nullableJSON(envVars), input.URL, nullableJSON(headers), input.Timeout,
		input.SSEReadTimeout, input.TerminateOnClose, input.OrganizationID).Scan(&id); err != nil {
		return nil, err
	}
	return r.Get(ctx, id)
}

func (r *Repository) List(ctx context.Context, organizationID uuid.UUID, enabledOnly bool) ([]Tool, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	query := toolProjection + `WHERE organization_id = $1`
	if enabledOnly {
		query += ` AND enabled = TRUE`
	}
	query += ` ORDER BY id`
	rows, err := r.pool.Query(ctx, query, organizationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]Tool, 0)
	for rows.Next() {
		item, err := scanTool(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, *item)
	}
	return result, rows.Err()
}

func (r *Repository) Get(ctx context.Context, id int64) (*Tool, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	item, err := scanTool(r.pool.QueryRow(ctx, toolProjection+`WHERE id = $1`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return item, err
}

func (r *Repository) Update(ctx context.Context, id int64, organizationID uuid.UUID, fields map[string]json.RawMessage) (*Tool, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	tool, err := r.Get(ctx, id)
	if errors.Is(err, ErrNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if tool.OrganizationID != organizationID {
		return nil, ErrForbidden
	}
	if raw, ok := fields["name"]; ok {
		var name string
		if err := json.Unmarshal(raw, &name); err != nil || strings.TrimSpace(name) == "" || len(name) > 255 {
			return nil, ErrInvalid
		}
		var exists bool
		if err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM mcp_tools WHERE name = $1 AND organization_id = $2 AND id <> $3)`, name, organizationID, id).Scan(&exists); err != nil {
			return nil, err
		}
		if exists {
			return nil, ErrConflict
		}
	}
	parts := make([]string, 0, len(fields))
	args := make([]any, 0, len(fields)+1)
	for key, raw := range fields {
		column := key
		var value any
		switch key {
		case "name", "description", "command", "url":
			if string(raw) == "null" {
				value = nil
			} else {
				var parsed string
				if err := json.Unmarshal(raw, &parsed); err != nil {
					return nil, ErrInvalid
				}
				value = parsed
			}
		case "enabled", "terminate_on_close":
			var parsed bool
			if err := json.Unmarshal(raw, &parsed); err != nil {
				return nil, ErrInvalid
			}
			value = parsed
		case "args":
			value = rawJSONOrNil(raw)
		case "env_vars", "headers":
			value = rawJSONOrNil(raw)
		case "timeout", "sse_read_timeout":
			if string(raw) == "null" {
				value = nil
			} else {
				var parsed int
				if err := json.Unmarshal(raw, &parsed); err != nil {
					return nil, ErrInvalid
				}
				max := 300
				if key == "sse_read_timeout" {
					max = 600
				}
				if parsed < 1 || parsed > max {
					return nil, ErrInvalid
				}
				value = parsed
			}
		default:
			continue
		}
		args = append(args, value)
		parts = append(parts, fmt.Sprintf("%s = $%d", column, len(args)))
	}
	if len(parts) == 0 {
		return tool, nil
	}
	args = append(args, id, organizationID)
	_, err = r.pool.Exec(ctx, "UPDATE mcp_tools SET "+strings.Join(parts, ", ")+", updated_at = NOW() WHERE id = $"+fmt.Sprint(len(args)-1)+" AND organization_id = $"+fmt.Sprint(len(args)), args...)
	if err != nil {
		return nil, err
	}
	return r.Get(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id int64, organizationID uuid.UUID) error {
	if err := r.ready(); err != nil {
		return err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var exists bool
	if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM mcp_tools WHERE id = $1 AND organization_id = $2)`, id, organizationID).Scan(&exists); err != nil {
		return err
	}
	if !exists {
		return ErrNotFound
	}
	if _, err := tx.Exec(ctx, `DELETE FROM mcp_tool_to_agent WHERE mcp_tool_id = $1`, id); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM mcp_tools WHERE id = $1 AND organization_id = $2`, id, organizationID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *Repository) AddToAgent(ctx context.Context, toolID int64, agentID, organizationID uuid.UUID) (*Association, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	var toolOrganization, agentOrganization uuid.UUID
	if err := r.pool.QueryRow(ctx, `SELECT organization_id FROM mcp_tools WHERE id = $1`, toolID).Scan(&toolOrganization); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if toolOrganization != organizationID {
		return nil, ErrForbidden
	}
	if err := r.pool.QueryRow(ctx, `SELECT organization_id FROM agents WHERE id = $1`, agentID).Scan(&agentOrganization); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if agentOrganization != organizationID {
		return nil, ErrForbidden
	}
	var association Association
	var createdAt pgtype.Timestamp
	err := r.pool.QueryRow(ctx, `SELECT id, mcp_tool_id, agent_id, created_at FROM mcp_tool_to_agent WHERE mcp_tool_id = $1 AND agent_id = $2`, toolID, agentID).Scan(&association.ID, &association.MCPToolID, &association.AgentID, &createdAt)
	if errors.Is(err, pgx.ErrNoRows) {
		err = r.pool.QueryRow(ctx, `INSERT INTO mcp_tool_to_agent (mcp_tool_id, agent_id) VALUES ($1,$2) RETURNING id, mcp_tool_id, agent_id, created_at`, toolID, agentID).Scan(&association.ID, &association.MCPToolID, &association.AgentID, &createdAt)
	}
	if err != nil {
		return nil, err
	}
	association.CreatedAt = timestampPointer(createdAt)
	association.MCPTool, err = r.Get(ctx, toolID)
	return &association, err
}

func (r *Repository) RemoveFromAgent(ctx context.Context, toolID int64, agentID, organizationID uuid.UUID) error {
	if err := r.ready(); err != nil {
		return err
	}
	var toolOrganization uuid.UUID
	if err := r.pool.QueryRow(ctx, `SELECT organization_id FROM mcp_tools WHERE id = $1`, toolID).Scan(&toolOrganization); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}
	if toolOrganization != organizationID {
		return ErrForbidden
	}
	result, err := r.pool.Exec(ctx, `DELETE FROM mcp_tool_to_agent WHERE mcp_tool_id = $1 AND agent_id = $2`, toolID, agentID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrAssociation
	}
	return nil
}

func (r *Repository) AgentTools(ctx context.Context, agentID, organizationID uuid.UUID) (*AgentTools, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	var result AgentTools
	if err := r.pool.QueryRow(ctx, `SELECT id, name FROM agents WHERE id = $1 AND organization_id = $2`, agentID, organizationID).Scan(&result.ID, &result.Name); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	rows, err := r.pool.Query(ctx, toolProjection+`t JOIN mcp_tool_to_agent link ON link.mcp_tool_id = t.id WHERE link.agent_id = $1 AND t.enabled = TRUE ORDER BY t.id`, agentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result.MCPTools = make([]Tool, 0)
	for rows.Next() {
		item, err := scanTool(rows)
		if err != nil {
			return nil, err
		}
		result.MCPTools = append(result.MCPTools, *item)
	}
	return &result, rows.Err()
}

func (r *Repository) Test(ctx context.Context, id int64, organizationID uuid.UUID) TestResult {
	tool, err := r.Get(ctx, id)
	if err != nil {
		return failedResult(err.Error())
	}
	if tool.OrganizationID != organizationID {
		return failedResult(ErrForbidden.Error())
	}
	deadline := 30 * time.Second
	if tool.Timeout != nil && *tool.Timeout > 0 {
		deadline = time.Duration(*tool.Timeout) * time.Second
	}
	testCtx, cancel := context.WithTimeout(ctx, deadline)
	defer cancel()
	switch strings.ToLower(tool.TransportType) {
	case "stdio":
		return testSTDIO(testCtx, tool)
	case "sse", "http":
		return testHTTP(testCtx, tool)
	default:
		return failedResult("unsupported transport type")
	}
}

func testHTTP(ctx context.Context, tool *Tool) TestResult {
	if tool.URL == nil || strings.TrimSpace(*tool.URL) == "" {
		return failedResult("URL is required")
	}
	requestBody, _ := json.Marshal(map[string]any{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": map[string]any{}})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, *tool.URL, bytes.NewReader(requestBody))
	if err != nil {
		return failedResult(err.Error())
	}
	req.Header.Set("Content-Type", "application/json")
	for key, value := range tool.Headers {
		req.Header.Set(key, value)
	}
	response, err := (&http.Client{}).Do(req)
	if err != nil {
		return failedResult(err.Error())
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return failedResult(fmt.Sprintf("MCP server returned HTTP %d", response.StatusCode))
	}
	var payload any
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return failedResult(err.Error())
	}
	return resultFromRPC(payload)
}

func testSTDIO(ctx context.Context, tool *Tool) TestResult {
	if tool.Command == nil || strings.TrimSpace(*tool.Command) == "" {
		return failedResult("command is required")
	}
	command := exec.CommandContext(ctx, *tool.Command, tool.Args...)
	command.Env = os.Environ()
	for key, value := range tool.EnvVars {
		command.Env = append(command.Env, key+"="+value)
	}
	stdin, err := command.StdinPipe()
	if err != nil {
		return failedResult(err.Error())
	}
	stdout, err := command.StdoutPipe()
	if err != nil {
		return failedResult(err.Error())
	}
	var stderr bytes.Buffer
	command.Stderr = &stderr
	if err := command.Start(); err != nil {
		return failedResult(err.Error())
	}
	defer command.Process.Kill()
	for _, message := range []map[string]any{
		{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": map[string]any{"protocolVersion": "2024-11-05", "capabilities": map[string]any{}, "clientInfo": map[string]string{"name": "chattermate-go", "version": "1"}}},
		{"jsonrpc": "2.0", "method": "notifications/initialized", "params": map[string]any{}},
		{"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": map[string]any{}},
	} {
		data, _ := json.Marshal(message)
		if _, err := stdin.Write(append(data, '\n')); err != nil {
			return failedResult(err.Error())
		}
	}
	_ = stdin.Close()
	scanner := bufio.NewScanner(stdout)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		var payload any
		if json.Unmarshal([]byte(line), &payload) != nil {
			continue
		}
		result := resultFromRPC(payload)
		if result.Success || result.Error != nil {
			return result
		}
	}
	if err := scanner.Err(); err != nil {
		return failedResult(err.Error())
	}
	if stderr.Len() > 0 {
		return failedResult(strings.TrimSpace(stderr.String()))
	}
	return failedResult("MCP server did not return a tools/list response")
}

func resultFromRPC(payload any) TestResult {
	root, ok := payload.(map[string]any)
	if !ok {
		return failedResult("invalid MCP response")
	}
	if errValue, ok := root["error"].(map[string]any); ok {
		message, _ := errValue["message"].(string)
		return failedResult(message)
	}
	result, _ := root["result"].(map[string]any)
	tools, _ := result["tools"].([]any)
	functions := make([]string, 0, len(tools))
	for _, value := range tools {
		if tool, ok := value.(map[string]any); ok {
			if name, ok := tool["name"].(string); ok {
				functions = append(functions, name)
			}
		}
	}
	return TestResult{Success: true, Functions: functions}
}

func failedResult(message string) TestResult {
	message = strings.TrimSpace(message)
	return TestResult{Success: false, Functions: []string{}, Error: &message}
}

type rowScanner interface{ Scan(dest ...any) error }

func scanTool(row rowScanner) (*Tool, error) {
	var (
		item                           Tool
		description, command, url      pgtype.Text
		transportType                  string
		argsJSON, envJSON, headersJSON []byte
		timeout, sseTimeout            pgtype.Int4
		terminate                      pgtype.Bool
		createdAt, updatedAt           pgtype.Timestamp
	)
	if err := row.Scan(&item.ID, &item.Name, &description, &transportType, &item.Enabled, &command, &argsJSON, &envJSON, &url, &headersJSON, &timeout, &sseTimeout, &terminate, &item.OrganizationID, &createdAt, &updatedAt); err != nil {
		return nil, err
	}
	item.Description = textPointer(description)
	item.TransportType = strings.ToLower(transportType)
	item.Command = textPointer(command)
	item.URL = textPointer(url)
	if timeout.Valid {
		value := int(timeout.Int32)
		item.Timeout = &value
	}
	if sseTimeout.Valid {
		value := int(sseTimeout.Int32)
		item.SSEReadTimeout = &value
	}
	if terminate.Valid {
		value := terminate.Bool
		item.TerminateOnClose = &value
	}
	item.Args = stringSlice(argsJSON)
	item.EnvVars = stringMap(envJSON)
	item.Headers = stringMap(headersJSON)
	item.CreatedAt = timestampPointer(createdAt)
	item.UpdatedAt = timestampPointer(updatedAt)
	return &item, nil
}

func validateCreate(input CreateInput) error {
	input.Name = strings.TrimSpace(input.Name)
	if len(input.Name) < 1 || len(input.Name) > 255 {
		return ErrInvalid
	}
	switch strings.ToLower(input.TransportType) {
	case "stdio":
		if input.Command == nil || strings.TrimSpace(*input.Command) == "" {
			return ErrInvalid
		}
	case "sse", "http":
		if input.URL == nil || strings.TrimSpace(*input.URL) == "" {
			return ErrInvalid
		}
	default:
		return ErrInvalid
	}
	if input.Timeout != nil && (*input.Timeout < 1 || *input.Timeout > 300) {
		return ErrInvalid
	}
	if input.SSEReadTimeout != nil && (*input.SSEReadTimeout < 1 || *input.SSEReadTimeout > 600) {
		return ErrInvalid
	}
	return nil
}

func nullableJSON(value []byte) any {
	if len(value) == 0 || bytes.Equal(value, []byte("null")) {
		return nil
	}
	return string(value)
}

func rawJSONOrNil(value json.RawMessage) any {
	if string(value) == "null" {
		return nil
	}
	if !json.Valid(value) {
		return nil
	}
	return string(value)
}

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

func stringSlice(raw []byte) []string {
	if len(raw) == 0 {
		return nil
	}
	var value []string
	_ = json.Unmarshal(raw, &value)
	return value
}

func stringMap(raw []byte) map[string]string {
	if len(raw) == 0 {
		return nil
	}
	var value map[string]string
	_ = json.Unmarshal(raw, &value)
	return value
}
