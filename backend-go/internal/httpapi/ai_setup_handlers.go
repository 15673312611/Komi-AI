package httpapi

import (
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/chattermate/chattermate/backend-go/internal/aiconfig"
)

func registerAISetupRoutes(r chi.Router, deps Dependencies) {
	r.With(requireAllPermissions(deps, "manage_ai_config")).Get("/ai/providers", listAIProviders())
	r.With(requireAllPermissions(deps, "manage_ai_config")).Post("/ai/setup", setupAIConfig(deps))
	r.With(requireAllPermissions(deps, "view_ai_config")).Get("/ai/config", getAIConfig(deps))
	r.With(requireAllPermissions(deps, "manage_ai_config")).Put("/ai/config", updateAIConfig(deps))
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
		result, err := store.Create(r.Context(), aiconfig.CreateInput{OrganizationID: organizationID, ModelType: body.ModelType, ModelName: body.ModelName, APIKey: body.APIKey})
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
		if modelType == nil {
			modelType = &current.ModelType
		}
		if modelName == nil {
			modelName = &current.ModelName
		}
		if err := aiconfig.ValidateModelSelection(*modelType, *modelName); err != nil {
			Error(w, http.StatusBadRequest, "Invalid AI model selection")
			return
		}
		result, err := store.Update(r.Context(), current.ID, organizationID, aiconfig.UpdateInput{ModelType: modelType, ModelName: modelName, APIKey: body.APIKey, Settings: body.Settings})
		if err != nil {
			writeAIError(w, err, "Failed to update AI configuration")
			return
		}
		JSON(w, http.StatusOK, map[string]any{"message": "AI configuration updated successfully", "config": result})
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
