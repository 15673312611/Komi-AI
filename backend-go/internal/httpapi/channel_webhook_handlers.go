package httpapi

import (
	"context"
	"crypto"
	"crypto/hmac"
	"crypto/rsa"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/chattermate/chattermate/backend-go/internal/channel"
	"github.com/chattermate/chattermate/backend-go/internal/config"
	"github.com/chattermate/chattermate/backend-go/internal/guardrail"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

const (
	channelWebhookDedupeTTL = time.Hour
	maxChannelWebhookBody   = 4 << 20
	maxSlackSignatureAge    = 5 * time.Minute
)

var snsHostPattern = regexp.MustCompile(`^sns\.[a-z0-9-]+\.amazonaws\.com$`)

func registerChannelWebhookRoutes(r chi.Router, deps Dependencies) {
	r.Post("/webhooks/telegram/{account_id}", telegramWebhook(deps))
	r.Post("/webhooks/line/{account_id}", lineWebhook(deps))
	r.Get("/webhooks/meta", metaWebhookVerify(deps))
	r.Post("/webhooks/meta", metaWebhook(deps))
	r.Post("/webhooks/slack", slackWebhook(deps))
	r.Post("/webhooks/email/{account_id}", emailWebhook(deps))
	r.Post("/webhooks/sms/{provider}/{account_id}", smsWebhook(deps))
}

func channelProcessor(deps Dependencies) channel.ProcessorDependencies {
	processor := channel.ProcessorDependencies{
		Accounts: deps.Channels, Customers: deps.Customers, Sessions: deps.Sessions, Chats: deps.Chats,
		Agents: deps.Agents, Users: deps.Users, AIConfigs: deps.AIConfigs, LeadCapture: deps.LeadCapture,
		Organizations: deps.Organizations, Stores: deps.Stores,
		GuardrailSettings: guardrail.Settings{
			PolicyEnabled: deps.Config.GuardrailPolicyEnabled, InboundAction: deps.Config.GuardrailInboundAction,
			OfftopicAction: deps.Config.GuardrailOfftopicAction, OutputCheckEnabled: deps.Config.GuardrailOutputCheckEnabled,
			EventsEnabled: deps.Config.GuardrailEventsEnabled, StoreExcerpt: deps.Config.GuardrailStoreExcerpt,
		},
		GuardrailEvents: deps.GuardrailEvents,
		Sender:          channel.NewSender(deps.Config, deps.Channels),
	}
	processor.Notifier = func(ctx context.Context, recipients []uuid.UUID, event, title, message string, metadata map[string]any) {
		emitChatEvent(ctx, deps, recipients, event, title, message, metadata)
	}
	if deps.Realtime != nil {
		processor.Responder = deps.Realtime.ChannelReply
		processor.Broadcast = deps.Realtime.BroadcastChannelMessage
	}
	return processor
}

func processInboundAsync(deps Dependencies, accountID uuid.UUID, inbound channel.InboundMessage) {
	go func() {
		if err := channelProcessor(deps).Process(context.Background(), accountID, inbound); err != nil {
			deps.Logger.Error().Err(err).Str("account_id", accountID.String()).Msg("channel inbound processing failed")
		}
	}()
}

func processInteractionAsync(deps Dependencies, accountID uuid.UUID, interaction channel.Interaction) {
	go func() {
		if err := channelProcessor(deps).ProcessInteraction(context.Background(), accountID, interaction); err != nil {
			deps.Logger.Error().Err(err).Str("account_id", accountID.String()).Msg("channel interaction processing failed")
		}
	}()
}

func claimChannelWebhook(deps Dependencies, key string) bool {
	key = strings.TrimSpace(key)
	if key == "" || deps.Redis == nil {
		return false
	}
	claimed, err := deps.Redis.SetNX(context.Background(), "channel_dedupe:"+key, "1", channelWebhookDedupeTTL).Result()
	if err != nil {
		deps.Logger.Warn().Err(err).Msg("channel webhook dedupe failed; processing message")
		return false
	}
	return !claimed
}

func telegramWebhook(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		account, ok := webhookAccount(w, r, deps, channelTypeTelegram)
		if !ok {
			return
		}
		if !hmac.Equal([]byte(account.WebhookSecret), []byte(r.Header.Get("X-Telegram-Bot-Api-Secret-Token"))) {
			Error(w, http.StatusForbidden, "Invalid webhook secret")
			return
		}
		payload, err := readJSONBody(r, 1<<20)
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid webhook payload")
			return
		}
		inbound, interaction := channel.ParseTelegram(payload)
		if interaction != nil {
			processInteractionAsync(deps, account.ID, *interaction)
		}
		for _, message := range inbound {
			key := account.ID.String() + ":" + message.ExternalConversationID + ":" + message.ExternalMessageID
			if claimChannelWebhook(deps, key) {
				continue
			}
			processInboundAsync(deps, account.ID, message)
		}
		JSON(w, http.StatusOK, map[string]bool{"ok": true})
	}
}

func lineWebhook(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		account, ok := webhookAccount(w, r, deps, channelTypeLine)
		if !ok {
			return
		}
		credentials, err := deps.Channels.Credentials(account)
		raw, readErr := io.ReadAll(io.LimitReader(r.Body, maxChannelWebhookBody+1))
		if err != nil || readErr != nil || len(raw) > maxChannelWebhookBody || !verifyLineSignature(raw, r.Header.Get("X-Line-Signature"), credentials) {
			Error(w, http.StatusForbidden, "Invalid signature")
			return
		}
		var payload map[string]any
		if err := json.Unmarshal(raw, &payload); err != nil || payload == nil {
			Error(w, http.StatusBadRequest, "Invalid webhook payload")
			return
		}
		for _, message := range channel.ParseLINE(payload) {
			if message.ExternalMessageID != "" && claimChannelWebhook(deps, account.ID.String()+":"+message.ExternalMessageID) {
				continue
			}
			processInboundAsync(deps, account.ID, message)
		}
		JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	}
}

func metaWebhookVerify(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("hub.mode") != "subscribe" ||
			doesNotEqual(deps.Config.MetaWebhookVerifyToken, r.URL.Query().Get("hub.verify_token")) ||
			r.URL.Query().Get("hub.challenge") == "" {
			Error(w, http.StatusForbidden, "Verification failed")
			return
		}
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, r.URL.Query().Get("hub.challenge"))
	}
}

func metaWebhook(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		raw, err := io.ReadAll(io.LimitReader(r.Body, maxChannelWebhookBody+1))
		if err != nil || len(raw) > maxChannelWebhookBody {
			Error(w, http.StatusBadRequest, "Invalid webhook payload")
			return
		}
		if deps.Config.MetaAppSecret == "" || !verifySHA256Signature(raw, r.Header.Get("X-Hub-Signature-256"), deps.Config.MetaAppSecret) {
			Error(w, http.StatusForbidden, "Invalid signature")
			return
		}
		var payload map[string]any
		if err := json.Unmarshal(raw, &payload); err != nil {
			Error(w, http.StatusBadRequest, "Invalid webhook payload")
			return
		}
		product := jsonString(payload, "object")
		if product != "whatsapp_business_account" && product != "page" && product != "instagram" {
			JSON(w, http.StatusOK, map[string]string{"status": "ignored"})
			return
		}
		for _, message := range channel.ParseMeta(payload) {
			accountType := metaProductChannel(product)
			externalID := firstNonEmpty(message.ExternalAccountID, jsonString(payload, "entry.0.id"))
			account, accountErr := deps.Channels.GetByExternal(r.Context(), accountType, externalID)
			if accountErr != nil || account == nil || !account.IsActive {
				continue
			}
			if message.ExternalMessageID != "" && claimChannelWebhook(deps, account.ID.String()+":"+message.ExternalMessageID) {
				continue
			}
			processInboundAsync(deps, account.ID, message)
		}
		JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	}
}

func slackWebhook(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		raw, err := io.ReadAll(io.LimitReader(r.Body, maxChannelWebhookBody+1))
		if err != nil || len(raw) > maxChannelWebhookBody {
			Error(w, http.StatusBadRequest, "Invalid webhook payload")
			return
		}
		if !verifySlackSignature(raw, r.Header.Get("X-Slack-Request-Timestamp"), r.Header.Get("X-Slack-Signature"), deps.Config.SlackSigningSecret) {
			Error(w, http.StatusForbidden, "Invalid signature")
			return
		}
		var payload map[string]any
		if err := json.Unmarshal(raw, &payload); err != nil {
			Error(w, http.StatusBadRequest, "Invalid webhook payload")
			return
		}
		if payload["type"] == "url_verification" {
			JSON(w, http.StatusOK, map[string]string{"challenge": webhookString(payload["challenge"])})
			return
		}
		if payload["type"] != "event_callback" {
			JSON(w, http.StatusOK, map[string]string{"status": "ignored"})
			return
		}
		event := webhookMap(payload["event"])
		eventType := webhookString(event["type"])
		teamID := webhookString(payload["team_id"])
		if eventType == "app_uninstalled" || eventType == "tokens_revoked" && webhookBool(webhookMap(event["tokens"])["bot"]) {
			if account, getErr := deps.Channels.GetByExternal(r.Context(), channelTypeSlack, teamID); getErr == nil && account != nil {
				_ = deps.Channels.Delete(r.Context(), account)
			}
			JSON(w, http.StatusOK, map[string]string{"status": "ok"})
			return
		}
		for _, message := range channel.ParseSlack(payload) {
			account, accountErr := deps.Channels.GetByExternal(r.Context(), channelTypeSlack, message.ExternalAccountID)
			if accountErr != nil || account == nil || !account.IsActive {
				continue
			}
			if message.ExternalMessageID != "" && claimChannelWebhook(deps, account.ID.String()+":"+message.ExternalMessageID) {
				continue
			}
			processInboundAsync(deps, account.ID, message)
		}
		JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	}
}

func emailWebhook(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		account, ok := webhookAccount(w, r, deps, channelTypeEmail)
		if !ok {
			return
		}
		if !hmac.Equal([]byte(account.WebhookSecret), []byte(r.URL.Query().Get("token"))) {
			Error(w, http.StatusForbidden, "Invalid token")
			return
		}
		payload, err := readWebhookObject(r, maxChannelWebhookBody)
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid webhook payload")
			return
		}
		for _, message := range channel.ParseEmail(payload) {
			if strings.EqualFold(message.ExternalUserID, account.ExternalAccountID) {
				continue
			}
			if message.ExternalMessageID != "" && claimChannelWebhook(deps, account.ID.String()+":"+message.ExternalMessageID) {
				continue
			}
			processInboundAsync(deps, account.ID, message)
		}
		JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	}
}

func smsWebhook(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		account, ok := webhookAccount(w, r, deps, channelTypeSMS)
		if !ok {
			return
		}
		provider := strings.ToLower(strings.TrimSpace(chi.URLParam(r, "provider")))
		configured := strings.ToLower(stringValueFromMap(account.Settings, "provider", ""))
		if provider == "" || configured != provider {
			Error(w, http.StatusNotFound, "Provider mismatch")
			return
		}
		payload, pairs, raw, err := readSMSPayload(r, maxChannelWebhookBody)
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid webhook payload")
			return
		}
		credentials, err := deps.Channels.Credentials(account)
		if err != nil || !verifySMSWebhook(r, deps.Config, account, provider, credentials, payload, pairs, raw) {
			Error(w, http.StatusForbidden, "Invalid signature")
			return
		}
		var messages []channel.InboundMessage
		if provider == "sns" {
			if webhookString(payload["Type"]) == "SubscriptionConfirmation" {
				_ = confirmSNSSubscription(r.Context(), webhookString(payload["SubscribeURL"]))
			}
			messages = channel.ParseSNSMessage(payload)
		} else {
			params := make(map[string]string, len(payload))
			for key, value := range payload {
				params[key] = webhookString(value)
			}
			messages = channel.ParseSMSText(provider, params, account.ExternalAccountID)
		}
		for _, message := range messages {
			if message.ExternalMessageID != "" && claimChannelWebhook(deps, account.ID.String()+":"+message.ExternalMessageID) {
				continue
			}
			processInboundAsync(deps, account.ID, message)
		}
		if provider == "twilio" {
			w.Header().Set("Content-Type", "text/xml; charset=utf-8")
			w.WriteHeader(http.StatusOK)
			_, _ = io.WriteString(w, `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`)
			return
		}
		JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	}
}

func webhookAccount(w http.ResponseWriter, r *http.Request, deps Dependencies, expected string) (*channel.Account, bool) {
	if deps.Channels == nil {
		Error(w, http.StatusServiceUnavailable, "Channel storage is not configured")
		return nil, false
	}
	id, err := uuid.Parse(chi.URLParam(r, "account_id"))
	if err != nil {
		Error(w, http.StatusNotFound, "Unknown account")
		return nil, false
	}
	account, err := deps.Channels.GetByID(r.Context(), id)
	if errors.Is(err, channel.ErrNotFound) || account == nil || account.ChannelType != expected {
		Error(w, http.StatusNotFound, "Unknown account")
		return nil, false
	}
	if err != nil {
		Error(w, http.StatusInternalServerError, "Failed to load channel account")
		return nil, false
	}
	return account, true
}

func readJSONBody(r *http.Request, maximum int64) (map[string]any, error) {
	data, err := io.ReadAll(io.LimitReader(r.Body, maximum+1))
	if err != nil || int64(len(data)) > maximum {
		return nil, errors.New("body too large")
	}
	var payload map[string]any
	if err := json.Unmarshal(data, &payload); err != nil || payload == nil {
		return nil, errors.New("invalid JSON")
	}
	return payload, nil
}

func readWebhookObject(r *http.Request, maximum int64) (map[string]any, error) {
	contentType := strings.ToLower(r.Header.Get("Content-Type"))
	if strings.Contains(contentType, "application/json") {
		return readJSONBody(r, maximum)
	}
	if err := r.ParseMultipartForm(maximum); err != nil && !errors.Is(err, http.ErrNotMultipart) {
		return nil, err
	}
	if err := r.ParseForm(); err != nil {
		return nil, err
	}
	result := make(map[string]any, len(r.Form))
	for key, values := range r.Form {
		if len(values) > 0 {
			result[key] = values[0]
		}
	}
	return result, nil
}

func readSMSPayload(r *http.Request, maximum int64) (map[string]any, [][2]string, []byte, error) {
	contentType := strings.ToLower(r.Header.Get("Content-Type"))
	if strings.Contains(contentType, "application/json") {
		raw, err := io.ReadAll(io.LimitReader(r.Body, maximum+1))
		if err != nil || int64(len(raw)) > maximum {
			return nil, nil, nil, errors.New("body too large")
		}
		var payload map[string]any
		if err := json.Unmarshal(raw, &payload); err != nil || payload == nil {
			return nil, nil, nil, errors.New("invalid JSON")
		}
		return payload, nil, raw, nil
	}
	if err := r.ParseMultipartForm(maximum); err != nil && !errors.Is(err, http.ErrNotMultipart) {
		return nil, nil, nil, err
	}
	if err := r.ParseForm(); err != nil {
		return nil, nil, nil, err
	}
	payload := make(map[string]any, len(r.Form))
	pairs := make([][2]string, 0)
	for key, values := range r.Form {
		for _, value := range values {
			if _, exists := payload[key]; !exists {
				payload[key] = value
			}
			pairs = append(pairs, [2]string{key, value})
		}
	}
	return payload, pairs, nil, nil
}

func verifyLineSignature(body []byte, provided string, credentials map[string]any) bool {
	secret := stringValueFromMap(credentials, "channel_secret", "")
	if secret == "" || provided == "" {
		return false
	}
	hash := hmac.New(sha256.New, []byte(secret))
	_, _ = hash.Write(body)
	return hmac.Equal([]byte(base64.StdEncoding.EncodeToString(hash.Sum(nil))), []byte(provided))
}

func verifySHA256Signature(body []byte, header, secret string) bool {
	header = strings.TrimSpace(header)
	if secret == "" || !strings.HasPrefix(header, "sha256=") {
		return false
	}
	hash := hmac.New(sha256.New, []byte(secret))
	_, _ = hash.Write(body)
	return hmac.Equal([]byte("sha256="+fmt.Sprintf("%x", hash.Sum(nil))), []byte(header))
}

func verifySlackSignature(body []byte, timestamp, signature, secret string) bool {
	if secret == "" || timestamp == "" || signature == "" {
		return false
	}
	value, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil || time.Since(time.Unix(value, 0)) > maxSlackSignatureAge || time.Until(time.Unix(value, 0)) > maxSlackSignatureAge {
		return false
	}
	hash := hmac.New(sha256.New, []byte(secret))
	_, _ = hash.Write([]byte("v0:" + timestamp + ":"))
	_, _ = hash.Write(body)
	expected := "v0=" + fmt.Sprintf("%x", hash.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}

func verifySMSWebhook(r *http.Request, cfg config.Config, account *channel.Account, provider string, credentials map[string]any, payload map[string]any, pairs [][2]string, raw []byte) bool {
	baseURL := strings.TrimRight(cfg.BackendURL, "/") + cfg.APIBasePath + "/webhooks/sms/" + provider + "/" + account.ID.String()
	tokenOK := hmac.Equal([]byte(account.WebhookSecret), []byte(r.URL.Query().Get("token")))
	switch provider {
	case "twilio":
		provided := r.Header.Get("X-Twilio-Signature")
		secret := stringValueFromMap(credentials, "auth_token", "")
		if secret == "" || provided == "" {
			return false
		}
		sort.Slice(pairs, func(i, j int) bool { return pairs[i][0] < pairs[j][0] })
		value := baseURL
		for _, pair := range pairs {
			value += pair[0] + pair[1]
		}
		hash := hmac.New(sha1.New, []byte(secret))
		_, _ = hash.Write([]byte(value))
		return hmac.Equal([]byte(base64.StdEncoding.EncodeToString(hash.Sum(nil))), []byte(provided))
	case "plivo":
		secret := stringValueFromMap(credentials, "auth_token", "")
		nonce := r.Header.Get("X-Plivo-Signature-V3-Nonce")
		provided := strings.Split(r.Header.Get("X-Plivo-Signature-V3"), ",")
		if secret == "" || nonce == "" || len(provided) == 0 {
			return false
		}
		hash := hmac.New(sha256.New, []byte(secret))
		_, _ = hash.Write([]byte(baseURL + nonce))
		expected := base64.StdEncoding.EncodeToString(hash.Sum(nil))
		for _, value := range provided {
			if hmac.Equal([]byte(expected), []byte(strings.TrimSpace(value))) {
				return true
			}
		}
		return false
	case "vonage":
		secret := stringValueFromMap(credentials, "signature_secret", "")
		if secret == "" {
			return tokenOK
		}
		provided := strings.ToUpper(webhookString(payload["sig"]))
		if provided == "" {
			return false
		}
		keys := make([]string, 0, len(payload))
		for key := range payload {
			if key != "sig" {
				keys = append(keys, key)
			}
		}
		sort.Strings(keys)
		var builder strings.Builder
		for _, key := range keys {
			builder.WriteByte('&')
			builder.WriteString(key)
			builder.WriteByte('=')
			builder.WriteString(strings.NewReplacer("&", "_", "=", "_").Replace(webhookString(payload[key])))
		}
		hash := hmac.New(sha256.New, []byte(secret))
		_, _ = hash.Write([]byte(builder.String()))
		return hmac.Equal([]byte(strings.ToUpper(fmt.Sprintf("%x", hash.Sum(nil)))), []byte(provided))
	case "messagebird":
		secret := stringValueFromMap(credentials, "signing_key", "")
		if secret == "" {
			return tokenOK
		}
		timestamp := r.Header.Get("MessageBird-Request-Timestamp")
		provided := r.Header.Get("MessageBird-Signature")
		if timestamp == "" || provided == "" {
			return false
		}
		bodyHash := sha256.Sum256(raw)
		hash := hmac.New(sha256.New, []byte(secret))
		_, _ = hash.Write([]byte(timestamp + "\n" + baseURL + "\n" + string(bodyHash[:])))
		return hmac.Equal([]byte(base64.StdEncoding.EncodeToString(hash.Sum(nil))), []byte(provided))
	case "sns":
		return verifySNSPayload(r.Context(), payload, credentials)
	case "brevo":
		return tokenOK
	default:
		return false
	}
}

func verifySNSPayload(ctx context.Context, payload map[string]any, credentials map[string]any) bool {
	if topic := stringValueFromMap(credentials, "topic_arn", ""); topic != "" && topic != webhookString(payload["TopicArn"]) {
		return false
	}
	certURL, err := url.Parse(webhookString(payload["SigningCertURL"]))
	if err != nil || certURL.Scheme != "https" || certURL.Hostname() == "" || !snsHostPattern.MatchString(strings.ToLower(certURL.Hostname())) {
		return false
	}
	fieldsByType := map[string][]string{
		"Notification":             {"Message", "MessageId", "Subject", "Timestamp", "TopicArn", "Type"},
		"SubscriptionConfirmation": {"Message", "MessageId", "SubscribeURL", "Timestamp", "Token", "TopicArn", "Type"},
		"UnsubscribeConfirmation":  {"Message", "MessageId", "SubscribeURL", "Timestamp", "Token", "TopicArn", "Type"},
	}
	fields := fieldsByType[webhookString(payload["Type"])]
	if len(fields) == 0 || webhookString(payload["Signature"]) == "" {
		return false
	}
	var signed strings.Builder
	for _, field := range fields {
		if value, exists := payload[field]; exists && value != nil {
			signed.WriteString(field + "\n" + webhookString(value) + "\n")
		}
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, certURL.String(), nil)
	if err != nil {
		return false
	}
	response, err := (&http.Client{Timeout: 10 * time.Second}).Do(request)
	if err != nil {
		return false
	}
	defer response.Body.Close()
	pemData, err := io.ReadAll(io.LimitReader(response.Body, 1<<20))
	if err != nil || response.StatusCode < 200 || response.StatusCode >= 300 {
		return false
	}
	block, _ := pem.Decode(pemData)
	if block == nil {
		return false
	}
	certificate, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return false
	}
	publicKey, ok := certificate.PublicKey.(*rsa.PublicKey)
	if !ok {
		return false
	}
	signature, err := base64.StdEncoding.DecodeString(webhookString(payload["Signature"]))
	if err != nil {
		return false
	}
	if webhookString(payload["SignatureVersion"]) == "2" {
		digest := sha256.Sum256([]byte(signed.String()))
		return rsa.VerifyPKCS1v15(publicKey, crypto.SHA256, digest[:], signature) == nil
	}
	digest := sha1.Sum([]byte(signed.String()))
	return rsa.VerifyPKCS1v15(publicKey, crypto.SHA1, digest[:], signature) == nil
}

func confirmSNSSubscription(ctx context.Context, value string) error {
	parsed, err := url.Parse(value)
	if err != nil || parsed.Scheme != "https" || parsed.Hostname() == "" || !snsHostPattern.MatchString(strings.ToLower(parsed.Hostname())) {
		return errors.New("invalid SNS confirmation URL")
	}
	response, err := (&http.Client{Timeout: 10 * time.Second}).Get(parsed.String())
	if err != nil {
		return err
	}
	defer response.Body.Close()
	_, _ = io.Copy(io.Discard, io.LimitReader(response.Body, 4096))
	return nil
}

func metaProductChannel(value string) string {
	switch value {
	case "whatsapp_business_account":
		return channelTypeWhatsApp
	case "instagram":
		return channelTypeInstagram
	default:
		return channelTypeMessenger
	}
}

func doesNotEqual(expected, actual string) bool {
	return expected == "" || actual == "" || !hmac.Equal([]byte(expected), []byte(actual))
}

func webhookString(value any) string {
	switch value := value.(type) {
	case string:
		return value
	case float64:
		return strconv.FormatFloat(value, 'f', -1, 64)
	case bool:
		return strconv.FormatBool(value)
	case nil:
		return ""
	default:
		return fmt.Sprint(value)
	}
}

func webhookBool(value any) bool {
	result, _ := value.(bool)
	return result
}

func webhookMap(value any) map[string]any {
	result, _ := value.(map[string]any)
	return result
}
