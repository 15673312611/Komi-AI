package httpapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/komi/komi/backend-go/internal/store"
)

func registerStoreRoutes(r chi.Router, deps Dependencies) {
	manageOrg := requireAllPermissions(deps, "manage_organization")
	inbox := requireAnyPermissions(deps, "view_all_chats", "view_assigned_chats", "view_unassigned_chats", "manage_all_chats", "manage_assigned_chats")

	r.With(inbox).Get("/stores", listStores(deps))
	r.With(inbox).Get("/stores/options", getStoreOptions(deps))
	r.With(inbox).Get("/stores/{id}", getStore(deps))
	r.With(manageOrg).Post("/stores", createStore(deps))
	r.With(manageOrg).Put("/stores/{id}", updateStore(deps))
	r.With(manageOrg).Delete("/stores/{id}", deleteStore(deps))
}

func listStores(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Stores == nil {
			Error(w, http.StatusInternalServerError, "Store service is not configured")
			return
		}
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}

		stores, err := deps.Stores.List(r.Context(), *current.OrganizationID)
		if err != nil {
			deps.Logger.Error().Err(err).Msg("failed to list stores")
			Error(w, http.StatusInternalServerError, "Failed to list stores")
			return
		}

		JSON(w, http.StatusOK, stores)
	}
}

func getStoreOptions(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Stores == nil {
			Error(w, http.StatusInternalServerError, "Store service is not configured")
			return
		}
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}

		opts, err := deps.Stores.GetOptions(r.Context(), *current.OrganizationID)
		if err != nil {
			deps.Logger.Error().Err(err).Msg("failed to get store options")
			Error(w, http.StatusInternalServerError, "Failed to get store options")
			return
		}

		JSON(w, http.StatusOK, opts)
	}
}

func getStore(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Stores == nil {
			Error(w, http.StatusInternalServerError, "Store service is not configured")
			return
		}
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}

		rawID := chi.URLParam(r, "id")
		id, err := uuid.Parse(rawID)
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid store id")
			return
		}

		s, err := deps.Stores.GetByID(r.Context(), id, *current.OrganizationID)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				Error(w, http.StatusNotFound, "Store not found")
				return
			}
			Error(w, http.StatusInternalServerError, "Failed to get store")
			return
		}

		JSON(w, http.StatusOK, s)
	}
}

func createStore(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Stores == nil {
			Error(w, http.StatusInternalServerError, "Store service is not configured")
			return
		}
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}

		var input store.CreateInput
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			Error(w, http.StatusBadRequest, "Invalid JSON payload")
			return
		}

		if strings.TrimSpace(input.Name) == "" {
			Error(w, http.StatusBadRequest, "Store name is required")
			return
		}

		if input.ChannelAccountID != nil && input.EmailAccountID == nil {
			input.EmailAccountID = input.ChannelAccountID
		}

		if input.ChannelType != nil && strings.TrimSpace(*input.ChannelType) != "" && len(input.ChannelConfig) > 0 && deps.Channels != nil {
			chType := strings.ToLower(strings.TrimSpace(*input.ChannelType))
			extID := fmt.Sprintf("%s_%s_%s", chType, strings.ToLower(regexp.MustCompile(`[^a-zA-Z0-9]+`).ReplaceAllString(input.Name, "_")), (*current.OrganizationID).String()[:6])
			for _, k := range []string{"phone_number_id", "email", "bot_username", "ig_id", "channel_id", "page_id", "phone"} {
				if val, ok := input.ChannelConfig[k].(string); ok && strings.TrimSpace(val) != "" {
					extID = strings.TrimSpace(val)
					break
				}
			}
			dispName := fmt.Sprintf("%s (%s)", input.Name, strings.ToUpper(chType))
			if customDisp, ok := input.ChannelConfig["display_name"].(string); ok && strings.TrimSpace(customDisp) != "" {
				dispName = strings.TrimSpace(customDisp)
			}
			acc, err := deps.Channels.Create(r.Context(), *current.OrganizationID, chType, extID, input.ChannelConfig, &dispName, map[string]any{"store_name": input.Name})
			if err == nil && acc != nil {
				input.EmailAccountID = &acc.ID
			}
		}

		s, err := deps.Stores.Create(r.Context(), *current.OrganizationID, input)
		if err != nil {
			deps.Logger.Error().Err(err).Msg("failed to create store")
			Error(w, http.StatusInternalServerError, "Failed to create store: "+err.Error())
			return
		}

		if s.EmailAccountID != nil && s.AgentID != nil && deps.Channels != nil {
			_ = deps.Channels.SetAgent(r.Context(), *s.EmailAccountID, *current.OrganizationID, *s.AgentID, true)
		}

		JSON(w, http.StatusCreated, s)
	}
}

func updateStore(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Stores == nil {
			Error(w, http.StatusInternalServerError, "Store service is not configured")
			return
		}
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}

		rawID := chi.URLParam(r, "id")
		id, err := uuid.Parse(rawID)
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid store id")
			return
		}

		var input store.UpdateInput
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			Error(w, http.StatusBadRequest, "Invalid JSON payload")
			return
		}

		if input.ChannelAccountID != nil && input.EmailAccountID == nil {
			input.EmailAccountID = input.ChannelAccountID
		}

		if input.ChannelType != nil && strings.TrimSpace(*input.ChannelType) != "" && len(input.ChannelConfig) > 0 && deps.Channels != nil {
			chType := strings.ToLower(strings.TrimSpace(*input.ChannelType))
			storeName := "Store"
			if input.Name != nil {
				storeName = *input.Name
			}
			extID := fmt.Sprintf("%s_%s_%s", chType, strings.ToLower(regexp.MustCompile(`[^a-zA-Z0-9]+`).ReplaceAllString(storeName, "_")), (*current.OrganizationID).String()[:6])
			for _, k := range []string{"phone_number_id", "email", "bot_username", "ig_id", "channel_id", "page_id", "phone"} {
				if val, ok := input.ChannelConfig[k].(string); ok && strings.TrimSpace(val) != "" {
					extID = strings.TrimSpace(val)
					break
				}
			}
			dispName := fmt.Sprintf("%s (%s)", storeName, strings.ToUpper(chType))
			if customDisp, ok := input.ChannelConfig["display_name"].(string); ok && strings.TrimSpace(customDisp) != "" {
				dispName = strings.TrimSpace(customDisp)
			}
			acc, err := deps.Channels.Create(r.Context(), *current.OrganizationID, chType, extID, input.ChannelConfig, &dispName, map[string]any{"store_name": storeName})
			if err == nil && acc != nil {
				input.EmailAccountID = &acc.ID
			}
		}

		s, err := deps.Stores.Update(r.Context(), id, *current.OrganizationID, input)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				Error(w, http.StatusNotFound, "Store not found")
				return
			}
			deps.Logger.Error().Err(err).Msg("failed to update store")
			Error(w, http.StatusInternalServerError, "Failed to update store: "+err.Error())
			return
		}

		if s.EmailAccountID != nil && s.AgentID != nil && deps.Channels != nil {
			_ = deps.Channels.SetAgent(r.Context(), *s.EmailAccountID, *current.OrganizationID, *s.AgentID, true)
		}

		JSON(w, http.StatusOK, s)
	}
}

func deleteStore(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Stores == nil {
			Error(w, http.StatusInternalServerError, "Store service is not configured")
			return
		}
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}

		rawID := chi.URLParam(r, "id")
		id, err := uuid.Parse(rawID)
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid store id")
			return
		}

		if err := deps.Stores.Delete(r.Context(), id, *current.OrganizationID); err != nil {
			if errors.Is(err, store.ErrNotFound) {
				Error(w, http.StatusNotFound, "Store not found")
				return
			}
			deps.Logger.Error().Err(err).Msg("failed to delete store")
			Error(w, http.StatusInternalServerError, "Failed to delete store")
			return
		}

		JSON(w, http.StatusOK, map[string]bool{"success": true})
	}
}
