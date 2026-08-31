package channel

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/mail"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/chattermate/chattermate/backend-go/internal/agent"
	"github.com/chattermate/chattermate/backend-go/internal/aiconfig"
	"github.com/chattermate/chattermate/backend-go/internal/chat"
	"github.com/chattermate/chattermate/backend-go/internal/customer"
	"github.com/chattermate/chattermate/backend-go/internal/guardrail"
	"github.com/chattermate/chattermate/backend-go/internal/leadcapture"
	"github.com/chattermate/chattermate/backend-go/internal/organization"
	"github.com/chattermate/chattermate/backend-go/internal/session"
	"github.com/chattermate/chattermate/backend-go/internal/store"
	"github.com/chattermate/chattermate/backend-go/internal/user"
)

// InboundMessage is the channel-independent representation consumed by the
// conversation pipeline. The webhook handlers only deal with transport and
// authentication; customer/session/message persistence happens below.
type InboundMessage struct {
	ExternalAccountID      string
	ExternalConversationID string
	ExternalUserID         string
	ExternalMessageID      string
	Text                   string
	Attachments            []map[string]any
	Profile                map[string]any
	Timestamp              *time.Time
}

type Interaction struct {
	Type                   string
	ExternalAccountID      string
	ExternalConversationID string
	ExternalUserID         string
	Phone                  string
	Profile                map[string]any
}

// ReplyRequest is the channel-independent input passed to the AI runtime.
// Keeping it here prevents channel ingress from depending on realtime or HTTP
// packages and lets every transport share the same response contract.
type ReplyRequest struct {
	OrganizationID    uuid.UUID
	AgentID           uuid.UUID
	CustomerID        uuid.UUID
	SessionID         uuid.UUID
	Channel           string
	Message           string
	ConversationExtra map[string]any
}

type Reply struct {
	Message             string
	TransferToHuman     bool
	TransferReason      string
	TransferDescription string
	EndChat             bool
	EndChatReason       string
	EndChatDescription  string
	RequestContact      bool
	RequestRating       bool
	// These fields mirror the structured ChatResponse returned by the Python
	// agent. They are transport-neutral so widget and external channels can
	// share parsing and persistence without importing realtime.
	RequestLeadCapture bool
	LeadEmail          string
	LeadName           string
	LeadCompany        string
	LeadPhone          string
	LeadData           map[string]any
	LeadSummary        string
	LeadConsent        bool
	Sources            []map[string]any
	ShopifyOutput      map[string]any
	CreateTicket       bool
	TicketSummary      string
	TicketDescription  string
	IntegrationType    string
	TicketID           string
	TicketStatus       string
	TicketPriority     string
}

const channelQueuedForHumanNotice = "I'm passing this to a member of our team. Someone will reply here shortly."

type Responder func(context.Context, ReplyRequest) (Reply, error)
type Broadcaster func(context.Context, uuid.UUID, uuid.UUID, map[string]any) error
type Notifier func(context.Context, []uuid.UUID, string, string, string, map[string]any)

// ProcessorDependencies is deliberately expressed in terms of existing
// stores so channel ingress shares the same database contracts as widget and
// agent messages.
type ProcessorDependencies struct {
	Accounts          *Repository
	Customers         customer.Store
	LeadCapture       leadcapture.Store
	Sessions          session.Store
	Chats             chat.Store
	Agents            agent.Store
	Users             user.Store
	AIConfigs         aiconfig.Store
	Organizations     organization.Store
	Stores            store.Service
	GuardrailSettings guardrail.Settings
	GuardrailEvents   guardrail.EventStore
	Responder         Responder
	Broadcast         Broadcaster
	Sender            *Sender
	Notifier          Notifier
}

func ParseTelegram(payload map[string]any) ([]InboundMessage, *Interaction) {
	message := object(payload, "message")
	if len(message) == 0 {
		return nil, nil
	}
	sender := object(message, "from")
	chatObject := object(message, "chat")
	chatID := stringValue(chatObject["id"])
	if chatID == "" || boolValue(sender["is_bot"]) {
		return nil, nil
	}
	if contact := object(message, "contact"); len(contact) > 0 && stringValue(contact["user_id"]) == stringValue(sender["id"]) {
		return nil, &Interaction{
			Type: "contact", ExternalConversationID: chatID,
			ExternalUserID: firstNonEmpty(stringValue(sender["id"]), chatID),
			Phone:          stringValue(contact["phone_number"]),
			Profile:        map[string]any{"name": firstNonEmpty(stringValue(contact["first_name"]), stringValue(contact["last_name"]))},
		}
	}
	text := firstNonEmpty(stringValue(message["text"]), stringValue(message["caption"]))
	if text == "" {
		return nil, nil
	}
	profileName := strings.TrimSpace(strings.Join(nonEmptyStrings(stringValue(sender["first_name"]), stringValue(sender["last_name"])), " "))
	if profileName == "" {
		profileName = stringValue(sender["username"])
	}
	var timestamp *time.Time
	if value := int64Value(message["date"]); value > 0 {
		parsed := time.Unix(value, 0).UTC()
		timestamp = &parsed
	}
	return []InboundMessage{{
		ExternalConversationID: chatID,
		ExternalUserID:         firstNonEmpty(stringValue(sender["id"]), chatID),
		ExternalMessageID:      stringValue(message["message_id"]),
		Text:                   text,
		Profile:                map[string]any{"name": profileName, "username": stringValue(sender["username"])},
		Timestamp:              timestamp,
	}}, nil
}

func ParseLINE(payload map[string]any) []InboundMessage {
	events := objects(payload["events"])
	result := make([]InboundMessage, 0, len(events))
	for _, event := range events {
		message := object(event, "message")
		source := object(event, "source")
		if stringValue(event["type"]) != "message" || stringValue(message["type"]) != "text" {
			continue
		}
		userID := stringValue(source["userId"])
		if userID == "" {
			continue
		}
		var timestamp *time.Time
		if value := int64Value(event["timestamp"]); value > 0 {
			parsed := time.UnixMilli(value).UTC()
			timestamp = &parsed
		}
		result = append(result, InboundMessage{
			ExternalAccountID: stringValue(payload["destination"]), ExternalConversationID: userID,
			ExternalUserID: userID, ExternalMessageID: stringValue(message["id"]),
			Text: stringValue(message["text"]), Timestamp: timestamp,
		})
	}
	return result
}

// ParseMeta handles the one callback shared by WhatsApp, Messenger and
// Instagram. The top-level object identifies the product; each product has a
// different nesting shape below entries[].
func ParseMeta(payload map[string]any) []InboundMessage {
	product := stringValue(payload["object"])
	entries := objects(payload["entry"])
	result := make([]InboundMessage, 0)
	for _, entry := range entries {
		accountID := stringValue(entry["id"])
		if product == "whatsapp_business_account" {
			changes := objects(entry["changes"])
			for _, change := range changes {
				value := object(change, "value")
				metadata := object(value, "metadata")
				if phoneID := stringValue(metadata["phone_number_id"]); phoneID != "" {
					accountID = phoneID
				}
				contacts := objects(value["contacts"])
				contactNames := map[string]string{}
				for _, contact := range contacts {
					profile := object(contact, "profile")
					contactNames[stringValue(contact["wa_id"])] = stringValue(profile["name"])
				}
				for _, message := range objects(value["messages"]) {
					kind := stringValue(message["type"])
					text := stringValue(object(message, "text")["body"])
					if text == "" && kind == "image" {
						text = stringValue(object(message, "image")["caption"])
					}
					from := stringValue(message["from"])
					if from == "" || text == "" {
						continue
					}
					var timestamp *time.Time
					if value := int64Value(stringValue(message["timestamp"])); value > 0 {
						parsed := time.Unix(value, 0).UTC()
						timestamp = &parsed
					}
					result = append(result, InboundMessage{
						ExternalAccountID: accountID, ExternalConversationID: from,
						ExternalUserID: from, ExternalMessageID: stringValue(message["id"]), Text: text,
						Profile: map[string]any{"name": contactNames[from], "phone": from}, Timestamp: timestamp,
					})
				}
			}
			continue
		}
		for _, event := range objects(entry["messaging"]) {
			message := object(event, "message")
			if len(message) == 0 || boolValue(message["is_echo"]) {
				continue
			}
			text := stringValue(message["text"])
			sender := object(event, "sender")
			from := stringValue(sender["id"])
			if text == "" || from == "" {
				continue
			}
			var timestamp *time.Time
			if value := int64Value(event["timestamp"]); value > 0 {
				parsed := time.UnixMilli(value).UTC()
				timestamp = &parsed
			}
			result = append(result, InboundMessage{
				ExternalAccountID: accountID, ExternalConversationID: from, ExternalUserID: from,
				ExternalMessageID: firstNonEmpty(stringValue(message["mid"]), stringValue(event["timestamp"])),
				Text:              text, Timestamp: timestamp,
			})
		}
	}
	return result
}

var slackMention = regexp.MustCompile(`<@[A-Z0-9]+>`)

func ParseSlack(payload map[string]any) []InboundMessage {
	event := object(payload, "event")
	typeName := stringValue(event["type"])
	isMention := typeName == "app_mention"
	isDM := typeName == "message" && stringValue(event["channel_type"]) == "im"
	if !isMention && !isDM || stringValue(event["bot_id"]) != "" || stringValue(event["subtype"]) != "" {
		return nil
	}
	text := strings.TrimSpace(slackMention.ReplaceAllString(stringValue(event["text"]), ""))
	channelID := stringValue(event["channel"])
	if text == "" || channelID == "" {
		return nil
	}
	conversationID := channelID
	if isMention {
		conversationID += ":" + firstNonEmpty(stringValue(event["thread_ts"]), stringValue(event["ts"]))
	} else if thread := stringValue(event["thread_ts"]); thread != "" {
		conversationID += ":" + thread
	}
	return []InboundMessage{{
		ExternalAccountID: stringValue(payload["team_id"]), ExternalConversationID: conversationID,
		ExternalUserID: stringValue(event["user"]), ExternalMessageID: firstNonEmpty(stringValue(payload["event_id"]), stringValue(event["ts"])), Text: text,
	}}
}

func ParseEmail(payload map[string]any) []InboundMessage {
	if emailAutoGenerated(payload) {
		return nil
	}
	from := firstNonEmpty(stringValue(payload["from"]), stringValue(payload["From"]))
	address := ""
	name := ""
	if parsed, err := mail.ParseAddress(from); err == nil {
		address, name = strings.ToLower(parsed.Address), parsed.Name
	} else if strings.Contains(from, "@") {
		address = strings.ToLower(strings.TrimSpace(from))
	}
	if address == "" {
		return nil
	}
	text := firstNonEmpty(stringValue(payload["text"]), stringValue(payload["RawTextBody"]), stringValue(payload["body"]))
	text = stripQuotedReply(text)
	if text == "" {
		return nil
	}
	headers := stringValue(payload["headers"])
	messageID := firstNonEmpty(stringValue(payload["MessageId"]), stringValue(payload["message_id"]), headerValue(payload, headers, "Message-ID"))
	subject := firstNonEmpty(stringValue(payload["subject"]), stringValue(payload["Subject"]))
	if messageID == "" {
		digest := sha256.Sum256([]byte(text))
		messageID = address + ":" + hex.EncodeToString(digest[:])[:32]
	}
	profile := map[string]any{"name": name, "email": address, "subject": subject, "inbound_message_id": firstNonEmpty(stringValue(payload["MessageId"]), stringValue(payload["message_id"])), "in_reply_to": headerValue(payload, headers, "In-Reply-To"), "references": headerValue(payload, headers, "References")}
	return []InboundMessage{{ExternalConversationID: address, ExternalUserID: address, ExternalMessageID: messageID, Text: text, Profile: profile}}
}

func ParseSMSText(provider string, params map[string]string, accountID string) []InboundMessage {
	provider = strings.ToLower(strings.TrimSpace(provider))
	sender, text, id, recipient := "", "", "", accountID
	switch provider {
	case "twilio":
		sender, text, id, recipient = params["From"], strings.TrimSpace(params["Body"]), params["MessageSid"], params["To"]
	case "plivo":
		sender, text, id, recipient = params["From"], strings.TrimSpace(params["Text"]), params["MessageUUID"], params["To"]
	case "vonage":
		sender, text, id, recipient = params["msisdn"], strings.TrimSpace(params["text"]), params["messageId"], params["to"]
	case "messagebird":
		sender, text, id, recipient = firstNonEmpty(params["originator"], params["sender"]), strings.TrimSpace(firstNonEmpty(params["payload"], params["body"])), params["id"], firstNonEmpty(params["recipient"], accountID)
	case "brevo":
		sender, text, id, recipient = firstNonEmpty(params["from"], params["sender"], params["msisdn"]), strings.TrimSpace(firstNonEmpty(params["text"], params["message"], params["content"])), firstNonEmpty(params["id"], params["messageId"]), firstNonEmpty(params["to"], accountID)
	default:
		return nil
	}
	if sender == "" || text == "" {
		return nil
	}
	return []InboundMessage{{ExternalAccountID: recipient, ExternalConversationID: sender, ExternalUserID: sender, ExternalMessageID: id, Text: text, Profile: map[string]any{"phone": sender}}}
}

func ParseSNSMessage(payload map[string]any) []InboundMessage {
	if stringValue(payload["Type"]) != "Notification" {
		return nil
	}
	message := object(payload, "Message")
	if len(message) == 0 {
		var raw map[string]any
		if json.Unmarshal([]byte(stringValue(payload["Message"])), &raw) != nil {
			return nil
		}
		message = raw
	}
	sender, text := stringValue(message["originationNumber"]), strings.TrimSpace(stringValue(message["messageBody"]))
	if sender == "" || text == "" {
		return nil
	}
	return []InboundMessage{{ExternalAccountID: stringValue(message["destinationNumber"]), ExternalConversationID: sender, ExternalUserID: sender, ExternalMessageID: stringValue(payload["MessageId"]), Text: text, Profile: map[string]any{"phone": sender}}}
}

func (p ProcessorDependencies) Process(ctx context.Context, accountID uuid.UUID, inbound InboundMessage) error {
	if p.Accounts == nil || p.Customers == nil || p.Sessions == nil || p.Chats == nil {
		return errors.New("channel processing dependencies are not configured")
	}
	account, err := p.Accounts.GetByID(ctx, accountID)
	if err != nil {
		return err
	}
	if account == nil || !account.IsActive {
		return ErrNotFound
	}
	agentID, err := p.Accounts.AgentID(ctx, account.ID)
	if err != nil {
		return err
	}
	if agentID == nil && p.Stores != nil {
		if st, stErr := p.Stores.GetByEmailAccountID(ctx, account.ID); stErr == nil && st != nil && st.AgentID != nil {
			agentID = st.AgentID
		}
	}
	if agentID == nil && p.Agents != nil {
		if defaultAgents, listErr := p.Agents.List(ctx, account.OrganizationID); listErr == nil && len(defaultAgents) > 0 {
			for _, da := range defaultAgents {
				if da.IsActive {
					agentID = &da.ID
					break
				}
			}
		}
	}
	if agentID == nil {
		return errors.New("channel account has no active agent")
	}
	var configuredAgent *agent.Agent
	if p.Agents != nil {
		configuredAgent, err = p.Agents.Get(ctx, *agentID, account.OrganizationID)
		if err != nil {
			return err
		}
		if configuredAgent == nil || !configuredAgent.IsActive {
			return errors.New("channel account agent is not active")
		}
	}
	inbound.ExternalAccountID = firstNonEmpty(inbound.ExternalAccountID, account.ExternalAccountID)
	inbound.ExternalUserID = firstNonEmpty(inbound.ExternalUserID, inbound.ExternalConversationID)
	inbound.ExternalConversationID = firstNonEmpty(inbound.ExternalConversationID, inbound.ExternalUserID)
	if inbound.ExternalConversationID == "" || strings.TrimSpace(inbound.Text) == "" {
		return nil
	}

	profile := inbound.Profile
	if profile == nil {
		profile = map[string]any{}
	}
	profile["channel"] = account.ChannelType
	customerRecord, err := p.resolveCustomer(ctx, account, inbound, profile)
	if err != nil {
		return err
	}
	if p.Sender != nil && isPlaceholderName(customerRecord.FullName, account.ChannelType) {
		if enrichment, enrichErr := p.Sender.FetchProfile(ctx, account, inbound.ExternalUserID); enrichErr == nil {
			if name := strings.TrimSpace(stringValue(enrichment["name"])); name != "" {
				customerRecord, _ = p.Customers.UpdateIdentity(ctx, customerRecord.ID, &name, customerRecord.IsAuthenticated)
			}
		}
	}

	conversation, err := p.Accounts.GetActiveConversation(ctx, account.ID, inbound.ExternalConversationID)
	if err != nil && !errors.Is(err, ErrNotFound) {
		return err
	}
	var managed *session.ManagedSession
	if conversation != nil {
		if store, ok := p.Sessions.(session.ActionStore); ok {
			managed, err = store.GetManaged(ctx, conversation.SessionID, account.OrganizationID)
			if err != nil {
				return err
			}
		}
		if channelAgentChanged(conversation, managed, *agentID) {
			if store, ok := p.Sessions.(session.Store); ok {
				if _, closeErr := store.Close(ctx, conversation.SessionID, nil, nil); closeErr != nil {
					return closeErr
				}
			} else {
				return errors.New("session store does not support session rotation")
			}
			conversation = nil
			managed = nil
		}
	}
	isNewSession := false
	if conversation == nil {
		widgetStore, ok := p.Sessions.(session.WidgetStore)
		if !ok {
			return errors.New("session store does not support channel sessions")
		}
		sessionID := uuid.New()
		createdManaged, createErr := widgetStore.CreateWidgetSession(ctx, sessionID, account.OrganizationID, customerRecord.ID, *agentID, account.ChannelType)
		if createErr != nil {
			return createErr
		}
		managed = createdManaged
		conversation, err = p.Accounts.CreateConversation(ctx, Conversation{
			ChannelAccountID: account.ID, ChannelType: account.ChannelType,
			ExternalConversationID: inbound.ExternalConversationID, ExternalUserID: inbound.ExternalUserID,
			SessionID: managed.ID, OrganizationID: account.OrganizationID, AgentID: agentID,
			CustomerID: &customerRecord.ID, LastInboundAt: inbound.Timestamp, Extra: conversationState(inbound),
		})
		if err != nil {
			return err
		}
		isNewSession = true
		if p.Notifier != nil {
			p.Notifier(ctx, p.chatEventRecipients(ctx, managed, false), "new_chat", "New chat",
				fmt.Sprintf("A new conversation started on %s.", channelDisplayName(account.ChannelType)),
				map[string]any{"session_id": managed.ID.String()})
		}
	} else {
		if err := p.Accounts.TouchInbound(ctx, conversation.ID, mergeObjects(conversation.Extra, conversationState(inbound))); err != nil {
			return err
		}
	}

	if managed == nil {
		managed = &session.ManagedSession{ID: conversation.SessionID, OrganizationID: account.OrganizationID, CustomerID: customerRecord.ID, AgentID: agentID, Status: conversation.Status, UserID: conversation.UserID, GroupID: conversation.GroupID, Channel: account.ChannelType, WorkflowState: map[string]any{}}
	}

	aiEnabled := true
	if configuredAgent != nil {
		aiEnabled = configuredAgent.AIRepliesEnabled
	}
	if managed.UserID == nil && strings.EqualFold(managed.Status, "open") {
		if override, exists := managed.WorkflowState["ai_auto_reply"].(bool); exists {
			aiEnabled = override
		}
	}
	automated := managed.UserID == nil && !strings.EqualFold(managed.Status, "transferred") && aiEnabled
	var guardrailVerdict guardrail.Verdict
	if automated {
		guardrailCtx := p.guardrailContext(ctx, configuredAgent)
		guardrailVerdict = guardrail.CheckInbound(strings.TrimSpace(inbound.Text), guardrailCtx, p.GuardrailSettings, true)
		p.recordGuardrail(ctx, guardrail.EventInput{
			OrganizationID: account.OrganizationID, AgentID: *agentID, SessionID: conversation.SessionID,
			Surface: guardrail.SurfaceChannel, Layer: "inbound", Action: inboundAction(guardrailVerdict),
			Rules: guardrailVerdict.Rules, CharLen: len([]rune(strings.TrimSpace(inbound.Text))), Excerpt: strings.TrimSpace(inbound.Text),
		})
	}
	chatStore, ok := p.Chats.(chat.ActionStore)
	if !ok {
		return errors.New("chat store does not support message writes")
	}
	attributes := map[string]any{"channel": account.ChannelType, "external_message_id": inbound.ExternalMessageID, "external_conversation_id": inbound.ExternalConversationID, "profile": profile}
	if len(inbound.Attachments) > 0 {
		attributes["attachments"] = inbound.Attachments
	}
	mergeAttributes(attributes, guardrailVerdict.Attributes())
	stored, err := chatStore.CreateMessage(ctx, chat.MessageInput{
		Message: strings.TrimSpace(inbound.Text), MessageType: "user", SessionID: conversation.SessionID,
		OrganizationID: account.OrganizationID, CustomerID: customerRecord.ID, AgentID: agentID, Attributes: attributes,
	})
	if err != nil {
		return err
	}

	fmt.Printf("[Channel Inbound] 收到 %s 消息: 来自=%s, 内容=%q (SessionID: %s, isNewSession: %v)\n", account.ChannelType, inbound.ExternalUserID, inbound.Text, conversation.SessionID, isNewSession)

	// Always broadcast incoming user message so conversation center updates in real-time
	p.broadcastHumanMessage(ctx, account.OrganizationID, conversation.SessionID, stored, managed.UserID)

	if managed.UserID != nil || strings.EqualFold(managed.Status, "transferred") || !aiEnabled {
		fmt.Printf("[Channel Inbound] 跳过 AI 自动回复 (原因: UserID=%v, Status=%s, aiEnabled=%v)\n", managed.UserID, managed.Status, aiEnabled)
		if isNewSession && !aiEnabled && p.Sender != nil {
			p.persistAndDeliver(ctx, account, conversation, managed,
				"Thanks for your message. Someone from our team will reply here shortly.",
				map[string]any{"channel": account.ChannelType, "human_only_ack": true})
		}
		return nil
	}
	if guardrailVerdict.Block {
		blocked := Reply{Message: guardrailVerdict.Reply}
		botAttributes := ReplyAttributes(blocked)
		mergeAttributes(botAttributes, guardrailVerdict.Attributes())
		p.persistAndDeliver(ctx, account, conversation, managed, blocked.Message, botAttributes)
		return nil
	}

	channelTerm := "咨询"
	if account.ChannelType == "email" {
		channelTerm = "邮件"
	} else if account.ChannelType == "whatsapp" {
		channelTerm = "WhatsApp 消息"
	}

	canTransfer := configuredAgent != nil && configuredAgent.TransferToHuman && len(configuredAgent.Groups) > 0

	if p.AIConfigs != nil {
		if _, configErr := p.AIConfigs.GetActive(ctx, account.OrganizationID); configErr != nil {
			if isNewSession {
				fallback := fmt.Sprintf("您好！我们已收到您的%s。人工客服团队正在处理中，稍后将尽快回复您。", channelTerm)
				if canTransfer {
					if store, ok := p.Sessions.(session.ActionStore); ok {
						_, _ = store.RouteToHuman(ctx, conversation.SessionID, account.OrganizationID, "ai_config_missing", "未配置 AI 模型，已自动转入人工接待")
					}
					fallback = fmt.Sprintf("您好！我们已收到您的%s。已为您转接人工客服专员，坐席稍后将尽快为您回复处理。", channelTerm)
				}
				if fallbackMessage, fallbackErr := chatStore.CreateMessage(ctx, chat.MessageInput{
					Message: fallback, MessageType: "bot", SessionID: conversation.SessionID,
					OrganizationID: account.OrganizationID, CustomerID: customerRecord.ID, AgentID: agentID,
					Attributes: map[string]any{"warning": configErr.Error(), "ai_generated": true, "transfer_to_human": canTransfer},
				}); fallbackErr == nil {
					if p.Sender != nil {
						_ = p.Sender.Deliver(ctx, account, conversation, fallback)
					}
					p.broadcastBotMessage(ctx, account.OrganizationID, conversation.SessionID, fallbackMessage, Reply{TransferToHuman: canTransfer})
				}
			}
			return nil
		}
	}
	if p.Responder == nil {
		return nil
	}
	if p.Sender != nil {
		_ = p.Sender.Typing(ctx, account, conversation)
	}
	reply, err := p.Responder(ctx, ReplyRequest{
		OrganizationID: account.OrganizationID, AgentID: *agentID, CustomerID: customerRecord.ID,
		SessionID: conversation.SessionID, Channel: account.ChannelType, Message: strings.TrimSpace(inbound.Text),
		ConversationExtra: conversation.Extra,
	})
	if err != nil {
		if isNewSession {
			fallback := fmt.Sprintf("您好！我们已收到您的%s，客服团队正在为您核对处理，请稍候。", channelTerm)
			if canTransfer {
				if store, ok := p.Sessions.(session.ActionStore); ok {
					_, _ = store.RouteToHuman(ctx, conversation.SessionID, account.OrganizationID, "ai_error", "AI 回复异常，已自动转接人工")
				}
				fallback = fmt.Sprintf("您好！我们已收到您的%s。已为您转接人工客服专员，坐席稍后将尽快为您核对处理。", channelTerm)
			}
			if fallbackMessage, fallbackErr := chatStore.CreateMessage(ctx, chat.MessageInput{
				Message: fallback, MessageType: "bot", SessionID: conversation.SessionID,
				OrganizationID: account.OrganizationID, CustomerID: customerRecord.ID, AgentID: agentID,
				Attributes: map[string]any{"error": err.Error(), "ai_generated": true, "transfer_to_human": canTransfer},
			}); fallbackErr == nil {
				if p.Sender != nil {
					result := p.Sender.Deliver(ctx, account, conversation, fallback)
					if !result.OK {
						if deliveryStore, ok := p.Chats.(chat.DeliveryStore); ok {
							_ = deliveryStore.MarkDeliveryFailed(ctx, fallbackMessage.ID, result.Error)
						}
					}
				}
				p.broadcastBotMessage(ctx, account.OrganizationID, conversation.SessionID, fallbackMessage, Reply{TransferToHuman: canTransfer})
			}
		}
		return nil
	}
	if strings.TrimSpace(reply.Message) == "" {
		reply.Message = fmt.Sprintf("您好，我们已收到您的%s，请问有什么可以具体帮您的吗？", channelTerm)
	}
	if !canTransfer {
		reply.TransferToHuman = false
		reply.TransferReason = ""
		reply.TransferDescription = ""
	}
	if reply.TransferToHuman {
		// Route before persisting or delivering the reply. The Python channel
		// path runs its transfer handler inside the agent response, so the
		// customer receives a queue/availability message rather than the model's
		// pre-transfer answer.
		transferred := false
		if store, ok := p.Sessions.(session.ActionStore); ok {
			var routeErr error
			transferred, routeErr = store.RouteToHuman(ctx, conversation.SessionID, account.OrganizationID, reply.TransferReason, reply.TransferDescription)
			if routeErr != nil {
				return routeErr
			}
			if transferred {
				if groupStore, groupOK := p.Sessions.(session.GroupStore); groupOK {
					groupID := configuredAgent.Groups[0].ID
					grouped, groupErr := groupStore.SetGroup(ctx, conversation.SessionID, account.OrganizationID, groupID)
					if groupErr != nil {
						return groupErr
					}
					if grouped {
						managed.GroupID = &groupID
					}
				}
				if p.Notifier != nil {
					p.Notifier(ctx, p.chatEventRecipients(ctx, managed, true), "chat_transfer", "New Chat Transfer",
						fmt.Sprintf("A chat has been transferred to your group. Reason: %s", firstNonEmpty(reply.TransferReason, "Not specified")),
						map[string]any{"session_id": conversation.SessionID.String(), "transfer_reason": nullableString(reply.TransferReason), "transfer_description": reply.TransferDescription})
				}
			}
		}
		if transferred {
			reply.Message = channelQueuedForHumanNotice
			reply.RequestContact = true
			reply.EndChat = false
			reply.EndChatReason = ""
			reply.EndChatDescription = ""
		} else {
			reply.TransferToHuman = false
			reply.TransferReason = ""
			reply.TransferDescription = ""
		}
	}
	if !reply.TransferToHuman && reply.RequestLeadCapture {
		if captured := p.recordLeadCapture(ctx, account, conversation, customerRecord, reply); captured != nil && captured.CustomerID != customerRecord.ID {
			customerRecord.ID = captured.CustomerID
			conversation.CustomerID = &customerRecord.ID
			managed.CustomerID = customerRecord.ID
		}
	}
	// External channels do not have the widget rating UI.
	reply.RequestRating = false
	botAttributes := ReplyAttributes(reply)
	botMessage, err := chatStore.CreateMessage(ctx, chat.MessageInput{
		Message: reply.Message, MessageType: "bot", SessionID: conversation.SessionID,
		OrganizationID: account.OrganizationID, CustomerID: customerRecord.ID, AgentID: agentID, Attributes: botAttributes,
	})
	if err != nil {
		return err
	}
	if reply.EndChat {
		if store, ok := p.Sessions.(session.Store); ok {
			if _, closeErr := store.Close(ctx, conversation.SessionID, optionalString(normalizeEndReason(reply.EndChatReason)), optionalString(reply.EndChatDescription)); closeErr != nil {
				return closeErr
			}
		}
	}
	if configuredAgent != nil {
		if delay := calculateChannelResponseDelay(configuredAgent, reply.Message); delay > 0 {
			time.Sleep(delay)
		}
	}
	if p.Sender != nil {
		result := p.Sender.Deliver(ctx, account, conversation, reply.Message)
		if !result.OK {
			if deliveryStore, ok := p.Chats.(chat.DeliveryStore); ok {
				_ = deliveryStore.MarkDeliveryFailed(ctx, botMessage.ID, result.Error)
			}
		}
		if reply.RequestContact {
			_ = p.Sender.RequestPhone(ctx, account, conversation, "To help us follow up, tap below to share your phone number.")
		}
	}
	p.broadcastBotMessage(ctx, account.OrganizationID, conversation.SessionID, botMessage, reply)
	return nil
}

func (p ProcessorDependencies) recordLeadCapture(ctx context.Context, account *Account, conversation *Conversation, customerRecord *customer.Customer, reply Reply) *leadcapture.CaptureResult {
	store, ok := p.LeadCapture.(leadcapture.RuntimeStore)
	if !ok || store == nil || account == nil || conversation == nil || customerRecord == nil {
		return nil
	}
	values := make(map[string]any, len(reply.LeadData)+4)
	for key, value := range reply.LeadData {
		values[key] = value
	}
	for key, value := range map[string]string{
		"email": reply.LeadEmail, "name": reply.LeadName, "company": reply.LeadCompany, "phone": reply.LeadPhone,
	} {
		if strings.TrimSpace(value) != "" {
			if _, exists := values[key]; !exists {
				values[key] = value
			}
		}
	}
	agentID := uuid.Nil
	if conversation.AgentID != nil {
		agentID = *conversation.AgentID
	}
	result, err := store.Record(ctx, leadcapture.CaptureInput{
		OrganizationID: account.OrganizationID, AgentID: agentID,
		CustomerID: customerRecord.ID, SessionID: conversation.SessionID, LeadData: values,
		Summary: reply.LeadSummary, Consent: reply.LeadConsent, Channel: account.ChannelType,
	})
	if err != nil {
		return nil
	}
	return result
}

func (p ProcessorDependencies) persistAndDeliver(ctx context.Context, account *Account, conversation *Conversation, managed *session.ManagedSession, text string, attributes map[string]any) {
	if p.Chats == nil || account == nil || conversation == nil || managed == nil {
		return
	}
	store, ok := p.Chats.(chat.ActionStore)
	if !ok || store == nil {
		return
	}
	message, err := store.CreateMessage(ctx, chat.MessageInput{
		Message: text, MessageType: "bot", SessionID: managed.ID, OrganizationID: managed.OrganizationID,
		CustomerID: managed.CustomerID, AgentID: managed.AgentID, Attributes: attributes,
	})
	if err != nil {
		return
	}
	if p.Sender != nil {
		result := p.Sender.Deliver(ctx, account, conversation, text)
		if !result.OK {
			if deliveryStore, ok := p.Chats.(chat.DeliveryStore); ok {
				_ = deliveryStore.MarkDeliveryFailed(ctx, message.ID, result.Error)
			}
		}
	}
	p.broadcastBotMessage(ctx, managed.OrganizationID, managed.ID, message, Reply{})
}

func (p ProcessorDependencies) chatEventRecipients(ctx context.Context, managed *session.ManagedSession, groupOnly bool) []uuid.UUID {
	if p.Users == nil || managed == nil {
		return nil
	}
	store, ok := p.Users.(user.TeammateStore)
	if !ok || store == nil {
		return nil
	}
	teammates, err := store.ListChatTeammates(ctx, managed.OrganizationID)
	if err != nil {
		return nil
	}
	result := make([]uuid.UUID, 0, len(teammates))
	for _, teammate := range teammates {
		permissions := teammate.Permissions
		if groupOnly {
			if managed.GroupID == nil || !hasGroup(teammate, *managed.GroupID) || !hasPermission(permissions, "view_assigned_chats", "manage_assigned_chats", "view_all_chats", "manage_all_chats", "super_admin") {
				continue
			}
		} else if !hasPermission(permissions, "view_unassigned_chats", "view_all_chats", "manage_all_chats", "super_admin") {
			continue
		}
		result = append(result, teammate.ID)
	}
	return result
}

func (p ProcessorDependencies) guardrailContext(ctx context.Context, configured *agent.Agent) guardrail.Context {
	result := guardrail.Context{GuardrailEnabled: true}
	if configured != nil {
		result.AgentType = configured.AgentType
		result.Description = stringValue(configured.Description)
		result.TopicScope = stringValue(configured.TopicScope)
		result.GuardrailPrompt = stringValue(configured.GuardrailPrompt)
		result.GuardrailEnabled = configured.GuardrailEnabled
		result.OrganizationID = configured.OrganizationID.String()
		result.AgentID = configured.ID.String()
	}
	if p.Organizations != nil && configured != nil {
		if found, err := p.Organizations.Get(ctx, configured.OrganizationID); err == nil && found != nil {
			result.OrgName = found.Name
			result.Domain = found.Domain
		}
	}
	return result
}

func (p ProcessorDependencies) recordGuardrail(ctx context.Context, input guardrail.EventInput) {
	_ = guardrail.RecordEvent(ctx, p.GuardrailEvents, p.GuardrailSettings, input)
}

func inboundAction(verdict guardrail.Verdict) string {
	if verdict.Block {
		return "blocked"
	}
	return "counted"
}

func mergeAttributes(target, values map[string]any) {
	for key, value := range values {
		target[key] = value
	}
}

func hasGroup(teammate user.Teammate, groupID uuid.UUID) bool {
	for _, candidate := range teammate.GroupIDs {
		if candidate == groupID {
			return true
		}
	}
	return false
}

func hasPermission(values map[string]struct{}, names ...string) bool {
	for _, name := range names {
		if _, ok := values[name]; ok {
			return true
		}
	}
	return false
}

func (p ProcessorDependencies) resolveCustomer(ctx context.Context, account *Account, inbound InboundMessage, profile map[string]any) (*customer.Customer, error) {
	email := strings.ToLower(strings.TrimSpace(stringValue(profile["email"])))
	if email == "" || !strings.Contains(email, "@") {
		email = fmt.Sprintf("%s@%s.channel", inbound.ExternalUserID, strings.ToLower(account.ChannelType))
	}
	phone := customer.NormalizePhone(stringValue(profile["phone"]))
	var record *customer.Customer
	if identityStore, ok := p.Customers.(customer.ChannelIdentityStore); ok && phone != "" {
		record, _ = identityStore.GetByPhone(ctx, phone, account.OrganizationID)
	}
	if record == nil {
		record, _ = p.Customers.GetByEmail(ctx, email, account.OrganizationID)
	}
	if record == nil {
		name := strings.TrimSpace(stringValue(profile["name"]))
		var namePtr *string
		if name != "" {
			namePtr = &name
		} else {
			placeholder := placeholderName(account.ChannelType, inbound.ExternalUserID)
			namePtr = &placeholder
		}
		metaData := map[string]any{
			"channel": account.ChannelType, "external_user_id": inbound.ExternalUserID, "phone": phone,
		}
		storeName := ""
		if p.Accounts != nil {
			storeName = p.Accounts.GetStoreName(ctx, account.ID)
		}
		if storeName == "" && account.DisplayName != nil && strings.TrimSpace(*account.DisplayName) != "" {
			storeName = strings.TrimSpace(*account.DisplayName)
		}
		if storeName != "" {
			metaData["store_name"] = storeName
		}
		created, err := p.Customers.Create(ctx, email, namePtr, account.OrganizationID, metaData, false)
		if err != nil {
			return nil, err
		}
		record = created
	}
	if identityStore, ok := p.Customers.(customer.ChannelIdentityStore); ok && phone != "" {
		if updated, setErr := identityStore.SetPhoneIfAbsent(ctx, record.ID, phone); setErr == nil && updated != nil {
			record = updated
		}
	}
	name := strings.TrimSpace(stringValue(profile["name"]))
	if name != "" && isPlaceholderName(record.FullName, account.ChannelType) {
		if updated, updateErr := p.Customers.UpdateIdentity(ctx, record.ID, &name, record.IsAuthenticated); updateErr == nil && updated != nil {
			record = updated
		}
	}
	return record, nil
}

func channelAgentChanged(conversation *Conversation, managed *session.ManagedSession, activeAgent uuid.UUID) bool {
	if conversation == nil {
		return false
	}
	if managed != nil {
		if managed.UserID != nil || strings.EqualFold(managed.Status, "transferred") {
			return false
		}
	}
	return conversation.AgentID != nil && *conversation.AgentID != activeAgent
}

func placeholderName(channelType, externalUserID string) string {
	display := channelDisplayName(channelType)
	if len(externalUserID) > 8 {
		externalUserID = externalUserID[:8]
	}
	return fmt.Sprintf("%s user %s", display, externalUserID)
}

func channelDisplayName(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value == "" {
		return "Channel"
	}
	runes := []rune(value)
	runes[0] = []rune(strings.ToUpper(string(runes[0])))[0]
	return string(runes)
}

func isPlaceholderName(value *string, channelType string) bool {
	if value == nil || strings.TrimSpace(*value) == "" {
		return true
	}
	return strings.HasPrefix(strings.ToLower(*value), strings.ToLower(channelDisplayName(channelType))+" user ")
}

func (p ProcessorDependencies) broadcastHumanMessage(ctx context.Context, organizationID, sessionID uuid.UUID, message *chat.Message, userID *uuid.UUID) {
	if p.Broadcast == nil || message == nil {
		return
	}
	_ = p.Broadcast(ctx, organizationID, sessionID, map[string]any{
		"message": message.Message, "message_id": message.ID, "message_type": "user",
		"type": "user_message", "transfer_to_human": false, "session_id": sessionID.String(),
		"created_at": message.CreatedAt.UTC().Format(time.RFC3339Nano), "attributes": message.Attributes,
		"user_id": userID,
	})
}

func (p ProcessorDependencies) broadcastBotMessage(ctx context.Context, organizationID, sessionID uuid.UUID, message *chat.Message, reply Reply) {
	if p.Broadcast == nil || message == nil {
		return
	}
	_ = p.Broadcast(ctx, organizationID, sessionID, map[string]any{
		"message": message.Message, "message_id": message.ID, "message_type": "bot",
		"type": "chat_response", "session_id": sessionID.String(), "transfer_to_human": reply.TransferToHuman,
		"end_chat": reply.EndChat, "request_rating": reply.RequestRating,
		"transfer_reason": nullableString(reply.TransferReason), "transfer_description": reply.TransferDescription,
		"end_chat_reason": normalizeEndReason(reply.EndChatReason), "end_chat_description": reply.EndChatDescription,
		"created_at": message.CreatedAt.UTC().Format(time.RFC3339Nano), "attributes": message.Attributes,
	})
}

func nullableString(value string) any {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}

// ReplyAttributes is the durable structured-response contract shared by
// Widget and external-channel messages. Keeping it next to Reply prevents a
// channel from silently dropping citations, lead data, commerce output, or
// ticket state when it persists the bot message.
func ReplyAttributes(reply Reply) map[string]any {
	return map[string]any{
		"ai_generated":         true,
		"transfer_to_human":    reply.TransferToHuman,
		"transfer_reason":      nullableString(reply.TransferReason),
		"transfer_description": nullableString(reply.TransferDescription),
		"end_chat":             reply.EndChat,
		"end_chat_reason":      normalizeEndReason(reply.EndChatReason),
		"end_chat_description": nullableString(reply.EndChatDescription),
		"request_contact":      reply.RequestContact,
		"request_rating":       reply.RequestRating,
		"request_lead_capture": reply.RequestLeadCapture,
		"lead_email":           nullableString(reply.LeadEmail),
		"lead_name":            nullableString(reply.LeadName),
		"lead_company":         nullableString(reply.LeadCompany),
		"lead_phone":           nullableString(reply.LeadPhone),
		"lead_data":            reply.LeadData,
		"lead_summary":         nullableString(reply.LeadSummary),
		"lead_consent":         reply.LeadConsent,
		"sources":              reply.Sources,
		"shopify_output":       reply.ShopifyOutput,
		"create_ticket":        reply.CreateTicket,
		"ticket_summary":       nullableString(reply.TicketSummary),
		"ticket_description":   nullableString(reply.TicketDescription),
		"integration_type":     nullableString(reply.IntegrationType),
		"ticket_id":            nullableString(reply.TicketID),
		"ticket_status":        nullableString(reply.TicketStatus),
		"ticket_priority":      nullableString(reply.TicketPriority),
	}
}

func optionalString(value string) *string {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	return &value
}

func normalizeEndReason(value string) string {
	switch strings.TrimSpace(value) {
	case "ISSUE_RESOLVED", "CUSTOMER_REQUEST", "CONFIRMATION_RECEIVED", "FAREWELL", "THANK_YOU", "NATURAL_CONCLUSION", "TASK_COMPLETED":
		return strings.TrimSpace(value)
	default:
		return "ISSUE_RESOLVED"
	}
}

func (p ProcessorDependencies) ProcessInteraction(ctx context.Context, accountID uuid.UUID, interaction Interaction) error {
	if p.Accounts == nil || p.Customers == nil {
		return errors.New("channel interaction dependencies are not configured")
	}
	conversation, err := p.Accounts.GetLatestConversation(ctx, accountID, interaction.ExternalConversationID)
	if errors.Is(err, ErrNotFound) {
		return nil
	}
	if err != nil || conversation == nil || conversation.CustomerID == nil {
		return err
	}
	if strings.TrimSpace(interaction.Phone) == "" {
		return nil
	}
	phone := customer.NormalizePhone(interaction.Phone)
	if phone == "" {
		return nil
	}
	if identityStore, ok := p.Customers.(customer.ChannelIdentityStore); ok {
		if _, setErr := identityStore.SetPhoneIfAbsent(ctx, *conversation.CustomerID, phone); setErr != nil {
			return setErr
		}
	}
	_, err = p.Customers.UpdateMetaData(ctx, *conversation.CustomerID, map[string]any{"phone": phone})
	return err
}

func conversationState(inbound InboundMessage) map[string]any {
	state := map[string]any{}
	if strings.EqualFold(stringValue(inbound.Profile["channel"]), "whatsapp") && inbound.ExternalMessageID != "" {
		state["last_inbound_message_id"] = inbound.ExternalMessageID
	}
	if value := stringValue(inbound.Profile["subject"]); value != "" {
		state["subject"] = value
	}
	if value := stringValue(inbound.Profile["inbound_message_id"]); value != "" {
		state["last_message_id"] = value
	}
	if inbound.ExternalMessageID != "" && stringValue(inbound.Profile["inbound_message_id"]) == "" && strings.EqualFold(stringValue(inbound.Profile["channel"]), "email") {
		state["last_message_id"] = inbound.ExternalMessageID
	}
	return state
}

func mergeObjects(left, right map[string]any) map[string]any {
	result := map[string]any{}
	for key, value := range left {
		result[key] = value
	}
	for key, value := range right {
		result[key] = value
	}
	return result
}

func emailAutoGenerated(payload map[string]any) bool {
	headers := stringValue(payload["headers"])
	lowered := strings.ToLower(headers)
	return strings.Contains(lowered, "x-auto-response-suppress:") ||
		strings.Contains(lowered, "auto-submitted:") && !strings.Contains(lowered, "auto-submitted: no") ||
		strings.Contains(lowered, "precedence: bulk") || strings.Contains(lowered, "precedence: junk") || strings.Contains(lowered, "precedence: auto_reply") || strings.Contains(lowered, "precedence: list")
}

var quotedReplyMarker = regexp.MustCompile(`(?im)^On .{5,80} wrote:\s*$|^-{2,}\s*Original Message\s*-{2,}|^_{10,}\s*$`)

func stripQuotedReply(value string) string {
	cut := len(value)
	if match := quotedReplyMarker.FindStringIndex(value); match != nil {
		cut = match[0]
	}
	lines := strings.Split(value[:cut], "\n")
	kept := make([]string, 0, len(lines))
	for _, line := range lines {
		if !strings.HasPrefix(line, ">") {
			kept = append(kept, line)
		}
	}
	result := strings.TrimSpace(strings.Join(kept, "\n"))
	if result == "" {
		return strings.TrimSpace(value)
	}
	return result
}

func headerValue(payload map[string]any, headers, name string) string {
	for key, value := range payload {
		if strings.EqualFold(key, strings.ToLower(name)) {
			return stringValue(value)
		}
	}
	for _, line := range strings.Split(headers, "\n") {
		parts := strings.SplitN(line, ":", 2)
		if len(parts) == 2 && strings.EqualFold(strings.TrimSpace(parts[0]), name) {
			return strings.TrimSpace(parts[1])
		}
	}
	return ""
}

func object(value map[string]any, key string) map[string]any {
	result, _ := value[key].(map[string]any)
	return result
}

func objects(value any) []map[string]any {
	items, _ := value.([]any)
	result := make([]map[string]any, 0, len(items))
	for _, item := range items {
		if value, ok := item.(map[string]any); ok {
			result = append(result, value)
		}
	}
	return result
}

func stringValue(value any) string {
	switch result := value.(type) {
	case string:
		return result
	case json.Number:
		return result.String()
	case float64:
		return fmt.Sprintf("%.0f", result)
	case float32:
		return fmt.Sprintf("%.0f", result)
	case int:
		return fmt.Sprintf("%d", result)
	case int64:
		return fmt.Sprintf("%d", result)
	case nil:
		return ""
	default:
		return fmt.Sprint(result)
	}
}

func boolValue(value any) bool {
	result, _ := value.(bool)
	return result
}

func int64Value(value any) int64 {
	if result, ok := value.(int64); ok {
		return result
	}
	parsed := strings.TrimSpace(stringValue(value))
	var result int64
	_, _ = fmt.Sscan(parsed, &result)
	return result
}

func nonEmptyStrings(values ...string) []string {
	result := make([]string, 0, len(values))
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			result = append(result, strings.TrimSpace(value))
		}
	}
	return result
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func calculateChannelResponseDelay(configured *agent.Agent, replyText string) time.Duration {
	if configured == nil || configured.Customization == nil || configured.Customization.CustomizationMetadata == nil {
		return 1200 * time.Millisecond
	}
	raw, ok := configured.Customization.CustomizationMetadata["response_delay"]
	if !ok || raw == nil {
		return 1200 * time.Millisecond
	}
	delayConfig, ok := raw.(map[string]any)
	if !ok {
		return 1200 * time.Millisecond
	}
	mode, _ := delayConfig["mode"].(string)
	switch strings.ToLower(mode) {
	case "instant":
		return 0
	case "custom":
		sec, _ := delayConfig["custom_delay_seconds"].(float64)
		if sec <= 0 {
			sec = 2
		}
		if sec > 15 {
			sec = 15
		}
		return time.Duration(sec * float64(time.Second))
	case "human_like", "":
		runeCount := len([]rune(replyText))
		delayMs := 1000 + (runeCount * 12)
		if delayMs < 1200 {
			delayMs = 1200
		}
		if delayMs > 4000 {
			delayMs = 4000
		}
		return time.Duration(delayMs) * time.Millisecond
	default:
		return 1200 * time.Millisecond
	}
}
