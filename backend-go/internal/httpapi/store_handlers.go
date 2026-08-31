package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/chattermate/chattermate/backend-go/internal/store"
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
