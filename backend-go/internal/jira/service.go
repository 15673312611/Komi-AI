package jira

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/chattermate/chattermate/backend-go/internal/config"
)

var (
	ErrNotConfigured = errors.New("Jira storage is not configured")
	ErrNotFound      = errors.New("Jira connection not found")
	ErrAuth          = errors.New("Jira authentication failed")
	ErrRemote        = errors.New("Jira request failed")
)

type Token struct {
	ID             int64
	OrganizationID uuid.UUID
	AccessToken    string
	RefreshToken   string
	TokenType      string
	ExpiresAt      time.Time
	CloudID        string
	SiteURL        string
}

type AgentConfig struct {
	Enabled     bool    `json:"enabled"`
	ProjectKey  *string `json:"projectKey"`
	IssueTypeID *string `json:"issueTypeId"`
}

type Project struct {
	ID   string `json:"id"`
	Key  string `json:"key"`
	Name string `json:"name"`
}
type IssueType struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	IconURL     string `json:"iconUrl,omitempty"`
}
type Priority struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	IconURL     string `json:"iconUrl,omitempty"`
}
type IssueInput struct {
	ProjectKey  string  `json:"projectKey"`
	IssueTypeID string  `json:"issueTypeId"`
	Summary     string  `json:"summary"`
	Description string  `json:"description"`
	Priority    *string `json:"priority"`
	ChatID      *string `json:"chatId"`
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
		return ErrNotConfigured
	}
	return nil
}

func (r *Repository) GetToken(ctx context.Context, org uuid.UUID) (*Token, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	var token Token
	err := r.pool.QueryRow(ctx, `SELECT id,organization_id,access_token,refresh_token,token_type,expires_at,cloud_id,site_url FROM jira_tokens WHERE organization_id=$1 ORDER BY id LIMIT 1`, org).Scan(&token.ID, &token.OrganizationID, &token.AccessToken, &token.RefreshToken, &token.TokenType, &token.ExpiresAt, &token.CloudID, &token.SiteURL)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &token, nil
}

func (r *Repository) UpsertToken(ctx context.Context, token Token) (*Token, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	current, err := r.GetToken(ctx, token.OrganizationID)
	if err != nil && !errors.Is(err, ErrNotFound) {
		return nil, err
	}
	if current == nil {
		_, err = r.pool.Exec(ctx, `INSERT INTO jira_tokens (organization_id,access_token,refresh_token,token_type,expires_at,cloud_id,site_url,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())`, token.OrganizationID, token.AccessToken, token.RefreshToken, token.TokenType, token.ExpiresAt, token.CloudID, token.SiteURL)
	} else {
		_, err = r.pool.Exec(ctx, `UPDATE jira_tokens SET access_token=$2,refresh_token=$3,token_type=$4,expires_at=$5,cloud_id=$6,site_url=$7,updated_at=NOW() WHERE organization_id=$1`, token.OrganizationID, token.AccessToken, token.RefreshToken, token.TokenType, token.ExpiresAt, token.CloudID, token.SiteURL)
	}
	if err != nil {
		return nil, err
	}
	return r.GetToken(ctx, token.OrganizationID)
}

func (r *Repository) Delete(ctx context.Context, org uuid.UUID) error {
	if err := r.ready(); err != nil {
		return err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `DELETE FROM agent_jira_configs WHERE agent_id IN (SELECT id::text FROM agents WHERE organization_id=$1)`, org); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM jira_tokens WHERE organization_id=$1`, org); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *Repository) GetAgentConfig(ctx context.Context, agentID uuid.UUID) (*AgentConfig, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	var result AgentConfig
	var project, issue pgtype.Text
	err := r.pool.QueryRow(ctx, `SELECT enabled,project_key,issue_type_id FROM agent_jira_configs WHERE agent_id=$1 ORDER BY id LIMIT 1`, agentID.String()).Scan(&result.Enabled, &project, &issue)
	if errors.Is(err, pgx.ErrNoRows) {
		return &AgentConfig{}, nil
	}
	if err != nil {
		return nil, err
	}
	if project.Valid {
		result.ProjectKey = &project.String
	}
	if issue.Valid {
		result.IssueTypeID = &issue.String
	}
	return &result, nil
}

func (r *Repository) UpsertAgentConfig(ctx context.Context, agentID uuid.UUID, input AgentConfig) error {
	if err := r.ready(); err != nil {
		return err
	}
	_, err := r.pool.Exec(ctx, `INSERT INTO agent_jira_configs (agent_id,enabled,project_key,issue_type_id) VALUES ($1,$2,$3,$4)`, agentID.String(), input.Enabled, input.ProjectKey, input.IssueTypeID)
	if err == nil {
		return nil
	}
	_, updateErr := r.pool.Exec(ctx, `UPDATE agent_jira_configs SET enabled=$2,project_key=$3,issue_type_id=$4,updated_at=NOW() WHERE agent_id=$1`, agentID.String(), input.Enabled, input.ProjectKey, input.IssueTypeID)
	if updateErr != nil {
		return err
	}
	return nil
}

type Service struct {
	Repo       *Repository
	Config     config.Config
	HTTPClient *http.Client
	stateMu    sync.Mutex
	states     map[string]uuid.UUID
}

func NewService(repo *Repository, cfg config.Config) *Service {
	return &Service{Repo: repo, Config: cfg, HTTPClient: &http.Client{Timeout: 20 * time.Second}, states: make(map[string]uuid.UUID)}
}

func (s *Service) AuthorizationURL(state string) string {
	redirect := s.Config.JiraRedirectURI
	if redirect == "" {
		redirect = strings.TrimRight(s.Config.BackendURL, "/") + s.Config.APIBasePath + "/jira/callback"
	}
	values := url.Values{"audience": {"api.atlassian.com"}, "client_id": {s.Config.JiraClientID}, "scope": {"read:jira-work write:jira-work read:jira-user offline_access"}, "redirect_uri": {redirect}, "state": {state}, "response_type": {"code"}, "prompt": {"consent"}}
	return "https://auth.atlassian.com/authorize?" + values.Encode()
}

func (s *Service) PutState(state string, org uuid.UUID) {
	s.stateMu.Lock()
	defer s.stateMu.Unlock()
	s.states[state] = org
}
func (s *Service) PopState(state string) (uuid.UUID, bool) {
	s.stateMu.Lock()
	defer s.stateMu.Unlock()
	value, ok := s.states[state]
	if ok {
		delete(s.states, state)
	}
	return value, ok
}

func (s *Service) ExchangeCode(ctx context.Context, code string) (*Token, error) {
	redirect := s.Config.JiraRedirectURI
	if redirect == "" {
		redirect = strings.TrimRight(s.Config.BackendURL, "/") + s.Config.APIBasePath + "/jira/callback"
	}
	body, status, err := s.form(ctx, "https://auth.atlassian.com/oauth/token", url.Values{"grant_type": {"authorization_code"}, "client_id": {s.Config.JiraClientID}, "client_secret": {s.Config.JiraClientSecret}, "code": {code}, "redirect_uri": {redirect}})
	if err != nil || status != http.StatusOK {
		return nil, ErrAuth
	}
	access := stringValue(body["access_token"])
	refresh := stringValue(body["refresh_token"])
	if access == "" || refresh == "" {
		return nil, ErrAuth
	}
	expires := time.Now().UTC().Add(time.Duration(numberValue(body["expires_in"], 3600)) * time.Second)
	resources, err := s.request(ctx, http.MethodGet, "https://api.atlassian.com/oauth/token/accessible-resources", access, nil)
	if err != nil || len(resources) == 0 {
		return nil, ErrAuth
	}
	first, _ := resources[0].(map[string]any)
	return &Token{AccessToken: access, RefreshToken: refresh, TokenType: firstNonEmpty(stringValue(body["token_type"]), "Bearer"), ExpiresAt: expires, CloudID: stringValue(first["id"]), SiteURL: stringValue(first["url"])}, nil
}

func (s *Service) Refresh(ctx context.Context, token *Token) (*Token, error) {
	body, status, err := s.form(ctx, "https://auth.atlassian.com/oauth/token", url.Values{"grant_type": {"refresh_token"}, "client_id": {s.Config.JiraClientID}, "client_secret": {s.Config.JiraClientSecret}, "refresh_token": {token.RefreshToken}})
	if err != nil || status != http.StatusOK {
		return nil, ErrAuth
	}
	result := &Token{OrganizationID: token.OrganizationID, AccessToken: stringValue(body["access_token"]), RefreshToken: firstNonEmpty(stringValue(body["refresh_token"]), token.RefreshToken), TokenType: firstNonEmpty(stringValue(body["token_type"]), token.TokenType), ExpiresAt: time.Now().UTC().Add(time.Duration(numberValue(body["expires_in"], 3600)) * time.Second), CloudID: token.CloudID, SiteURL: token.SiteURL}
	if result.AccessToken == "" {
		return nil, ErrAuth
	}
	return result, nil
}

func (s *Service) EnsureToken(ctx context.Context, token *Token) (*Token, error) {
	if token == nil {
		return nil, ErrNotFound
	}
	if token.ExpiresAt.After(time.Now().UTC().Add(5 * time.Minute)) {
		return token, nil
	}
	refreshed, err := s.Refresh(ctx, token)
	if err != nil {
		return nil, err
	}
	refreshed.OrganizationID = token.OrganizationID
	if s.Repo != nil {
		if _, saveErr := s.Repo.UpsertToken(ctx, *refreshed); saveErr != nil {
			return nil, saveErr
		}
	}
	return refreshed, nil
}

func (s *Service) Projects(ctx context.Context, token *Token) ([]Project, error) {
	data, err := s.api(ctx, token, http.MethodGet, fmt.Sprintf("https://api.atlassian.com/ex/jira/%s/rest/api/3/project", token.CloudID), nil)
	if err != nil {
		return nil, err
	}
	result := make([]Project, 0)
	for _, raw := range data {
		if item, ok := raw.(map[string]any); ok {
			result = append(result, Project{ID: stringValue(item["id"]), Key: stringValue(item["key"]), Name: stringValue(item["name"])})
		}
	}
	return result, nil
}

func (s *Service) IssueTypes(ctx context.Context, token *Token, projectKey string) ([]IssueType, error) {
	data, err := s.apiObject(ctx, token, http.MethodGet, fmt.Sprintf("https://api.atlassian.com/ex/jira/%s/rest/api/3/project/%s", token.CloudID, url.PathEscape(projectKey)))
	if err != nil {
		return nil, err
	}
	result := make([]IssueType, 0)
	for _, raw := range objects(data["issueTypes"]) {
		if boolValue(raw["subtask"]) {
			continue
		}
		result = append(result, IssueType{ID: stringValue(raw["id"]), Name: stringValue(raw["name"]), Description: stringValue(raw["description"]), IconURL: stringValue(raw["iconUrl"])})
	}
	return result, nil
}

func (s *Service) Priorities(ctx context.Context, token *Token) ([]Priority, error) {
	data, err := s.api(ctx, token, http.MethodGet, fmt.Sprintf("https://api.atlassian.com/ex/jira/%s/rest/api/3/priority", token.CloudID), nil)
	if err != nil {
		return nil, err
	}
	result := make([]Priority, 0)
	for _, raw := range data {
		if item, ok := raw.(map[string]any); ok {
			result = append(result, Priority{ID: stringValue(item["id"]), Name: stringValue(item["name"]), Description: stringValue(item["description"]), IconURL: stringValue(item["iconUrl"])})
		}
	}
	return result, nil
}

func (s *Service) HasPriority(ctx context.Context, token *Token, projectKey, issueTypeID string) (bool, error) {
	endpoint := fmt.Sprintf("https://api.atlassian.com/ex/jira/%s/rest/api/3/issue/createmeta?projectKeys=%s&issuetypeIds=%s&expand=projects.issuetypes.fields", token.CloudID, url.QueryEscape(projectKey), url.QueryEscape(issueTypeID))
	data, err := s.apiObject(ctx, token, http.MethodGet, endpoint)
	if err != nil {
		return false, err
	}
	projects := objects(data["projects"])
	if len(projects) == 0 {
		return false, nil
	}
	types := objects(projects[0]["issuetypes"])
	if len(types) == 0 {
		return false, nil
	}
	_, ok := object(types[0], "fields")["priority"]
	return ok, nil
}

func (s *Service) CreateIssue(ctx context.Context, token *Token, input IssueInput) (map[string]any, error) {
	fields := map[string]any{"project": map[string]any{"key": input.ProjectKey}, "issuetype": map[string]any{"id": input.IssueTypeID}, "summary": input.Summary, "description": map[string]any{"type": "doc", "version": 1, "content": []any{map[string]any{"type": "paragraph", "content": []any{map[string]any{"type": "text", "text": input.Description}}}}}}
	if input.Priority != nil && strings.TrimSpace(*input.Priority) != "" {
		if available, err := s.HasPriority(ctx, token, input.ProjectKey, input.IssueTypeID); err == nil && available {
			fields["priority"] = map[string]any{"id": *input.Priority}
		}
	}
	return s.apiObject(ctx, token, http.MethodPost, fmt.Sprintf("https://api.atlassian.com/ex/jira/%s/rest/api/3/issue", token.CloudID), map[string]any{"fields": fields})
}

func (s *Service) GetIssue(ctx context.Context, token *Token, issueKey string) (map[string]any, error) {
	issueKey = strings.TrimSpace(issueKey)
	if issueKey == "" {
		return nil, ErrNotFound
	}
	return s.apiObject(ctx, token, http.MethodGet, fmt.Sprintf("https://api.atlassian.com/ex/jira/%s/rest/api/3/issue/%s", token.CloudID, url.PathEscape(issueKey)))
}

// UpdateIssue appends/replaces the fields that the AI ticket tool owns. Jira
// accepts a 204 response for a successful update, so this method deliberately
// treats an empty response as success instead of trying to decode it as JSON.
func (s *Service) UpdateIssue(ctx context.Context, token *Token, issueKey string, input IssueInput) error {
	fields := map[string]any{}
	if strings.TrimSpace(input.Summary) != "" {
		fields["summary"] = input.Summary
	}
	if strings.TrimSpace(input.Description) != "" {
		fields["description"] = jiraDescription(input.Description)
	}
	if input.Priority != nil && strings.TrimSpace(*input.Priority) != "" && input.ProjectKey != "" && input.IssueTypeID != "" {
		if available, err := s.HasPriority(ctx, token, input.ProjectKey, input.IssueTypeID); err == nil && available {
			fields["priority"] = map[string]any{"id": *input.Priority}
		}
	}
	if len(fields) == 0 {
		return nil
	}
	_, err := s.rawRequest(ctx, http.MethodPut, fmt.Sprintf("https://api.atlassian.com/ex/jira/%s/rest/api/3/issue/%s", token.CloudID, url.PathEscape(issueKey)), token.AccessToken, map[string]any{"fields": fields})
	return err
}

func (s *Service) Test(ctx context.Context, token *Token) (map[string]any, error) {
	_, err := s.apiObject(ctx, token, http.MethodGet, fmt.Sprintf("https://api.atlassian.com/ex/jira/%s/rest/api/3/myself", token.CloudID))
	if err != nil {
		return map[string]any{"connected": false}, nil
	}
	return map[string]any{"connected": true, "site_url": token.SiteURL}, nil
}

func (s *Service) request(ctx context.Context, method, endpoint, access string, body any) ([]any, error) {
	data, err := s.rawRequest(ctx, method, endpoint, access, body)
	if err != nil {
		return nil, err
	}
	var values []any
	if err := json.Unmarshal(data, &values); err != nil {
		return nil, err
	}
	return values, nil
}
func (s *Service) api(ctx context.Context, token *Token, method, endpoint string, body any) ([]any, error) {
	return s.request(ctx, method, endpoint, token.AccessToken, body)
}
func (s *Service) apiObject(ctx context.Context, token *Token, method, endpoint string, body ...any) (map[string]any, error) {
	var payload any
	if len(body) > 0 {
		payload = body[0]
	}
	data, err := s.rawRequest(ctx, method, endpoint, token.AccessToken, payload)
	if err != nil {
		return nil, err
	}
	var value map[string]any
	if err := json.Unmarshal(data, &value); err != nil {
		return nil, err
	}
	return value, nil
}
func (s *Service) rawRequest(ctx context.Context, method, endpoint, access string, body any) ([]byte, error) {
	var reader io.Reader
	if body != nil {
		encoded, _ := json.Marshal(body)
		reader = bytes.NewReader(encoded)
	}
	req, err := http.NewRequestWithContext(ctx, method, endpoint, reader)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+access)
	req.Header.Set("Accept", "application/json")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := s.client().Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return data, fmt.Errorf("Jira API HTTP %d", resp.StatusCode)
	}
	return data, nil
}

func jiraDescription(value string) map[string]any {
	return map[string]any{"type": "doc", "version": 1, "content": []any{map[string]any{"type": "paragraph", "content": []any{map[string]any{"type": "text", "text": value}}}}}
}
func (s *Service) form(ctx context.Context, endpoint string, values url.Values) (map[string]any, int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(values.Encode()))
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := s.client().Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
	var value map[string]any
	_ = json.Unmarshal(data, &value)
	return value, resp.StatusCode, nil
}
func (s *Service) client() *http.Client {
	if s.HTTPClient != nil {
		return s.HTTPClient
	}
	return http.DefaultClient
}
func stringValue(value any) string {
	switch v := value.(type) {
	case string:
		return v
	case fmt.Stringer:
		return v.String()
	case float64:
		return strconv.FormatFloat(v, 'f', -1, 64)
	default:
		return ""
	}
}
func numberValue(value any, fallback float64) float64 {
	if v, ok := value.(float64); ok {
		return v
	}
	return fallback
}
func boolValue(value any) bool { v, _ := value.(bool); return v }
func object(value any, key string) map[string]any {
	if m, ok := value.(map[string]any); ok {
		if v, ok := m[key].(map[string]any); ok {
			return v
		}
	}
	return map[string]any{}
}
func objects(value any) []map[string]any {
	items, ok := value.([]any)
	if !ok {
		return nil
	}
	result := make([]map[string]any, 0, len(items))
	for _, item := range items {
		if m, ok := item.(map[string]any); ok {
			result = append(result, m)
		}
	}
	return result
}
func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}

var _ = pgtype.Text{}
var _ = uuid.Nil
