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
	HasAPIKey      bool           `json:"has_api_key"`
	APIKeyMasked   string         `json:"api_key_masked,omitempty"`
	Settings       map[string]any `json:"settings"`
}

type CreateInput struct {
	OrganizationID uuid.UUID
	ModelType      string
	ModelName      string
	APIKey         string
	Settings       map[string]any
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
	mergedSettings := map[string]any{}
	for k, v := range defaultSettings {
		mergedSettings[k] = v
	}
	if input.Settings != nil {
		for k, v := range input.Settings {
			mergedSettings[k] = v
		}
	}
	settings, err := json.Marshal(mergedSettings)
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
	result, err := scanConfig(tx.QueryRow(ctx, `SELECT id, organization_id, model_type::text, model_name, is_active, settings, COALESCE(encrypted_api_key, '') FROM ai_configs WHERE id = $1`, id))
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
SELECT id, organization_id, model_type::text, model_name, is_active, settings, COALESCE(encrypted_api_key, '')
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
	if strings.TrimSpace(encrypted) != "" {
		result.HasAPIKey = true
		result.APIKeyMasked = "••••••••(已配置有效密钥)"
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
	current, err := r.GetActiveByID(ctx, id, organizationID)
	if err != nil {
		return nil, err
	}
	targetModelType := current.ModelType
	if input.ModelType != nil && strings.TrimSpace(*input.ModelType) != "" {
		targetModelType = strings.ToUpper(strings.TrimSpace(*input.ModelType))
	}
	targetModelName := current.ModelName
	if input.ModelName != nil && strings.TrimSpace(*input.ModelName) != "" {
		targetModelName = strings.TrimSpace(*input.ModelName)
	}
	if err := ValidateModelSelection(targetModelType, targetModelName); err != nil {
		return nil, err
	}
	parts := make([]string, 0, 4)
	args := make([]any, 0, 6)
	if input.ModelType != nil && strings.TrimSpace(*input.ModelType) != "" {
		args = append(args, targetModelType)
		parts = append(parts, fmt.Sprintf("model_type = $%d::aimodeltype", len(args)))
	}
	if input.ModelName != nil && strings.TrimSpace(*input.ModelName) != "" {
		args = append(args, targetModelName)
		parts = append(parts, fmt.Sprintf("model_name = $%d", len(args)))
	}
	if input.APIKey != nil && strings.TrimSpace(*input.APIKey) != "" {
		encrypted, err := encryption.Encrypt(strings.TrimSpace(*input.APIKey))
		if err != nil {
			return nil, err
		}
		args = append(args, encrypted)
		parts = append(parts, fmt.Sprintf("encrypted_api_key = $%d", len(args)))
	}
	if input.Settings != nil {
		mergedSettings := map[string]any{}
		if current.Settings != nil {
			for k, v := range current.Settings {
				mergedSettings[k] = v
			}
		}
		for k, v := range input.Settings {
			mergedSettings[k] = v
		}
		settings, err := json.Marshal(mergedSettings)
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
	result, err := scanConfig(r.pool.QueryRow(ctx, `SELECT id, organization_id, model_type::text, model_name, is_active, settings, COALESCE(encrypted_api_key, '') FROM ai_configs WHERE id = $1 AND organization_id = $2 AND is_active = TRUE`, id, organizationID))
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
		{
			Value: "OPENAI", Label: "OpenAI", RequiresAPIKey: true, CustomAllowed: true, APIKeyURL: "https://platform.openai.com/api-keys",
			Models: []Model{
				{"gpt-5.6-sol", "GPT-5.6 Sol (旗舰推理与编程)"},
				{"gpt-5.6-terra", "GPT-5.6 Terra (智能与成本平衡)"},
				{"gpt-5.6-luna", "GPT-5.6 Luna (高并发低成本)"},
			},
		},
		{
			Value: "DEEPSEEK", Label: "DeepSeek", RequiresAPIKey: true, CustomAllowed: true, APIKeyURL: "https://platform.deepseek.com/api_keys",
			Models: []Model{
				{"deepseek-v4-pro", "DeepSeek-V4 Pro (旗舰推理)"},
				{"deepseek-v4-flash", "DeepSeek-V4 Flash (快速通用)"},
			},
		},
		{
			Value: "ANTHROPIC", Label: "Anthropic (Claude)", RequiresAPIKey: true, CustomAllowed: true, APIKeyURL: "https://console.anthropic.com/settings/keys",
			Models: []Model{
				{"claude-opus-5", "Claude Opus 5"},
				{"claude-sonnet-5", "Claude Sonnet 5"},
				{"claude-fable-5", "Claude Fable 5"},
				{"claude-haiku-4-5-20251001", "Claude Haiku 4.5"},
			},
		},
		{
			Value: "GOOGLE", Label: "Google Gemini", RequiresAPIKey: true, CustomAllowed: true, APIKeyURL: "https://aistudio.google.com/app/apikey",
			Models: []Model{
				{"gemini-3.7-flash", "Gemini 3.7 Flash (最新通用)"},
				{"gemini-3.6-flash", "Gemini 3.6 Flash"},
				{"gemini-3.5-flash", "Gemini 3.5 Flash"},
				{"gemini-3.1-pro", "Gemini 3.1 Pro (高级推理)"},
			},
		},
		{
			Value: "XAI", Label: "xAI (Grok)", RequiresAPIKey: true, CustomAllowed: true, APIKeyURL: "https://console.x.ai",
			Models: []Model{
				{"grok-4.20", "Grok 4.20 (最新旗舰)"},
				{"grok-4.20-reasoning", "Grok 4.20 Reasoning"},
				{"grok-4.20-non-reasoning", "Grok 4.20 Non-Reasoning"},
				{"grok-code-fast-1", "Grok Code Fast 1"},
			},
		},
		{
			Value: "GROQ", Label: "Groq (LPU Speed)", RequiresAPIKey: true, CustomAllowed: true, APIKeyURL: "https://console.groq.com/keys",
			Models: []Model{
				{"qwen/qwen3.8-27b", "Qwen 3.8 27B"},
				{"qwen/qwen3.6-27b", "Qwen 3.6 27B"},
				{"meta-llama/llama-4-maverick-17b-128e-instruct", "Llama 4 Maverick 17B"},
				{"meta-llama/llama-4-scout-17b-16e-instruct", "Llama 4 Scout 17B"},
				{"openai/gpt-oss-120b", "GPT-OSS 120B"},
			},
		},
		{
			Value: "MISTRAL", Label: "Mistral", RequiresAPIKey: true, CustomAllowed: true, APIKeyURL: "https://console.mistral.ai/api-keys",
			Models: []Model{
				{"mistral-medium-3.5-26.04", "Mistral Medium 3.5 (旗舰多模态)"},
				{"mistral-large-3-25-12", "Mistral Large 3"},
				{"mistral-small-4-0-26-03", "Mistral Small 4"},
				{"devstral-2512", "Devstral 2 (代码)"},
			},
		},
		{
			Value: "ZHIPU", Label: "智谱 AI (GLM)", RequiresAPIKey: true, CustomAllowed: true, APIKeyURL: "https://open.bigmodel.cn/usercenter/apikeys",
			Models: []Model{
				{"glm-5.3", "GLM-5.3 (最新旗舰)"},
				{"glm-5.3-flash", "GLM-5.3-Flash (高速)"},
				{"glm-5.2", "GLM-5.2"},
			},
		},
		{
			Value: "KIMI", Label: "Kimi (Moonshot AI)", RequiresAPIKey: true, CustomAllowed: true, APIKeyURL: "https://platform.moonshot.cn/console/api-keys",
			Models: []Model{
				{"kimi-k3", "Kimi K3 (最新旗舰)"},
				{"kimi-k2.7-code-highspeed", "Kimi K2.7 Code Highspeed"},
				{"kimi-k2.6", "Kimi K2.6"},
				{"kimi-k2.5", "Kimi K2.5"},
			},
		},
	}
}

type rowScanner interface{ Scan(dest ...any) error }

func scanConfig(row rowScanner) (*Config, error) {
	var result Config
	var modelType string
	var settings []byte
	var active pgtype.Bool
	var encryptedKey string
	if err := row.Scan(&result.ID, &result.OrganizationID, &modelType, &result.ModelName, &active, &settings, &encryptedKey); err != nil {
		return nil, err
	}
	result.ModelType = strings.ToUpper(modelType)
	result.IsActive = active.Valid && active.Bool
	result.Settings = map[string]any{}
	if len(settings) > 0 {
		_ = json.Unmarshal(settings, &result.Settings)
	}
	if strings.TrimSpace(encryptedKey) != "" {
		result.HasAPIKey = true
		result.APIKeyMasked = "••••••••(已配置有效密钥)"
	}
	return &result, nil
}
