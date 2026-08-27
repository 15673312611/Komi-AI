package aiconfig

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

	"github.com/chattermate/chattermate/backend-go/internal/encryption"
)

var (
	ErrNotFound = errors.New("no active AI configuration found")
	ErrInvalid  = errors.New("invalid AI configuration")
)

type Config struct {
	ID             int64          `json:"id"`
	OrganizationID uuid.UUID      `json:"organization_id"`
	ModelType      string         `json:"model_type"`
	ModelName      string         `json:"model_name"`
	IsActive       bool           `json:"is_active"`
	Settings       map[string]any `json:"settings"`
}

type CreateInput struct {
	OrganizationID uuid.UUID
	ModelType      string
	ModelName      string
	APIKey         string
}

type UpdateInput struct {
	ModelType *string
	ModelName *string
	APIKey    *string
	Settings  map[string]any
}

type Model struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

type Provider struct {
	Value          string  `json:"value"`
	Label          string  `json:"label"`
	RequiresAPIKey bool    `json:"requires_api_key"`
	CustomAllowed  bool    `json:"custom_allowed"`
	APIKeyURL      string  `json:"api_key_url"`
	Models         []Model `json:"models"`
}

type Store interface {
	Create(ctx context.Context, input CreateInput) (*Config, error)
	GetActive(ctx context.Context, organizationID uuid.UUID) (*Config, error)
	Update(ctx context.Context, id int64, organizationID uuid.UUID, input UpdateInput) (*Config, error)
}

// CredentialStore is the internal extension used by server-side AI features.
// API keys must never be included in the public Config response, but the
// copilot and instruction-generation handlers still need the decrypted key to
// call the configured provider.
type CredentialStore interface {
	Store
	GetActiveAPIKey(ctx context.Context, organizationID uuid.UUID) (*Config, string, error)
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

var defaultSettings = map[string]any{
	"instructions": []any{"You are a helpful customer service agent.", "Be concise and professional.", "If you don't know something, say so.", "Always maintain a friendly tone."},
	"tools":        []any{"web_search"},
	"memory":       true,
	"markdown":     true,
}

func (r *Repository) Create(ctx context.Context, input CreateInput) (*Config, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	if err := ValidateModelSelection(input.ModelType, input.ModelName); err != nil {
		return nil, err
	}
	encrypted, err := encryption.Encrypt(input.APIKey)
	if err != nil {
		return nil, err
	}
	settings, err := json.Marshal(defaultSettings)
	if err != nil {
		return nil, err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `UPDATE ai_configs SET is_active = FALSE WHERE organization_id = $1 AND is_active = TRUE`, input.OrganizationID); err != nil {
		return nil, err
	}
	var id int64
	if err := tx.QueryRow(ctx, `
INSERT INTO ai_configs (organization_id, model_type, model_name, encrypted_api_key, settings, is_active)
VALUES ($1,$2::aimodeltype,$3,$4,$5,TRUE) RETURNING id`, input.OrganizationID, strings.ToUpper(input.ModelType), input.ModelName, encrypted, string(settings)).Scan(&id); err != nil {
		return nil, err
	}
	result, err := scanConfig(tx.QueryRow(ctx, `SELECT id, organization_id, model_type::text, model_name, is_active, settings FROM ai_configs WHERE id = $1`, id))
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return result, nil
}

func (r *Repository) GetActive(ctx context.Context, organizationID uuid.UUID) (*Config, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	result, err := scanConfig(r.pool.QueryRow(ctx, `
SELECT id, organization_id, model_type::text, model_name, is_active, settings
FROM ai_configs WHERE organization_id = $1 AND is_active = TRUE ORDER BY id DESC LIMIT 1`, organizationID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return result, err
}

func (r *Repository) GetActiveAPIKey(ctx context.Context, organizationID uuid.UUID) (*Config, string, error) {
	if err := r.ready(); err != nil {
		return nil, "", err
	}
	var (
		result      Config
		modelType   string
		encrypted   string
		settingsRaw []byte
		active      bool
	)
	err := r.pool.QueryRow(ctx, `
SELECT id, organization_id, model_type::text, model_name, encrypted_api_key,
       is_active, settings
FROM ai_configs
WHERE organization_id=$1 AND is_active=TRUE
ORDER BY id DESC LIMIT 1`, organizationID).Scan(
		&result.ID, &result.OrganizationID, &modelType, &result.ModelName,
		&encrypted, &active, &settingsRaw,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, "", ErrNotFound
	}
	if err != nil {
		return nil, "", err
	}
	result.ModelType = strings.ToUpper(modelType)
	result.IsActive = active
	result.Settings = map[string]any{}
	if len(settingsRaw) > 0 {
		_ = json.Unmarshal(settingsRaw, &result.Settings)
	}
	apiKey, err := encryption.Decrypt(encrypted)
	if err != nil {
		return nil, "", fmt.Errorf("decrypt AI API key: %w", err)
	}
	return &result, apiKey, nil
}

func (r *Repository) Update(ctx context.Context, id int64, organizationID uuid.UUID, input UpdateInput) (*Config, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	if _, err := r.GetActiveByID(ctx, id, organizationID); err != nil {
		return nil, err
	}
	parts := make([]string, 0, 4)
	args := make([]any, 0, 5)
	if input.ModelType != nil {
		if err := ValidateModelSelection(*input.ModelType, valueOrEmpty(input.ModelName)); err != nil {
			return nil, err
		}
		args = append(args, strings.ToUpper(*input.ModelType))
		parts = append(parts, fmt.Sprintf("model_type = $%d::aimodeltype", len(args)))
	}
	if input.ModelName != nil {
		if strings.TrimSpace(*input.ModelName) == "" {
			return nil, ErrInvalid
		}
		args = append(args, *input.ModelName)
		parts = append(parts, fmt.Sprintf("model_name = $%d", len(args)))
	}
	if input.APIKey != nil {
		encrypted, err := encryption.Encrypt(*input.APIKey)
		if err != nil {
			return nil, err
		}
		args = append(args, encrypted)
		parts = append(parts, fmt.Sprintf("encrypted_api_key = $%d", len(args)))
	}
	if input.Settings != nil {
		settings, err := json.Marshal(input.Settings)
		if err != nil {
			return nil, err
		}
		args = append(args, string(settings))
		parts = append(parts, fmt.Sprintf("settings = $%d", len(args)))
	}
	if len(parts) > 0 {
		args = append(args, id, organizationID)
		if _, err := r.pool.Exec(ctx, "UPDATE ai_configs SET "+strings.Join(parts, ", ")+", updated_at = NOW() WHERE id = $"+fmt.Sprint(len(args)-1)+" AND organization_id = $"+fmt.Sprint(len(args)), args...); err != nil {
			return nil, err
		}
	}
	return r.GetActiveByID(ctx, id, organizationID)
}

func (r *Repository) GetActiveByID(ctx context.Context, id int64, organizationID uuid.UUID) (*Config, error) {
	result, err := scanConfig(r.pool.QueryRow(ctx, `SELECT id, organization_id, model_type::text, model_name, is_active, settings FROM ai_configs WHERE id = $1 AND organization_id = $2 AND is_active = TRUE`, id, organizationID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return result, err
}

func ValidateModelSelection(modelType, modelName string) error {
	modelType = strings.ToUpper(strings.TrimSpace(modelType))
	if modelType == "CHATTERMATE" && strings.EqualFold(strings.TrimSpace(modelName), "chattermate") {
		return nil
	}
	if !IsKnownProvider(modelType) {
		return ErrInvalid
	}
	if strings.TrimSpace(modelName) == "" {
		return ErrInvalid
	}
	return nil
}

func IsKnownProvider(value string) bool {
	value = strings.ToUpper(strings.TrimSpace(value))
	for _, provider := range Providers() {
		if provider.Value == value {
			return true
		}
	}
	return false
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func Providers() []Provider {
	return []Provider{
		{Value: "OPENAI", Label: "OpenAI", RequiresAPIKey: true, CustomAllowed: true, APIKeyURL: "https://platform.openai.com/api-keys", Models: []Model{{"gpt-4.1", "GPT-4.1"}, {"gpt-4o", "GPT-4o"}, {"gpt-4.1-mini", "GPT-4.1 Mini"}, {"gpt-4o-mini", "GPT-4o Mini"}, {"o4-mini", "o4-mini"}}},
		{Value: "ANTHROPIC", Label: "Anthropic (Claude)", RequiresAPIKey: true, CustomAllowed: true, APIKeyURL: "https://console.anthropic.com/settings/keys", Models: []Model{{"claude-opus-4-8", "Claude Opus 4.8"}, {"claude-sonnet-5", "Claude Sonnet 5"}, {"claude-sonnet-4-6", "Claude Sonnet 4.6"}, {"claude-haiku-4-5", "Claude Haiku 4.5"}}},
		{Value: "GOOGLE", Label: "Google Gemini", RequiresAPIKey: true, CustomAllowed: true, APIKeyURL: "https://aistudio.google.com/app/apikey", Models: []Model{{"gemini-2.5-pro", "Gemini 2.5 Pro"}, {"gemini-2.5-flash", "Gemini 2.5 Flash"}, {"gemini-2.5-flash-lite", "Gemini 2.5 Flash-Lite"}, {"gemini-3.5-flash", "Gemini 3.5 Flash"}}},
		{Value: "MISTRAL", Label: "Mistral", RequiresAPIKey: true, CustomAllowed: true, APIKeyURL: "https://console.mistral.ai/api-keys", Models: []Model{{"mistral-large-latest", "Mistral Large"}, {"mistral-medium-latest", "Mistral Medium"}, {"mistral-small-latest", "Mistral Small"}}},
		{Value: "XAI", Label: "xAI (Grok)", RequiresAPIKey: true, CustomAllowed: true, APIKeyURL: "https://console.x.ai", Models: []Model{{"grok-4", "Grok 4"}, {"grok-4-fast-reasoning", "Grok 4 Fast (Reasoning)"}, {"grok-4-fast-non-reasoning", "Grok 4 Fast (Non-Reasoning)"}, {"grok-3", "Grok 3"}}},
		{Value: "DEEPSEEK", Label: "DeepSeek", RequiresAPIKey: true, CustomAllowed: true, APIKeyURL: "https://platform.deepseek.com/api_keys", Models: []Model{{"deepseek-chat", "DeepSeek Chat (V3)"}, {"deepseek-reasoner", "DeepSeek Reasoner"}}},
		{Value: "GROQ", Label: "Groq", RequiresAPIKey: true, CustomAllowed: true, APIKeyURL: "https://console.groq.com/keys", Models: []Model{{"openai/gpt-oss-120b", "GPT-OSS 120B"}, {"llama-3.3-70b-versatile", "Llama 3.3 70B Versatile"}}},
	}
}

type rowScanner interface{ Scan(dest ...any) error }

func scanConfig(row rowScanner) (*Config, error) {
	var result Config
	var modelType string
	var settings []byte
	var active pgtype.Bool
	if err := row.Scan(&result.ID, &result.OrganizationID, &modelType, &result.ModelName, &active, &settings); err != nil {
		return nil, err
	}
	result.ModelType = strings.ToUpper(modelType)
	result.IsActive = active.Valid && active.Bool
	result.Settings = map[string]any{}
	if len(settings) > 0 {
		_ = json.Unmarshal(settings, &result.Settings)
	}
	return &result, nil
}
