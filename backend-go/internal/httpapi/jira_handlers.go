package httpapi

import (
	"errors"
	"net/http"
	"net/url"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/komi/komi/backend-go/internal/jira"
)

func registerJiraRoutes(r chi.Router, deps Dependencies) {
	org := requireAuthenticated(deps)
	manage := requireAllPermissions(deps, "manage_organization")
	r.With(org).Get("/jira/status", jiraStatus(deps))
	r.With(manage).Delete("/jira/disconnect", disconnectJira(deps))
	r.With(manage).Get("/jira/authorize", authorizeJira(deps))
	r.Get("/jira/callback", jiraCallback(deps))
	r.With(org).Get("/jira/refresh", refreshJira(deps))
	r.With(org).Get("/jira/projects", jiraProjects(deps))
	r.With(org).Get("/jira/projects/{project_key}/issue-types", jiraIssueTypes(deps))
	r.With(org).Get("/jira/priorities", jiraPriorities(deps))
	r.With(org).Get("/jira/projects/{project_key}/issue-types/{issue_type_id}/has-priority", jiraHasPriority(deps))
	r.With(manage).Post("/jira/issues", createJiraIssue(deps))
	r.With(manage).Post("/jira/agent-config/{agent_id}", saveJiraAgentConfig(deps))
	r.With(org).Get("/jira/agent-config/{agent_id}", getJiraAgentConfig(deps))
}

func configuredJira(deps Dependencies, w http.ResponseWriter) (*jira.Service, bool) {
	if deps.Jira == nil || deps.Jira.Repo == nil {
		Error(w, http.StatusInternalServerError, "Jira service is not configured")
		return nil, false
	}
	return deps.Jira, true
}

func jiraOrganization(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	current, ok := currentUserFromContext(r)
	if !ok || current.OrganizationID == nil {
		Error(w, http.StatusForbidden, "User is not associated with any organization")
		return uuid.Nil, false
	}
	return *current.OrganizationID, true
}

func jiraStatus(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredJira(deps, w)
		if !ok {
			return
		}
		organizationID, ok := jiraOrganization(w, r)
		if !ok {
			return
		}
		token, err := service.Repo.GetToken(r.Context(), organizationID)
		if errors.Is(err, jira.ErrNotFound) {
			JSON(w, http.StatusOK, map[string]any{"connected": false})
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to check Jira connection")
			return
		}
		token, err = service.EnsureToken(r.Context(), token)
		if err != nil {
			JSON(w, http.StatusOK, map[string]any{"connected": false, "site_url": nil})
			return
		}
		JSON(w, http.StatusOK, map[string]any{"connected": true, "site_url": token.SiteURL})
	}
}

func disconnectJira(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredJira(deps, w)
		if !ok {
			return
		}
		organizationID, ok := jiraOrganization(w, r)
		if !ok {
			return
		}
		if _, err := service.Repo.GetToken(r.Context(), organizationID); errors.Is(err, jira.ErrNotFound) {
			Error(w, http.StatusNotFound, "No Jira connection found")
			return
		} else if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to load Jira connection")
			return
		}
		if err := service.Repo.Delete(r.Context(), organizationID); err != nil {
			deps.Logger.Error().Err(err).Msg("disconnect Jira failed")
			Error(w, http.StatusInternalServerError, "Error disconnecting Jira: "+err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Jira disconnected successfully"})
	}
}

func authorizeJira(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredJira(deps, w)
		if !ok {
			return
		}
		organizationID, ok := jiraOrganization(w, r)
		if !ok {
			return
		}
		state, err := newCRMState()
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to start Jira authorization")
			return
		}
		service.PutState(state, organizationID)
		http.Redirect(w, r, service.AuthorizationURL(state), http.StatusTemporaryRedirect)
	}
}

func jiraCallback(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredJira(deps, w)
		if !ok {
			return
		}
		query := r.URL.Query()
		state := query.Get("state")
		if query.Get("error") != "" || query.Get("code") == "" || state == "" {
			if state != "" {
				_, _ = service.PopState(state)
			}
			http.Redirect(w, r, jiraSettingsRedirect(deps, "failure", firstNonEmptyString(query.Get("error"), "cancelled")), http.StatusTemporaryRedirect)
			return
		}
		organizationID, valid := service.PopState(state)
		if !valid {
			http.Redirect(w, r, jiraSettingsRedirect(deps, "failure", "invalid_state"), http.StatusTemporaryRedirect)
			return
		}
		token, err := service.ExchangeCode(r.Context(), query.Get("code"))
		if err != nil {
			deps.Logger.Error().Err(err).Msg("Jira OAuth exchange failed")
			http.Redirect(w, r, jiraSettingsRedirect(deps, "failure", "oauth_failed"), http.StatusTemporaryRedirect)
			return
		}
		token.OrganizationID = organizationID
		if _, err := service.Repo.UpsertToken(r.Context(), *token); err != nil {
			deps.Logger.Error().Err(err).Msg("save Jira token failed")
			http.Redirect(w, r, jiraSettingsRedirect(deps, "failure", "storage_failed"), http.StatusTemporaryRedirect)
			return
		}
		http.Redirect(w, r, jiraSettingsRedirect(deps, "success", ""), http.StatusTemporaryRedirect)
	}
}

func refreshJira(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredJira(deps, w)
		if !ok {
			return
		}
		organizationID, ok := jiraOrganization(w, r)
		if !ok {
			return
		}
		token, err := service.Repo.GetToken(r.Context(), organizationID)
		if errors.Is(err, jira.ErrNotFound) {
			Error(w, http.StatusNotFound, "No Jira token found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to load Jira token")
			return
		}
		refreshed, err := service.Refresh(r.Context(), token)
		if err != nil {
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		refreshed.OrganizationID = organizationID
		if _, err := service.Repo.UpsertToken(r.Context(), *refreshed); err != nil {
			Error(w, http.StatusInternalServerError, "Failed to save refreshed Jira token")
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Token refreshed successfully"})
	}
}

func jiraProjects(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, token, ok := jiraTokenForRequest(deps, w, r)
		if !ok {
			return
		}
		values, err := service.Projects(r.Context(), token)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to get Jira projects")
			return
		}
		JSON(w, http.StatusOK, values)
	}
}

func jiraIssueTypes(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, token, ok := jiraTokenForRequest(deps, w, r)
		if !ok {
			return
		}
		values, err := service.IssueTypes(r.Context(), token, chi.URLParam(r, "project_key"))
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to get Jira issue types")
			return
		}
		JSON(w, http.StatusOK, values)
	}
}

func jiraPriorities(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, token, ok := jiraTokenForRequest(deps, w, r)
		if !ok {
			return
		}
		values, err := service.Priorities(r.Context(), token)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to get Jira priorities")
			return
		}
		JSON(w, http.StatusOK, values)
	}
}

func jiraHasPriority(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, token, ok := jiraTokenForRequest(deps, w, r)
		if !ok {
			return
		}
		value, err := service.HasPriority(r.Context(), token, chi.URLParam(r, "project_key"), chi.URLParam(r, "issue_type_id"))
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to check priority availability")
			return
		}
		JSON(w, http.StatusOK, map[string]bool{"hasPriority": value})
	}
}

func createJiraIssue(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, token, ok := jiraTokenForRequest(deps, w, r)
		if !ok {
			return
		}
		var input jira.IssueInput
		if err := decodeJSON(r, &input); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		value, err := service.CreateIssue(r.Context(), token, input)
		if errors.Is(err, jira.ErrAuth) {
			Error(w, http.StatusUnauthorized, err.Error())
			return
		}
		if err != nil {
			deps.Logger.Error().Err(err).Msg("create Jira issue failed")
			Error(w, http.StatusInternalServerError, "Failed to create Jira issue")
			return
		}
		JSON(w, http.StatusOK, map[string]any{"key": value["key"], "id": value["id"], "self": value["self"]})
	}
}

type jiraAgentConfigRequest struct {
	Enabled    bool    `json:"enabled"`
	ProjectKey *string `json:"projectKey"`
	IssueType  *string `json:"issueTypeId"`
}

func saveJiraAgentConfig(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredJira(deps, w)
		if !ok {
			return
		}
		organizationID, ok := jiraOrganization(w, r)
		if !ok {
			return
		}
		agentID, err := parsePathUUID(r, "agent_id")
		if err != nil || !jiraAgentBelongsToOrg(r, deps, agentID, organizationID) {
			Error(w, http.StatusNotFound, "Agent not found")
			return
		}
		var input jiraAgentConfigRequest
		if err := decodeJSON(r, &input); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if input.Enabled {
			if _, err := service.Repo.GetToken(r.Context(), organizationID); errors.Is(err, jira.ErrNotFound) {
				Error(w, http.StatusBadRequest, "Cannot enable Jira integration: Jira is not connected")
				return
			} else if err != nil {
				Error(w, http.StatusInternalServerError, "Failed to check Jira connection")
				return
			}
		}
		if err := service.Repo.UpsertAgentConfig(r.Context(), agentID, jira.AgentConfig{Enabled: input.Enabled, ProjectKey: input.ProjectKey, IssueTypeID: input.IssueType}); err != nil {
			Error(w, http.StatusInternalServerError, "Failed to save Jira agent configuration")
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Agent Jira configuration saved successfully"})
	}
}

func getJiraAgentConfig(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredJira(deps, w)
		if !ok {
			return
		}
		organizationID, ok := jiraOrganization(w, r)
		if !ok {
			return
		}
		agentID, err := parsePathUUID(r, "agent_id")
		if err != nil || !jiraAgentBelongsToOrg(r, deps, agentID, organizationID) {
			Error(w, http.StatusNotFound, "Agent not found")
			return
		}
		value, err := service.Repo.GetAgentConfig(r.Context(), agentID)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to get Jira agent configuration")
			return
		}
		JSON(w, http.StatusOK, value)
	}
}

func jiraTokenForRequest(deps Dependencies, w http.ResponseWriter, r *http.Request) (*jira.Service, *jira.Token, bool) {
	service, ok := configuredJira(deps, w)
	if !ok {
		return nil, nil, false
	}
	organizationID, ok := jiraOrganization(w, r)
	if !ok {
		return nil, nil, false
	}
	token, err := service.Repo.GetToken(r.Context(), organizationID)
	if errors.Is(err, jira.ErrNotFound) {
		Error(w, http.StatusNotFound, "No Jira connection found")
		return nil, nil, false
	}
	if err != nil {
		Error(w, http.StatusInternalServerError, "Failed to load Jira connection")
		return nil, nil, false
	}
	token, err = service.EnsureToken(r.Context(), token)
	if err != nil {
		Error(w, http.StatusUnauthorized, "Jira token expired and could not be refreshed")
		return nil, nil, false
	}
	return service, token, true
}

func jiraAgentBelongsToOrg(r *http.Request, deps Dependencies, agentID, organizationID uuid.UUID) bool {
	if deps.Agents == nil {
		return false
	}
	found, err := deps.Agents.Get(r.Context(), agentID, organizationID)
	return err == nil && found != nil
}

func jiraSettingsRedirect(deps Dependencies, status, reason string) string {
	values := url.Values{"status": {status}}
	if reason != "" {
		values.Set("reason", strings.ReplaceAll(reason, " ", "_"))
	}
	return strings.TrimRight(deps.Config.FrontendURL, "/") + "/settings/integrations?" + values.Encode()
}

func firstNonEmptyString(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}
