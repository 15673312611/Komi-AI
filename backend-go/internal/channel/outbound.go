package channel

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/mail"
	"net/smtp"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/google/uuid"

	"github.com/komi/komi/backend-go/internal/config"
)

// SendResult keeps the channel-specific outcome behind one delivery contract.
// CanTemplate is meaningful for WhatsApp when its 24-hour service window has
// expired and an approved template can reopen the conversation.
type SendResult struct {
	OK                bool
	ExternalMessageID string
	Error             string
	CanTemplate       bool
}

type WindowStatus string

const (
	WindowOK            WindowStatus = "ok"
	WindowTemplate      WindowStatus = "template_required"
	WindowUndeliverable WindowStatus = "undeliverable"
)

type placeholderMessage struct {
	Timestamp string
	CreatedAt time.Time
}

// Sender is the channel-agnostic outbound adapter used by webhook processing.
// It owns only short-lived Slack typing placeholders; credentials remain in
// channel_accounts and are decrypted for each operation.
type Sender struct {
	Config     config.Config
	Accounts   *Repository
	HTTPClient *http.Client

	mu           sync.Mutex
	placeholders map[string]placeholderMessage
}

func NewSender(cfg config.Config, accounts *Repository) *Sender {
	return &Sender{Config: cfg, Accounts: accounts, placeholders: make(map[string]placeholderMessage)}
}

func (s *Sender) client() *http.Client {
	if s != nil && s.HTTPClient != nil {
		return s.HTTPClient
	}
	return defaultHTTPClient
}

func (s *Sender) credentials(account *Account) (map[string]any, error) {
	if s == nil || s.Accounts == nil {
		return nil, errors.New("channel credential storage is not configured")
	}
	return s.Accounts.Credentials(account)
}

// Deliver sends a formatted text reply to the connected channel. Empty text
// is an intentional no-op, matching the Python delivery service's handling of
// attachment-only/action-only responses.
func (s *Sender) Deliver(ctx context.Context, account *Account, conversation *Conversation, text string) SendResult {
	if account == nil || conversation == nil {
		return SendResult{Error: "channel conversation is not configured"}
	}
	if strings.TrimSpace(text) == "" {
		return SendResult{OK: true}
	}
	switch s.CheckDeliveryWindow(conversation, account.ChannelType) {
	case WindowTemplate:
		return SendResult{Error: "window_expired", CanTemplate: true}
	case WindowUndeliverable:
		return SendResult{Error: "window_expired"}
	}
	text = FormatOutbound(account.ChannelType, text)
	switch strings.ToLower(strings.TrimSpace(account.ChannelType)) {
	case "telegram":
		return s.sendTelegram(ctx, account, conversation.ExternalConversationID, text, nil)
	case "line":
		return s.sendLine(ctx, account, conversation.ExternalConversationID, text)
	case "whatsapp":
		return s.sendWhatsApp(ctx, account, conversation.ExternalConversationID, text)
	case "messenger":
		return s.sendMetaText(ctx, account, conversation.ExternalConversationID, text, false)
	case "instagram":
		return s.sendMetaText(ctx, account, conversation.ExternalConversationID, text, true)
	case "slack":
		return s.sendSlack(ctx, account, conversation, text)
	case "email":
		return s.sendEmail(ctx, account, conversation, text)
	case "sms":
		return s.sendSMS(ctx, account, conversation.ExternalConversationID, text)
	default:
		return SendResult{Error: "unknown_channel"}
	}
}

func (s *Sender) DeliverSession(ctx context.Context, sessionID, organizationID uuid.UUID, text string) SendResult {
	if s == nil || s.Accounts == nil {
		return SendResult{Error: "channel storage is not configured"}
	}
	conversation, err := s.Accounts.GetConversationBySession(ctx, sessionID)
	if err != nil || conversation == nil || conversation.OrganizationID != organizationID {
		if err != nil {
			return SendResult{Error: err.Error()}
		}
		return SendResult{Error: "channel conversation not found"}
	}
	account, err := s.Accounts.GetByID(ctx, conversation.ChannelAccountID)
	if err != nil || account == nil || !account.IsActive {
		if err != nil {
			return SendResult{Error: err.Error()}
		}
		return SendResult{Error: "channel account is inactive"}
	}
	return s.Deliver(ctx, account, conversation, text)
}

func (s *Sender) CheckDeliveryWindow(conversation *Conversation, channelType string) WindowStatus {
	if conversation == nil {
		return WindowUndeliverable
	}
	if channelType != "whatsapp" && channelType != "messenger" && channelType != "instagram" {
		return WindowOK
	}
	if conversation.LastInboundAt == nil || time.Since(*conversation.LastInboundAt) >= 24*time.Hour {
		if channelType == "whatsapp" {
			return WindowTemplate
		}
		return WindowUndeliverable
	}
	return WindowOK
}

func (s *Sender) Typing(ctx context.Context, account *Account, conversation *Conversation) error {
	if account == nil || conversation == nil {
		return nil
	}
	switch strings.ToLower(strings.TrimSpace(account.ChannelType)) {
	case "telegram":
		credentials, err := s.credentials(account)
		if err != nil {
			return err
		}
		_, _, err = s.telegramCall(ctx, credentialString(credentials, "bot_token"), "sendChatAction", url.Values{
			"chat_id": []string{conversation.ExternalConversationID}, "action": []string{"typing"},
		})
		return err
	case "line":
		credentials, err := s.credentials(account)
		if err != nil {
			return err
		}
		_, _, err = s.requestJSON(ctx, http.MethodPost, "https://api.line.me/v2/bot/chat/loading/start", bearerHeaders(credentialString(credentials, "channel_access_token")), map[string]any{
			"chatId": conversation.ExternalConversationID, "loadingSeconds": 20,
		}, "", "")
		return err
	case "whatsapp":
		messageID := stringValue(conversation.Extra["last_inbound_message_id"])
		if messageID == "" {
			return nil
		}
		credentials, err := s.credentials(account)
		if err != nil {
			return err
		}
		_, _, err = s.graphRequest(ctx, http.MethodPost, account.ExternalAccountID+"/messages", credentialString(credentials, "access_token"), false, map[string]any{
			"messaging_product": "whatsapp", "status": "read", "message_id": messageID,
			"typing_indicator": map[string]any{"type": "text"},
		})
		return err
	case "messenger", "instagram":
		credentials, err := s.credentials(account)
		if err != nil {
			return err
		}
		_, _, err = s.graphRequest(ctx, http.MethodPost, "me/messages", credentialString(credentials, "access_token"), account.ChannelType == "instagram", map[string]any{
			"recipient": map[string]any{"id": conversation.ExternalConversationID}, "sender_action": "typing_on",
		})
		return err
	case "slack":
		return s.slackTyping(ctx, account, conversation)
	default:
		return nil
	}
}

func (s *Sender) RequestPhone(ctx context.Context, account *Account, conversation *Conversation, text string) SendResult {
	if account == nil || conversation == nil || account.ChannelType != "telegram" {
		return SendResult{Error: "phone_request_unsupported"}
	}
	credentials, err := s.credentials(account)
	if err != nil {
		return SendResult{Error: err.Error()}
	}
	markup, _ := json.Marshal(map[string]any{
		"keyboard":          [][]map[string]any{{{"text": "Share my phone number", "request_contact": true}}},
		"resize_keyboard":   true,
		"one_time_keyboard": true,
	})
	return s.sendTelegram(ctx, account, conversation.ExternalConversationID, text, map[string]string{
		"bot_token": credentialString(credentials, "bot_token"), "reply_markup": string(markup),
	})
}

func (s *Sender) SendWhatsAppTemplate(ctx context.Context, account *Account, conversation *Conversation, templateName, language string, components []map[string]any) SendResult {
	if account == nil || conversation == nil || account.ChannelType != "whatsapp" {
		return SendResult{Error: "template_unsupported"}
	}
	credentials, err := s.credentials(account)
	if err != nil {
		return SendResult{Error: err.Error()}
	}
	if strings.TrimSpace(language) == "" {
		language = "en_US"
	}
	template := map[string]any{"name": templateName, "language": map[string]string{"code": language}}
	if components != nil {
		template["components"] = components
	}
	result, _, err := s.graphRequest(ctx, http.MethodPost, account.ExternalAccountID+"/messages", credentialString(credentials, "access_token"), false, map[string]any{
		"messaging_product": "whatsapp", "recipient_type": "individual", "to": conversation.ExternalConversationID,
		"type": "template", "template": template,
	})
	if err != nil {
		return SendResult{Error: err.Error()}
	}
	return SendResult{OK: true, ExternalMessageID: lookupString(result, "messages", "0", "id")}
}

func (s *Sender) FetchProfile(ctx context.Context, account *Account, externalUserID string) (map[string]any, error) {
	if account == nil || strings.TrimSpace(externalUserID) == "" {
		return map[string]any{}, nil
	}
	var result map[string]any
	switch strings.ToLower(strings.TrimSpace(account.ChannelType)) {
	case "messenger", "instagram":
		credentials, err := s.credentials(account)
		if err != nil {
			return nil, err
		}
		fields := "first_name,last_name"
		if account.ChannelType == "instagram" {
			fields = "name,username"
		}
		result, _, err = s.graphRequest(ctx, http.MethodGet, externalUserID+"?fields="+url.QueryEscape(fields), credentialString(credentials, "access_token"), account.ChannelType == "instagram", nil)
		if err != nil {
			return map[string]any{}, nil
		}
		if account.ChannelType == "instagram" {
			if name := firstNonEmpty(stringValue(result["name"]), stringValue(result["username"])); name != "" {
				return map[string]any{"name": name}, nil
			}
		} else if name := strings.TrimSpace(strings.Join(nonEmptyStrings(stringValue(result["first_name"]), stringValue(result["last_name"])), " ")); name != "" {
			return map[string]any{"name": name}, nil
		}
		return map[string]any{}, nil
	case "slack":
		credentials, err := s.credentials(account)
		if err != nil {
			return nil, err
		}
		result, _, err = s.requestForm(ctx, http.MethodPost, "https://slack.com/api/users.info", url.Values{"user": []string{externalUserID}}, bearerHeaders(credentialString(credentials, "access_token")), "", "")
		if err != nil || !boolValue(result["ok"]) {
			return map[string]any{}, nil
		}
		user := object(result, "user")
		profile := object(user, "profile")
		return map[string]any{"name": firstNonEmpty(stringValue(user["real_name"]), stringValue(profile["display_name"]), stringValue(profile["real_name"])), "email": stringValue(profile["email"])}, nil
	default:
		return map[string]any{}, nil
	}
}

func (s *Sender) sendTelegram(ctx context.Context, account *Account, chatID, text string, overrides map[string]string) SendResult {
	credentials, err := s.credentials(account)
	if err != nil {
		if overrides != nil && overrides["bot_token"] != "" {
			return SendResult{Error: err.Error()}
		}
		return SendResult{Error: err.Error()}
	}
	token := credentialString(credentials, "bot_token")
	if overrides != nil && overrides["bot_token"] != "" {
		token = overrides["bot_token"]
	}
	values := url.Values{"chat_id": []string{chatID}, "text": []string{text}}
	if overrides != nil && overrides["reply_markup"] != "" {
		values.Set("reply_markup", overrides["reply_markup"])
	}
	result, _, err := s.telegramCall(ctx, token, "sendMessage", values)
	if err != nil || !boolValue(result["ok"]) {
		if err != nil {
			return SendResult{Error: err.Error()}
		}
		return SendResult{Error: firstNonEmpty(stringValue(result["description"]), "sendMessage failed")}
	}
	return SendResult{OK: true, ExternalMessageID: lookupString(result, "result", "message_id")}
}

func (s *Sender) sendLine(ctx context.Context, account *Account, to, text string) SendResult {
	credentials, err := s.credentials(account)
	if err != nil {
		return SendResult{Error: err.Error()}
	}
	_, _, err = s.requestJSON(ctx, http.MethodPost, "https://api.line.me/v2/bot/message/push", bearerHeaders(credentialString(credentials, "channel_access_token")), map[string]any{
		"to": to, "messages": []map[string]string{{"type": "text", "text": text}},
	}, "", "")
	if err != nil {
		return SendResult{Error: err.Error()}
	}
	return SendResult{OK: true}
}

func (s *Sender) sendWhatsApp(ctx context.Context, account *Account, to, text string) SendResult {
	credentials, err := s.credentials(account)
	if err != nil {
		return SendResult{Error: err.Error()}
	}
	result, _, err := s.graphRequest(ctx, http.MethodPost, account.ExternalAccountID+"/messages", credentialString(credentials, "access_token"), false, map[string]any{
		"messaging_product": "whatsapp", "recipient_type": "individual", "to": to,
		"type": "text", "text": map[string]any{"preview_url": false, "body": text},
	})
	if err != nil {
		return SendResult{Error: err.Error()}
	}
	return SendResult{OK: true, ExternalMessageID: lookupString(result, "messages", "0", "id")}
}

func (s *Sender) sendMetaText(ctx context.Context, account *Account, to, text string, instagram bool) SendResult {
	credentials, err := s.credentials(account)
	if err != nil {
		return SendResult{Error: err.Error()}
	}
	body := map[string]any{"recipient": map[string]any{"id": to}, "message": map[string]any{"text": text}}
	if !instagram {
		body["messaging_type"] = "RESPONSE"
	}
	result, _, err := s.graphRequest(ctx, http.MethodPost, "me/messages", credentialString(credentials, "access_token"), instagram, body)
	if err != nil {
		return SendResult{Error: err.Error()}
	}
	return SendResult{OK: true, ExternalMessageID: stringValue(result["message_id"])}
}

func (s *Sender) slackTyping(ctx context.Context, account *Account, conversation *Conversation) error {
	credentials, err := s.credentials(account)
	if err != nil {
		return err
	}
	channelID, threadTS := splitSlackConversation(conversation.ExternalConversationID)
	body := map[string]any{"channel": channelID, "text": "_typing..._", "mrkdwn": true}
	if threadTS != "" {
		body["thread_ts"] = threadTS
	}
	result, _, err := s.requestJSON(ctx, http.MethodPost, "https://slack.com/api/chat.postMessage", bearerHeaders(credentialString(credentials, "access_token")), body, "", "")
	if err != nil {
		return err
	}
	if !boolValue(result["ok"]) {
		return errors.New(firstNonEmpty(stringValue(result["error"]), "Slack typing placeholder failed"))
	}
	s.mu.Lock()
	if s.placeholders == nil {
		s.placeholders = make(map[string]placeholderMessage)
	}
	s.placeholders[slackPlaceholderKey(account, conversation)] = placeholderMessage{Timestamp: stringValue(result["ts"]), CreatedAt: time.Now()}
	s.mu.Unlock()
	return nil
}

func (s *Sender) sendSlack(ctx context.Context, account *Account, conversation *Conversation, text string) SendResult {
	credentials, err := s.credentials(account)
	if err != nil {
		return SendResult{Error: err.Error()}
	}
	channelID, threadTS := splitSlackConversation(conversation.ExternalConversationID)
	key := slackPlaceholderKey(account, conversation)
	s.mu.Lock()
	placeholder, hasPlaceholder := s.placeholders[key]
	if hasPlaceholder {
		delete(s.placeholders, key)
	}
	s.mu.Unlock()
	if hasPlaceholder && time.Since(placeholder.CreatedAt) <= 5*time.Minute {
		result, _, updateErr := s.requestJSON(ctx, http.MethodPost, "https://slack.com/api/chat.update", bearerHeaders(credentialString(credentials, "access_token")), map[string]any{
			"channel": channelID, "ts": placeholder.Timestamp, "text": text,
		}, "", "")
		if updateErr == nil && boolValue(result["ok"]) {
			return SendResult{OK: true, ExternalMessageID: stringValue(result["ts"])}
		}
		_, _, _ = s.requestJSON(ctx, http.MethodPost, "https://slack.com/api/chat.delete", bearerHeaders(credentialString(credentials, "access_token")), map[string]any{
			"channel": channelID, "ts": placeholder.Timestamp,
		}, "", "")
	}
	body := map[string]any{"channel": channelID, "text": text}
	if threadTS != "" {
		body["thread_ts"] = threadTS
	}
	result, _, err := s.requestJSON(ctx, http.MethodPost, "https://slack.com/api/chat.postMessage", bearerHeaders(credentialString(credentials, "access_token")), body, "", "")
	if err != nil || !boolValue(result["ok"]) {
		if err != nil {
			return SendResult{Error: err.Error()}
		}
		return SendResult{Error: firstNonEmpty(stringValue(result["error"]), "chat.postMessage failed")}
	}
	return SendResult{OK: true, ExternalMessageID: stringValue(result["ts"])}
}

type smtpSettings struct {
	Host      string
	Port      int
	Username  string
	Password  string
	FromEmail string
	UseSSL    bool
}

func (s *Sender) smtpSettings(account *Account) smtpSettings {
	result := smtpSettings{Host: s.Config.SMTPServer, Port: s.Config.SMTPPort, Username: s.Config.SMTPUsername, Password: s.Config.SMTPPassword, FromEmail: s.Config.FromEmail}
	if result.Port == 0 {
		result.Port = 587
	}
	if account != nil && s.Accounts != nil {
		if values, err := s.Accounts.Credentials(account); err == nil {
			if host := credentialString(values, "smtp_host"); host != "" {
				result.Host = host
				if port, parseErr := strconv.Atoi(credentialString(values, "smtp_port")); parseErr == nil && port > 0 {
					result.Port = port
				}
				result.Username = credentialString(values, "smtp_username")
				result.Password = credentialString(values, "smtp_password")
				result.FromEmail = firstNonEmpty(credentialString(values, "from_email"), account.ExternalAccountID, result.FromEmail)
				if raw, ok := values["smtp_use_ssl"].(bool); ok {
					result.UseSSL = raw
				} else {
					result.UseSSL = result.Port == 465
				}
			}
		}
	}
	if result.FromEmail == "" {
		result.FromEmail = account.ExternalAccountID
	}
	if result.Port == 465 {
		result.UseSSL = true
	}
	return result
}

func (s *Sender) sendEmail(ctx context.Context, account *Account, conversation *Conversation, text string) SendResult {
	settings := s.smtpSettings(account)
	if settings.Host == "" || settings.FromEmail == "" {
		return SendResult{Error: "SMTP is not configured"}
	}
	if _, err := mail.ParseAddress(conversation.ExternalConversationID); err != nil {
		return SendResult{Error: "invalid recipient email"}
	}
	subject := stringValue(conversation.Extra["subject"])
	if subject == "" {
		subject = "Re: your message"
	} else if !strings.HasPrefix(strings.ToLower(subject), "re:") {
		subject = "Re: " + subject
	}
	messageID := fmt.Sprintf("<%s@komi>", uuid.NewString())
	lastInbound := stringValue(conversation.Extra["last_message_id"])
	var builder strings.Builder
	builder.WriteString("From: " + cleanHeader(settings.FromEmail) + "\r\n")
	builder.WriteString("To: " + cleanHeader(conversation.ExternalConversationID) + "\r\n")
	builder.WriteString("Subject: " + cleanHeader(subject) + "\r\n")
	builder.WriteString("Message-ID: " + cleanHeader(messageID) + "\r\n")
	if lastInbound != "" {
		builder.WriteString("In-Reply-To: " + cleanHeader(lastInbound) + "\r\n")
		builder.WriteString("References: " + cleanHeader(lastInbound) + "\r\n")
	}
	builder.WriteString("MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n")
	builder.WriteString(text)
	if err := sendSMTP(ctx, settings, settings.FromEmail, conversation.ExternalConversationID, []byte(builder.String())); err != nil {
		return SendResult{Error: err.Error()}
	}
	return SendResult{OK: true, ExternalMessageID: messageID}
}

func sendSMTP(ctx context.Context, settings smtpSettings, from, to string, data []byte) error {
	address := net.JoinHostPort(settings.Host, strconv.Itoa(settings.Port))
	dialer := &net.Dialer{Timeout: 20 * time.Second}
	connection, err := dialer.DialContext(ctx, "tcp", address)
	if err != nil {
		return err
	}
	if deadline, ok := ctx.Deadline(); ok {
		_ = connection.SetDeadline(deadline)
	}
	if settings.UseSSL {
		tlsConnection := tls.Client(connection, &tls.Config{ServerName: settings.Host, MinVersion: tls.VersionTLS12})
		if err := tlsConnection.HandshakeContext(ctx); err != nil {
			_ = connection.Close()
			return err
		}
		connection = tlsConnection
	}
	client, err := smtp.NewClient(connection, settings.Host)
	if err != nil {
		_ = connection.Close()
		return err
	}
	defer client.Close()
	if !settings.UseSSL {
		if supported, _ := client.Extension("STARTTLS"); supported {
			if err := client.StartTLS(&tls.Config{ServerName: settings.Host, MinVersion: tls.VersionTLS12}); err != nil {
				return err
			}
		}
	}
	if settings.Username != "" {
		if err := client.Auth(smtp.PlainAuth("", settings.Username, settings.Password, settings.Host)); err != nil {
			return err
		}
	}
	if err := client.Mail(from); err != nil {
		return err
	}
	if err := client.Rcpt(to); err != nil {
		return err
	}
	writer, err := client.Data()
	if err != nil {
		return err
	}
	if _, err := writer.Write(data); err != nil {
		_ = writer.Close()
		return err
	}
	return writer.Close()
}

func (s *Sender) sendSMS(ctx context.Context, account *Account, to, text string) SendResult {
	credentials, err := s.credentials(account)
	if err != nil {
		return SendResult{Error: err.Error()}
	}
	provider := strings.ToLower(strings.TrimSpace(stringValue(account.Settings["provider"])))
	if provider == "" {
		provider = "twilio"
	}
	from := account.ExternalAccountID
	var result map[string]any
	switch provider {
	case "twilio":
		accountSID, token := credentialString(credentials, "account_sid"), credentialString(credentials, "auth_token")
		result, _, err = s.requestForm(ctx, http.MethodPost, "https://api.twilio.com/2010-04-01/Accounts/"+url.PathEscape(accountSID)+"/Messages.json", url.Values{"From": []string{from}, "To": []string{to}, "Body": []string{text}}, nil, accountSID, token)
		if err == nil {
			return SendResult{OK: true, ExternalMessageID: stringValue(result["sid"])}
		}
	case "plivo":
		authID, token := credentialString(credentials, "auth_id"), credentialString(credentials, "auth_token")
		result, _, err = s.requestJSON(ctx, http.MethodPost, "https://api.plivo.com/v1/Account/"+url.PathEscape(authID)+"/Message/", basicHeaders(authID, token), map[string]any{"src": from, "dst": to, "text": text}, "", "")
		if err == nil {
			ids, _ := result["message_uuid"].([]any)
			id := ""
			if len(ids) > 0 {
				id = stringValue(ids[0])
			}
			return SendResult{OK: true, ExternalMessageID: id}
		}
	case "vonage":
		result, _, err = s.requestForm(ctx, http.MethodPost, "https://rest.nexmo.com/sms/json", url.Values{"api_key": []string{credentialString(credentials, "api_key")}, "api_secret": []string{credentialString(credentials, "api_secret")}, "from": []string{from}, "to": []string{to}, "text": []string{text}}, nil, "", "")
		if err == nil {
			message := nestedMap(result, "messages", "0")
			if stringValue(message["status"]) != "0" {
				return SendResult{Error: firstNonEmpty(stringValue(message["error-text"]), "Vonage send failed")}
			}
			return SendResult{OK: true, ExternalMessageID: stringValue(message["message-id"])}
		}
	case "messagebird":
		result, _, err = s.requestJSON(ctx, http.MethodPost, "https://rest.messagebird.com/messages", map[string]string{"Authorization": "AccessKey " + credentialString(credentials, "access_key")}, map[string]any{"originator": from, "recipients": []string{to}, "body": text}, "", "")
		if err == nil {
			return SendResult{OK: true, ExternalMessageID: stringValue(result["id"])}
		}
	case "brevo":
		result, _, err = s.requestJSON(ctx, http.MethodPost, "https://api.brevo.com/v3/transactionalSMS/sms", map[string]string{"api-key": credentialString(credentials, "api_key")}, map[string]any{"sender": from, "recipient": to, "content": text}, "", "")
		if err == nil {
			return SendResult{OK: true, ExternalMessageID: stringValue(result["messageId"])}
		}
	case "sns":
		return s.sendSNS(ctx, account, to, text, credentials)
	default:
		return SendResult{Error: "unknown SMS provider: " + provider}
	}
	if err == nil {
		err = errors.New("SMS provider returned an empty response")
	}
	return SendResult{Error: err.Error()}
}

func (s *Sender) sendSNS(ctx context.Context, account *Account, to, text string, values map[string]any) SendResult {
	region := credentialString(values, "region")
	accessKey := credentialString(values, "aws_access_key_id")
	secretKey := credentialString(values, "aws_secret_access_key")
	if region == "" || accessKey == "" || secretKey == "" {
		return SendResult{Error: "AWS access key, secret, and region are required"}
	}
	awsCfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithRegion(region),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, credentialString(values, "aws_session_token"))),
	)
	if err != nil {
		return SendResult{Error: err.Error()}
	}
	result, err := sns.NewFromConfig(awsCfg).Publish(ctx, &sns.PublishInput{
		PhoneNumber: aws.String(to),
		Message:     aws.String(text),
	})
	if err != nil {
		return SendResult{Error: err.Error()}
	}
	return SendResult{OK: true, ExternalMessageID: aws.ToString(result.MessageId)}
}

func FormatOutbound(channelType, text string) string {
	limit := 0
	switch strings.ToLower(strings.TrimSpace(channelType)) {
	case "telegram", "whatsapp":
		limit = 4096
	case "line":
		limit = 5000
	case "messenger", "instagram":
		limit = 2000
	case "slack":
		limit = 12000
	case "sms":
		text = strings.ReplaceAll(strings.ReplaceAll(text, "**", ""), "__", "")
		limit = 1600
	}
	return truncateRunes(text, limit)
}

func truncateRunes(value string, maximum int) string {
	if maximum <= 0 {
		return value
	}
	runes := []rune(value)
	if len(runes) <= maximum {
		return value
	}
	return string(runes[:maximum])
}

func (s *Sender) telegramCall(ctx context.Context, token, method string, values url.Values) (map[string]any, int, error) {
	return s.requestForm(ctx, http.MethodPost, "https://api.telegram.org/bot"+strings.TrimSpace(token)+"/"+strings.TrimLeft(method, "/"), values, nil, "", "")
}

func (s *Sender) graphRequest(ctx context.Context, method, path, token string, instagram bool, body any) (map[string]any, int, error) {
	return s.requestJSON(ctx, method, GraphURL(s.Config, path, instagram), bearerHeaders(token), body, "", "")
}

func (s *Sender) requestJSON(ctx context.Context, method, endpoint string, headers map[string]string, body any, username, password string) (map[string]any, int, error) {
	var reader io.Reader
	if body != nil {
		encoded, err := json.Marshal(body)
		if err != nil {
			return nil, 0, err
		}
		reader = bytes.NewReader(encoded)
	}
	request, err := http.NewRequestWithContext(ctx, method, endpoint, reader)
	if err != nil {
		return nil, 0, err
	}
	if body != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	for key, value := range headers {
		request.Header.Set(key, value)
	}
	if username != "" {
		request.SetBasicAuth(username, password)
	}
	return s.executeRemote(request)
}

func (s *Sender) requestForm(ctx context.Context, method, endpoint string, values url.Values, headers map[string]string, username, password string) (map[string]any, int, error) {
	request, err := http.NewRequestWithContext(ctx, method, endpoint, strings.NewReader(values.Encode()))
	if err != nil {
		return nil, 0, err
	}
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	for key, value := range headers {
		request.Header.Set(key, value)
	}
	if username != "" {
		request.SetBasicAuth(username, password)
	}
	return s.executeRemote(request)
}

func (s *Sender) executeRemote(request *http.Request) (map[string]any, int, error) {
	response, err := s.client().Do(request)
	if err != nil {
		return nil, 0, err
	}
	defer response.Body.Close()
	data, err := io.ReadAll(io.LimitReader(response.Body, 4<<20))
	if err != nil {
		return nil, response.StatusCode, err
	}
	result := map[string]any{}
	if len(bytes.TrimSpace(data)) > 0 {
		if decodeErr := json.Unmarshal(data, &result); decodeErr != nil {
			if response.StatusCode >= 200 && response.StatusCode < 300 {
				return result, response.StatusCode, fmt.Errorf("decode remote response: %w", decodeErr)
			}
		}
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return result, response.StatusCode, remoteError(result, response.StatusCode)
	}
	return result, response.StatusCode, nil
}

func bearerHeaders(token string) map[string]string {
	return map[string]string{"Authorization": "Bearer " + token}
}

func basicHeaders(username, password string) map[string]string {
	request, _ := http.NewRequest(http.MethodGet, "http://localhost", nil)
	request.SetBasicAuth(username, password)
	return map[string]string{"Authorization": request.Header.Get("Authorization")}
}

func credentialString(values map[string]any, key string) string {
	if values == nil {
		return ""
	}
	return stringValue(values[key])
}

func lookupString(value map[string]any, path ...string) string {
	var current any = value
	for _, key := range path {
		switch typed := current.(type) {
		case map[string]any:
			current = typed[key]
		case []any:
			index, err := strconv.Atoi(key)
			if err != nil || index < 0 || index >= len(typed) {
				return ""
			}
			current = typed[index]
		default:
			return ""
		}
	}
	return stringValue(current)
}

func nestedMap(value map[string]any, path ...string) map[string]any {
	var current any = value
	for _, key := range path {
		switch typed := current.(type) {
		case map[string]any:
			current = typed[key]
		case []any:
			index, err := strconv.Atoi(key)
			if err != nil || index < 0 || index >= len(typed) {
				return map[string]any{}
			}
			current = typed[index]
		default:
			return map[string]any{}
		}
	}
	result, _ := current.(map[string]any)
	if result == nil {
		return map[string]any{}
	}
	return result
}

func splitSlackConversation(value string) (string, string) {
	if index := strings.IndexByte(value, ':'); index >= 0 {
		return value[:index], value[index+1:]
	}
	return value, ""
}

func slackPlaceholderKey(account *Account, conversation *Conversation) string {
	return account.ID.String() + "|" + conversation.ExternalConversationID
}

func cleanHeader(value string) string {
	return strings.NewReplacer("\r", "", "\n", "").Replace(value)
}
