package httpapi

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/komi/komi/backend-go/internal/aiconfig"
)

func registerAISetupRoutes(r chi.Router, deps Dependencies) {
	r.With(requireAllPermissions(deps, "manage_ai_config")).Get("/ai/providers", listAIProviders())
	r.With(requireAllPermissions(deps, "manage_ai_config")).Post("/ai/setup", setupAIConfig(deps))
	r.With(requireAllPermissions(deps, "view_ai_config")).Get("/ai/config", getAIConfig(deps))
	r.With(requireAllPermissions(deps, "manage_ai_config")).Put("/ai/config", updateAIConfig(deps))
	r.With(requireAllPermissions(deps, "manage_ai_config")).Post("/ai/test", testAIConfig(deps))
}

type aiSetupRequest struct {
	ModelType string         `json:"model_type"`
	ModelName string         `json:"model_name"`
	APIKey    string         `json:"api_key"`
	Settings  map[string]any `json:"settings"`
}

type aiUpdateRequest struct {
	ModelType *string        `json:"model_type"`
	ModelName *string        `json:"model_name"`
	APIKey    *string        `json:"api_key"`
	Settings  map[string]any `json:"settings"`
}

type aiTestRequest struct {
	ModelType string         `json:"model_type"`
	ModelName string         `json:"model_name"`
	APIKey    string         `json:"api_key"`
	Settings  map[string]any `json:"settings"`
}

func aiStoreOrError(w http.ResponseWriter, deps Dependencies) aiconfig.Store {
	if deps.AIConfigs == nil {
		Error(w, http.StatusServiceUnavailable, "AI configuration storage is not configured")
		return nil
	}
	return deps.AIConfigs
}

func aiOrganization(r *http.Request) (uuid.UUID, bool) {
	current, ok := currentUserFromContext(r)
	if !ok || current.OrganizationID == nil {
		return uuid.Nil, false
	}
	return *current.OrganizationID, true
}

func listAIProviders() http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		JSON(w, http.StatusOK, map[string]any{"providers": aiconfig.Providers()})
	}
}

func setupAIConfig(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := aiStoreOrError(w, deps)
		if store == nil {
			return
		}
		organizationID, ok := aiOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		var body aiSetupRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if err := aiconfig.ValidateModelSelection(body.ModelType, body.ModelName); err != nil {
			Error(w, http.StatusBadRequest, "Invalid AI model selection")
			return
		}
		result, err := store.Create(r.Context(), aiconfig.CreateInput{
			OrganizationID: organizationID,
			ModelType:      body.ModelType,
			ModelName:      body.ModelName,
			APIKey:         body.APIKey,
			Settings:       body.Settings,
		})
		if err != nil {
			writeAIError(w, err, "Failed to setup AI configuration")
			return
		}
		JSON(w, http.StatusOK, map[string]any{"message": "AI configuration completed successfully", "config": result})
	}
}

func getAIConfig(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := aiStoreOrError(w, deps)
		if store == nil {
			return
		}
		organizationID, ok := aiOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		result, err := store.GetActive(r.Context(), organizationID)
		if err != nil {
			writeAIError(w, err, "Failed to get AI configuration")
			return
		}
		JSON(w, http.StatusOK, result)
	}
}

func updateAIConfig(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := aiStoreOrError(w, deps)
		if store == nil {
			return
		}
		organizationID, ok := aiOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		var body aiUpdateRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		current, err := store.GetActive(r.Context(), organizationID)
		if err != nil {
			writeAIError(w, err, "Failed to update AI configuration")
			return
		}
		modelType := body.ModelType
		modelName := body.ModelName
		if modelType == nil || strings.TrimSpace(*modelType) == "" {
			modelType = &current.ModelType
		}
		if modelName == nil || strings.TrimSpace(*modelName) == "" {
			modelName = &current.ModelName
		}
		apiKey := body.APIKey
		if apiKey != nil && strings.TrimSpace(*apiKey) == "" {
			apiKey = nil // Preserve existing API key
		}
		result, err := store.Update(r.Context(), current.ID, organizationID, aiconfig.UpdateInput{ModelType: modelType, ModelName: modelName, APIKey: apiKey, Settings: body.Settings})
		if err != nil {
			writeAIError(w, err, "Failed to update AI configuration")
			return
		}
		JSON(w, http.StatusOK, map[string]any{"message": "AI configuration updated successfully", "config": result})
	}
}

func testAIConfig(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		organizationID, ok := aiOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		var body aiTestRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		modelType := strings.TrimSpace(body.ModelType)
		modelName := strings.TrimSpace(body.ModelName)
		apiKey := strings.TrimSpace(body.APIKey)
		settings := body.Settings

		// If user didn't enter an API Key, try loading existing active key
		if apiKey == "" && deps.AIConfigs != nil {
			if credStore, ok := deps.AIConfigs.(aiconfig.CredentialStore); ok {
				if activeCfg, existingKey, err := credStore.GetActiveAPIKey(r.Context(), organizationID); err == nil && activeCfg != nil {
					if modelType == "" {
						modelType = activeCfg.ModelType
					}
					if modelName == "" {
						modelName = activeCfg.ModelName
					}
					if settings == nil {
						settings = activeCfg.Settings
					}
					apiKey = existingKey
				}
			}
		}

		if modelType == "" || modelName == "" {
			Error(w, http.StatusBadRequest, "Model type and model name are required")
			return
		}
		if apiKey == "" {
			Error(w, http.StatusBadRequest, "API Key is required to test connectivity")
			return
		}

		testCfg := &aiconfig.Config{
			ModelType: modelType,
			ModelName: modelName,
			Settings:  settings,
		}

		start := time.Now()
		_, err := callConfiguredAI(r.Context(), testCfg, apiKey, "You are a test ping bot.", "Ping! Please respond with 'pong'.", 10, false)
		latency := time.Since(start).Milliseconds()

		if err != nil {
			JSON(w, http.StatusOK, map[string]any{
				"success":    false,
				"latency_ms": latency,
				"error":      err.Error(),
			})
			return
		}

		JSON(w, http.StatusOK, map[string]any{
			"success":    true,
			"latency_ms": latency,
			"message":    fmt.Sprintf("模型握手成功！延迟 %dms", latency),
		})
	}
}

func writeAIError(w http.ResponseWriter, err error, fallback string) {
	if errors.Is(err, aiconfig.ErrNotFound) {
		Error(w, http.StatusNotFound, "No active AI configuration found")
		return
	}
	if errors.Is(err, aiconfig.ErrInvalid) {
		Error(w, http.StatusBadRequest, "Invalid AI model selection")
		return
	}
	if strings.Contains(strings.ToLower(err.Error()), "encryption") || strings.Contains(strings.ToLower(err.Error()), "decrypt") {
		Error(w, http.StatusInternalServerError, "AI credential encryption failed")
		return
	}
	Error(w, http.StatusInternalServerError, fallback)
}
