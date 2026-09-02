package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"

	"github.com/komi/komi/backend-go/internal/organization"
)

type createOrganizationRequest struct {
	Name          string         `json:"name"`
	Domain        string         `json:"domain"`
	Timezone      string         `json:"timezone"`
	BusinessHours map[string]any `json:"business_hours"`
	Settings      map[string]any `json:"settings"`
	AdminEmail    string         `json:"admin_email"`
	AdminName     string         `json:"admin_name"`
	AdminPassword string         `json:"admin_password"`
}

func registerOrganizationRoutes(r chi.Router, deps Dependencies) {
	if deps.Organizations == nil && deps.DB != nil {
		deps.Organizations = organization.NewRepository(deps.DB)
	}
	r.Post("/organizations", createOrganization(deps))
	r.Get("/organizations/setup-status", setupStatus(deps))
	r.Get("/organizations/check-domain/{domain}", checkDomain(deps))
	r.With(requireAuthenticated(deps)).Get("/organizations/{org_id}", getOrganization(deps))
	r.With(requireAllPermissions(deps, "manage_organization")).Patch("/organizations/{org_id}", updateOrganization(deps))
	r.With(requireAllPermissions(deps, "view_organization")).Get("/organizations/{org_id}/stats", organizationStats(deps))
}

func createOrganization(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Organizations == nil {
			Error(w, http.StatusInternalServerError, "Failed to create organization: database is not configured")
			return
		}
		var body createOrganizationRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if body.Name == "" || body.Domain == "" || body.AdminEmail == "" || body.AdminName == "" || body.AdminPassword == "" {
			Error(w, http.StatusUnprocessableEntity, "Invalid organization data")
			return
		}
		created, err := deps.Organizations.Create(r.Context(), organization.CreateInput{
			Name: body.Name, Domain: body.Domain, Timezone: body.Timezone, BusinessHours: body.BusinessHours,
			Settings: body.Settings, AdminEmail: body.AdminEmail, AdminName: body.AdminName, AdminPassword: body.AdminPassword,
		})
		if errors.Is(err, organization.ErrAlreadyExists) {
			Error(w, http.StatusForbidden, "Organization already exists")
			return
		}
		if err != nil {
			deps.Logger.Error().Err(err).Msg("organization creation failed")
			Error(w, http.StatusInternalServerError, "Failed to create organization: "+err.Error())
			return
		}
		accessToken, err := deps.Auth.CreateAccessToken(created.Admin.ID.String(), created.Organization.ID.String())
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to create organization: "+err.Error())
			return
		}
		refreshToken, err := deps.Auth.CreateRefreshToken(created.Admin.ID.String(), created.Organization.ID.String())
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to create organization: "+err.Error())
			return
		}
		response := map[string]any{
			"id": created.Organization.ID, "name": created.Organization.Name, "domain": created.Organization.Domain,
			"timezone": created.Organization.Timezone, "business_hours": created.Organization.BusinessHours,
			"settings": created.Organization.Settings, "is_active": created.Organization.IsActive,
			"access_token": accessToken, "refresh_token": refreshToken, "token_type": "bearer",
			"user": toUserView(created.Admin),
		}
		setAuthCookies(w, tokenResponse{AccessToken: accessToken, RefreshToken: refreshToken, TokenType: "bearer", User: toUserView(created.Admin)}, false)
		JSON(w, http.StatusCreated, response)
	}
}

func setupStatus(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Organizations == nil {
			Error(w, http.StatusInternalServerError, "Failed to check organization setup status")
			return
		}
		exists, err := deps.Organizations.SetupStatus(r.Context())
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to check organization setup status")
			return
		}
		JSON(w, http.StatusOK, map[string]bool{"is_setup": exists})
	}
}

func checkDomain(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Organizations == nil {
			Error(w, http.StatusInternalServerError, "Failed to check domain availability")
			return
		}
		available, err := deps.Organizations.DomainAvailable(r.Context(), chi.URLParam(r, "domain"))
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to check domain availability")
			return
		}
		message := "Domain already exists"
		if available {
			message = "Domain is available"
		}
		JSON(w, http.StatusOK, map[string]any{"available": available, "message": message})
	}
}

func getOrganization(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		id, err := parsePathUUID(r, "org_id")
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid organization ID")
			return
		}
		if !ok || current.OrganizationID == nil || *current.OrganizationID != id {
			Error(w, http.StatusNotFound, "Organization not found")
			return
		}
		if deps.Organizations == nil {
			Error(w, http.StatusInternalServerError, "Failed to retrieve organization. Please try again later.")
			return
		}
		org, err := deps.Organizations.Get(r.Context(), id)
		if errors.Is(err, pgx.ErrNoRows) || org == nil {
			Error(w, http.StatusNotFound, "Organization not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to retrieve organization. Please try again later.")
			return
		}
		JSON(w, http.StatusOK, org)
	}
}

func updateOrganization(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		id, err := parsePathUUID(r, "org_id")
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid organization ID")
			return
		}
		if !ok || current.OrganizationID == nil || *current.OrganizationID != id {
			Error(w, http.StatusNotFound, "Organization not found")
			return
		}
		input, err := decodeObject(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if businessHours, exists := input["business_hours"]; exists {
			if err := validateBusinessHours(businessHours); err != nil {
				Error(w, http.StatusBadRequest, err.Error())
				return
			}
		}
		if deps.Organizations == nil {
			Error(w, http.StatusInternalServerError, "Failed to update organization. Please try again later.")
			return
		}
		org, err := deps.Organizations.Update(r.Context(), id, organization.UpdateInput(input))
		if errors.Is(err, pgx.ErrNoRows) || org == nil {
			Error(w, http.StatusNotFound, "Organization not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to update organization. Please try again later.")
			return
		}
		JSON(w, http.StatusOK, org)
	}
}

func organizationStats(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		id, err := parsePathUUID(r, "org_id")
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid organization ID")
			return
		}
		if !ok || current.OrganizationID == nil || *current.OrganizationID != id {
			Error(w, http.StatusNotFound, "Organization not found")
			return
		}
		if deps.Organizations == nil {
			Error(w, http.StatusInternalServerError, "Failed to retrieve organization statistics")
			return
		}
		stats, err := deps.Organizations.Stats(r.Context(), id)
		if errors.Is(err, pgx.ErrNoRows) || stats == nil {
			Error(w, http.StatusNotFound, "Organization not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to retrieve organization statistics")
			return
		}
		JSON(w, http.StatusOK, stats)
	}
}

func validateBusinessHours(raw json.RawMessage) error {
	var values map[string]map[string]any
	if err := json.Unmarshal(raw, &values); err != nil {
		return errors.New("Business hours must include all days of the week")
	}
	days := []string{"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"}
	for _, day := range days {
		entry, ok := values[day]
		if !ok {
			return errors.New("Business hours must include all days of the week")
		}
		for _, key := range []string{"start", "end", "enabled"} {
			if _, ok := entry[key]; !ok {
				return errors.New("Business hours for " + day + " must include start, end, and enabled status")
			}
		}
		for _, key := range []string{"start", "end"} {
			value, ok := entry[key].(string)
			if !ok || len(value) != 5 || value[2] != ':' || value[0] < '0' || value[0] > '2' || value[1] < '0' || value[1] > '9' || value[3] < '0' || value[3] > '5' || value[4] < '0' || value[4] > '9' {
				return errors.New("Invalid time format for " + day + ". Use HH:MM format (24-hour)")
			}
			hour := int(value[0]-'0')*10 + int(value[1]-'0')
			if hour > 23 {
				return errors.New("Invalid time format for " + day + ". Use HH:MM format (24-hour)")
			}
		}
	}
	return nil
}
