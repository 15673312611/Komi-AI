package httpapi

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/mail"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/chattermate/chattermate/backend-go/internal/channel"
	"github.com/chattermate/chattermate/backend-go/internal/chat"
	"github.com/chattermate/chattermate/backend-go/internal/config"
	"github.com/chattermate/chattermate/backend-go/internal/customer"
	"github.com/chattermate/chattermate/backend-go/internal/encryption"
	"github.com/chattermate/chattermate/backend-go/internal/session"
)

const (
	channelTypeTelegram  = "telegram"
	channelTypeWhatsApp  = "whatsapp"
	channelTypeMessenger = "messenger"
	channelTypeInstagram = "instagram"
	channelTypeSlack     = "slack"
	channelTypeEmail     = "email"
	channelTypeSMS       = "sms"
	channelTypeLine      = "line"
)

func registerChannelRoutes(r chi.Router, deps Dependencies) {
	manageOrg := requireAllPermissions(deps, "manage_organization")
	inbox := requireAnyPermissions(deps, "view_all_chats", "view_assigned_chats", "view_unassigned_chats", "manage_all_chats", "manage_assigned_chats")
	inboxSender := requireAnyPermissions(deps, "manage_all_chats", "manage_assigned_chats")

	r.With(inbox).Get("/channels/accounts", listChannelAccounts(deps))
	r.With(manageOrg).Post("/channels/agent-config/{account_id}", setChannelAgent(deps))
	r.With(manageOrg).Delete("/channels/agent-config/{account_id}", clearChannelAgent(deps))
	r.With(manageOrg).Post("/channels/email", connectEmail(deps))
	r.With(manageOrg).Get("/channels/email/{account_id}/webhook-url", emailWebhookURL(deps))
	r.With(manageOrg).Delete("/channels/email/{account_id}", disconnectChannel(deps, channelTypeEmail))
	r.With(manageOrg).Post("/channels/line", connectLine(deps))
	r.With(manageOrg).Delete("/channels/line/{account_id}", disconnectChannel(deps, channelTypeLine))
	r.With(manageOrg).Get("/channels/meta/embedded-signup-config", metaSignupConfig(deps))
	r.With(manageOrg).Post("/channels/meta/whatsapp", connectWhatsApp(deps))
	r.With(manageOrg).Post("/channels/meta/whatsapp/embedded-signup", connectWhatsAppSignup(deps))
	r.With(manageOrg).Post("/channels/meta/messenger", connectMessenger(deps))
	r.With(manageOrg).Post("/channels/meta/messenger/signup/pages", listMessengerPages(deps))
	r.With(manageOrg).Post("/channels/meta/messenger/signup/connect", connectMessengerSignup(deps))
	r.With(manageOrg).Post("/channels/meta/instagram/login/connect", connectInstagramLogin(deps))
	r.With(manageOrg).Post("/channels/meta/instagram", connectInstagram(deps))
	r.With(manageOrg).Delete("/channels/meta/{account_id}", disconnectChannel(deps, "meta"))
	r.With(manageOrg).Get("/channels/slack/install", installSlack(deps))
	r.Get("/channels/slack/callback", slackCallback(deps))
	r.With(manageOrg).Delete("/channels/slack/{account_id}", disconnectChannel(deps, channelTypeSlack))
	r.With(manageOrg).Get("/channels/sms/providers", listSMSProviders())
	r.With(manageOrg).Post("/channels/sms", connectSMS(deps))
	r.With(manageOrg).Delete("/channels/sms/{account_id}", disconnectChannel(deps, channelTypeSMS))
	r.With(manageOrg).Post("/channels/telegram", connectTelegram(deps))
	r.With(manageOrg).Delete("/channels/telegram/{account_id}", disconnectChannel(deps, channelTypeTelegram))
	registerChannelWebhookRoutes(r, deps)

	r.With(inboxSender).Post("/channels/meta/whatsapp/{account_id}/conversations", startWhatsAppConversation(deps))
	r.With(inboxSender).Post("/channels/meta/whatsapp/{account_id}/send-template", sendWhatsAppTemplate(deps))
	r.With(inbox).Get("/channels/meta/whatsapp/{account_id}/templates", listWhatsAppTemplates(deps))
	r.With(manageOrg).Get("/channels/meta/whatsapp/{account_id}/template-library", whatsappTemplateLibrary(deps))
}

func channelRepository(w http.ResponseWriter, deps Dependencies) *channel.Repository {
	if deps.Channels == nil {
		Error(w, http.StatusServiceUnavailable, "Channel storage is not configured")
		return nil
	}
	return deps.Channels
}

func channelOrganization(r *http.Request) (uuid.UUID, bool) {
	current, ok := currentUserFromContext(r)
	return func() (uuid.UUID, bool) {
		if !ok || current == nil || current.OrganizationID == nil {
			return uuid.Nil, false
		}
		return *current.OrganizationID, true
	}()
}

func channelOwnedAccount(w http.ResponseWriter, r *http.Request, deps Dependencies) (*channel.Account, uuid.UUID, bool) {
	repo := channelRepository(w, deps)
	if repo == nil {
		return nil, uuid.Nil, false
	}
	org, ok := channelOrganization(r)
	if !ok {
		Error(w, http.StatusForbidden, "User is not associated with any organization")
		return nil, uuid.Nil, false
	}
	id, err := uuid.Parse(chi.URLParam(r, "account_id"))
	if err != nil {
		Error(w, http.StatusNotFound, "Channel account not found")
		return nil, uuid.Nil, false
	}
	account, err := repo.GetOwned(r.Context(), id, org)
	if errors.Is(err, channel.ErrNotFound) {
		Error(w, http.StatusNotFound, "Channel account not found")
		return nil, uuid.Nil, false
	}
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return nil, uuid.Nil, false
	}
	return account, org, true
}

func channelAccountResponse(cfg config.Config, account *channel.Account, agentID *uuid.UUID, includeWebhook bool) map[string]any {
	result := map[string]any{
		"id":                  account.ID,
		"channel_type":        account.ChannelType,
		"external_account_id": account.ExternalAccountID,
		"display_name":        account.DisplayName,
		"is_active":           account.IsActive,
		"agent_id":            agentID,
		"created_at":          account.CreatedAt,
	}
	if includeWebhook {
		result["webhook_url"] = channelWebhookURL(cfg, account)
	} else {
		result["webhook_url"] = nil
	}
	return result
}

func channelWebhookURL(cfg config.Config, account *channel.Account) string {
	base := strings.TrimRight(cfg.BackendURL, "/") + cfg.APIBasePath + "/webhooks"
	switch account.ChannelType {
	case channelTypeEmail:
		return fmt.Sprintf("%s/email/%s?token=%s", base, account.ID, url.QueryEscape(account.WebhookSecret))
	case channelTypeSMS:
		provider := stringValueFromMap(account.Settings, "provider", "twilio")
		return fmt.Sprintf("%s/sms/%s/%s?token=%s", base, provider, account.ID, url.QueryEscape(account.WebhookSecret))
	default:
		return ""
	}
}

func listChannelAccounts(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := channelRepository(w, deps)
		if repo == nil {
			return
		}
		org, ok := channelOrganization(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		accounts, err := repo.List(r.Context(), org)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		current, _ := currentUserFromContext(r)
		includeWebhook := hasAllPermissions(current, "manage_organization")
		result := make([]map[string]any, 0, len(accounts))
		for i := range accounts {
			item := accounts[i]
			result = append(result, channelAccountResponse(deps.Config, &item.Account, item.AgentID, includeWebhook))
		}
		JSON(w, http.StatusOK, result)
	}
}

func setChannelAgent(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		account, org, ok := channelOwnedAccount(w, r, deps)
		if !ok {
			return
		}
		var body struct {
			AgentID  uuid.UUID `json:"agent_id"`
			IsActive *bool     `json:"is_active"`
		}
		if err := decodeJSON(r, &body); err != nil || body.AgentID == uuid.Nil {
			Error(w, http.StatusUnprocessableEntity, "agent_id is required")
			return
		}
		if deps.Agents == nil {
			Error(w, http.StatusServiceUnavailable, "Agent service is not configured")
			return
		}
		found, err := deps.Agents.Get(r.Context(), body.AgentID, org)
		if errors.Is(err, pgx.ErrNoRows) || found == nil {
			Error(w, http.StatusNotFound, "Agent not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		active := true
		if body.IsActive != nil {
			active = *body.IsActive
		}
		if err := deps.Channels.SetAgent(r.Context(), account.ID, org, body.AgentID, active); err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		updated, err := deps.Channels.GetByID(r.Context(), account.ID)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, channelAccountResponse(deps.Config, updated, func() *uuid.UUID {
			if active {
				return &body.AgentID
			}
			return nil
		}(), true))
	}
}

func clearChannelAgent(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		account, org, ok := channelOwnedAccount(w, r, deps)
		if !ok {
			return
		}
		if err := deps.Channels.ClearAgent(r.Context(), account.ID, org); errors.Is(err, channel.ErrNotFound) {
			Error(w, http.StatusNotFound, "Channel account not found")
			return
		} else if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]string{"status": "cleared"})
	}
}

func upsertChannelAccount(r *http.Request, repo *channel.Repository, org uuid.UUID, channelType, externalID string, credentials map[string]any, displayName string, settings map[string]any) (*channel.Account, bool, error) {
	existing, err := repo.GetByExternal(r.Context(), channelType, externalID)
	if err != nil && !errors.Is(err, channel.ErrNotFound) {
		return nil, false, err
	}
	if existing == nil || errors.Is(err, channel.ErrNotFound) {
		var display *string
		if displayName != "" {
			display = &displayName
		}
		account, err := repo.Create(r.Context(), org, channelType, externalID, credentials, display, settings)
		return account, true, err
	}
	if existing.OrganizationID != org {
		return nil, false, channel.ErrConflict
	}
	old, err := repo.Credentials(existing)
	if err != nil {
		return nil, false, err
	}
	for key, value := range credentials {
		if value != nil {
			old[key] = value
		}
	}
	if _, err := repo.UpdateCredentials(r.Context(), existing, old); err != nil {
		return nil, false, err
	}
	if settings != nil {
		merged := existing.Settings
		if merged == nil {
			merged = map[string]any{}
		}
		for key, value := range settings {
			merged[key] = value
		}
		if _, err := repo.UpdateSettings(r.Context(), existing, merged); err != nil {
			return nil, false, err
		}
	}
	updated, err := repo.SetActive(r.Context(), existing, true)
	return updated, false, err
}

type telegramConnectRequest struct {
	BotToken string `json:"bot_token"`
}

func connectTelegram(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := channelRepository(w, deps)
		if repo == nil {
			return
		}
		org, ok := channelOrganization(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		var body telegramConnectRequest
		if err := decodeJSON(r, &body); err != nil || strings.TrimSpace(body.BotToken) == "" {
			Error(w, http.StatusUnprocessableEntity, "bot_token is required")
			return
		}
		response, _, err := channel.Telegram(r.Context(), strings.TrimSpace(body.BotToken), "getMe", nil)
		if err != nil || !jsonBool(response, "ok") {
			Error(w, http.StatusBadRequest, "Invalid bot token")
			return
		}
		bot := jsonMap(response, "result")
		botID := jsonString(bot, "id")
		if botID == "" {
			Error(w, http.StatusBadRequest, "Invalid bot token")
			return
		}
		username := jsonString(bot, "username")
		display := "@" + firstNonEmpty(username, botID)
		account, created, err := upsertChannelAccount(r, repo, org, channelTypeTelegram, botID, map[string]any{"bot_token": strings.TrimSpace(body.BotToken)}, display, nil)
		if errors.Is(err, channel.ErrConflict) {
			Error(w, http.StatusConflict, "This bot is already connected to another organization")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		values := url.Values{"url": []string{webhookURLFor(deps.Config, "telegram", account.ID)}, "secret_token": []string{account.WebhookSecret}}
		values.Set("allowed_updates", `["message"]`)
		webhook, _, webhookErr := channel.Telegram(r.Context(), strings.TrimSpace(body.BotToken), "setWebhook", values)
		if webhookErr != nil || !jsonBool(webhook, "ok") {
			if created {
				_ = repo.Delete(r.Context(), account)
			}
			Error(w, http.StatusBadGateway, "Failed to register Telegram webhook")
			return
		}
		JSON(w, http.StatusOK, channelAccountResponse(deps.Config, account, nil, true))
	}
}

type emailConnectRequest struct {
	InboundAddress string `json:"inbound_address"`
	DisplayName    string `json:"display_name"`
	SMTPHost       string `json:"smtp_host"`
	SMTPPort       int    `json:"smtp_port"`
	SMTPUsername   string `json:"smtp_username"`
	SMTPPassword   string `json:"smtp_password"`
	FromEmail      string `json:"from_email"`
	SMTPUseSSL     *bool  `json:"smtp_use_ssl"`
}

func connectEmail(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := channelRepository(w, deps)
		if repo == nil {
			return
		}
		org, ok := channelOrganization(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		var body emailConnectRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		parsed, err := mail.ParseAddress(strings.TrimSpace(body.InboundAddress))
		if err != nil || !strings.Contains(parsed.Address, "@") {
			Error(w, http.StatusBadRequest, "Enter a valid email address")
			return
		}
		address := strings.ToLower(parsed.Address)
		credentials := map[string]any{}
		if strings.TrimSpace(body.SMTPHost) != "" {
			if strings.TrimSpace(body.SMTPUsername) == "" || body.SMTPPassword == "" {
				Error(w, http.StatusBadRequest, "SMTP username and password are required when an SMTP host is set")
				return
			}
			port := body.SMTPPort
			if port == 0 {
				port = 587
			}
			useSSL := port == 465
			if body.SMTPUseSSL != nil {
				useSSL = *body.SMTPUseSSL
			}
			credentials = map[string]any{"smtp_host": strings.TrimSpace(body.SMTPHost), "smtp_port": port, "smtp_username": body.SMTPUsername, "smtp_password": body.SMTPPassword, "from_email": firstNonEmpty(strings.ToLower(strings.TrimSpace(body.FromEmail)), address), "smtp_use_ssl": useSSL}
		}
		display := firstNonEmpty(strings.TrimSpace(body.DisplayName), address)
		account, _, err := upsertChannelAccount(r, repo, org, channelTypeEmail, address, credentials, display, nil)
		if errors.Is(err, channel.ErrConflict) {
			Error(w, http.StatusConflict, "This address is already connected to another organization")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, channelAccountResponse(deps.Config, account, nil, true))
	}
}

func emailWebhookURL(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		account, _, ok := channelOwnedAccount(w, r, deps)
		if !ok {
			return
		}
		if account.ChannelType != channelTypeEmail {
			Error(w, http.StatusNotFound, "Channel account not found")
			return
		}
		JSON(w, http.StatusOK, map[string]string{"webhook_url": channelWebhookURL(deps.Config, account)})
	}
}

type lineConnectRequest struct {
	ChannelSecret      string `json:"channel_secret"`
	ChannelAccessToken string `json:"channel_access_token"`
}

func connectLine(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := channelRepository(w, deps)
		if repo == nil {
			return
		}
		org, ok := channelOrganization(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		var body lineConnectRequest
		if err := decodeJSON(r, &body); err != nil || strings.TrimSpace(body.ChannelSecret) == "" || strings.TrimSpace(body.ChannelAccessToken) == "" {
			Error(w, http.StatusUnprocessableEntity, "channel_secret and channel_access_token are required")
			return
		}
		profile, _, err := channel.Line(r.Context(), http.MethodGet, "/v2/bot/info", strings.TrimSpace(body.ChannelAccessToken), nil)
		if err != nil || jsonString(profile, "userId") == "" {
			Error(w, http.StatusBadRequest, "Invalid LINE channel access token")
			return
		}
		externalID := jsonString(profile, "userId")
		display := firstNonEmpty(jsonString(profile, "displayName"), jsonString(profile, "basicId"), externalID)
		account, _, err := upsertChannelAccount(r, repo, org, channelTypeLine, externalID, map[string]any{"channel_access_token": strings.TrimSpace(body.ChannelAccessToken), "channel_secret": strings.TrimSpace(body.ChannelSecret)}, display, nil)
		if errors.Is(err, channel.ErrConflict) {
			Error(w, http.StatusConflict, "This LINE account is already connected to another organization")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		_, _, _ = channel.Line(r.Context(), http.MethodPut, "/v2/bot/channel/webhook/endpoint", body.ChannelAccessToken, map[string]string{"endpoint": webhookURLFor(deps.Config, "line", account.ID)})
		JSON(w, http.StatusOK, channelAccountResponse(deps.Config, account, nil, true))
	}
}

type smsConnectRequest struct {
	Provider    string         `json:"provider"`
	PhoneNumber string         `json:"phone_number"`
	Credentials map[string]any `json:"credentials"`
}

type smsProviderInfo struct {
	Name   string           `json:"name"`
	Label  string           `json:"label"`
	Fields []map[string]any `json:"fields"`
}

func listSMSProviders() http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		JSON(w, http.StatusOK, []smsProviderInfo{
			{Name: "twilio", Label: "Twilio", Fields: []map[string]any{{"key": "account_sid", "label": "Account SID", "secret": false, "optional": false}, {"key": "auth_token", "label": "Auth token", "secret": true, "optional": false}}},
			{Name: "vonage", Label: "Vonage", Fields: []map[string]any{{"key": "api_key", "label": "API key", "secret": false, "optional": false}, {"key": "api_secret", "label": "API secret", "secret": true, "optional": false}}},
			{Name: "messagebird", Label: "MessageBird", Fields: []map[string]any{{"key": "access_key", "label": "Access key", "secret": true, "optional": false}}},
			{Name: "plivo", Label: "Plivo", Fields: []map[string]any{{"key": "auth_id", "label": "Auth ID", "secret": false, "optional": false}, {"key": "auth_token", "label": "Auth token", "secret": true, "optional": false}}},
			{Name: "sns", Label: "Amazon SNS", Fields: []map[string]any{{"key": "region", "label": "AWS region", "secret": false, "optional": false}, {"key": "access_key_id", "label": "Access key ID", "secret": true, "optional": false}, {"key": "secret_access_key", "label": "Secret access key", "secret": true, "optional": false}}},
			{Name: "brevo", Label: "Brevo", Fields: []map[string]any{{"key": "api_key", "label": "API key", "secret": true, "optional": false}}},
		})
	}
}

func connectSMS(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := channelRepository(w, deps)
		if repo == nil {
			return
		}
		org, ok := channelOrganization(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		var body smsConnectRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		provider := strings.ToLower(strings.TrimSpace(body.Provider))
		if !map[string]bool{"twilio": true, "vonage": true, "messagebird": true, "plivo": true, "sns": true, "brevo": true}[provider] {
			Error(w, http.StatusBadRequest, "Unknown SMS provider '"+provider+"'")
			return
		}
		phone := strings.TrimSpace(body.PhoneNumber)
		if phone == "" || body.Credentials == nil {
			Error(w, http.StatusBadRequest, "phone_number and credentials are required")
			return
		}
		required := map[string][]string{"twilio": {"account_sid", "auth_token"}, "vonage": {"api_key", "api_secret"}, "messagebird": {"access_key"}, "plivo": {"auth_id", "auth_token"}, "sns": {"region", "access_key_id", "secret_access_key"}, "brevo": {"api_key"}}
		for _, key := range required[provider] {
			if strings.TrimSpace(jsonString(body.Credentials, key)) == "" {
				Error(w, http.StatusBadRequest, key+" is required")
				return
			}
		}
		display := fmt.Sprintf("SMS %s (%s)", phone, provider)
		account, _, err := upsertChannelAccount(r, repo, org, channelTypeSMS, phone, body.Credentials, display, map[string]any{"provider": provider})
		if errors.Is(err, channel.ErrConflict) {
			Error(w, http.StatusConflict, "This number is already connected to another organization")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, channelAccountResponse(deps.Config, account, nil, true))
	}
}

type whatsappConnectRequest struct {
	PhoneNumberID string `json:"phone_number_id"`
	AccessToken   string `json:"access_token"`
	WABAID        string `json:"waba_id"`
	DisplayName   string `json:"display_name"`
}

func connectWhatsApp(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body whatsappConnectRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if strings.TrimSpace(body.PhoneNumberID) == "" || strings.TrimSpace(body.AccessToken) == "" {
			Error(w, http.StatusUnprocessableEntity, "phone_number_id and access_token are required")
			return
		}
		profile, _, err := channel.Graph(r.Context(), deps.Config, http.MethodGet, body.PhoneNumberID, body.AccessToken, url.Values{"fields": []string{"display_phone_number,verified_name"}}, nil, false)
		if err != nil {
			Error(w, http.StatusBadRequest, "Could not verify WhatsApp credentials: "+remoteMessage(err))
			return
		}
		account, _, err := connectMetaAccount(r, deps, channelTypeWhatsApp, body.PhoneNumberID, map[string]any{"access_token": body.AccessToken, "waba_id": nullableString(body.WABAID)}, firstNonEmpty(body.DisplayName, fmt.Sprintf("WhatsApp (%s)", firstNonEmpty(jsonString(profile, "display_phone_number"), body.PhoneNumberID))))
		if err != nil {
			writeChannelAccountError(w, err)
			return
		}
		JSON(w, http.StatusOK, channelAccountResponse(deps.Config, account, nil, false))
	}
}

type embeddedSignupRequest struct {
	Code          string `json:"code"`
	WABAID        string `json:"waba_id"`
	PhoneNumberID string `json:"phone_number_id"`
	DisplayName   string `json:"display_name"`
}

func connectWhatsAppSignup(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok || current == nil {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		if !metaSignupAllowed(deps.Config, "whatsapp", current.Email) {
			Error(w, http.StatusForbidden, "Signup is not configured on this deployment for this channel")
			return
		}
		var body embeddedSignupRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		org, hasOrg := channelOrganization(r)
		if !hasOrg || body.Code == "" || body.WABAID == "" || body.PhoneNumberID == "" {
			Error(w, http.StatusBadRequest, "code, waba_id and phone_number_id are required")
			return
		}
		exchanged, _, err := channel.Graph(r.Context(), deps.Config, http.MethodGet, "oauth/access_token", "", url.Values{"client_id": []string{deps.Config.MetaAppID}, "client_secret": []string{deps.Config.MetaAppSecret}, "code": []string{body.Code}}, nil, false)
		if err != nil || jsonString(exchanged, "access_token") == "" {
			Error(w, http.StatusBadRequest, "Could not complete signup - please try connecting again")
			return
		}
		accessToken := jsonString(exchanged, "access_token")
		profile, _, err := channel.Graph(r.Context(), deps.Config, http.MethodGet, body.WABAID+"/phone_numbers", accessToken, url.Values{"fields": []string{"id,display_phone_number,verified_name"}}, nil, false)
		if err != nil || !containsID(jsonSlice(profile, "data"), body.PhoneNumberID) {
			Error(w, http.StatusBadRequest, "That number is not on this WhatsApp Business Account")
			return
		}
		account, _, err := connectMetaAccountForOrg(r, deps, org, channelTypeWhatsApp, body.PhoneNumberID, map[string]any{"access_token": accessToken, "waba_id": body.WABAID}, firstNonEmpty(body.DisplayName, "WhatsApp ("+body.PhoneNumberID+")"))
		if err != nil {
			writeChannelAccountError(w, err)
			return
		}
		JSON(w, http.StatusOK, channelAccountResponse(deps.Config, account, nil, false))
	}
}

type messengerConnectRequest struct {
	PageID          string `json:"page_id"`
	PageAccessToken string `json:"page_access_token"`
	DisplayName     string `json:"display_name"`
}

func connectMessenger(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body messengerConnectRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if body.PageID == "" || body.PageAccessToken == "" {
			Error(w, http.StatusUnprocessableEntity, "page_id and page_access_token are required")
			return
		}
		debug, _, err := channel.Graph(r.Context(), deps.Config, http.MethodGet, "debug_token", "", url.Values{"access_token": []string{deps.Config.MetaAppID + "|" + deps.Config.MetaAppSecret}, "input_token": []string{body.PageAccessToken}}, nil, false)
		if err != nil {
			Error(w, http.StatusBadRequest, "That token is not valid")
			return
		}
		data := jsonMap(debug, "data")
		if !jsonBool(data, "is_valid") || strings.ToUpper(jsonString(data, "type")) != "PAGE" || jsonString(data, "profile_id") != body.PageID {
			Error(w, http.StatusBadRequest, "The Page access token does not match the Page ID")
			return
		}
		page, _, _ := channel.Graph(r.Context(), deps.Config, http.MethodGet, body.PageID, body.PageAccessToken, url.Values{"fields": []string{"name"}}, nil, false)
		account, _, err := connectMetaAccount(r, deps, channelTypeMessenger, body.PageID, map[string]any{"access_token": body.PageAccessToken}, firstNonEmpty(body.DisplayName, jsonString(page, "name"), body.PageID))
		if err != nil {
			writeChannelAccountError(w, err)
			return
		}
		JSON(w, http.StatusOK, channelAccountResponse(deps.Config, account, nil, false))
	}
}

type messengerSignupRequest struct {
	Code        string `json:"code"`
	RedirectURI string `json:"redirect_uri"`
}

func listMessengerPages(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok || current == nil || !metaSignupAllowed(deps.Config, "messenger", current.Email) {
			Error(w, http.StatusForbidden, "Signup is not configured on this deployment for this channel")
			return
		}
		org, ok := channelOrganization(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		var body messengerSignupRequest
		if err := decodeJSON(r, &body); err != nil || body.Code == "" {
			Error(w, http.StatusUnprocessableEntity, "code and redirect_uri are required")
			return
		}
		exchanged, _, err := channel.Graph(r.Context(), deps.Config, http.MethodGet, "oauth/access_token", "", url.Values{"client_id": []string{deps.Config.MetaAppID}, "client_secret": []string{deps.Config.MetaAppSecret}, "code": []string{body.Code}, "redirect_uri": []string{body.RedirectURI}}, nil, false)
		if err != nil {
			Error(w, http.StatusBadRequest, "Could not complete signup - please try connecting again")
			return
		}
		userToken := jsonString(exchanged, "access_token")
		pagesResponse, _, err := channel.Graph(r.Context(), deps.Config, http.MethodGet, "me/accounts", userToken, url.Values{"fields": []string{"id,name,access_token"}, "limit": []string{"100"}}, nil, false)
		if err != nil {
			Error(w, http.StatusBadRequest, "Could not list your Facebook Pages")
			return
		}
		pages := jsonSlice(pagesResponse, "data")
		if len(pages) == 0 {
			Error(w, http.StatusBadRequest, "No Facebook Pages were shared with ChatterMate")
			return
		}
		payload := map[string]any{"org": org.String(), "exp": time.Now().Add(10 * time.Minute).Unix(), "pages": pages}
		encoded, _ := json.Marshal(payload)
		sealed, err := encryption.Encrypt(string(encoded))
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		result := make([]map[string]string, 0, len(pages))
		for _, page := range pages {
			result = append(result, map[string]string{"id": jsonString(page, "id"), "name": firstNonEmpty(jsonString(page, "name"), jsonString(page, "id"))})
		}
		JSON(w, http.StatusOK, map[string]any{"pages": result, "signup_token": sealed})
	}
}

type messengerSignupConnectRequest struct {
	SignupToken string `json:"signup_token"`
	PageID      string `json:"page_id"`
	DisplayName string `json:"display_name"`
}

func connectMessengerSignup(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok || current == nil || !metaSignupAllowed(deps.Config, "messenger", current.Email) {
			Error(w, http.StatusForbidden, "Signup is not configured on this deployment for this channel")
			return
		}
		org, ok := channelOrganization(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		var body messengerSignupConnectRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		plain, err := encryption.Decrypt(body.SignupToken)
		if err != nil {
			Error(w, http.StatusBadRequest, "That signup has expired - please connect again")
			return
		}
		var payload struct {
			Org   string           `json:"org"`
			Exp   int64            `json:"exp"`
			Pages []map[string]any `json:"pages"`
		}
		if json.Unmarshal([]byte(plain), &payload) != nil || payload.Org != org.String() || payload.Exp <= time.Now().Unix() {
			Error(w, http.StatusBadRequest, "That signup has expired - please connect again")
			return
		}
		var selected map[string]any
		for _, page := range payload.Pages {
			if jsonString(page, "id") == body.PageID {
				selected = page
				break
			}
		}
		if selected == nil || jsonString(selected, "access_token") == "" {
			Error(w, http.StatusBadRequest, "That Page was not part of this signup")
			return
		}
		account, _, err := connectMetaAccountForOrg(r, deps, org, channelTypeMessenger, body.PageID, map[string]any{"access_token": jsonString(selected, "access_token")}, firstNonEmpty(body.DisplayName, jsonString(selected, "name"), body.PageID))
		if err != nil {
			writeChannelAccountError(w, err)
			return
		}
		JSON(w, http.StatusOK, channelAccountResponse(deps.Config, account, nil, false))
	}
}

type instagramLoginRequest struct {
	Code        string `json:"code"`
	RedirectURI string `json:"redirect_uri"`
	DisplayName string `json:"display_name"`
}

func connectInstagramLogin(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok || current == nil || !metaSignupAllowed(deps.Config, "instagram", current.Email) {
			Error(w, http.StatusForbidden, "Signup is not configured on this deployment for this channel")
			return
		}
		org, ok := channelOrganization(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		var body instagramLoginRequest
		if err := decodeJSON(r, &body); err != nil || body.Code == "" || body.RedirectURI == "" {
			Error(w, http.StatusUnprocessableEntity, "code and redirect_uri are required")
			return
		}
		data, _, err := channel.FormRequest(r.Context(), http.MethodPost, "https://api.instagram.com/oauth/access_token", url.Values{"client_id": []string{deps.Config.InstagramAppID}, "client_secret": []string{deps.Config.InstagramAppSecret}, "grant_type": []string{"authorization_code"}, "redirect_uri": []string{body.RedirectURI}, "code": []string{body.Code}}, "")
		if err != nil {
			Error(w, http.StatusBadRequest, "Could not complete Instagram login - please try connecting again")
			return
		}
		token := jsonString(data, "access_token")
		accountID := jsonString(data, "user_id")
		profile, _, profileErr := channel.Graph(r.Context(), deps.Config, http.MethodGet, "me", token, url.Values{"fields": []string{"user_id,username"}}, nil, true)
		if profileErr == nil {
			accountID = firstNonEmpty(jsonString(profile, "user_id"), accountID)
		}
		if token == "" || accountID == "" {
			Error(w, http.StatusBadRequest, "Could not complete Instagram login - please try connecting again")
			return
		}
		account, _, err := connectMetaAccountForOrg(r, deps, org, channelTypeInstagram, accountID, map[string]any{"access_token": token}, firstNonEmpty(body.DisplayName, "@"+firstNonEmpty(jsonString(profile, "username"), accountID)))
		if err != nil {
			writeChannelAccountError(w, err)
			return
		}
		JSON(w, http.StatusOK, channelAccountResponse(deps.Config, account, nil, false))
	}
}

type instagramConnectRequest struct {
	IGID            string `json:"ig_id"`
	PageAccessToken string `json:"page_access_token"`
	DisplayName     string `json:"display_name"`
}

func connectInstagram(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body instagramConnectRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		profile, _, err := channel.Graph(r.Context(), deps.Config, http.MethodGet, body.IGID, body.PageAccessToken, url.Values{"fields": []string{"id,username"}}, nil, false)
		if err != nil || jsonString(profile, "id") != body.IGID {
			Error(w, http.StatusBadRequest, "The ID entered is not an Instagram professional account ID")
			return
		}
		account, _, err := connectMetaAccount(r, deps, channelTypeInstagram, body.IGID, map[string]any{"access_token": body.PageAccessToken}, firstNonEmpty(body.DisplayName, "@"+firstNonEmpty(jsonString(profile, "username"), body.IGID)))
		if err != nil {
			writeChannelAccountError(w, err)
			return
		}
		JSON(w, http.StatusOK, channelAccountResponse(deps.Config, account, nil, false))
	}
}

func metaSignupConfig(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		channelName := strings.ToLower(r.URL.Query().Get("channel"))
		if channelName == "" {
			channelName = channelTypeWhatsApp
		}
		if channelName != channelTypeWhatsApp && channelName != channelTypeMessenger && channelName != channelTypeInstagram {
			Error(w, http.StatusNotFound, "No signup flow for this channel")
			return
		}
		current, _ := currentUserFromContext(r)
		email := ""
		if current != nil {
			email = current.Email
		}
		enabled := metaSignupAllowed(deps.Config, channelName, email)
		configID := ""
		appID := deps.Config.MetaAppID
		if channelName == channelTypeWhatsApp {
			configID = deps.Config.MetaConfigID
		} else if channelName == channelTypeMessenger {
			configID = deps.Config.MetaMessengerConfigID
		} else {
			appID = deps.Config.InstagramAppID
		}
		if !enabled {
			configID, appID = "", ""
		}
		JSON(w, http.StatusOK, map[string]any{"enabled": enabled, "config_id": nullableString(configID), "app_id": nullableString(appID), "graph_version": firstNonEmpty(deps.Config.MetaGraphVersion, "v21.0")})
	}
}

func connectMetaAccount(r *http.Request, deps Dependencies, channelType, externalID string, credentials map[string]any, display string) (*channel.Account, bool, error) {
	org, ok := channelOrganization(r)
	if !ok {
		return nil, false, errors.New("organization is required")
	}
	return connectMetaAccountForOrg(r, deps, org, channelType, externalID, credentials, display)
}

func connectMetaAccountForOrg(r *http.Request, deps Dependencies, org uuid.UUID, channelType, externalID string, credentials map[string]any, display string) (*channel.Account, bool, error) {
	return upsertChannelAccount(r, deps.Channels, org, channelType, externalID, credentials, display, nil)
}

func writeChannelAccountError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, channel.ErrConflict):
		Error(w, http.StatusConflict, "This account is already connected to another organization")
	case errors.Is(err, channel.ErrNotFound):
		Error(w, http.StatusNotFound, "Channel account not found")
	default:
		Error(w, http.StatusInternalServerError, err.Error())
	}
}

func disconnectChannel(deps Dependencies, expected string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		account, _, ok := channelOwnedAccount(w, r, deps)
		if !ok {
			return
		}
		if expected == "meta" {
			if account.ChannelType != channelTypeWhatsApp && account.ChannelType != channelTypeMessenger && account.ChannelType != channelTypeInstagram {
				Error(w, http.StatusNotFound, "Channel account not found")
				return
			}
		} else if account.ChannelType != expected {
			Error(w, http.StatusNotFound, "Channel account not found")
			return
		}
		if account.ChannelType == channelTypeTelegram {
			if credentials, err := deps.Channels.Credentials(account); err == nil {
				_, _, _ = channel.Telegram(r.Context(), jsonString(credentials, "bot_token"), "deleteWebhook", nil)
			}
		}
		if account.ChannelType == channelTypeSlack {
			if credentials, err := deps.Channels.Credentials(account); err == nil {
				_, _, _ = channel.FormRequest(r.Context(), http.MethodPost, "https://slack.com/api/auth.revoke", url.Values{}, jsonString(credentials, "access_token"))
			}
		}
		if err := deps.Channels.Delete(r.Context(), account); err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]string{"status": "disconnected"})
	}
}

type slackState struct {
	OrganizationID uuid.UUID
	ExpiresAt      time.Time
}

var slackStates = struct {
	sync.Mutex
	values map[string]slackState
}{values: map[string]slackState{}}

func installSlack(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		org, ok := channelOrganization(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		if deps.Config.SlackClientID == "" || deps.Config.SlackClientSecret == "" {
			Error(w, http.StatusBadRequest, "Slack app credentials are not configured")
			return
		}
		state := randomURLToken()
		slackStates.Lock()
		slackStates.values[state] = slackState{OrganizationID: org, ExpiresAt: time.Now().Add(10 * time.Minute)}
		slackStates.Unlock()
		params := url.Values{"client_id": []string{deps.Config.SlackClientID}, "scope": []string{"app_mentions:read,chat:write,im:history,users:read"}, "redirect_uri": []string{slackCallbackURL(deps.Config)}, "state": []string{state}}
		redirect := "https://slack.com/oauth/v2/authorize?" + params.Encode()
		http.Redirect(w, r, redirect, http.StatusFound)
	}
}

func slackCallback(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		status, reason := "success", ""
		if value := r.URL.Query().Get("error"); value != "" {
			status, reason = "failure", value
		} else {
			state := r.URL.Query().Get("state")
			slackStates.Lock()
			entry, found := slackStates.values[state]
			delete(slackStates.values, state)
			slackStates.Unlock()
			if !found || time.Now().After(entry.ExpiresAt) || r.URL.Query().Get("code") == "" {
				status, reason = "failure", "invalid_state"
			} else {
				data, _, err := channel.FormRequest(r.Context(), http.MethodPost, "https://slack.com/api/oauth.v2.access", url.Values{"client_id": []string{deps.Config.SlackClientID}, "client_secret": []string{deps.Config.SlackClientSecret}, "code": []string{r.URL.Query().Get("code")}, "redirect_uri": []string{slackCallbackURL(deps.Config)}}, "")
				if err != nil || !jsonBool(data, "ok") {
					status, reason = "failure", remoteMessage(err)
				} else {
					team := jsonMap(data, "team")
					teamID := jsonString(team, "id")
					if teamID == "" {
						status, reason = "failure", "oauth_failed"
					} else if _, _, err := upsertChannelAccount(r, deps.Channels, entry.OrganizationID, channelTypeSlack, teamID, map[string]any{"access_token": jsonString(data, "access_token"), "bot_user_id": jsonString(data, "bot_user_id")}, firstNonEmpty(jsonString(team, "name"), teamID), nil); err != nil {
						status, reason = "failure", "workspace_connected_elsewhere"
					}
				}
			}
		}
		params := url.Values{"status": []string{status}, "integration": []string{"slack"}}
		if reason != "" {
			params.Set("reason", reason)
		}
		http.Redirect(w, r, strings.TrimRight(deps.Config.FrontendURL, "/")+"/settings/integrations?"+params.Encode(), http.StatusFound)
	}
}

type whatsappTemplateRequest struct {
	SessionID      uuid.UUID        `json:"session_id"`
	TemplateName   string           `json:"template_name"`
	Language       string           `json:"language"`
	Components     []map[string]any `json:"components"`
	To             string           `json:"to"`
	CustomerID     *uuid.UUID       `json:"customer_id"`
	CustomerName   string           `json:"customer_name"`
	IdempotencyKey string           `json:"idempotency_key"`
}

var whatsappOutboundKeyPattern = regexp.MustCompile(`^[A-Za-z0-9_-]+$`)

func whatsappAccount(deps Dependencies, w http.ResponseWriter, r *http.Request) (*channel.Account, bool) {
	account, _, ok := channelOwnedAccount(w, r, deps)
	if !ok {
		return nil, false
	}
	if account.ChannelType != channelTypeWhatsApp {
		Error(w, http.StatusNotFound, "Channel account not found")
		return nil, false
	}
	return account, true
}

func listWhatsAppTemplates(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		account, ok := whatsappAccount(deps, w, r)
		if !ok {
			return
		}
		credentials, err := deps.Channels.Credentials(account)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		waba := jsonString(credentials, "waba_id")
		if waba == "" {
			Error(w, http.StatusBadRequest, "Reconnect this number with its WhatsApp Business Account ID to manage templates")
			return
		}
		data, err := channel.ListWhatsAppTemplates(r.Context(), deps.Config, waba, jsonString(credentials, "access_token"))
		if err != nil {
			Error(w, http.StatusBadGateway, remoteMessage(err))
			return
		}
		JSON(w, http.StatusOK, data)
	}
}

func whatsappTemplateLibrary(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		account, ok := whatsappAccount(deps, w, r)
		if !ok {
			return
		}
		credentials, err := deps.Channels.Credentials(account)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		waba := jsonString(credentials, "waba_id")
		if waba == "" {
			Error(w, http.StatusBadRequest, "Reconnect this number with its WhatsApp Business Account ID to manage templates")
			return
		}
		params := url.Values{"asset_id": []string{waba}}
		business, _, _ := channel.Graph(r.Context(), deps.Config, http.MethodGet, waba, jsonString(credentials, "access_token"), url.Values{"fields": []string{"owner_business_info"}}, nil, false)
		if id := jsonString(jsonMap(business, "owner_business_info"), "id"); id != "" {
			params.Set("business_id", id)
		}
		JSON(w, http.StatusOK, map[string]string{"url": "https://business.facebook.com/latest/whatsapp_manager/template_library?" + params.Encode()})
	}
}

func sendWhatsAppTemplate(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		account, ok := whatsappAccount(deps, w, r)
		if !ok {
			return
		}
		var body whatsappTemplateRequest
		if err := decodeJSON(r, &body); err != nil || body.SessionID == uuid.Nil || strings.TrimSpace(body.TemplateName) == "" {
			Error(w, http.StatusUnprocessableEntity, "session_id and template_name are required")
			return
		}
		if err := validateWhatsAppIdempotencyKey(body.IdempotencyKey); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		conversation, err := deps.Channels.GetConversationBySession(r.Context(), body.SessionID)
		if errors.Is(err, channel.ErrNotFound) || conversation == nil || conversation.ChannelAccountID != account.ID {
			Error(w, http.StatusNotFound, "Conversation not found for this account")
			return
		}

		if body.IdempotencyKey != "" {
			prior, lookupErr := deps.Channels.GetByOutboundIdempotency(r.Context(), account.ID, body.IdempotencyKey)
			if lookupErr != nil && !errors.Is(lookupErr, channel.ErrNotFound) {
				Error(w, http.StatusInternalServerError, lookupErr.Error())
				return
			}
			if prior != nil && prior.ID != conversation.ID {
				if status := outboundMarkerStatus(prior); status == "sent" {
					JSON(w, http.StatusOK, map[string]any{"status": "already_sent", "external_message_id": outboundMarkerMessageID(prior)})
					return
				}
				if outboundMarkerStatus(prior) == "pending" {
					Error(w, http.StatusConflict, "This outbound WhatsApp send is already in progress. Verify its result before retrying.")
					return
				}
				Error(w, http.StatusConflict, "This idempotency key belongs to a previous WhatsApp send. Start a new request with a new key.")
				return
			}
			marker := outboundMarker(conversation)
			if marker["key"] == body.IdempotencyKey && marker["status"] == "sent" {
				JSON(w, http.StatusOK, map[string]any{"status": "already_sent", "external_message_id": marker["external_message_id"]})
				return
			}
			if marker["key"] == body.IdempotencyKey && marker["status"] == "pending" {
				Error(w, http.StatusConflict, "This outbound WhatsApp send is already in progress. Verify its result before retrying.")
				return
			}
			pending := mergeConversationExtra(conversation.Extra)
			pending["outbound_idempotency"] = map[string]any{"key": body.IdempotencyKey, "status": "pending"}
			key := body.IdempotencyKey
			if err := deps.Channels.SetExtra(r.Context(), conversation.ID, pending, &key); err != nil {
				Error(w, http.StatusInternalServerError, err.Error())
				return
			}
			conversation.Extra = pending
		}

		language := firstNonEmpty(body.Language, channel.DefaultWhatsAppTemplateLanguage)
		result := sendWhatsAppTemplateViaSender(r, deps, account, conversation, body.TemplateName, language, body.Components)
		if !result.OK {
			if body.IdempotencyKey != "" {
				failed := mergeConversationExtra(conversation.Extra)
				failed["outbound_idempotency"] = map[string]any{"key": body.IdempotencyKey, "status": "failed", "error": result.Error}
				key := body.IdempotencyKey
				_ = deps.Channels.SetExtra(r.Context(), conversation.ID, failed, &key)
			}
			Error(w, http.StatusBadGateway, result.Error)
			return
		}
		if body.IdempotencyKey != "" {
			sent := mergeConversationExtra(conversation.Extra)
			sent["outbound_idempotency"] = map[string]any{"key": body.IdempotencyKey, "status": "sent", "external_message_id": result.ExternalMessageID}
			key := body.IdempotencyKey
			if err := deps.Channels.SetExtra(r.Context(), conversation.ID, sent, &key); err != nil {
				Error(w, http.StatusInternalServerError, err.Error())
				return
			}
		}
		JSON(w, http.StatusOK, map[string]any{"status": "sent", "external_message_id": result.ExternalMessageID})
	}
}

func startWhatsAppConversation(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		account, ok := whatsappAccount(deps, w, r)
		if !ok {
			return
		}
		var body whatsappTemplateRequest
		if err := decodeJSON(r, &body); err != nil || strings.TrimSpace(body.To) == "" || strings.TrimSpace(body.TemplateName) == "" {
			Error(w, http.StatusUnprocessableEntity, "to and template_name are required")
			return
		}
		if err := validateWhatsAppIdempotencyKey(body.IdempotencyKey); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		org, ok := channelOrganization(r)
		if !ok || deps.Sessions == nil || deps.Customers == nil {
			Error(w, http.StatusServiceUnavailable, "Conversation service is not configured")
			return
		}
		phone := channel.NormalizeWhatsAppPhone(body.To)
		if phone == "" {
			Error(w, http.StatusBadRequest, "Enter the number in international format, e.g. +91 12345 67890")
			return
		}
		waID := channel.WhatsAppID(phone)
		if body.IdempotencyKey != "" {
			prior, lookupErr := deps.Channels.GetByOutboundIdempotency(r.Context(), account.ID, body.IdempotencyKey)
			if lookupErr != nil && !errors.Is(lookupErr, channel.ErrNotFound) {
				Error(w, http.StatusInternalServerError, lookupErr.Error())
				return
			}
			if prior != nil {
				if prior.ExternalConversationID != waID {
					Error(w, http.StatusConflict, "This idempotency key belongs to another WhatsApp recipient. Start a new request with a new key.")
					return
				}
				switch outboundMarkerStatus(prior) {
				case "sent":
					JSON(w, http.StatusOK, map[string]any{"session_id": prior.SessionID})
					return
				case "pending":
					Error(w, http.StatusConflict, "This outbound WhatsApp send is already in progress. Verify its result before retrying.")
					return
				}
			}
		}

		agentID, err := deps.Channels.AgentID(r.Context(), account.ID)
		if err != nil || agentID == nil {
			Error(w, http.StatusBadRequest, "No agent is configured for this WhatsApp account")
			return
		}
		existing, err := deps.Channels.GetActiveConversation(r.Context(), account.ID, waID)
		if err != nil && !errors.Is(err, channel.ErrNotFound) {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		language := firstNonEmpty(body.Language, channel.DefaultWhatsAppTemplateLanguage)
		template, templateErr := loadAndValidateWhatsAppTemplate(r, deps, account, body.TemplateName, language, existing == nil)
		if templateErr != nil {
			writeWhatsAppTemplateError(w, templateErr)
			return
		}
		var (
			customerID        uuid.UUID
			conversation      *channel.Conversation
			managed           *session.ManagedSession
			sessionID         uuid.UUID
			createdNewSession = existing == nil
		)
		if existing != nil {
			conversation = existing
			sessionID = existing.SessionID
			if store, storeOK := deps.Sessions.(session.ActionStore); storeOK {
				managed, err = store.GetManaged(r.Context(), sessionID, org)
				if err != nil {
					Error(w, http.StatusInternalServerError, err.Error())
					return
				}
			}
			if existing.CustomerID != nil {
				customerID = *existing.CustomerID
			} else if managed != nil {
				customerID = managed.CustomerID
			}
			if customerID == uuid.Nil {
				Error(w, http.StatusInternalServerError, "Conversation has no customer")
				return
			}
		} else {
			customerRecord, customerErr := resolveWhatsAppOutboundCustomer(r, deps, org, phone, waID, body.CustomerID, body.CustomerName)
			if customerErr != nil {
				Error(w, http.StatusBadRequest, customerErr.Error())
				return
			}
			customerID = customerRecord.ID
			sessionStore, storeOK := deps.Sessions.(session.WidgetStore)
			if !storeOK {
				Error(w, http.StatusServiceUnavailable, "Conversation service is not configured")
				return
			}
			sessionID = uuid.New()
			managed, err = sessionStore.CreateWidgetSession(r.Context(), sessionID, org, customerID, *agentID, channelTypeWhatsApp)
			if err != nil {
				Error(w, http.StatusInternalServerError, err.Error())
				return
			}
			extra := map[string]any{}
			if body.IdempotencyKey != "" {
				extra["outbound_idempotency"] = map[string]any{"key": body.IdempotencyKey, "status": "pending"}
			}
			conversation, err = deps.Channels.CreateConversation(r.Context(), channel.Conversation{
				ChannelAccountID: account.ID, ChannelType: channelTypeWhatsApp, ExternalConversationID: waID,
				ExternalUserID: waID, SessionID: sessionID, OrganizationID: org, AgentID: agentID,
				CustomerID: &customerID, LastInboundAt: nil, Extra: extra,
				OutboundIdempotencyKey: nullableString(body.IdempotencyKey),
			})
			if err != nil {
				cleanupOutboundSession(r, deps, sessionID, org)
				if body.IdempotencyKey != "" && errors.Is(err, channel.ErrConflict) {
					prior, lookupErr := deps.Channels.GetByOutboundIdempotency(r.Context(), account.ID, body.IdempotencyKey)
					if lookupErr == nil && prior != nil && prior.ExternalConversationID == waID {
						switch outboundMarkerStatus(prior) {
						case "sent":
							JSON(w, http.StatusOK, map[string]any{"session_id": prior.SessionID})
							return
						case "pending":
							Error(w, http.StatusConflict, "This outbound WhatsApp send is already in progress. Verify its result before retrying.")
							return
						default:
							conversation = prior
							sessionID = prior.SessionID
							createdNewSession = false
						}
					}
				}
				if conversation == nil {
					Error(w, http.StatusInternalServerError, err.Error())
					return
				}
			}
		}
		if !createdNewSession && body.IdempotencyKey != "" {
			pending := mergeConversationExtra(conversation.Extra)
			pending["outbound_idempotency"] = map[string]any{"key": body.IdempotencyKey, "status": "pending"}
			key := body.IdempotencyKey
			if err := deps.Channels.SetExtra(r.Context(), conversation.ID, pending, &key); err != nil {
				Error(w, http.StatusInternalServerError, err.Error())
				return
			}
			conversation.Extra = pending
		}
		if createdNewSession && deps.Notifications != nil {
			emitChatEvent(r.Context(), deps, chatNotificationRecipients(r.Context(), deps, managed, "new_chat"), "new_chat", "New chat", "A new conversation started on WhatsApp.", map[string]any{"session_id": sessionID.String()})
		}
		result := sendWhatsAppTemplateViaSender(r, deps, account, conversation, body.TemplateName, language, body.Components)
		if !result.OK {
			if createdNewSession && body.IdempotencyKey == "" {
				cleanupOutboundSession(r, deps, sessionID, org)
			}
			if body.IdempotencyKey != "" {
				failed := mergeConversationExtra(conversation.Extra)
				failed["outbound_idempotency"] = map[string]any{"key": body.IdempotencyKey, "status": "failed", "error": result.Error}
				key := body.IdempotencyKey
				_ = deps.Channels.SetExtra(r.Context(), conversation.ID, failed, &key)
			}
			Error(w, http.StatusBadGateway, result.Error)
			return
		}

		chatStore, ok := deps.Chats.(chat.ActionStore)
		if !ok || chatStore == nil {
			if body.IdempotencyKey != "" {
				markWhatsAppOutboundSent(r, deps, conversation, body.IdempotencyKey, result.ExternalMessageID, template, body.Components)
			}
			Error(w, http.StatusServiceUnavailable, "Chat message service is not configured")
			return
		}
		rendered := channel.RenderWhatsAppTemplateBody(template, body.Components)
		message, err := chatStore.CreateMessage(r.Context(), chat.MessageInput{
			Message: rendered, MessageType: "bot", SessionID: sessionID, OrganizationID: org,
			CustomerID: customerID, AgentID: agentID,
			Attributes: map[string]any{"channel": channelTypeWhatsApp, "external_message_id": result.ExternalMessageID, "outbound_template": body.TemplateName},
		})
		if err != nil {
			if body.IdempotencyKey != "" {
				markWhatsAppOutboundSent(r, deps, conversation, body.IdempotencyKey, result.ExternalMessageID, template, body.Components)
			}
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		extra := mergeConversationExtra(conversation.Extra)
		extra["outbound_template"] = rendered
		if body.IdempotencyKey != "" {
			extra["outbound_idempotency"] = map[string]any{"key": body.IdempotencyKey, "status": "sent", "external_message_id": result.ExternalMessageID}
		}
		if err := deps.Channels.SetExtra(r.Context(), conversation.ID, extra, nullableString(body.IdempotencyKey)); err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if deps.Realtime != nil {
			deps.Realtime.BroadcastConversationUpdated(r.Context(), org, sessionID, nil)
		}
		_ = message
		JSON(w, http.StatusOK, map[string]any{"session_id": sessionID})
	}
}

func loadAndValidateWhatsAppTemplate(r *http.Request, deps Dependencies, account *channel.Account, name, language string, startsConversation bool) (map[string]any, error) {
	credentials, err := deps.Channels.Credentials(account)
	if err != nil {
		return nil, &channel.WhatsAppTemplateError{Status: http.StatusInternalServerError, Message: err.Error()}
	}
	wabaID := jsonString(credentials, "waba_id")
	if wabaID == "" {
		return nil, &channel.WhatsAppTemplateError{Status: http.StatusBadRequest, Message: "Reconnect this number with its WhatsApp Business Account ID to send templates"}
	}
	templates, err := channel.ListWhatsAppTemplates(r.Context(), deps.Config, wabaID, jsonString(credentials, "access_token"))
	if err != nil {
		return nil, &channel.WhatsAppTemplateError{Status: http.StatusBadGateway, Message: "Could not read the account's templates from Meta"}
	}
	return channel.ValidateWhatsAppTemplate(templates, name, language, startsConversation)
}

func writeWhatsAppTemplateError(w http.ResponseWriter, err error) {
	var templateErr *channel.WhatsAppTemplateError
	if errors.As(err, &templateErr) && templateErr != nil {
		Error(w, templateErr.Status, templateErr.Message)
		return
	}
	Error(w, http.StatusBadGateway, remoteMessage(err))
}

func sendWhatsAppTemplateViaSender(r *http.Request, deps Dependencies, account *channel.Account, conversation *channel.Conversation, name, language string, components []map[string]any) channel.SendResult {
	sender := deps.Sender
	if sender == nil {
		sender = channel.NewSender(deps.Config, deps.Channels)
	}
	return sender.SendWhatsAppTemplate(r.Context(), account, conversation, name, language, components)
}

func validateWhatsAppIdempotencyKey(value string) error {
	if value == "" {
		return nil
	}
	if len(value) < 16 || len(value) > 128 || !whatsappOutboundKeyPattern.MatchString(value) {
		return errors.New("idempotency_key must be 16-128 characters using only letters, numbers, underscores, or hyphens")
	}
	return nil
}

func outboundMarker(conversation *channel.Conversation) map[string]any {
	if conversation != nil {
		if marker, ok := conversation.Extra["outbound_idempotency"].(map[string]any); ok {
			return marker
		}
	}
	return map[string]any{}
}

func outboundMarkerStatus(conversation *channel.Conversation) string {
	return stringValue(outboundMarker(conversation)["status"])
}

func outboundMarkerMessageID(conversation *channel.Conversation) string {
	return stringValue(outboundMarker(conversation)["external_message_id"])
}

func mergeConversationExtra(value map[string]any) map[string]any {
	result := make(map[string]any, len(value)+2)
	for key, item := range value {
		result[key] = item
	}
	return result
}

func cleanupOutboundSession(r *http.Request, deps Dependencies, sessionID, organizationID uuid.UUID) {
	store, ok := deps.Sessions.(session.CleanupStore)
	if !ok || store == nil {
		return
	}
	if _, err := store.Delete(r.Context(), sessionID, organizationID); err != nil {
		deps.Logger.Warn().Err(err).Str("session_id", sessionID.String()).Msg("failed to remove empty outbound session")
	}
}

func markWhatsAppOutboundSent(r *http.Request, deps Dependencies, conversation *channel.Conversation, key, externalMessageID string, template map[string]any, components []map[string]any) {
	if conversation == nil || deps.Channels == nil || key == "" {
		return
	}
	extra := mergeConversationExtra(conversation.Extra)
	extra["outbound_template"] = channel.RenderWhatsAppTemplateBody(template, components)
	extra["outbound_idempotency"] = map[string]any{"key": key, "status": "sent", "external_message_id": externalMessageID}
	_ = deps.Channels.SetExtra(r.Context(), conversation.ID, extra, &key)
}

func resolveWhatsAppOutboundCustomer(r *http.Request, deps Dependencies, organizationID uuid.UUID, phone, waID string, requested *uuid.UUID, name string) (*customer.Customer, error) {
	store, ok := deps.Customers.(customer.WhatsAppOutboundStore)
	if !ok || store == nil {
		return nil, errors.New("customer identity service is not configured")
	}
	ctx := r.Context()
	if requested != nil {
		found, err := store.GetByID(ctx, *requested)
		if err != nil {
			return nil, err
		}
		if found == nil || found.OrganizationID != organizationID {
			return nil, errors.New("Customer not found")
		}
		if found.Phone != nil && strings.TrimSpace(*found.Phone) != "" && strings.TrimSpace(*found.Phone) != phone {
			label := "That person"
			if found.FullName != nil && strings.TrimSpace(*found.FullName) != "" {
				label = *found.FullName
			}
			return nil, fmt.Errorf("%s has a different number on file. Send to their number, or update it on their profile first.", label)
		}
		owner, err := store.GetByPhone(ctx, phone, organizationID)
		if err != nil {
			return nil, err
		}
		if owner != nil && owner.ID != found.ID {
			label := "another person"
			if owner.FullName != nil && strings.TrimSpace(*owner.FullName) != "" {
				label = *owner.FullName
			}
			return nil, fmt.Errorf("%s already belongs to %s. Pick them instead, or clear the number from their profile.", phone, label)
		}
		if found.Phone == nil || strings.TrimSpace(*found.Phone) == "" {
			updated, setErr := store.SetPhoneIfAbsent(ctx, found.ID, phone)
			if setErr != nil {
				return nil, setErr
			}
			if updated != nil {
				found = updated
			}
		}
		return found, nil
	}

	found, err := store.GetByPhone(ctx, phone, organizationID)
	if err != nil {
		return nil, err
	}
	if found == nil {
		found, err = store.GetByEmail(ctx, waID+"@whatsapp.channel", organizationID)
		if err != nil {
			return nil, err
		}
		if found != nil && (found.Phone == nil || strings.TrimSpace(*found.Phone) == "") {
			found, err = store.SetPhoneIfAbsent(ctx, found.ID, phone)
			if err != nil {
				return nil, err
			}
		}
	}
	if found != nil {
		if err := store.SetLeadSourceIfAbsent(ctx, found.ID, map[string]any{"channel": "whatsapp", "via": "outbound"}); err != nil {
			return nil, err
		}
		return found, nil
	}

	fullName := strings.TrimSpace(name)
	if fullName == "" {
		shortID := waID
		if len(shortID) > 8 {
			shortID = shortID[:8]
		}
		fullName = "Whatsapp user " + shortID
	}
	created, err := store.CreateWithPhone(ctx, waID+"@whatsapp.channel", &fullName, organizationID, phone, nil, map[string]any{"channel": "whatsapp", "via": "outbound"})
	if err == nil {
		return created, nil
	}
	// A concurrent inbound message may have claimed the phone between the
	// lookup and insert. Re-resolve the winner before surfacing the failure.
	if winner, lookupErr := store.GetByPhone(ctx, phone, organizationID); lookupErr == nil && winner != nil {
		return winner, nil
	}
	if winner, lookupErr := store.GetByEmail(ctx, waID+"@whatsapp.channel", organizationID); lookupErr == nil && winner != nil {
		return winner, nil
	}
	return nil, err
}

func webhookURLFor(cfg config.Config, suffix string, id uuid.UUID) string {
	base := strings.TrimRight(cfg.BackendURL, "/") + cfg.APIBasePath + "/webhooks/"
	if id != uuid.Nil {
		return base + suffix + "/" + id.String()
	}
	return base + suffix
}

func metaSignupAllowed(cfg config.Config, channelName, email string) bool {
	available := false
	switch channelName {
	case channelTypeWhatsApp:
		available = cfg.MetaConfigID != ""
	case channelTypeMessenger:
		available = cfg.MetaMessengerConfigID != ""
	case channelTypeInstagram:
		available = cfg.InstagramAppID != "" && cfg.InstagramAppSecret != ""
	}
	if !available {
		return false
	}
	allowed := strings.TrimSpace(cfg.SignupAllowedEmails)
	if allowed == "" {
		return true
	}
	for _, value := range strings.Split(allowed, ",") {
		if strings.EqualFold(strings.TrimSpace(value), strings.TrimSpace(email)) {
			return true
		}
	}
	return false
}

func randomURLToken() string {
	data := make([]byte, 24)
	if _, err := rand.Read(data); err != nil {
		return base64.RawURLEncoding.EncodeToString([]byte(uuid.NewString()))
	}
	return base64.RawURLEncoding.EncodeToString(data)
}

func jsonMap(value map[string]any, key string) map[string]any {
	if nested, ok := value[key].(map[string]any); ok {
		return nested
	}
	return map[string]any{}
}

func jsonSlice(value map[string]any, key string) []map[string]any {
	items, ok := value[key].([]any)
	if !ok {
		return nil
	}
	result := make([]map[string]any, 0, len(items))
	for _, item := range items {
		if object, ok := item.(map[string]any); ok {
			result = append(result, object)
		}
	}
	return result
}

func jsonString(value map[string]any, key string) string {
	var current any = value
	for _, part := range strings.Split(key, ".") {
		object, ok := current.(map[string]any)
		if !ok {
			return ""
		}
		current, ok = object[part]
		if !ok {
			return ""
		}
		if list, ok := current.([]any); ok {
			if len(list) == 0 {
				return ""
			}
			current = list[0]
		}
	}
	if result, ok := current.(string); ok {
		return result
	}
	if result, ok := current.(float64); ok {
		return fmt.Sprintf("%.0f", result)
	}
	return ""
}

func jsonBool(value map[string]any, key string) bool {
	result, _ := value[key].(bool)
	return result
}

func containsID(values []map[string]any, id string) bool {
	for _, value := range values {
		if jsonString(value, "id") == id {
			return true
		}
	}
	return false
}

func nullableString(value string) *string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return &value
}

func stringValueFromMap(values map[string]any, key, fallback string) string {
	if value, ok := values[key].(string); ok && strings.TrimSpace(value) != "" {
		return value
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

func slackCallbackURL(cfg config.Config) string {
	return strings.TrimRight(cfg.BackendURL, "/") + cfg.APIBasePath + "/channels/slack/callback"
}

func remoteMessage(err error) string {
	if err == nil {
		return "remote request failed"
	}
	return err.Error()
}
