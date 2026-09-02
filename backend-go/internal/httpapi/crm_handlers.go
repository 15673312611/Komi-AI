package httpapi

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/komi/komi/backend-go/internal/crm"
)

const crmWebhookMaxBody = 4 << 20

type crmConnectionView struct {
	Provider          string     `json:"provider"`
	Status            string     `json:"status"`
	DisplayName       *string    `json:"display_name"`
	ExternalAccountID string     `json:"external_account_id"`
	LastError         *string    `json:"last_error"`
	CreatedAt         *time.Time `json:"created_at"`
	RecentFailures    int64      `json:"recent_failures"`
}

func registerCRMRoutes(r chi.Router, deps Dependencies) {
	manage := requireAllPermissions(deps, "manage_organization")
	r.With(manage).Get("/crm/connections", listCRMConnections(deps))
	r.With(manage).Get("/crm/{provider}/install", installCRM(deps))
	r.Get("/crm/{provider}/callback", crmOAuthCallback(deps))
	r.With(manage).Post("/crm/{provider}/test", testCRMConnection(deps))
	r.With(manage).Delete("/crm/{provider}", disconnectCRM(deps))
	r.Post("/crm/hubspot/uninstall", hubSpotUninstall(deps))
	r.Post("/crm/pipedrive/uninstall", pipeDriveUninstall(deps))
}

func listCRMConnections(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredCRM(deps, w)
		if !ok {
			return
		}
		organizationID, ok := requestOrganizationID(w, r)
		if !ok {
			return
		}
		connections, err := service.Repo.ListByOrganization(r.Context(), organizationID)
		if err != nil {
			deps.Logger.Error().Err(err).Msg("list CRM connections failed")
			Error(w, http.StatusInternalServerError, "Failed to fetch CRM connections")
			return
		}
		result := make([]crmConnectionView, 0, len(connections))
		for index := range connections {
			connection := &connections[index]
			failures, err := service.Repo.RecentFailures(r.Context(), organizationID, connection.Provider, time.Now().Add(-7*24*time.Hour))
			if err != nil {
				deps.Logger.Error().Err(err).Str("provider", connection.Provider).Msg("count CRM failures failed")
				Error(w, http.StatusInternalServerError, "Failed to fetch CRM connection health")
				return
			}
			result = append(result, crmConnectionView{
				Provider: connection.Provider, Status: connection.Status,
				DisplayName: connection.DisplayName, ExternalAccountID: connection.ExternalAccountID,
				LastError: connection.LastError, CreatedAt: connection.CreatedAt, RecentFailures: failures,
			})
		}
		JSON(w, http.StatusOK, result)
	}
}

func installCRM(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredCRM(deps, w)
		if !ok {
			return
		}
		provider := chi.URLParam(r, "provider")
		if !service.Supported(provider) {
			Error(w, http.StatusNotFound, "Unknown CRM provider")
			return
		}
		if !service.CredentialsConfigured(provider) {
			Error(w, http.StatusBadRequest, provider+" app credentials are not configured")
			return
		}
		organizationID, ok := requestOrganizationID(w, r)
		if !ok {
			return
		}
		state, err := newCRMState()
		if err != nil {
			deps.Logger.Error().Err(err).Msg("create CRM OAuth state failed")
			Error(w, http.StatusInternalServerError, "Failed to start CRM authorization")
			return
		}
		service.PutState(state, organizationID, provider)
		location, err := service.AuthorizationURL(provider, state)
		if err != nil {
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		http.Redirect(w, r, location, http.StatusTemporaryRedirect)
	}
}

func crmOAuthCallback(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredCRM(deps, w)
		if !ok {
			return
		}
		provider := chi.URLParam(r, "provider")
		if !service.Supported(provider) {
			Error(w, http.StatusNotFound, "Unknown CRM provider")
			return
		}
		if failure := r.URL.Query().Get("error"); failure != "" {
			http.Redirect(w, r, crmSettingsRedirect(deps, provider, "failure", crmCallbackReason(failure)), http.StatusTemporaryRedirect)
			return
		}
		state := r.URL.Query().Get("state")
		code := r.URL.Query().Get("code")
		organizationID, stateProvider, valid := service.PopState(state)
		if !valid || stateProvider != provider || code == "" {
			http.Redirect(w, r, crmSettingsRedirect(deps, provider, "failure", "invalid_state"), http.StatusTemporaryRedirect)
			return
		}
		connection, credentials, err := service.ExchangeCode(r.Context(), provider, code)
		if err != nil {
			deps.Logger.Error().Err(err).Str("provider", provider).Msg("CRM OAuth exchange failed")
			http.Redirect(w, r, crmSettingsRedirect(deps, provider, "failure", "oauth_failed"), http.StatusTemporaryRedirect)
			return
		}
		connection.OrganizationID = organizationID
		existing, err := service.Repo.GetByExternalID(r.Context(), provider, connection.ExternalAccountID)
		if err != nil && !errors.Is(err, crm.ErrNotFound) {
			deps.Logger.Error().Err(err).Msg("lookup CRM external account failed")
			http.Redirect(w, r, crmSettingsRedirect(deps, provider, "failure", "storage_failed"), http.StatusTemporaryRedirect)
			return
		}
		if existing != nil && existing.OrganizationID != organizationID {
			http.Redirect(w, r, crmSettingsRedirect(deps, provider, "failure", "account_connected_elsewhere"), http.StatusTemporaryRedirect)
			return
		}
		if _, err := service.Repo.Upsert(r.Context(), connection, credentials); err != nil {
			deps.Logger.Error().Err(err).Msg("save CRM connection failed")
			http.Redirect(w, r, crmSettingsRedirect(deps, provider, "failure", "storage_failed"), http.StatusTemporaryRedirect)
			return
		}
		if err := service.Repo.ReopenFailed(r.Context(), organizationID, provider); err != nil {
			deps.Logger.Warn().Err(err).Msg("reopen failed CRM sync jobs failed")
		}
		http.Redirect(w, r, crmSettingsRedirect(deps, provider, "success", ""), http.StatusTemporaryRedirect)
	}
}

func testCRMConnection(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredCRM(deps, w)
		if !ok {
			return
		}
		provider := chi.URLParam(r, "provider")
		if !service.Supported(provider) {
			Error(w, http.StatusNotFound, "Unknown CRM provider")
			return
		}
		organizationID, ok := requestOrganizationID(w, r)
		if !ok {
			return
		}
		connection, err := service.Repo.GetByOrganizationProvider(r.Context(), organizationID, provider)
		if errors.Is(err, crm.ErrNotFound) {
			Error(w, http.StatusNotFound, "CRM is not connected")
			return
		}
		if err != nil {
			deps.Logger.Error().Err(err).Msg("get CRM connection failed")
			Error(w, http.StatusInternalServerError, "Failed to fetch CRM connection")
			return
		}
		JSON(w, http.StatusOK, service.Test(r.Context(), connection))
	}
}

func disconnectCRM(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredCRM(deps, w)
		if !ok {
			return
		}
		provider := chi.URLParam(r, "provider")
		if !service.Supported(provider) {
			Error(w, http.StatusNotFound, "Unknown CRM provider")
			return
		}
		organizationID, ok := requestOrganizationID(w, r)
		if !ok {
			return
		}
		connection, err := service.Repo.GetByOrganizationProvider(r.Context(), organizationID, provider)
		if errors.Is(err, crm.ErrNotFound) {
			Error(w, http.StatusNotFound, "CRM is not connected")
			return
		}
		if err != nil {
			deps.Logger.Error().Err(err).Msg("get CRM connection for disconnect failed")
			Error(w, http.StatusInternalServerError, "Failed to fetch CRM connection")
			return
		}
		if err := service.Revoke(r.Context(), connection); err != nil {
			deps.Logger.Warn().Err(err).Str("provider", provider).Msg("CRM revoke failed during disconnect")
		}
		if err := service.Repo.SkipPending(r.Context(), organizationID, provider, "disconnected"); err != nil {
			deps.Logger.Warn().Err(err).Msg("skip pending CRM jobs failed")
		}
		if err := service.Repo.Delete(r.Context(), connection); err != nil {
			deps.Logger.Error().Err(err).Msg("delete CRM connection failed")
			Error(w, http.StatusInternalServerError, "Failed to disconnect CRM")
			return
		}
		JSON(w, http.StatusOK, map[string]string{"status": "disconnected"})
	}
}

func hubSpotUninstall(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredCRM(deps, w)
		if !ok {
			return
		}
		body, err := io.ReadAll(io.LimitReader(r.Body, crmWebhookMaxBody))
		if err != nil || !validHubSpotWebhook(service, r, body) {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		var payload any
		if json.Unmarshal(body, &payload) == nil {
			for _, event := range crmWebhookEvents(payload) {
				portalID := firstJSONValue(event, "portalId", "hub_id")
				kind := strings.ToLower(firstJSONValue(event, "subscriptionType") + firstJSONValue(event, "eventType"))
				if portalID != "" && strings.Contains(kind, "uninstall") {
					revokeCRMExternal(r, service, crm.ProviderHubSpot, portalID)
				}
			}
		}
		JSON(w, http.StatusOK, map[string]bool{"ok": true})
	}
}

func pipeDriveUninstall(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredCRM(deps, w)
		if !ok {
			return
		}
		if !service.ValidPipedriveBasic(r.Header.Get("Authorization")) {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		var payload map[string]any
		if err := decodeJSON(r, &payload); err != nil {
			payload = map[string]any{}
		}
		companyID := firstJSONValue(payload, "company_id")
		if companyID != "" {
			revokeCRMExternal(r, service, crm.ProviderPipedrive, companyID)
		}
		JSON(w, http.StatusOK, map[string]bool{"ok": true})
	}
}

func revokeCRMExternal(r *http.Request, service *crm.Service, provider, externalID string) {
	connection, err := service.Repo.GetByExternalID(r.Context(), provider, externalID)
	if err != nil || connection == nil {
		return
	}
	if err := service.Repo.SetStatus(r.Context(), connection, "revoked", "App uninstalled from the CRM"); err != nil {
		return
	}
	_ = service.Repo.SkipPending(r.Context(), connection.OrganizationID, provider, "app uninstalled")
}

func configuredCRM(deps Dependencies, w http.ResponseWriter) (*crm.Service, bool) {
	if deps.CRM == nil || deps.CRM.Repo == nil {
		Error(w, http.StatusInternalServerError, "CRM service is not configured")
		return nil, false
	}
	return deps.CRM, true
}

func requestOrganizationID(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	current, ok := currentUserFromContext(r)
	if !ok || current.OrganizationID == nil {
		Error(w, http.StatusForbidden, "User is not associated with any organization")
		return uuid.Nil, false
	}
	return *current.OrganizationID, true
}

func newCRMState() (string, error) {
	value := make([]byte, 24)
	if _, err := rand.Read(value); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(value), nil
}

func crmSettingsRedirect(deps Dependencies, provider, status, reason string) string {
	values := url.Values{"status": {status}, "integration": {provider}}
	if reason != "" {
		values.Set("reason", reason)
	}
	return strings.TrimRight(deps.Config.FrontendURL, "/") + "/settings/integrations?" + values.Encode()
}

func crmCallbackReason(value string) string {
	if value == "access_denied" {
		return "cancelled"
	}
	return value
}

func validHubSpotWebhook(service *crm.Service, r *http.Request, body []byte) bool {
	base := "http"
	if r.TLS != nil {
		base = "https"
	}
	if forwarded := strings.TrimSpace(strings.Split(r.Header.Get("X-Forwarded-Proto"), ",")[0]); depsTrustProxy(service, r) && (forwarded == "http" || forwarded == "https") {
		base = forwarded
	}
	fullURL := fmt.Sprintf("%s://%s%s", base, r.Host, r.URL.RequestURI())
	if service.ValidHubSpotSignature(r.Method, fullURL, body, r.Header.Get("X-HubSpot-Signature-v3"), r.Header.Get("X-HubSpot-Request-Timestamp")) {
		return true
	}
	if base == "https" {
		return service.ValidHubSpotSignature(r.Method, strings.Replace(fullURL, "https://", "http://", 1), body, r.Header.Get("X-HubSpot-Signature-v3"), r.Header.Get("X-HubSpot-Request-Timestamp"))
	}
	return service.ValidHubSpotSignature(r.Method, strings.Replace(fullURL, "http://", "https://", 1), body, r.Header.Get("X-HubSpot-Signature-v3"), r.Header.Get("X-HubSpot-Request-Timestamp"))
}

func depsTrustProxy(service *crm.Service, r *http.Request) bool {
	return service != nil && service.Config.TrustProxy && r.Header.Get("X-Forwarded-Proto") != ""
}

func crmWebhookEvents(value any) []map[string]any {
	if events, ok := value.([]any); ok {
		result := make([]map[string]any, 0, len(events))
		for _, item := range events {
			if event, ok := item.(map[string]any); ok {
				result = append(result, event)
			}
		}
		return result
	}
	if event, ok := value.(map[string]any); ok {
		return []map[string]any{event}
	}
	return nil
}

func firstJSONValue(value map[string]any, keys ...string) string {
	for _, key := range keys {
		if raw, ok := value[key]; ok {
			switch item := raw.(type) {
			case string:
				return item
			case float64:
				return fmt.Sprintf("%v", item)
			case json.Number:
				return item.String()
			}
		}
	}
	return ""
}
