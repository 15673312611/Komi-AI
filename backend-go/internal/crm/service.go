package crm

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"

	"github.com/chattermate/chattermate/backend-go/internal/config"
)

const (
	ProviderHubSpot   = "hubspot"
	ProviderPipedrive = "pipedrive"
)

var (
	ErrUnknownProvider = errors.New("Unknown CRM provider")
	ErrAuth            = errors.New("CRM authentication failed")
	ErrTransient       = errors.New("CRM provider is temporarily unavailable")
)

type Service struct {
	Repo       *Repository
	Config     config.Config
	HTTPClient *http.Client
	stateMu    sync.Mutex
	states     map[string]oauthState
}

type oauthState struct {
	OrganizationID uuid.UUID
	Provider       string
	ExpiresAt      time.Time
}

type TestResult struct {
	OK          bool    `json:"ok"`
	AccountName *string `json:"account_name"`
	Error       *string `json:"error"`
}

type LeadPayload struct {
	Email        string
	Name         string
	Company      string
	Phone        string
	Summary      string
	CustomFields map[string]string
	SourceURL    string
}

type PushResult struct {
	OK          bool
	Action      string
	ContactID   string
	SecondaryID string
	RecordURL   string
	Error       string
	Retryable   bool
	AuthFailed  bool
}

func NewService(repo *Repository, cfg config.Config) *Service {
	return &Service{Repo: repo, Config: cfg, HTTPClient: &http.Client{Timeout: 20 * time.Second}, states: make(map[string]oauthState)}
}

func (s *Service) Supported(provider string) bool {
	return provider == ProviderHubSpot || provider == ProviderPipedrive
}

func (s *Service) CredentialsConfigured(provider string) bool {
	switch provider {
	case ProviderHubSpot:
		return s.Config.HubSpotClientID != "" && s.Config.HubSpotClientSecret != ""
	case ProviderPipedrive:
		return s.Config.PipedriveClientID != "" && s.Config.PipedriveClientSecret != ""
	default:
		return false
	}
}

func (s *Service) RedirectURI(provider string) string {
	return strings.TrimRight(s.Config.BackendURL, "/") + s.Config.APIBasePath + "/crm/" + provider + "/callback"
}

func (s *Service) AuthorizationURL(provider, state string) (string, error) {
	if !s.Supported(provider) {
		return "", ErrUnknownProvider
	}
	if !s.CredentialsConfigured(provider) {
		return "", fmt.Errorf("%s app credentials are not configured", provider)
	}
	values := url.Values{"state": {state}, "redirect_uri": {s.RedirectURI(provider)}}
	if provider == ProviderHubSpot {
		values.Set("client_id", s.Config.HubSpotClientID)
		values.Set("scope", "crm.objects.contacts.read crm.objects.contacts.write")
		return "https://app.hubspot.com/oauth/authorize?" + values.Encode(), nil
	}
	values.Set("client_id", s.Config.PipedriveClientID)
	return "https://oauth.pipedrive.com/oauth/authorize?" + values.Encode(), nil
}

func (s *Service) PutState(state string, organizationID uuid.UUID, provider string) {
	s.stateMu.Lock()
	defer s.stateMu.Unlock()
	s.states[state] = oauthState{OrganizationID: organizationID, Provider: provider, ExpiresAt: time.Now().Add(10 * time.Minute)}
}

func (s *Service) PopState(state string) (uuid.UUID, string, bool) {
	s.stateMu.Lock()
	defer s.stateMu.Unlock()
	value, ok := s.states[state]
	delete(s.states, state)
	if !ok || time.Now().After(value.ExpiresAt) {
		return uuid.Nil, "", false
	}
	return value.OrganizationID, value.Provider, true
}

func (s *Service) ExchangeCode(ctx context.Context, provider, code string) (Connection, map[string]any, error) {
	if !s.Supported(provider) {
		return Connection{}, nil, ErrUnknownProvider
	}
	var body map[string]any
	var status int
	var err error
	if provider == ProviderHubSpot {
		body, status, err = s.form(ctx, "https://api.hubapi.com/oauth/v1/token", url.Values{
			"grant_type": {"authorization_code"}, "client_id": {s.Config.HubSpotClientID}, "client_secret": {s.Config.HubSpotClientSecret}, "redirect_uri": {s.RedirectURI(provider)}, "code": {code},
		})
	} else {
		body, status, err = s.basicForm(ctx, "https://oauth.pipedrive.com/oauth/token", url.Values{
			"grant_type": {"authorization_code"}, "code": {code}, "redirect_uri": {s.RedirectURI(provider)},
		}, s.Config.PipedriveClientID, s.Config.PipedriveClientSecret)
	}
	if err != nil {
		return Connection{}, nil, err
	}
	if status >= 500 {
		return Connection{}, nil, ErrTransient
	}
	if status < 200 || status >= 300 {
		return Connection{}, nil, ErrAuth
	}
	access := stringValue(body["access_token"])
	refresh := stringValue(body["refresh_token"])
	if access == "" {
		return Connection{}, nil, ErrAuth
	}
	credentials := map[string]any{"access_token": access, "refresh_token": refresh}
	connection := Connection{Provider: provider, ExternalAccountID: stringValue(body["hub_id"]), DisplayName: stringPointer(body["hub_domain"])}
	connection.AccessTokenExpiresAt = timePointerFromSeconds(body["expires_in"], 1800)
	if provider == ProviderHubSpot {
		info, infoStatus, infoErr := s.get(ctx, "https://api.hubapi.com/oauth/v1/access-tokens/"+url.PathEscape(access), "")
		if infoErr == nil && infoStatus >= 200 && infoStatus < 300 {
			connection.ExternalAccountID = stringValue(info["hub_id"])
			connection.DisplayName = stringPointer(info["hub_domain"])
		}
	} else {
		apiDomain := stringValue(body["api_domain"])
		if !validPipedriveDomain(apiDomain) {
			return Connection{}, nil, ErrAuth
		}
		credentials["api_domain"] = apiDomain
		info, infoStatus, infoErr := s.get(ctx, strings.TrimRight(apiDomain, "/")+"/api/v1/users/me", access)
		if infoErr == nil && infoStatus >= 200 && infoStatus < 300 {
			data := object(info, "data")
			connection.ExternalAccountID = stringValue(data["company_id"])
			connection.DisplayName = stringPointer(data["company_name"])
		}
		refreshExpiry := time.Now().Add(60 * 24 * time.Hour)
		connection.RefreshTokenExpiresAt = &refreshExpiry
	}
	if connection.ExternalAccountID == "" {
		return Connection{}, nil, ErrAuth
	}
	return connection, credentials, nil
}

func (s *Service) Test(ctx context.Context, connection *Connection) TestResult {
	result := TestResult{OK: false}
	credentials, err := s.Repo.Credentials(connection)
	if err != nil {
		message := err.Error()
		result.Error = &message
		return result
	}
	access := stringValue(credentials["access_token"])
	var body map[string]any
	var status int
	if connection.Provider == ProviderHubSpot {
		body, status, err = s.get(ctx, "https://api.hubapi.com/oauth/v1/access-tokens/"+url.PathEscape(access), "")
		if status == http.StatusOK {
			result.AccountName = stringPointer(body["hub_domain"])
		}
	} else {
		domain := stringValue(credentials["api_domain"])
		body, status, err = s.get(ctx, strings.TrimRight(domain, "/")+"/api/v1/users/me", access)
		if status == http.StatusOK {
			data := object(body, "data")
			result.AccountName = stringPointer(data["company_name"])
		}
	}
	if err != nil || status < 200 || status >= 300 {
		message := fmt.Sprintf("HTTP %d", status)
		if err != nil {
			message = err.Error()
		}
		result.Error = &message
		return result
	}
	result.OK = true
	return result
}

func (s *Service) Revoke(ctx context.Context, connection *Connection) error {
	credentials, err := s.Repo.Credentials(connection)
	if err != nil {
		return err
	}
	refresh := stringValue(credentials["refresh_token"])
	if refresh == "" {
		return nil
	}
	if connection.Provider == ProviderHubSpot {
		_, _, err = s.request(ctx, http.MethodDelete, "https://api.hubapi.com/oauth/v1/refresh-tokens/"+url.PathEscape(refresh), "", nil)
		return err
	}
	_, _, err = s.basicRequest(ctx, http.MethodPost, "https://oauth.pipedrive.com/oauth/revoke", url.Values{"token": {refresh}, "token_type_hint": {"refresh_token"}}, s.Config.PipedriveClientID, s.Config.PipedriveClientSecret)
	return err
}

// PushLead performs the synchronous provider operation used by the People
// drawer. It refreshes an expiring token and retries once after a provider
// returns 401, matching the Python manual-sync path.
func (s *Service) PushLead(ctx context.Context, connection *Connection, payload LeadPayload) (PushResult, error) {
	if s == nil || s.Repo == nil || connection == nil {
		return PushResult{}, errors.New("CRM is not configured")
	}
	credentials, err := s.Repo.Credentials(connection)
	if err != nil {
		return PushResult{}, err
	}
	credentials, err = s.ensureFreshCredentials(ctx, connection, credentials)
	if err != nil {
		return PushResult{}, err
	}
	result := s.pushWithCredentials(ctx, connection, credentials, payload)
	if !result.AuthFailed {
		return result, nil
	}
	refreshed, refreshErr := s.refreshCredentials(ctx, connection, credentials)
	if refreshErr != nil {
		if result.Error == "" {
			result.Error = refreshErr.Error()
		}
		result.AuthFailed = true
		return result, nil
	}
	return s.pushWithCredentials(ctx, connection, refreshed, payload), nil
}

func (s *Service) ensureFreshCredentials(ctx context.Context, connection *Connection, credentials map[string]any) (map[string]any, error) {
	if connection.AccessTokenExpiresAt == nil || connection.AccessTokenExpiresAt.After(time.Now().Add(5*time.Minute)) {
		return credentials, nil
	}
	return s.refreshCredentials(ctx, connection, credentials)
}

func (s *Service) refreshCredentials(ctx context.Context, connection *Connection, credentials map[string]any) (map[string]any, error) {
	refresh := stringValue(credentials["refresh_token"])
	if refresh == "" {
		return nil, ErrAuth
	}
	var body map[string]any
	var status int
	var err error
	if connection.Provider == ProviderHubSpot {
		body, status, err = s.form(ctx, "https://api.hubapi.com/oauth/v1/token", url.Values{
			"grant_type": {"refresh_token"}, "client_id": {s.Config.HubSpotClientID},
			"client_secret": {s.Config.HubSpotClientSecret}, "refresh_token": {refresh},
		})
	} else if connection.Provider == ProviderPipedrive {
		body, status, err = s.basicForm(ctx, "https://oauth.pipedrive.com/oauth/token", url.Values{
			"grant_type": {"refresh_token"}, "refresh_token": {refresh},
		}, s.Config.PipedriveClientID, s.Config.PipedriveClientSecret)
	} else {
		return nil, ErrUnknownProvider
	}
	if err != nil {
		return nil, ErrTransient
	}
	if status >= 500 || status == http.StatusTooManyRequests {
		return nil, ErrTransient
	}
	if status < 200 || status >= 300 {
		return nil, ErrAuth
	}
	access := stringValue(body["access_token"])
	if access == "" {
		return nil, ErrAuth
	}
	refreshed := map[string]any{}
	for key, value := range credentials {
		refreshed[key] = value
	}
	refreshed["access_token"] = access
	if next := stringValue(body["refresh_token"]); next != "" {
		refreshed["refresh_token"] = next
	}
	if connection.Provider == ProviderPipedrive {
		if domain := stringValue(body["api_domain"]); validPipedriveDomain(domain) {
			refreshed["api_domain"] = domain
		}
	}
	expires := time.Now().Add(time.Duration(numberValue(body["expires_in"], 1800)) * time.Second)
	refreshExpiry := connection.RefreshTokenExpiresAt
	if connection.Provider == ProviderPipedrive {
		value := time.Now().Add(60 * 24 * time.Hour)
		refreshExpiry = &value
	}
	if _, err := s.Repo.SaveCredentials(ctx, connection, refreshed, &expires, refreshExpiry); err != nil {
		return nil, err
	}
	connection.AccessTokenExpiresAt = &expires
	connection.RefreshTokenExpiresAt = refreshExpiry
	return refreshed, nil
}

func (s *Service) pushWithCredentials(ctx context.Context, connection *Connection, credentials map[string]any, payload LeadPayload) PushResult {
	switch connection.Provider {
	case ProviderHubSpot:
		return s.pushHubSpot(ctx, connection, credentials, payload)
	case ProviderPipedrive:
		return s.pushPipedrive(ctx, connection, credentials, payload)
	default:
		return PushResult{Error: ErrUnknownProvider.Error()}
	}
}

func (s *Service) pushHubSpot(ctx context.Context, connection *Connection, credentials map[string]any, payload LeadPayload) PushResult {
	access := stringValue(credentials["access_token"])
	first, last := splitName(payload.Name)
	properties := map[string]any{"email": strings.ToLower(strings.TrimSpace(payload.Email)), "firstname": first, "lastname": last, "phone": payload.Phone, "company": payload.Company, "lifecyclestage": "lead"}
	for key, value := range properties {
		if stringValue(value) == "" {
			delete(properties, key)
		}
	}
	body := map[string]any{"inputs": []any{map[string]any{"id": payload.Email, "idProperty": "email", "properties": properties}}}
	data, status, err := s.request(ctx, http.MethodPost, "https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert", access, body)
	if err != nil {
		return PushResult{Error: "network error: " + err.Error(), Retryable: true}
	}
	if status < 200 || status >= 300 {
		return classifyPushFailure(status, data)
	}
	var decoded map[string]any
	_ = json.Unmarshal(data, &decoded)
	items, _ := decoded["results"].([]any)
	firstItem := map[string]any{}
	if len(items) > 0 {
		firstItem = objectValue(items[0])
	}
	contactID := stringValue(firstItem["id"])
	action := "updated"
	if boolValue(firstItem["new"]) {
		action = "created"
	}
	s.attachHubSpotNote(ctx, access, contactID, payload)
	recordURL := ""
	if connection.ExternalAccountID != "" && contactID != "" {
		recordURL = "https://app.hubspot.com/contacts/" + connection.ExternalAccountID + "/record/0-1/" + contactID
	}
	return PushResult{OK: true, Action: action, ContactID: contactID, RecordURL: recordURL}
}

func (s *Service) attachHubSpotNote(ctx context.Context, access, contactID string, payload LeadPayload) {
	if contactID == "" {
		return
	}
	body := map[string]any{
		"properties":   map[string]any{"hs_timestamp": time.Now().UnixMilli(), "hs_note_body": buildNoteBody(payload)},
		"associations": []any{map[string]any{"to": map[string]any{"id": contactID}, "types": []any{map[string]any{"associationCategory": "HUBSPOT_DEFINED", "associationTypeId": 202}}}},
	}
	data, status, err := s.request(ctx, http.MethodPost, "https://api.hubapi.com/crm/v3/objects/notes", access, body)
	if err != nil || status < 200 || status >= 300 {
		safeLog := string(data)
		if len(safeLog) > 200 {
			safeLog = safeLog[:200]
		}
		_ = safeLog
	}
}

func (s *Service) pushPipedrive(ctx context.Context, connection *Connection, credentials map[string]any, payload LeadPayload) PushResult {
	domain := strings.TrimRight(stringValue(credentials["api_domain"]), "/")
	if !validPipedriveDomain(domain) {
		return PushResult{Error: "Pipedrive API domain is invalid", AuthFailed: true}
	}
	access := stringValue(credentials["access_token"])
	orgID := s.pipedriveOrganization(ctx, domain, access, payload.Company)
	personID, action, result := s.pipedrivePerson(ctx, domain, access, payload, orgID)
	if result.Error != "" || result.AuthFailed || result.Retryable {
		return result
	}
	leadID, result := s.pipedriveLead(ctx, domain, access, personID, payload, orgID)
	if result.Error != "" || result.AuthFailed || result.Retryable {
		return result
	}
	if leadID != "" {
		s.attachPipedriveNote(ctx, domain, access, leadID, payload)
	}
	recordURL := ""
	if personID != "" {
		recordURL = domain + "/person/" + personID
	}
	return PushResult{OK: true, Action: action, ContactID: personID, SecondaryID: leadID, RecordURL: recordURL}
}

func (s *Service) pipedriveOrganization(ctx context.Context, domain, access, company string) string {
	company = strings.TrimSpace(company)
	if company == "" {
		return ""
	}
	searchURL := domain + "/api/v2/organizations/search?" + url.Values{"term": {company}, "fields": {"name"}, "exact_match": {"true"}}.Encode()
	data, status, err := s.request(ctx, http.MethodGet, searchURL, access, nil)
	if err == nil && status >= 200 && status < 300 {
		var body map[string]any
		_ = json.Unmarshal(data, &body)
		if dataObject := objectValue(body["data"]); dataObject != nil {
			if items, ok := dataObject["items"].([]any); ok && len(items) > 0 {
				return stringValue(objectValue(objectValue(items[0])["item"])["id"])
			}
		}
	}
	data, status, err = s.request(ctx, http.MethodPost, domain+"/api/v2/organizations", access, map[string]any{"name": company})
	if err == nil && status >= 200 && status < 300 {
		var body map[string]any
		_ = json.Unmarshal(data, &body)
		return stringValue(objectValue(body["data"])["id"])
	}
	return ""
}

func (s *Service) pipedrivePerson(ctx context.Context, domain, access string, payload LeadPayload, orgID string) (string, string, PushResult) {
	searchURL := domain + "/api/v2/persons/search?" + url.Values{"term": {payload.Email}, "fields": {"email"}, "exact_match": {"true"}}.Encode()
	data, status, err := s.request(ctx, http.MethodGet, searchURL, access, nil)
	if err != nil {
		return "", "", PushResult{Error: "network error: " + err.Error(), Retryable: true}
	}
	if status < 200 || status >= 300 {
		return "", "", classifyPushFailure(status, data)
	}
	var body map[string]any
	_ = json.Unmarshal(data, &body)
	items := []any{}
	if dataObject := objectValue(body["data"]); dataObject != nil {
		items, _ = dataObject["items"].([]any)
	}
	if len(items) > 0 {
		item := objectValue(objectValue(items[0])["item"])
		personID := stringValue(item["id"])
		update := map[string]any{}
		if payload.Name != "" && stringValue(item["name"]) == "" {
			update["name"] = payload.Name
		}
		if payload.Phone != "" {
			if phones, ok := item["phones"].([]any); !ok || len(phones) == 0 {
				update["phones"] = []any{map[string]any{"value": payload.Phone, "primary": true}}
			}
		}
		if orgID != "" && stringValue(item["org_id"]) == "" {
			update["org_id"] = orgID
		}
		if len(update) > 0 {
			_, _, _ = s.request(ctx, http.MethodPatch, domain+"/api/v2/persons/"+url.PathEscape(personID), access, update)
		}
		return personID, "updated", PushResult{}
	}
	createBody := map[string]any{"name": firstNonEmpty(payload.Name, payload.Email), "emails": []any{map[string]any{"value": payload.Email, "primary": true}}}
	if payload.Phone != "" {
		createBody["phones"] = []any{map[string]any{"value": payload.Phone, "primary": true}}
	}
	if orgID != "" {
		createBody["org_id"] = orgID
	}
	data, status, err = s.request(ctx, http.MethodPost, domain+"/api/v2/persons", access, createBody)
	if err != nil {
		return "", "", PushResult{Error: "network error: " + err.Error(), Retryable: true}
	}
	if status < 200 || status >= 300 {
		return "", "", classifyPushFailure(status, data)
	}
	_ = json.Unmarshal(data, &body)
	return stringValue(objectValue(body["data"])["id"]), "created", PushResult{}
}

func (s *Service) pipedriveLead(ctx context.Context, domain, access, personID string, payload LeadPayload, orgID string) (string, PushResult) {
	values := url.Values{"person_id": {personID}, "archived_status": {"not_archived"}}
	data, status, err := s.request(ctx, http.MethodGet, domain+"/api/v1/leads?"+values.Encode(), access, nil)
	if err != nil {
		return "", PushResult{Error: "network error: " + err.Error(), Retryable: true}
	}
	if status < 200 || status >= 300 {
		return "", classifyPushFailure(status, data)
	}
	var body map[string]any
	_ = json.Unmarshal(data, &body)
	if existing, ok := body["data"].([]any); ok && len(existing) > 0 {
		return "", PushResult{}
	}
	leadBody := map[string]any{"title": firstNonEmpty(payload.Name, payload.Email) + " - ChatterMate lead", "person_id": personID}
	if orgID != "" {
		leadBody["organization_id"] = orgID
	}
	data, status, err = s.request(ctx, http.MethodPost, domain+"/api/v1/leads", access, leadBody)
	if err != nil {
		return "", PushResult{Error: "network error: " + err.Error(), Retryable: true}
	}
	if status < 200 || status >= 300 {
		return "", classifyPushFailure(status, data)
	}
	_ = json.Unmarshal(data, &body)
	return stringValue(objectValue(body["data"])["id"]), PushResult{}
}

func (s *Service) attachPipedriveNote(ctx context.Context, domain, access, leadID string, payload LeadPayload) {
	_, _, _ = s.request(ctx, http.MethodPost, domain+"/api/v1/notes", access, map[string]any{"lead_id": leadID, "content": buildNoteBody(payload)})
}

func classifyPushFailure(status int, data []byte) PushResult {
	message := strings.Join(strings.Fields(html.UnescapeString(string(data))), " ")
	if len(message) > 200 {
		message = message[:200]
	}
	if message == "" {
		message = http.StatusText(status)
	}
	result := PushResult{Error: fmt.Sprintf("HTTP %d: %s", status, message)}
	if status == http.StatusUnauthorized {
		result.AuthFailed = true
	}
	if status == http.StatusTooManyRequests || status >= 500 {
		result.Retryable = true
	}
	return result
}

func buildNoteBody(payload LeadPayload) string {
	lines := []string{"<b>Lead captured by ChatterMate</b>"}
	if payload.Summary != "" {
		lines = append(lines, "<b>AI summary:</b> "+html.EscapeString(payload.Summary))
	}
	for label, value := range payload.CustomFields {
		lines = append(lines, "<b>"+html.EscapeString(label)+":</b> "+html.EscapeString(value))
	}
	if payload.SourceURL != "" {
		source := html.EscapeString(payload.SourceURL)
		if strings.HasPrefix(strings.ToLower(payload.SourceURL), "http://") || strings.HasPrefix(strings.ToLower(payload.SourceURL), "https://") {
			lines = append(lines, "Captured on: <a href=\""+source+"\">"+source+"</a>")
		} else {
			lines = append(lines, "Captured on: "+source)
		}
	}
	return strings.Join(lines, "<br>")
}

func splitName(name string) (string, string) {
	parts := strings.Fields(name)
	if len(parts) == 0 {
		return "", ""
	}
	if len(parts) == 1 {
		return parts[0], ""
	}
	return strings.Join(parts[:len(parts)-1], " "), parts[len(parts)-1]
}

func objectValue(value any) map[string]any {
	if object, ok := value.(map[string]any); ok {
		return object
	}
	return map[string]any{}
}

func boolValue(value any) bool {
	result, _ := value.(bool)
	return result
}

func numberValue(value any, fallback int64) int64 {
	switch number := value.(type) {
	case float64:
		if number > 0 {
			return int64(number)
		}
	case json.Number:
		if parsed, err := number.Int64(); err == nil && parsed > 0 {
			return parsed
		}
	}
	return fallback
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func (s *Service) ValidHubSpotSignature(method, fullURL string, body []byte, signature, timestamp string) bool {
	if signature == "" || timestamp == "" || s.Config.HubSpotClientSecret == "" {
		return false
	}
	when, err := time.Parse("150405.000", timestamp)
	_ = when
	_ = err
	// HubSpot timestamps are epoch milliseconds. Keep the freshness check
	// explicit so replayed uninstall events cannot revoke a live connection.
	var millis int64
	if _, scanErr := fmt.Sscan(timestamp, &millis); scanErr != nil || time.Since(time.UnixMilli(millis)) > 5*time.Minute || time.Since(time.UnixMilli(millis)) < -5*time.Minute {
		return false
	}
	message := method + fullURL + string(body) + timestamp
	digest := hmac.New(sha256.New, []byte(s.Config.HubSpotClientSecret))
	_, _ = digest.Write([]byte(message))
	expected := base64.StdEncoding.EncodeToString(digest.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}

func (s *Service) ValidPipedriveBasic(header string) bool {
	const prefix = "Basic "
	if !strings.HasPrefix(header, prefix) {
		return false
	}
	decoded, err := base64.StdEncoding.DecodeString(strings.TrimSpace(strings.TrimPrefix(header, prefix)))
	return err == nil && hmac.Equal([]byte(decoded), []byte(s.Config.PipedriveClientID+":"+s.Config.PipedriveClientSecret))
}

func (s *Service) form(ctx context.Context, endpoint string, values url.Values) (map[string]any, int, error) {
	return s.formWithAuth(ctx, endpoint, values, "")
}

func (s *Service) basicForm(ctx context.Context, endpoint string, values url.Values, clientID, clientSecret string) (map[string]any, int, error) {
	return s.formWithAuth(ctx, endpoint, values, basicAuth(clientID, clientSecret))
}

func (s *Service) formWithAuth(ctx context.Context, endpoint string, values url.Values, auth string) (map[string]any, int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(values.Encode()))
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	if auth != "" {
		req.Header.Set("Authorization", auth)
	}
	return s.doJSON(req)
}

func (s *Service) get(ctx context.Context, endpoint, access string) (map[string]any, int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, 0, err
	}
	if access != "" {
		req.Header.Set("Authorization", "Bearer "+access)
	}
	return s.doJSON(req)
}

func (s *Service) request(ctx context.Context, method, endpoint, access string, body any) ([]byte, int, error) {
	var reader io.Reader
	if body != nil {
		encoded, err := json.Marshal(body)
		if err != nil {
			return nil, 0, err
		}
		reader = bytes.NewReader(encoded)
	}
	req, err := http.NewRequestWithContext(ctx, method, endpoint, reader)
	if err != nil {
		return nil, 0, err
	}
	if access != "" {
		req.Header.Set("Authorization", "Bearer "+access)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := s.client().Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()
	data, readErr := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	return data, resp.StatusCode, readErr
}

func (s *Service) basicRequest(ctx context.Context, method, endpoint string, values url.Values, clientID, clientSecret string) ([]byte, int, error) {
	req, err := http.NewRequestWithContext(ctx, method, endpoint, strings.NewReader(values.Encode()))
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Authorization", basicAuth(clientID, clientSecret))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := s.client().Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()
	data, readErr := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
	return data, resp.StatusCode, readErr
}

func (s *Service) doJSON(req *http.Request) (map[string]any, int, error) {
	resp, err := s.client().Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return nil, resp.StatusCode, err
	}
	var value map[string]any
	if len(data) > 0 {
		_ = json.Unmarshal(data, &value)
	}
	if value == nil {
		value = map[string]any{}
	}
	return value, resp.StatusCode, nil
}

func (s *Service) client() *http.Client {
	if s.HTTPClient != nil {
		return s.HTTPClient
	}
	return http.DefaultClient
}

func validPipedriveDomain(value string) bool {
	parsed, err := url.Parse(value)
	if err != nil || parsed.Scheme != "https" || parsed.Hostname() == "" {
		return false
	}
	host := strings.ToLower(parsed.Hostname())
	return host == "pipedrive.com" || strings.HasSuffix(host, ".pipedrive.com")
}

func basicAuth(id, secret string) string {
	return "Basic " + base64.StdEncoding.EncodeToString([]byte(id+":"+secret))
}

func stringValue(value any) string {
	switch text := value.(type) {
	case string:
		return text
	case float64:
		return strconv.FormatFloat(text, 'f', -1, 64)
	case json.Number:
		return text.String()
	case int:
		return strconv.Itoa(text)
	case int64:
		return strconv.FormatInt(text, 10)
	}
	return ""
}

func stringPointer(value any) *string {
	text := stringValue(value)
	if text == "" {
		return nil
	}
	return &text
}

func timePointerFromSeconds(value any, fallback int64) *time.Time {
	seconds := fallback
	if number, ok := value.(float64); ok && number > 0 {
		seconds = int64(number)
	}
	result := time.Now().Add(time.Duration(seconds) * time.Second)
	return &result
}

func object(value map[string]any, key string) map[string]any {
	if nested, ok := value[key].(map[string]any); ok {
		return nested
	}
	return map[string]any{}
}
