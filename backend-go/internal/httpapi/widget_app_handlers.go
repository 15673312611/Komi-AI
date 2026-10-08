package httpapi

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"

	"github.com/komi/komi/backend-go/internal/user"
	"github.com/komi/komi/backend-go/internal/widgetapp"
)

type widgetAppRequest struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
}

type widgetAppUpdateRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	IsActive    *bool   `json:"is_active"`
}

type widgetAppView struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	Description    *string `json:"description"`
	OrganizationID string  `json:"organization_id"`
	CreatedBy      string  `json:"created_by"`
	IsActive       bool    `json:"is_active"`
	CreatedAt      any     `json:"created_at"`
	UpdatedAt      any     `json:"updated_at"`
	APIKey         *string `json:"api_key,omitempty"`
}

func registerWidgetAppRoutes(r chi.Router, deps Dependencies) {
	guard := requireAllPermissions(deps, "manage_organization")
	r.With(guard).Post("/widget-apps", createWidgetApp(deps))
	r.With(guard).Get("/widget-apps", listWidgetApps(deps))
	r.With(guard).Get("/widget-apps/{app_id}", getWidgetApp(deps))
	r.With(guard).Patch("/widget-apps/{app_id}", updateWidgetApp(deps))
	r.With(guard).Delete("/widget-apps/{app_id}", deleteWidgetApp(deps))
	r.With(guard).Post("/widget-apps/{app_id}/regenerate-key", regenerateWidgetAppKey(deps))
}

func managementWidgetApps(deps Dependencies) (widgetapp.ManagementStore, bool) {
	store, ok := deps.WidgetApps.(widgetapp.ManagementStore)
	return store, ok && store != nil
}

func widgetAppCurrentUser(r *http.Request) (*user.User, bool) {
	current, ok := currentUserFromContext(r)
	if !ok || current.OrganizationID == nil {
		return nil, false
	}
	return current, true
}

func createWidgetApp(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store, ok := managementWidgetApps(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Widget app service is not configured")
			return
		}
		current, ok := widgetAppCurrentUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		var body widgetAppRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if name := strings.TrimSpace(body.Name); len(name) < 1 || len(name) > 100 {
			Error(w, http.StatusUnprocessableEntity, "Invalid widget app name")
			return
		} else {
			body.Name = name
		}
		if body.Description != nil && len(*body.Description) > 500 {
			Error(w, http.StatusUnprocessableEntity, "Invalid widget app description")
			return
		}
		app, plainKey, err := store.Create(r.Context(), widgetapp.CreateInput{
			Name: body.Name, Description: body.Description, OrganizationID: *current.OrganizationID, CreatedBy: current.ID,
		})
		if err != nil {
			deps.Logger.Error().Err(err).Msg("create widget app failed")
			Error(w, http.StatusInternalServerError, "Failed to create widget app")
			return
		}
		JSON(w, http.StatusCreated, widgetAppViewFrom(app, &plainKey))
	}
}

func listWidgetApps(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store, ok := managementWidgetApps(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Widget app service is not configured")
			return
		}
		current, ok := widgetAppCurrentUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		includeInactive := false
		if value := r.URL.Query().Get("include_inactive"); value != "" {
			parsed, parseErr := strconv.ParseBool(value)
			if parseErr != nil {
				Error(w, http.StatusUnprocessableEntity, "Invalid include_inactive value")
				return
			}
			includeInactive = parsed
		}
		apps, err := store.List(r.Context(), *current.OrganizationID, includeInactive)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to list widget apps")
			return
		}
		views := make([]widgetAppView, 0, len(apps))
		for _, app := range apps {
			views = append(views, widgetAppViewFrom(app, nil))
		}
		JSON(w, http.StatusOK, map[string]any{"total": len(views), "apps": views})
	}
}

func getWidgetApp(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store, ok := managementWidgetApps(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Widget app service is not configured")
			return
		}
		current, ok := widgetAppCurrentUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		id, err := parsePathUUID(r, "app_id")
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid widget app ID")
			return
		}
		app, err := store.Get(r.Context(), id, *current.OrganizationID)
		if err != nil || app == nil {
			if errors.Is(err, pgx.ErrNoRows) || app == nil {
				Error(w, http.StatusNotFound, "Widget app "+id.String()+" not found")
				return
			}
			Error(w, http.StatusInternalServerError, "Failed to get widget app")
			return
		}
		JSON(w, http.StatusOK, widgetAppViewFrom(app, nil))
	}
}

func updateWidgetApp(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store, ok := managementWidgetApps(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Widget app service is not configured")
			return
		}
		current, ok := widgetAppCurrentUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		id, err := parsePathUUID(r, "app_id")
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid widget app ID")
			return
		}
		var body widgetAppUpdateRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if body.Name != nil {
			value := strings.TrimSpace(*body.Name)
			if len(value) < 1 || len(value) > 100 {
				Error(w, http.StatusUnprocessableEntity, "Invalid widget app name")
				return
			}
			body.Name = &value
		}
		if body.Description != nil && len(*body.Description) > 500 {
			Error(w, http.StatusUnprocessableEntity, "Invalid widget app description")
			return
		}
		app, err := store.Update(r.Context(), id, *current.OrganizationID, widgetapp.UpdateInput{Name: body.Name, Description: body.Description, IsActive: body.IsActive})
		if err != nil || app == nil {
			if errors.Is(err, pgx.ErrNoRows) || app == nil {
				Error(w, http.StatusNotFound, "Widget app "+id.String()+" not found")
				return
			}
			Error(w, http.StatusInternalServerError, "Failed to update widget app")
			return
		}
		JSON(w, http.StatusOK, widgetAppViewFrom(app, nil))
	}
}

func deleteWidgetApp(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store, ok := managementWidgetApps(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Widget app service is not configured")
			return
		}
		current, ok := widgetAppCurrentUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		id, err := parsePathUUID(r, "app_id")
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid widget app ID")
			return
		}
		hardDelete := false
		if value := r.URL.Query().Get("hard_delete"); value != "" {
			parsed, parseErr := strconv.ParseBool(value)
			if parseErr != nil {
				Error(w, http.StatusUnprocessableEntity, "Invalid hard_delete value")
				return
			}
			hardDelete = parsed
		}
		var deleted bool
		if hardDelete {
			deleted, err = store.Delete(r.Context(), id, *current.OrganizationID)
		} else {
			deleted, err = store.Deactivate(r.Context(), id, *current.OrganizationID)
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to delete widget app")
			return
		}
		if !deleted {
			Error(w, http.StatusNotFound, "Widget app "+id.String()+" not found")
			return
		}
		NoContent(w)
	}
}

func regenerateWidgetAppKey(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store, ok := managementWidgetApps(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Widget app service is not configured")
			return
		}
		current, ok := widgetAppCurrentUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		id, err := parsePathUUID(r, "app_id")
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid widget app ID")
			return
		}
		app, plainKey, err := store.Regenerate(r.Context(), id, *current.OrganizationID)
		if err != nil || app == nil {
			if errors.Is(err, pgx.ErrNoRows) || app == nil {
				Error(w, http.StatusNotFound, "Widget app "+id.String()+" not found")
				return
			}
			Error(w, http.StatusInternalServerError, "Failed to regenerate widget app key")
			return
		}
		JSON(w, http.StatusOK, widgetAppViewFrom(app, &plainKey))
	}
}

func widgetAppViewFrom(app *widgetapp.App, apiKey *string) widgetAppView {
	if app == nil {
		return widgetAppView{}
	}
	return widgetAppView{
		ID:             app.ID.String(),
		Name:           app.Name,
		Description:    app.Description,
		OrganizationID: app.OrganizationID.String(),
		CreatedBy:      app.CreatedBy.String(),
		IsActive:       app.IsActive,
		CreatedAt:      app.CreatedAt,
		UpdatedAt:      app.UpdatedAt,
		APIKey:         apiKey,
	}
}
