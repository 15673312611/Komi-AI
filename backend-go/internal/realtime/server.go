package realtime

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	goRedis "github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"
	engineTypes "github.com/zishang520/engine.io/v2/types"
	"github.com/zishang520/socket.io/v2/socket"

	"github.com/komi/komi/backend-go/internal/agent"
	"github.com/komi/komi/backend-go/internal/aiconfig"
	"github.com/komi/komi/backend-go/internal/auth"
	"github.com/komi/komi/backend-go/internal/channel"
	"github.com/komi/komi/backend-go/internal/chat"
	"github.com/komi/komi/backend-go/internal/config"
	"github.com/komi/komi/backend-go/internal/customer"
	"github.com/komi/komi/backend-go/internal/guardrail"
	"github.com/komi/komi/backend-go/internal/jira"
	knowledgeStore "github.com/komi/komi/backend-go/internal/knowledge"
	"github.com/komi/komi/backend-go/internal/leadcapture"
	"github.com/komi/komi/backend-go/internal/mcptool"
	"github.com/komi/komi/backend-go/internal/notification"
	"github.com/komi/komi/backend-go/internal/organization"
	"github.com/komi/komi/backend-go/internal/rating"
	"github.com/komi/komi/backend-go/internal/session"
	"github.com/komi/komi/backend-go/internal/shopify"
	"github.com/komi/komi/backend-go/internal/storage"
	"github.com/komi/komi/backend-go/internal/ticketing"
	"github.com/komi/komi/backend-go/internal/user"
	"github.com/komi/komi/backend-go/internal/widget"
	"github.com/komi/komi/backend-go/internal/workflow"
)

type Dependencies struct {
	Config          config.Config
	Logger          zerolog.Logger
	DB              *pgxpool.Pool
	Auth            *auth.Service
	Users           user.Store
	Agents          agent.Store
	Organizations   organization.Store
	Widgets         widget.Store
	Customers       customer.Store
	Sessions        session.Store
	Chats           chat.Store
	Ratings         rating.Store
	Notifications   notification.Store
	Workflows       workflow.Store
	AIConfigs       aiconfig.Store
	LeadCapture     leadcapture.Store
	Knowledge       knowledgeStore.Store
	Redis           *goRedis.Client
	Shopify         *shopify.Service
	Jira            *jira.Service
	Tickets         ticketing.Store
	MCPTools        mcptool.Store
	GuardrailEvents guardrail.EventStore
	Sender          *channel.Sender
}

type Server struct {
	io       *socket.Server
	widgetNS socket.Namespace
	agentNS  socket.Namespace
	deps     Dependencies
}

type widgetSocketData struct {
	WidgetID   string
	OrgID      uuid.UUID
	CustomerID uuid.UUID
	AgentID    uuid.UUID
	SessionID  uuid.UUID
	Token      string
	PageURL    string
	Source     string
}

type agentSocketData struct {
	UserID uuid.UUID
	OrgID  uuid.UUID
	Token  string
}

type messagePayload struct {
	Message            string
	MessageType        string
	SessionID          string
	Room               string
	ClientMessageID    string
	Feedback           string
	Rating             int
	EndChat            bool
	RequestRating      bool
	EndChatReason      string
	EndChatDescription string
	Files              []any
	MentionedUserIDs   []string
	FormData           map[string]any
}

var (
	htmlTagPattern      = regexp.MustCompile(`(?is)<[^>]*>`)
	markdownLinkPattern = regexp.MustCompile(`!?\[([^\]]*)\]\([^)]*\)`)
	dangerousURI        = regexp.MustCompile(`(?i)(javascript|vbscript|file|about)\s*:`)
)

func New(deps Dependencies) *Server {
	opts := socket.DefaultServerOptions()
	if len(deps.Config.CORSOrigins) > 0 {
		origins := make([]any, 0, len(deps.Config.CORSOrigins))
		for _, origin := range deps.Config.CORSOrigins {
			origins = append(origins, origin)
		}
		opts.SetCors(&engineTypes.Cors{Origin: origins, Credentials: true})
	}
	io := socket.NewServer(nil, opts)
	server := &Server{io: io, deps: deps}
	server.widgetNS = io.Of("/widget", nil)
	server.agentNS = io.Of("/agent", nil)
	server.registerWidget()
	server.registerAgent()
	return server
}

func (s *Server) Handler() http.Handler {
	if s == nil || s.io == nil {
		return http.NotFoundHandler()
	}
	return s.io.ServeHandler(nil)
}

func (s *Server) Close() {
	if s != nil && s.io != nil {
		s.io.Close(nil)
	}
}

// EmitTicketUpdate publishes the same organization-scoped event used by the
// Python ticket service. HTTP handlers call this after their transaction has
// committed; a realtime failure never changes the HTTP result.
func (s *Server) EmitTicketUpdate(organizationID, ticketID uuid.UUID, kind string, payload map[string]any) {
	if s == nil || s.agentNS == nil {
		return
	}
	if payload == nil {
		payload = map[string]any{}
	}
	_ = s.agentNS.To(socket.Room("org_tickets_"+organizationID.String())).Emit("ticket_update", map[string]any{
		"ticket_id": ticketID.String(),
		"kind":      kind,
		"payload":   payload,
	})
}

func (s *Server) registerWidget() {
	// Authentication is performed before the connection event so invalid
	// conversation tokens receive a real Socket.IO connect_error.
	s.widgetNS.Use(func(client *socket.Socket, next func(*socket.ExtendedError)) {
		data, err := s.authenticateWidget(client)
		if err != nil {
			s.deps.Logger.Error().Err(err).Msg("widget socket authentication failed")
			next(socket.NewExtendedError("authentication failed", map[string]any{"type": "auth_error"}))
			return
		}
		client.SetData(data)
		client.Join(socket.Room(data.SessionID.String()))
		next(nil)
	})
	_ = s.widgetNS.On("connection", func(args ...any) {
		client, ok := firstSocket(args)
		if !ok {
			return
		}
		client.On("chat", func(values ...any) { s.handleWidgetChat(client, values...) })
		client.On("get_chat_history", func(values ...any) { s.handleWidgetHistory(client, values...) })
		client.On("end_chat", func(values ...any) { s.handleWidgetEnd(client, values...) })
		client.On("submit_rating", func(values ...any) { s.handleWidgetRating(client, values...) })
		client.On("get_workflow_state", func(values ...any) { s.handleWorkflowState(client, values...) })
		client.On("proceed_workflow", func(values ...any) { s.handleProceedWorkflow(client, values...) })
		client.On("submit_contact_info", func(values ...any) { s.handleContactInfo(client, values...) })
		client.On("submit_form", func(values ...any) { s.handleWorkflowForm(client, values...) })
		_ = client.Emit("session_initialized", map[string]any{
			"session_id":  client.Data().(widgetSocketData).SessionID.String(),
			"customer_id": client.Data().(widgetSocketData).CustomerID.String(),
			"agent_id":    client.Data().(widgetSocketData).AgentID.String(),
		})
	})
}

func (s *Server) registerAgent() {
	s.agentNS.Use(func(client *socket.Socket, next func(*socket.ExtendedError)) {
		data, err := s.authenticateAgent(client)
		if err != nil {
			next(socket.NewExtendedError("authentication failed", map[string]any{"type": "auth_error"}))
			return
		}
		client.SetData(data)
		next(nil)
	})
	_ = s.agentNS.On("connection", func(args ...any) {
		client, ok := firstSocket(args)
		if !ok {
			return
		}
		if agentData, ok := client.Data().(agentSocketData); ok {
			client.Join(socket.Room("user_" + agentData.UserID.String()))
			client.Join(socket.Room("org_chats_" + agentData.OrgID.String()))
		}
		client.On("agent_message", func(values ...any) { s.handleAgentMessage(client, values...) })
		client.On("join_room", func(values ...any) { s.handleJoinRoom(client, values...) })
		client.On("leave_room", func(values ...any) { s.handleLeaveRoom(client, values...) })
		client.On("taken_over", func(values ...any) { s.handleTakenOver(client, values...) })
		_ = client.Emit("connection_success", map[string]any{"user_id": client.Data().(agentSocketData).UserID.String()})
	})
}

func (s *Server) authenticateWidget(client *socket.Socket) (widgetSocketData, error) {
	if s.deps.Auth == nil || s.deps.Widgets == nil || s.deps.Sessions == nil {
		return widgetSocketData{}, errors.New("widget realtime service is not configured")
	}
	authData := authMap(client.Handshake().Auth)
	token := strings.TrimSpace(stringValue(authData["conversation_token"]))
	if token == "" {
		return widgetSocketData{}, errors.New("conversation token is required")
	}
	claims, err := s.deps.Auth.VerifyConversationToken(token)
	if err != nil {
		return widgetSocketData{}, fmt.Errorf("verify conversation token failed: %w", err)
	}
	if claims.WidgetID == "" {
		return widgetSocketData{}, errors.New("conversation token missing widget_id")
	}
	if claims.Subject == "" {
		return widgetSocketData{}, errors.New("conversation token missing sub (customer_id)")
	}
	widgetID := claims.WidgetID
	ctx := context.Background()
	foundWidget, err := s.deps.Widgets.Get(ctx, widgetID)
	if err != nil || foundWidget == nil || foundWidget.AgentID == nil {
		return widgetSocketData{}, fmt.Errorf("invalid widget %s: %v", widgetID, err)
	}
	customerID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return widgetSocketData{}, fmt.Errorf("invalid customer id %s: %w", claims.Subject, err)
	}
	store, ok := s.deps.Sessions.(session.WidgetStore)
	if !ok || store == nil {
		return widgetSocketData{}, errors.New("widget session service is not configured")
	}
	active, err := store.GetActiveCustomerSession(ctx, customerID, *foundWidget.AgentID)
	if err != nil {
		return widgetSocketData{}, fmt.Errorf("get active session failed: %w", err)
	}
	if active == nil {
		active, err = store.CreateWidgetSession(
			ctx, uuid.New(), foundWidget.OrganizationID,
			customerID, *foundWidget.AgentID, "web",
		)
		if err != nil {
			return widgetSocketData{}, fmt.Errorf("create widget session failed: %w", err)
		}
	}
	return widgetSocketData{
		WidgetID:   foundWidget.ID,
		OrgID:      foundWidget.OrganizationID,
		CustomerID: customerID,
		AgentID:    *foundWidget.AgentID,
		SessionID:  active.ID,
		Token:      token,
		PageURL:    cleanText(stringValue(authData["page_url"]), 500),
		Source:     claims.Source,
	}, nil
}

func (s *Server) authenticateAgent(client *socket.Socket) (agentSocketData, error) {
	if s.deps.Auth == nil || s.deps.Users == nil {
		return agentSocketData{}, errors.New("agent realtime service is not configured")
	}
	request := client.Request().Request()
	token := ""
	if request != nil {
		if cookie, err := request.Cookie("access_token"); err == nil {
			token = cookie.Value
		}
	}
	if token == "" {
		values := authMap(client.Handshake().Auth)
		token = strings.TrimSpace(stringValue(values["access_token"]))
		if token == "" {
			token = strings.TrimSpace(stringValue(values["token"]))
		}
	}
	if token == "" && request != nil {
		if cookie, err := request.Cookie("refresh_token"); err == nil {
			claims, refreshErr := s.deps.Auth.VerifyRefreshToken(cookie.Value)
			if refreshErr == nil {
				if refreshed, createErr := s.deps.Auth.CreateAccessToken(claims.Subject, claims.OrgID); createErr == nil {
					token = refreshed
					_ = client.Emit("cookie_set", map[string]any{"access_token": refreshed})
				}
			}
		}
	}
	claims, err := s.deps.Auth.VerifyAccessToken(token)
	if err != nil {
		return agentSocketData{}, err
	}
	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return agentSocketData{}, err
	}
	orgID, err := uuid.Parse(claims.OrgID)
	if err != nil {
		return agentSocketData{}, err
	}
	found, err := s.deps.Users.FindActiveByID(context.Background(), userID)
	if err != nil || found == nil || found.OrganizationID == nil || *found.OrganizationID != orgID {
		return agentSocketData{}, errors.New("user is not active in this organization")
	}
	if !hasAnyPermission(found, "view_all_chats", "view_assigned_chats", "view_unassigned_chats", "manage_all_chats", "manage_assigned_chats", "super_admin") {
		return agentSocketData{}, errors.New("not enough chat permissions")
	}
	return agentSocketData{UserID: userID, OrgID: orgID, Token: token}, nil
}

func (s *Server) handleWidgetChat(client *socket.Socket, values ...any) {
	data, ok := s.widgetData(client)
	if !ok {
		return
	}
	payload := decodeMessagePayload(firstValue(values))
	message := sanitizeMessage(payload.Message)
	if payload.Message != "" && strings.TrimSpace(message) == "" && len(payload.Files) == 0 {
		s.emitError(client, "validation_error", "Your message contains unsafe content and cannot be sent.")
		return
	}
	if strings.TrimSpace(message) == "" && len(payload.Files) == 0 {
		return
	}
	if !s.verifyWidgetToken(client, data) {
		return
	}
	managed, err := s.managedSession(context.Background(), data)
	if err != nil || managed == nil || managed.CustomerID != data.CustomerID {
		s.emitError(client, "chat_error", "Chat session not found")
		return
	}
	chatStore, ok := s.deps.Chats.(chat.ActionStore)
	if !ok || chatStore == nil {
		s.emitError(client, "chat_error", "Chat message service is not configured")
		return
	}
	aiEnabled, aiErr := s.widgetAIEnabled(context.Background(), data, managed)
	if aiErr != nil {
		s.emitError(client, "chat_error", "AI service is not configured")
		return
	}
	isWorkflow := managed.WorkflowID != nil && managed.UserID == nil && aiEnabled
	isAutomated := managed.UserID == nil && !strings.EqualFold(managed.Status, "TRANSFERRED") && aiEnabled
	var guardrailVerdict guardrail.Verdict
	if isAutomated {
		guardrailCtx := s.guardrailContext(context.Background(), nil)
		if configured, getErr := s.deps.Agents.Get(context.Background(), data.AgentID, data.OrgID); getErr == nil && configured != nil {
			guardrailCtx = s.guardrailContext(context.Background(), configured)
		}
		guardrailVerdict = guardrail.CheckInbound(message, guardrailCtx, guardrailSettings(s.deps.Config), !isWorkflow)
		s.recordGuardrail(context.Background(), guardrail.EventInput{
			OrganizationID: data.OrgID, AgentID: data.AgentID, SessionID: data.SessionID,
			Surface: guardrail.SurfaceWidget, Layer: "inbound", Action: guardrailInboundAction(guardrailVerdict),
			Rules: guardrailVerdict.Rules, CharLen: len([]rune(message)), Excerpt: message,
		})
	}
	var attachmentInputs []chat.AttachmentInput
	var attachmentPayload []map[string]any
	if len(payload.Files) > 0 {
		attachmentInputs, attachmentPayload, err = s.prepareWidgetAttachments(context.Background(), data, managed, payload.Files, nil, true)
		if err != nil {
			s.emitError(client, "validation_error", err.Error())
			return
		}
		if _, ok := s.deps.Chats.(chat.AttachmentStore); !ok {
			s.emitError(client, "upload_error", "Attachment storage is not configured")
			return
		}
	}
	clientMessageID := cleanText(payload.ClientMessageID, 128)
	if clientMessageID != "" {
		exists, checkErr := chatStore.FindMessageByClientID(context.Background(), data.SessionID, clientMessageID)
		if checkErr != nil {
			s.emitError(client, "chat_error", "Failed to check message id")
			return
		}
		if exists {
			return
		}
	}
	attributes := map[string]any{}
	if clientMessageID != "" {
		attributes["client_message_id"] = clientMessageID
	}
	mergeAttributes(attributes, guardrailVerdict.Attributes())
	created, err := chatStore.CreateMessage(context.Background(), chat.MessageInput{
		Message:        message,
		MessageType:    "user",
		SessionID:      data.SessionID,
		OrganizationID: data.OrgID,
		CustomerID:     data.CustomerID,
		AgentID:        &data.AgentID,
		Attributes:     attributes,
	})
	if err != nil {
		s.emitError(client, "chat_error", "Unable to save your message")
		return
	}
	if len(attachmentInputs) > 0 {
		stored, attachmentErr := s.deps.Chats.(chat.AttachmentStore).AddAttachments(context.Background(), created.ID, attachmentInputs)
		if attachmentErr != nil {
			s.emitError(client, "upload_error", "Failed to save attachments")
			return
		}
		for index := range attachmentPayload {
			if index < len(stored) {
				attachmentPayload[index]["id"] = stored[index].ID
			}
		}
	}
	accepted := map[string]any{
		"message_id":        created.ID,
		"session_id":        data.SessionID.String(),
		"message":           message,
		"message_type":      "user",
		"type":              "customer_message",
		"created_at":        created.CreatedAt.UTC().Format(time.RFC3339Nano),
		"client_message_id": clientMessageID,
		"attachments":       attachmentPayload,
		"attributes":        attributes,
	}
	_ = s.agentNS.To(socket.Room(data.SessionID.String())).Emit("chat_reply", accepted)
	_ = s.agentNS.To(socket.Room("org_chats_"+data.OrgID.String())).Emit("chat_reply", accepted)
	if managed.UserID != nil {
		_ = s.agentNS.To(socket.Room("user_"+managed.UserID.String())).Emit("chat_reply", accepted)
	}
	s.BroadcastConversationUpdated(context.Background(), data.OrgID, data.SessionID, nil)
	_ = client.Emit("message_accepted", accepted)
	if guardrailVerdict.Block {
		blocked := channel.Reply{Message: guardrailVerdict.Reply}
		botAttributes := channel.ReplyAttributes(blocked)
		mergeAttributes(botAttributes, guardrailVerdict.Attributes())
		s.emitBotMessage(client, data, managed, blocked.Message, botAttributes)
		return
	}
	if managed.WorkflowID != nil && managed.UserID == nil && aiEnabled {
		executor := s.workflowExecutor(data.OrgID, data.AgentID, data.SessionID)
		if executor == nil {
			s.emitError(client, "workflow_error", "Workflow service is not configured")
			return
		}
		result, execErr := executor.Execute(context.Background(), data.SessionID, data.OrgID, *managed.WorkflowID, managed.CurrentNodeID, managed.WorkflowState, message)
		if execErr != nil {
			s.emitError(client, "workflow_error", "Failed to process workflow message")
			return
		}
		s.emitWorkflowResult(client, data, managed, result, false)
		return
	}
	if managed.UserID == nil && strings.EqualFold(managed.Status, "TRANSFERRED") {
		s.emitBotMessage(client, data, managed, "Your message has been received. A teammate will follow up shortly.", map[string]any{"transfer_to_human": true})
		return
	}
	if managed.UserID == nil && !aiEnabled {
		return
	}
	if managed.UserID == nil {
		_ = client.Emit("bot_typing", map[string]any{"session_id": data.SessionID.String(), "is_typing": true})
		_ = s.agentNS.To(socket.Room(data.SessionID.String())).Emit("bot_typing", map[string]any{"session_id": data.SessionID.String(), "is_typing": true})

		var configuredAgent *agent.Agent
		if s.deps.Agents != nil {
			configuredAgent, _ = s.deps.Agents.Get(context.Background(), data.AgentID, data.OrgID)
		}

		reply, replyErr := s.generateWidgetReply(context.Background(), data, managed, message)
		if replyErr != nil {
			s.deps.Logger.Warn().Err(replyErr).Msg("generate widget reply returned error")
			agentName := "AI 智能体"
			if configuredAgent != nil {
				if configuredAgent.DisplayName != nil && *configuredAgent.DisplayName != "" {
					agentName = *configuredAgent.DisplayName
				} else if configuredAgent.Name != "" {
					agentName = configuredAgent.Name
				}
			}
			reply = channel.Reply{Message: fmt.Sprintf("您好！我是 %s。我已经收到您的测试消息：「%s」。\n\n（提示：如需测试真实大模型实时答复，请确保在系统【设置 - AI 模型配置】中配置可用的 API Key 与模型）", agentName, message)}
		}
		if strings.TrimSpace(reply.Message) == "" {
			reply.Message = "您好，我已收到您的消息，请问有什么我可以协助您的吗？"
		}

		if delay := calculateResponseDelay(configuredAgent, reply.Message); delay > 0 {
			time.Sleep(delay)
		}

		_ = client.Emit("bot_typing", map[string]any{"session_id": data.SessionID.String(), "is_typing": false})
		_ = s.agentNS.To(socket.Room(data.SessionID.String())).Emit("bot_typing", map[string]any{"session_id": data.SessionID.String(), "is_typing": false})

		if reply.TransferToHuman {
			var transferred bool
			reply, transferred, err = s.applyWidgetTransfer(context.Background(), data, managed, reply)
			if err != nil {
				s.emitError(client, "chat_error", "Unable to transfer the chat")
				return
			}
			if !transferred {
				reply.TransferToHuman = false
				reply.RequestContact = false
			}
		}
		attributes := widgetReplyAttributes(reply)
		if replyErr != nil {
			attributes["error"] = replyErr.Error()
		}
		s.emitBotMessage(client, data, managed, reply.Message, attributes)

		if reply.TransferToHuman || reply.RequestContact {
			s.emitWidgetHandoffForm(context.Background(), client, data, managed)
		}
		if !reply.TransferToHuman && reply.RequestLeadCapture {
			if captured := s.recordWidgetLead(context.Background(), data, reply); captured != nil && captured.CustomerID != data.CustomerID {
				data.CustomerID = captured.CustomerID
				client.SetData(data)
			}
		}
		if reply.EndChat {
			store, storeOK := s.deps.Sessions.(session.Store)
			if storeOK && store != nil {
				_, _ = store.Close(context.Background(), data.SessionID, optionalText(normalizeEndReason(reply.EndChatReason)), optionalText(cleanText(reply.EndChatDescription, 2000)))
			}
		}
	}
}

const widgetQueuedForHumanNotice = "I'm passing this to a member of our team. Someone will reply here shortly."

func (s *Server) widgetAIEnabled(ctx context.Context, data widgetSocketData, managed *session.ManagedSession) (bool, error) {
	if s.deps.Agents == nil {
		return false, errors.New("agent service is not configured")
	}
	configured, err := s.deps.Agents.Get(ctx, data.AgentID, data.OrgID)
	if err != nil {
		return false, err
	}
	if configured == nil {
		return false, errors.New("agent is not configured")
	}
	enabled := configured.AIRepliesEnabled
	if managed != nil && strings.EqualFold(managed.Status, "open") && managed.WorkflowState != nil {
		if override, exists := managed.WorkflowState["ai_auto_reply"].(bool); exists {
			enabled = override
		}
	}
	return enabled, nil
}

func (s *Server) applyWidgetTransfer(ctx context.Context, data widgetSocketData, managed *session.ManagedSession, reply channel.Reply) (channel.Reply, bool, error) {
	if managed == nil || s.deps.Agents == nil {
		return reply, false, nil
	}
	configured, err := s.deps.Agents.Get(ctx, data.AgentID, data.OrgID)
	if err != nil {
		return reply, false, err
	}
	if configured == nil || !configured.TransferToHuman || len(configured.Groups) == 0 {
		return reply, false, nil
	}
	actions, ok := s.deps.Sessions.(session.ActionStore)
	if !ok || actions == nil {
		return reply, false, errors.New("session management service is not configured")
	}
	transferred, err := actions.RouteToHuman(ctx, data.SessionID, data.OrgID, cleanText(reply.TransferReason, 120), cleanText(reply.TransferDescription, 2000))
	if err != nil || !transferred {
		return reply, false, err
	}
	groupID := configured.Groups[0].ID
	if groups, ok := s.deps.Sessions.(session.GroupStore); ok && groups != nil {
		if _, err := groups.SetGroup(ctx, data.SessionID, data.OrgID, groupID); err != nil {
			return reply, false, err
		}
		managed.GroupID = &groupID
	}
	managed.Status = "transferred"
	if s.deps.Notifications != nil {
		recipients := s.widgetTransferRecipients(ctx, data.OrgID, &groupID)
		items, notifyErr := notification.CreateChatEvent(ctx, s.deps.Notifications, recipients,
			"chat_transfer", "New Chat Transfer",
			"A chat has been transferred to your group. Reason: "+firstNonEmptyText(reply.TransferReason, "Not specified"),
			map[string]any{"session_id": data.SessionID.String(), "transfer_reason": optionalText(reply.TransferReason), "transfer_description": optionalText(reply.TransferDescription)})
		if notifyErr == nil {
			for _, item := range items {
				s.EmitNotification(item)
			}
		}
	}
	withinHours, online, availabilityErr := s.widgetTransferAvailability(ctx, data.OrgID, groupID)
	if availabilityErr != nil {
		return reply, false, availabilityErr
	}
	// Python queues the session first, then lets the availability response
	// decide whether the customer is being connected to a live teammate or
	// should expect a later follow-up. Both outcomes keep the session queued.
	reply.TransferToHuman = withinHours && online > 0
	if reply.TransferToHuman {
		reply.Message = widgetQueuedForHumanNotice
	} else {
		reply.Message = "Our team will get back to you shortly."
	}
	reply.TransferReason = ""
	reply.TransferDescription = ""
	reply.RequestContact = true
	reply.EndChat = false
	reply.EndChatReason = ""
	reply.EndChatDescription = ""
	return reply, true, nil
}

var defaultWidgetBusinessHours = map[string]map[string]any{
	"monday":    {"start": "09:00", "end": "17:00", "enabled": true},
	"tuesday":   {"start": "09:00", "end": "17:00", "enabled": true},
	"wednesday": {"start": "09:00", "end": "17:00", "enabled": true},
	"thursday":  {"start": "09:00", "end": "17:00", "enabled": true},
	"friday":    {"start": "09:00", "end": "17:00", "enabled": true},
	"saturday":  {"start": "09:00", "end": "17:00", "enabled": false},
	"sunday":    {"start": "09:00", "end": "17:00", "enabled": false},
}

func (s *Server) widgetTransferAvailability(ctx context.Context, organizationID, groupID uuid.UUID) (bool, int, error) {
	org := &organization.Organization{ID: organizationID, Timezone: "UTC", BusinessHours: cloneBusinessHours(defaultWidgetBusinessHours)}
	if s.deps.Organizations != nil {
		loaded, err := s.deps.Organizations.Get(ctx, organizationID)
		if err != nil {
			return false, 0, err
		}
		if loaded != nil {
			org = loaded
		}
	}

	// Availability is based on every active online member of the target group,
	// matching Python's group.users check rather than dashboard visibility.
	online := 0
	if s.deps.DB != nil {
		if err := s.deps.DB.QueryRow(ctx, `
SELECT COUNT(*)
FROM users u
JOIN user_groups ug ON ug.user_id = u.id
WHERE ug.group_id = $1 AND u.is_active = TRUE AND u.is_online = TRUE`, groupID).Scan(&online); err != nil {
			return false, 0, err
		}
	} else if teammates, ok := s.deps.Users.(user.TeammateStore); ok && teammates != nil {
		items, err := teammates.ListChatTeammates(ctx, organizationID)
		if err != nil {
			return false, 0, err
		}
		for _, item := range items {
			if item.IsOnline && teammateInGroupRealtime(item, groupID) {
				online++
			}
		}
	}
	return withinWidgetBusinessHours(org), online, nil
}

func cloneBusinessHours(source map[string]map[string]any) map[string]any {
	result := make(map[string]any, len(source))
	for day, values := range source {
		copyValues := make(map[string]any, len(values))
		for key, value := range values {
			copyValues[key] = value
		}
		result[day] = copyValues
	}
	return result
}

func withinWidgetBusinessHours(org *organization.Organization) bool {
	if org == nil {
		return false
	}
	zone := strings.TrimSpace(org.Timezone)
	location, err := time.LoadLocation(zone)
	if err != nil || zone == "" {
		location = time.UTC
	}
	hours := org.BusinessHours
	if len(hours) == 0 {
		hours = cloneBusinessHours(defaultWidgetBusinessHours)
	}
	now := time.Now().In(location)
	day := strings.ToLower(now.Weekday().String())
	entry, ok := hours[day].(map[string]any)
	if !ok || entry == nil {
		return false
	}
	enabled, _ := entry["enabled"].(bool)
	if !enabled {
		return false
	}
	start := widgetClockMinutes(entry["start"], 9*60)
	end := widgetClockMinutes(entry["end"], 17*60)
	minutes := now.Hour()*60 + now.Minute()
	return start <= minutes && minutes <= end
}

func widgetClockMinutes(value any, fallback int) int {
	text, ok := value.(string)
	if !ok {
		return fallback
	}
	var hour, minute int
	if _, err := fmt.Sscanf(text, "%d:%d", &hour, &minute); err != nil || hour < 0 || hour > 23 || minute < 0 || minute > 59 {
		return fallback
	}
	return hour*60 + minute
}

func (s *Server) widgetTransferRecipients(ctx context.Context, organizationID uuid.UUID, groupID *uuid.UUID) []uuid.UUID {
	store, ok := s.deps.Users.(user.TeammateStore)
	if !ok || store == nil {
		return nil
	}
	teammates, err := store.ListChatTeammates(ctx, organizationID)
	if err != nil {
		return nil
	}
	result := make([]uuid.UUID, 0, len(teammates))
	for _, teammate := range teammates {
		if groupID != nil {
			if !teammateInGroupRealtime(teammate, *groupID) {
				continue
			}
		} else if !hasTeammatePermissionRealtime(teammate.Permissions, "view_unassigned_chats") &&
			!hasTeammatePermissionRealtime(teammate.Permissions, "view_all_chats") &&
			!hasTeammatePermissionRealtime(teammate.Permissions, "manage_all_chats") &&
			!hasTeammatePermissionRealtime(teammate.Permissions, "super_admin") {
			continue
		}
		result = append(result, teammate.ID)
	}
	return result
}

func widgetReplyAttributes(reply channel.Reply) map[string]any {
	return channel.ReplyAttributes(reply)
	/*
		return map[string]any{
			"ai_generated":         true,
			"transfer_to_human":    reply.TransferToHuman,
			"transfer_reason":      optionalText(reply.TransferReason),
			"transfer_description": optionalText(reply.TransferDescription),
			"end_chat":             reply.EndChat,
			"end_chat_reason":      normalizeEndReason(reply.EndChatReason),
			"end_chat_description": optionalText(reply.EndChatDescription),
			"request_contact":      reply.RequestContact,
			"request_rating":       reply.RequestRating,
			"request_lead_capture": reply.RequestLeadCapture,
			"lead_email":           optionalText(reply.LeadEmail),
			"lead_name":            optionalText(reply.LeadName),
			"lead_company":         optionalText(reply.LeadCompany),
			"lead_phone":           optionalText(reply.LeadPhone),
			"lead_data":            reply.LeadData,
			"lead_summary":         optionalText(reply.LeadSummary),
			"lead_consent":         reply.LeadConsent,
			"sources":              reply.Sources,
			"shopify_output":       reply.ShopifyOutput,
			"create_ticket":        reply.CreateTicket,
			"ticket_summary":       optionalText(reply.TicketSummary),
			"ticket_description":   optionalText(reply.TicketDescription),
			"integration_type":     optionalText(reply.IntegrationType),
			"ticket_id":            optionalText(reply.TicketID),
			"ticket_status":        optionalText(reply.TicketStatus),
			"ticket_priority":      optionalText(reply.TicketPriority),
		}
	*/
}

func (s *Server) recordWidgetLead(ctx context.Context, data widgetSocketData, reply channel.Reply) *leadcapture.CaptureResult {
	store, ok := s.deps.LeadCapture.(leadcapture.RuntimeStore)
	if !ok || store == nil {
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
	result, err := store.Record(ctx, leadcapture.CaptureInput{
		OrganizationID: data.OrgID, AgentID: data.AgentID, CustomerID: data.CustomerID,
		SessionID: data.SessionID, LeadData: values, Summary: reply.LeadSummary,
		Consent: reply.LeadConsent, PageURL: data.PageURL, Channel: "widget",
	})
	if err != nil {
		s.deps.Logger.Error().Err(err).Msg("widget lead capture failed")
		return nil
	}
	return result
}

func (s *Server) emitWidgetHandoffForm(ctx context.Context, client *socket.Socket, data widgetSocketData, managed *session.ManagedSession) {
	if s.deps.Agents == nil || s.deps.Customers == nil {
		return
	}
	configured, err := s.deps.Agents.Get(ctx, data.AgentID, data.OrgID)
	if err != nil || configured == nil {
		return
	}
	detailStore, ok := s.deps.Customers.(customer.DetailStore)
	if !ok || detailStore == nil {
		return
	}
	customerID := data.CustomerID
	if managed != nil && managed.CustomerID != uuid.Nil {
		customerID = managed.CustomerID
	}
	current, err := detailStore.GetByID(ctx, customerID)
	if err != nil || current == nil {
		return
	}
	needsEmail := configured.HandoffCollectEmail && isPlaceholderCustomerEmail(current.Email)
	needsName := configured.HandoffCollectName && (current.FullName == nil || strings.TrimSpace(*current.FullName) == "")
	if !needsEmail && !needsName {
		return
	}
	fields := make([]map[string]any, 0, 2)
	if needsEmail {
		fields = append(fields, map[string]any{"name": "email", "type": "email", "label": "Email", "placeholder": "you@example.com", "required": true})
	}
	if needsName {
		fields = append(fields, map[string]any{"name": "name", "type": "text", "label": "Name", "placeholder": "Your name", "required": false})
	}
	_ = client.Emit("display_form", map[string]any{
		"form_data": map[string]any{
			"form_type": "contact", "title": "Before we connect you to a teammate",
			"description": "Share your details so we can follow up.", "fields": fields,
		},
		"session_id": data.SessionID.String(),
	})
}

func firstNonEmptyText(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func isPlaceholderCustomerEmail(value string) bool {
	value = strings.ToLower(strings.TrimSpace(value))
	return value == "" || strings.Contains(value, "@noemail.com") || strings.HasSuffix(value, ".channel")
}

func canReplaceWidgetContactEmail(found *customer.Customer) bool {
	if found == nil || !isPlaceholderCustomerEmail(found.Email) {
		return false
	}
	value := strings.ToLower(strings.TrimSpace(found.Email))
	if !strings.HasSuffix(value, ".channel") {
		return true
	}
	// Address-keyed channels need the synthesized address for future inbound
	// lookup. WhatsApp and SMS resolve by their verified phone on every message,
	// so their placeholder may become the real email once a phone is present.
	return (strings.HasSuffix(value, "@whatsapp.channel") || strings.HasSuffix(value, "@sms.channel")) &&
		found.Phone != nil && strings.TrimSpace(*found.Phone) != ""
}

func (s *Server) handleWidgetHistory(client *socket.Socket, _ ...any) {
	data, ok := s.widgetData(client)
	if !ok || !s.verifyWidgetToken(client, data) {
		return
	}
	detail, err := s.deps.Chats.GetDetail(context.Background(), data.SessionID, data.OrgID)
	if err != nil || detail == nil {
		s.emitError(client, "chat_history_error", "Failed to get chat history")
		return
	}
	messages := make([]map[string]any, 0, len(detail.Messages))
	for _, message := range detail.Messages {
		if strings.EqualFold(message.MessageType, "private_note") || boolAttribute(message.Attributes, "is_private") {
			continue
		}
		entry := map[string]any{
			"message":      message.Message,
			"message_type": message.MessageType,
			"timestamp":    message.CreatedAt.UTC().Format(time.RFC3339Nano),
			"attributes":   message.Attributes,
			"user_name":    message.UserName,
		}
		if len(message.Attachments) > 0 {
			entry["attachments"] = message.Attachments
		}
		messages = append(messages, entry)
	}
	_ = client.Emit("chat_history", map[string]any{"messages": messages, "type": "chat_history"})
}

func (s *Server) handleWidgetEnd(client *socket.Socket, values ...any) {
	data, ok := s.widgetData(client)
	if !ok || !s.verifyWidgetToken(client, data) {
		return
	}
	store, ok := s.deps.Sessions.(session.Store)
	if !ok || store == nil {
		s.emitError(client, "end_chat_error", "Chat session service is not configured")
		return
	}
	payload := decodeMessagePayload(firstValue(values))
	reason := cleanText(payload.EndChatReason, 64)
	description := cleanText(payload.EndChatDescription, 2000)
	closed, err := store.Close(context.Background(), data.SessionID, optionalText(reason), optionalText(description))
	if err != nil || !closed {
		s.emitError(client, "end_chat_error", "Failed to end chat session")
		return
	}
	ended := map[string]any{"session_id": data.SessionID.String(), "message": "Chat session closed"}
	_ = client.Emit("chat_ended", ended)
	_ = s.agentNS.To(socket.Room(data.SessionID.String())).Emit("chat_reply", map[string]any{
		"type": "session_closed", "session_id": data.SessionID.String(),
	})
}

func (s *Server) handleWidgetRating(client *socket.Socket, values ...any) {
	data, ok := s.widgetData(client)
	if !ok || !s.verifyWidgetToken(client, data) {
		return
	}
	payload := decodeMessagePayload(firstValue(values))
	if payload.Rating < 1 || payload.Rating > 5 {
		s.emitError(client, "rating_error", "Invalid rating value")
		return
	}
	if s.deps.Ratings == nil {
		s.emitError(client, "rating_error", "Rating service is not configured")
		return
	}
	managed, err := s.managedSession(context.Background(), data)
	if err != nil || managed == nil || managed.CustomerID != data.CustomerID {
		s.emitError(client, "rating_error", "Session not found")
		return
	}
	feedback := cleanText(payload.Feedback, 2000)
	created, err := s.deps.Ratings.Upsert(context.Background(), rating.Input{
		SessionID: data.SessionID, CustomerID: &data.CustomerID, AgentID: managed.AgentID,
		UserID: managed.UserID, OrganizationID: data.OrgID, Rating: payload.Rating,
		Feedback: optionalText(feedback),
	})
	if err != nil || created == nil {
		s.emitError(client, "rating_error", "Failed to submit rating")
		return
	}
	_ = client.Emit("rating_submitted", map[string]any{"success": true, "message": "Rating submitted successfully"})
	if managed.UserID != nil {
		_ = s.agentNS.To(socket.Room("user_"+managed.UserID.String())).Emit("rating_received", map[string]any{
			"session_id": data.SessionID.String(), "rating": payload.Rating, "feedback": optionalText(feedback),
		})
	}
}

func (s *Server) handleAgentMessage(client *socket.Socket, values ...any) {
	data, ok := s.agentData(client)
	if !ok {
		return
	}
	payload := decodeMessagePayload(firstValue(values))
	messageType := payload.MessageType
	if messageType == "" {
		messageType = "agent"
	}
	if messageType != "agent" && messageType != "private_note" && messageType != "system" {
		s.emitError(client, "message_error", "Unsupported message type")
		return
	}
	current, err := s.deps.Users.FindActiveByID(context.Background(), data.UserID)
	if err != nil || current == nil || current.OrganizationID == nil || *current.OrganizationID != data.OrgID ||
		!hasAnyPermission(current, "manage_all_chats", "manage_assigned_chats", "super_admin") {
		s.emitError(client, "message_error", "Unauthorized")
		return
	}
	if payload.SessionID == "" {
		s.emitError(client, "message_error", "No active session")
		return
	}
	sessionID, err := uuid.Parse(payload.SessionID)
	if err != nil {
		s.emitError(client, "message_error", "Invalid session ID")
		return
	}
	managed, err := s.managedByID(context.Background(), sessionID, data.OrgID)
	if err != nil || managed == nil {
		s.emitError(client, "message_error", "Session not found")
		return
	}
	if strings.EqualFold(managed.Status, "closed") || managed.UserID == nil || *managed.UserID != data.UserID {
		if store, ok := s.deps.Sessions.(session.ActionStore); ok && store != nil {
			if _, takeErr := store.Takeover(context.Background(), sessionID, data.OrgID, data.UserID); takeErr == nil {
				managed.UserID = &data.UserID
				managed.Status = "open"
			}
		}
	}
	message := sanitizeMessage(payload.Message)
	if strings.TrimSpace(message) == "" && len(payload.Files) == 0 {
		s.emitError(client, "validation_error", "Enter a message or attach a file before sending.")
		return
	}
	mentionInput := payload.MentionedUserIDs
	if messageType != "private_note" {
		mentionInput = nil
	}
	mentionedIDs, mentionedUsers, mentionErr := s.resolveMentionedUsers(context.Background(), managed, data.UserID, mentionInput)
	if mentionErr != nil {
		s.emitError(client, "validation_error", mentionErr.Error())
		return
	}
	chatStore, ok := s.deps.Chats.(chat.ActionStore)
	if !ok || chatStore == nil {
		s.emitError(client, "message_error", "Chat message service is not configured")
		return
	}
	clientMessageID := cleanText(payload.ClientMessageID, 128)
	if clientMessageID != "" {
		exists, checkErr := chatStore.FindMessageByClientID(context.Background(), sessionID, clientMessageID)
		if checkErr != nil {
			s.emitError(client, "message_error", "Failed to check message id")
			return
		}
		if exists {
			return
		}
	}
	isEnd := payload.EndChat && messageType != "private_note"
	requestRating := payload.RequestRating && isEnd && widgetChannel(managed.Channel)
	attributes := map[string]any{
		"end_chat":             isEnd,
		"request_rating":       requestRating,
		"end_chat_reason":      normalizeEndReason(payload.EndChatReason),
		"end_chat_description": cleanText(payload.EndChatDescription, 2000),
	}
	if messageType == "private_note" {
		attributes["is_private"] = true
	}
	if len(mentionedUsers) > 0 {
		attributes["mentioned_users"] = mentionedUsers
	}
	if clientMessageID != "" {
		attributes["client_message_id"] = clientMessageID
	}
	var attachmentInputs []chat.AttachmentInput
	var attachmentPayload []map[string]any
	if len(payload.Files) > 0 {
		attachmentInputs, attachmentPayload, err = s.prepareWidgetAttachments(context.Background(), widgetSocketData{OrgID: data.OrgID, AgentID: dereferenceUUID(managed.AgentID), CustomerID: managed.CustomerID, SessionID: sessionID}, managed, payload.Files, &data.UserID, false)
		if err != nil {
			s.emitError(client, "validation_error", err.Error())
			return
		}
		if _, ok := s.deps.Chats.(chat.AttachmentStore); !ok {
			s.emitError(client, "upload_error", "Attachment storage is not configured")
			return
		}
	}
	created, err := chatStore.CreateMessage(context.Background(), chat.MessageInput{
		Message: message, MessageType: messageType, SessionID: sessionID,
		OrganizationID: data.OrgID, CustomerID: managed.CustomerID, AgentID: managed.AgentID,
		UserID: &data.UserID, Attributes: attributes,
	})
	if err != nil {
		s.emitError(client, "message_error", "Failed to send message")
		return
	}
	if len(attachmentInputs) > 0 {
		stored, attachmentErr := s.deps.Chats.(chat.AttachmentStore).AddAttachments(context.Background(), created.ID, attachmentInputs)
		if attachmentErr != nil {
			s.emitError(client, "upload_error", "Failed to save attachments")
			return
		}
		for index := range attachmentPayload {
			if index < len(stored) {
				attachmentPayload[index]["id"] = stored[index].ID
			}
		}
	}
	if len(mentionedIDs) > 0 && s.deps.Notifications != nil {
		if items, notifyErr := notification.CreateChatMentions(context.Background(), s.deps.Notifications, mentionedIDs, sessionID, created.ID, current.FullName, messageType == "private_note"); notifyErr == nil {
			for _, item := range items {
				s.EmitNotification(item)
			}
		}
	}
	if isEnd {
		store, storeOK := s.deps.Sessions.(session.Store)
		if !storeOK || store == nil {
			s.emitError(client, "message_error", "Chat session service is not configured")
			return
		}
		if closed, closeErr := store.Close(context.Background(), sessionID,
			optionalText(normalizeEndReason(payload.EndChatReason)), optionalText(cleanText(payload.EndChatDescription, 2000))); closeErr != nil || !closed {
			s.emitError(client, "message_error", "Failed to close chat")
			return
		}
	}
	canonical := map[string]any{
		"message_id": created.ID, "client_message_id": clientMessageID, "user_id": data.UserID.String(),
		"message": message, "message_type": messageType, "type": "agent_message",
		"session_id": sessionID.String(), "created_at": created.CreatedAt.UTC().Format(time.RFC3339Nano),
		"user_name": current.FullName, "attributes": attributes, "attachments": attachmentPayload,
		"end_chat": isEnd, "request_rating": requestRating,
		"end_chat_reason": attributes["end_chat_reason"], "end_chat_description": attributes["end_chat_description"],
	}
	if messageType == "private_note" {
		s.EmitAgentChatReply(sessionID, &data.UserID, canonical)
		return
	}
	s.EmitAgentChatReply(sessionID, &data.UserID, canonical)
	var delivery channel.SendResult
	if !widgetChannel(managed.Channel) && s.deps.Sender != nil {
		delivery = s.deps.Sender.DeliverSession(context.Background(), sessionID, data.OrgID, message)
		if !delivery.OK {
			if deliveryStore, deliveryOK := s.deps.Chats.(chat.DeliveryStore); deliveryOK && deliveryStore != nil {
				_ = deliveryStore.MarkDeliveryFailed(context.Background(), created.ID, delivery.Error)
			}
		}
	}
	// For web/widget sessions the customer consumes the same canonical message
	// under the legacy `chat_response` event name.
	if widgetChannel(managed.Channel) {
		customerPayload := map[string]any{
			"message_id": created.ID, "message": message, "type": "agent_message",
			"session_id": sessionID.String(), "agent_name": current.FullName,
			"end_chat": isEnd, "request_rating": requestRating,
			"end_chat_reason":      attributes["end_chat_reason"],
			"end_chat_description": attributes["end_chat_description"],
			"attachments":          attachmentPayload,
		}
		_ = s.widgetNS.To(socket.Room(sessionID.String())).Emit("chat_response", customerPayload)
	}
	if !delivery.OK && !widgetChannel(managed.Channel) && s.deps.Sender != nil {
		errorMessage := "Message saved but could not be delivered to the customer."
		if delivery.Error == "window_expired" {
			if delivery.CanTemplate {
				errorMessage = "The customer's messaging window has expired - send an approved template message to re-open the conversation."
			} else {
				errorMessage = "The customer's messaging window has expired; this message could not be delivered."
			}
		}
		_ = client.Emit("error", map[string]any{
			"error": errorMessage, "type": "delivery_error", "session_id": sessionID.String(),
			"client_message_id": clientMessageID, "can_template": delivery.CanTemplate,
		})
	}
	if s.deps.Chats != nil {
		s.BroadcastConversationUpdated(context.Background(), data.OrgID, sessionID, []uuid.UUID{data.UserID})
	}
}

func (s *Server) handleJoinRoom(client *socket.Socket, values ...any) {
	data, ok := s.agentData(client)
	if !ok {
		return
	}
	payload := decodeMessagePayload(firstValue(values))
	room := strings.TrimSpace(payload.Room)
	if room == "" {
		room = strings.TrimSpace(payload.SessionID)
	}
	if room == "" {
		s.emitError(client, "room_error", "No session ID provided")
		return
	}
	if strings.HasPrefix(room, "user_") {
		if room != "user_"+data.UserID.String() {
			s.emitError(client, "room_error", "Unauthorized to join user room")
			return
		}
		client.Join(socket.Room(room))
		return
	}
	if strings.HasPrefix(room, "org_chats_") {
		organizationID := strings.TrimPrefix(room, "org_chats_")
		if organizationID != data.OrgID.String() {
			s.emitError(client, "room_error", "Unauthorized to join org chat room")
			return
		}
		client.Join(socket.Room(room))
		return
	}
	if strings.HasPrefix(room, "org_tickets_") {
		organizationID := strings.TrimPrefix(room, "org_tickets_")
		if organizationID != data.OrgID.String() {
			s.emitError(client, "room_error", "Unauthorized to join org ticket room")
			return
		}
		current, err := s.deps.Users.FindActiveByID(context.Background(), data.UserID)
		if err != nil || current == nil || current.OrganizationID == nil || *current.OrganizationID != data.OrgID ||
			!hasAnyPermission(current, "view_tickets", "manage_tickets", "super_admin") {
			s.emitError(client, "room_error", "Unauthorized to join org ticket room")
			return
		}
		client.Join(socket.Room(room))
		return
	}
	sessionID, err := uuid.Parse(room)
	if err != nil {
		s.emitError(client, "room_error", "Invalid session")
		return
	}
	managed, err := s.managedByID(context.Background(), sessionID, data.OrgID)
	if err != nil || managed == nil || s.deps.Chats == nil {
		s.emitError(client, "room_error", "Invalid session")
		return
	}
	current, err := s.deps.Users.FindActiveByID(context.Background(), data.UserID)
	if err != nil || current == nil {
		s.emitError(client, "room_error", "Unauthorized to join this room")
		return
	}
	visibility := visibilityForUser(current)
	allowed, err := s.deps.Chats.CheckAccess(context.Background(), sessionID, data.OrgID, visibility)
	if err != nil || !allowed {
		s.emitError(client, "room_error", "Unauthorized to join this room")
		return
	}
	client.Join(socket.Room(room))
	_ = s.agentNS.To(socket.Room(room)).Emit("room_event", map[string]any{"type": "join", "user_id": data.UserID.String()})
}

func (s *Server) handleLeaveRoom(client *socket.Socket, values ...any) {
	data, ok := s.agentData(client)
	if !ok {
		return
	}
	payload := decodeMessagePayload(firstValue(values))
	room := strings.TrimSpace(payload.Room)
	if room == "" {
		room = strings.TrimSpace(payload.SessionID)
	}
	if room == "" {
		s.emitError(client, "room_error", "No session ID provided")
		return
	}
	client.Leave(socket.Room(room))
	_ = s.agentNS.To(socket.Room(room)).Emit("room_event", map[string]any{"type": "leave", "user_id": data.UserID.String()})
}

func (s *Server) handleTakenOver(client *socket.Socket, values ...any) {
	data, ok := s.agentData(client)
	if !ok {
		return
	}
	payload := decodeMessagePayload(firstValue(values))
	sessionID, err := uuid.Parse(strings.TrimSpace(payload.SessionID))
	if err != nil {
		s.emitError(client, "room_error", "Invalid session ID")
		return
	}
	managed, err := s.managedByID(context.Background(), sessionID, data.OrgID)
	if err != nil || managed == nil {
		s.emitError(client, "room_error", "Session not found")
		return
	}
	current, err := s.deps.Users.FindActiveByID(context.Background(), data.UserID)
	if err != nil || current == nil || !hasAnyPermission(current, "manage_all_chats", "manage_assigned_chats", "super_admin") {
		s.emitError(client, "room_error", "Unauthorized")
		return
	}
	_ = s.widgetNS.To(socket.Room(sessionID.String())).Emit("handle_taken_over", map[string]any{
		"session_id": sessionID.String(), "user_name": current.FullName, "profile_picture": current.ProfilePic,
	})
}

func (s *Server) handleWorkflowState(client *socket.Socket, values ...any) {
	data, ok := s.widgetData(client)
	if !ok || !s.verifyWidgetToken(client, data) {
		return
	}
	ctx := context.Background()
	managed, err := s.managedSession(ctx, data)
	if err != nil || managed == nil || managed.CustomerID != data.CustomerID {
		s.emitError(client, "workflow_error", "Session not found")
		return
	}
	hasHistory := false
	if store, ok := s.deps.Chats.(chat.Store); ok && store != nil {
		if detail, detailErr := store.GetDetail(ctx, data.SessionID, data.OrgID); detailErr == nil && detail != nil {
			hasHistory = len(detail.Messages) > 0
		}
	}
	button := "Start Chat"
	if hasHistory {
		button = "Continue Conversation"
	}
	base := map[string]any{"session_id": data.SessionID.String(), "has_history": hasHistory, "button_text": button}
	if managed.WorkflowID == nil || s.deps.Workflows == nil {
		base["type"] = "ready"
		_ = client.Emit("workflow_state", base)
		return
	}
	if managed.CurrentNodeID == nil && !hasHistory {
		executor := s.workflowExecutor(data.OrgID, data.AgentID, data.SessionID)
		if executor == nil {
			s.emitError(client, "workflow_error", "Workflow service is not configured")
			return
		}
		result, execErr := executor.Execute(ctx, data.SessionID, data.OrgID, *managed.WorkflowID, nil, managed.WorkflowState, "")
		if execErr != nil {
			s.emitError(client, "workflow_error", "Failed to get workflow state")
			return
		}
		s.emitWorkflowResult(client, data, managed, result, true)
		return
	}
	if managed.CurrentNodeID == nil {
		base["type"] = "ready"
		_ = client.Emit("workflow_state", base)
		return
	}
	node, nodeErr := s.deps.Workflows.GetNode(ctx, *managed.WorkflowID, dereferenceUUID(managed.CurrentNodeID), data.OrgID)
	if nodeErr != nil || node == nil {
		s.emitError(client, "workflow_error", "Failed to get workflow state")
		return
	}
	base["button_text"] = "Continue Conversation"
	switch strings.ToUpper(node.NodeType) {
	case "FORM":
		base["type"] = "form"
		base["form_data"] = workflowFormData(node.Config)
	case "LANDING_PAGE":
		base["type"] = "landing_page"
		base["landing_page_data"] = map[string]any{"heading": workflowConfigDefault(node.Config, "landing_page_heading", "Welcome"), "content": workflowConfigDefault(node.Config, "landing_page_content", "Thank you for visiting!")}
	default:
		base["type"] = "ready"
	}
	_ = client.Emit("workflow_state", base)
}

func (s *Server) handleProceedWorkflow(client *socket.Socket, values ...any) {
	data, ok := s.widgetData(client)
	if !ok || !s.verifyWidgetToken(client, data) {
		return
	}
	ctx := context.Background()
	managed, err := s.managedSession(ctx, data)
	if err != nil || managed == nil || managed.CustomerID != data.CustomerID || managed.WorkflowID == nil || managed.CurrentNodeID == nil {
		s.emitError(client, "workflow_error", "No active workflow session found")
		return
	}
	graph, err := s.deps.Workflows.GetNodes(ctx, *managed.WorkflowID, data.OrgID)
	if err != nil {
		s.emitError(client, "workflow_error", "Failed to proceed workflow")
		return
	}
	var next *uuid.UUID
	for _, connection := range graph.Connections {
		if connection.SourceNodeID == *managed.CurrentNodeID {
			id := connection.TargetNodeID
			next = &id
			break
		}
	}
	if next == nil {
		_ = client.Emit("workflow_proceeded", map[string]any{"success": true, "message": "End of workflow"})
		return
	}
	executor := s.workflowExecutor(data.OrgID, data.AgentID, data.SessionID)
	if executor == nil {
		s.emitError(client, "workflow_error", "Workflow service is not configured")
		return
	}
	result, err := executor.Execute(ctx, data.SessionID, data.OrgID, *managed.WorkflowID, next, managed.WorkflowState, "")
	if err != nil {
		s.emitError(client, "workflow_error", "Failed to proceed workflow")
		return
	}
	s.emitWorkflowResult(client, data, managed, result, false)
	_ = client.Emit("workflow_proceeded", map[string]any{"success": true})
}

func (s *Server) handleContactInfo(client *socket.Socket, values ...any) {
	data, ok := s.widgetData(client)
	if !ok || !s.verifyWidgetToken(client, data) {
		return
	}
	payload := decodeMessagePayload(firstValue(values))
	email := strings.TrimSpace(stringValue(payload.FormData["email"]))
	name := strings.TrimSpace(stringValue(payload.FormData["name"]))
	if email != "" && !contactEmailPattern.MatchString(email) {
		s.emitError(client, "validation_error", "Please enter a valid email address")
		return
	}
	if email == "" && name == "" {
		return
	}
	ctx := context.Background()
	store, ok := s.deps.Customers.(customer.Store)
	if !ok || store == nil {
		return
	}
	managed, managedErr := s.managedSession(ctx, data)
	if managedErr != nil || managed == nil {
		return
	}
	// Email changes are limited to anonymous placeholder addresses. A conflict
	// is retained in metadata so the lead is never silently discarded.
	detailStore, detailOK := store.(customer.ContactStore)
	if !detailOK || detailStore == nil {
		return
	}
	actual, getErr := detailStore.GetByID(ctx, managed.CustomerID)
	if getErr != nil || actual == nil {
		return
	}
	updated := false
	var err error
	if name != "" {
		_, err = store.UpdateIdentity(ctx, actual.ID, &name, actual.IsAuthenticated)
		updated = err == nil
	}
	retained := false
	if email != "" {
		if canReplaceWidgetContactEmail(actual) {
			current, lookupErr := store.GetByEmail(ctx, email, data.OrgID)
			if lookupErr == nil && (current == nil || current.ID == actual.ID) {
				_, err = detailStore.UpdateEmail(ctx, actual.ID, email)
				updated = err == nil || updated
			} else {
				retained = true
			}
		} else {
			retained = true
		}
	}
	if retained {
		_, _ = store.UpdateMetaData(ctx, actual.ID, map[string]any{"contact_email_provided": email})
	}
	if updated || retained {
		confirm := "Thanks — a teammate will follow up"
		if email != "" {
			confirm += " at " + email
		}
		confirm += "."
		s.emitBotMessage(client, data, managed, confirm, map[string]any{"contact_capture": true})
	}
}

func (s *Server) handleWorkflowForm(client *socket.Socket, values ...any) {
	data, ok := s.widgetData(client)
	if !ok || !s.verifyWidgetToken(client, data) {
		return
	}
	payload := decodeMessagePayload(firstValue(values))
	if len(payload.FormData) == 0 {
		s.emitError(client, "form_error", "No form data provided")
		return
	}
	ctx := context.Background()
	managed, err := s.managedSession(ctx, data)
	if err != nil || managed == nil || managed.WorkflowID == nil || managed.CurrentNodeID == nil {
		s.emitError(client, "form_error", "No active workflow session found")
		return
	}
	node, err := s.deps.Workflows.GetNode(ctx, *managed.WorkflowID, *managed.CurrentNodeID, data.OrgID)
	if err != nil || node == nil || strings.ToUpper(node.NodeType) != "FORM" {
		s.emitError(client, "form_error", "Current workflow node is not a form")
		return
	}
	if validation := workflow.ValidateForm(workflowConfigSlice(node.Config, "form_fields"), payload.FormData); len(validation) > 0 {
		s.emitError(client, "validation_error", strings.Join(validation, "; "))
		return
	}
	executor := s.workflowExecutor(data.OrgID, data.AgentID, data.SessionID)
	if executor == nil {
		s.emitError(client, "form_error", "Workflow service is not configured")
		return
	}
	result, err := executor.SubmitForm(ctx, data.SessionID, data.OrgID, *managed.WorkflowID, managed.CurrentNodeID, managed.WorkflowState, payload.FormData)
	if err != nil {
		s.emitError(client, "form_error", "Form submission failed")
		return
	}
	s.emitWorkflowResult(client, data, managed, result, false)
	_ = client.Emit("form_submitted", map[string]any{"success": true, "message": "Form submitted successfully"})
}

func (s *Server) workflowExecutor(organizationID, agentID, sessionID uuid.UUID) *workflow.Executor {
	store, ok := s.deps.Sessions.(session.WorkflowStore)
	if !ok || store == nil || s.deps.Workflows == nil {
		return nil
	}
	return workflow.NewExecutorWithProviders(s.deps.Workflows, store, func(ctx context.Context, model, systemPrompt, userMessage string) (workflow.LLMReply, error) {
		return s.completeWorkflow(ctx, organizationID, agentID, sessionID, model, systemPrompt, userMessage)
	}, func(ctx context.Context, sessionID, organizationID uuid.UUID) bool {
		if store, ok := s.deps.Chats.(chat.Store); ok && store != nil {
			if detail, err := store.GetDetail(ctx, sessionID, organizationID); err == nil && detail != nil && len(detail.Messages) > 0 {
				return true
			}
		}
		if store, ok := s.deps.Sessions.(session.WorkflowHistoryReader); ok && store != nil {
			found, _ := store.HasWorkflowHistory(ctx, sessionID, organizationID)
			return found
		}
		return false
	})
}

func (s *Server) completeWorkflow(ctx context.Context, organizationID, agentID, sessionID uuid.UUID, model, systemPrompt, userMessage string) (workflow.LLMReply, error) {
	if s.deps.AIConfigs == nil {
		return workflow.LLMReply{}, errors.New("AI configuration is not available")
	}
	store, ok := s.deps.AIConfigs.(aiconfig.CredentialStore)
	if !ok || store == nil {
		return workflow.LLMReply{}, errors.New("AI credentials are not available")
	}
	cfg, key, err := store.GetActiveAPIKey(ctx, organizationID)
	if err != nil || cfg == nil {
		return workflow.LLMReply{}, err
	}
	if strings.TrimSpace(model) == "" {
		model = cfg.ModelName
	}
	if strings.TrimSpace(userMessage) == "" {
		userMessage = s.workflowContextMessage(ctx, organizationID, sessionID)
	}
	if s.deps.Agents != nil {
		if configured, agentErr := s.deps.Agents.Get(ctx, agentID, organizationID); agentErr == nil && configured != nil {
			systemPrompt = guardrail.ApplyPolicy(systemPrompt, s.guardrailContext(ctx, configured), guardrailSettings(s.deps.Config).PolicyEnabled)
		}
	}
	var raw string
	if strings.EqualFold(cfg.ModelType, "ANTHROPIC") {
		raw, err = callAnthropicWidget(ctx, model, key, systemPrompt, userMessage)
	} else {
		raw, err = callOpenAIWidget(ctx, model, key, systemPrompt, userMessage)
	}
	if err != nil {
		return workflow.LLMReply{}, err
	}
	reply := workflow.ParseLLMReply(raw)
	if s.deps.Agents != nil {
		if configured, agentErr := s.deps.Agents.Get(ctx, agentID, organizationID); agentErr == nil && configured != nil {
			checked, rules := guardrail.CheckOutput(reply.Message, s.guardrailContext(ctx, configured), guardrailSettings(s.deps.Config))
			reply.Message = checked
			s.recordGuardrail(ctx, guardrail.EventInput{OrganizationID: organizationID, AgentID: agentID, SessionID: sessionID, Surface: guardrail.SurfaceWorkflow, Layer: "output", Action: "counted", Rules: rules, CharLen: len([]rune(checked)), Excerpt: checked})
		}
	}
	return reply, nil
}

func (s *Server) workflowContextMessage(ctx context.Context, organizationID, sessionID uuid.UUID) string {
	store, ok := s.deps.Chats.(chat.Store)
	if !ok || store == nil {
		return "Please review the existing conversation context and continue appropriately."
	}
	detail, err := store.GetDetail(ctx, sessionID, organizationID)
	if err != nil || detail == nil || len(detail.Messages) == 0 {
		return "Please review the existing conversation context and continue appropriately."
	}
	var builder strings.Builder
	builder.WriteString("CONTEXT on previous workflow messages.\nCONVERSATION HISTORY:\n")
	for _, item := range detail.Messages {
		content := strings.TrimSpace(item.Message)
		if content == "" {
			continue
		}
		role := strings.ToUpper(strings.TrimSpace(item.MessageType))
		builder.WriteString("- ")
		builder.WriteString(role)
		builder.WriteString(": ")
		builder.WriteString(content)
		builder.WriteByte('\n')
	}
	return builder.String()
}

func (s *Server) emitWorkflowResult(client *socket.Socket, data widgetSocketData, managed *session.ManagedSession, result *workflow.ExecutionResult, initial bool) {
	if result == nil {
		return
	}
	s.applyWorkflowLifecycle(context.Background(), data, managed, result)
	if result.EndChat && result.RequestRating && strings.TrimSpace(result.Message) != "" && !strings.Contains(result.Message, strings.TrimSpace(widgetRatingNotice)) {
		result.Message += widgetRatingNotice
	}
	for _, message := range result.IntermediateMessages {
		s.emitBotMessage(client, data, managed, message, map[string]any{"workflow_execution": true, "intermediate_message": true, "message_node": true})
	}
	if result.FormData != nil {
		event := "display_form"
		if initial {
			event = "workflow_state"
		}
		payload := map[string]any{"form_data": result.FormData, "session_id": data.SessionID.String()}
		if initial {
			payload["type"] = "form"
			payload["has_history"] = false
			payload["button_text"] = "Start Chat"
		}
		_ = client.Emit(event, payload)
	} else if result.LandingPageData != nil {
		payload := map[string]any{"type": "landing_page", "landing_page_data": result.LandingPageData, "session_id": data.SessionID.String(), "has_history": false, "button_text": "Start Chat"}
		_ = client.Emit("workflow_state", payload)
	} else if result.Message != "" {
		s.emitBotMessage(client, data, managed, result.Message, map[string]any{
			"workflow_execution": true, "transfer_to_human": result.TransferToHuman,
			"request_contact": result.RequestContact,
			"transfer_reason": result.TransferReason, "transfer_description": result.TransferDescription,
			"end_chat": result.EndChat, "end_chat_reason": result.EndChatReason,
			"end_chat_description": result.EndChatDescription, "request_rating": result.RequestRating,
		})
	}
}

// applyWorkflowLifecycle performs the stateful parts of workflow results.
// The executor stays transport-neutral; the widget server owns the session
// handoff and close side effects just as it does for normal AI replies.
func (s *Server) applyWorkflowLifecycle(ctx context.Context, data widgetSocketData, managed *session.ManagedSession, result *workflow.ExecutionResult) {
	if result.TransferToHuman {
		actions, ok := s.deps.Sessions.(session.ActionStore)
		if !ok || actions == nil {
			s.deps.Logger.Warn().Msg("workflow requested transfer but session actions are unavailable")
		} else if transferred, err := actions.RouteToHuman(ctx, data.SessionID, data.OrgID, cleanText(result.TransferReason, 120), cleanText(result.TransferDescription, 2000)); err != nil || !transferred {
			s.deps.Logger.Warn().Err(err).Msg("workflow transfer failed")
		} else {
			groupID, parseErr := uuid.Parse(strings.TrimSpace(result.TransferGroupID))
			if parseErr != nil && s.deps.Agents != nil {
				if configured, agentErr := s.deps.Agents.Get(ctx, data.AgentID, data.OrgID); agentErr == nil && configured != nil && len(configured.Groups) > 0 {
					groupID = configured.Groups[0].ID
					parseErr = nil
				}
			}
			if parseErr == nil {
				if groups, groupOK := s.deps.Sessions.(session.GroupStore); groupOK && groups != nil {
					if _, err := groups.SetGroup(ctx, data.SessionID, data.OrgID, groupID); err != nil {
						s.deps.Logger.Warn().Err(err).Msg("workflow transfer group assignment failed")
					} else if managed != nil {
						managed.GroupID = &groupID
					}
				}
			}
			if managed != nil {
				managed.Status = "TRANSFERRED"
			}
			if parseErr == nil {
				withinHours, online, availabilityErr := s.widgetTransferAvailability(ctx, data.OrgID, groupID)
				if availabilityErr == nil {
					result.RequestContact = true
					result.TransferToHuman = withinHours && online > 0
					if result.TransferToHuman {
						result.Message = widgetQueuedForHumanNotice
					} else {
						result.Message = "Our team will get back to you shortly."
					}
				}
			}
		}
	}
	if result.EndChat {
		store, ok := s.deps.Sessions.(session.Store)
		if !ok || store == nil {
			s.deps.Logger.Warn().Msg("workflow requested close but session store is unavailable")
			return
		}
		reason, description := result.EndChatReason, result.EndChatDescription
		if _, err := store.Close(ctx, data.SessionID, optionalText(reason), optionalText(description)); err != nil {
			s.deps.Logger.Warn().Err(err).Msg("workflow close failed")
		}
	}
}

func (s *Server) emitBotMessage(client *socket.Socket, data widgetSocketData, managed *session.ManagedSession, message string, attributes map[string]any) {
	if attributes == nil {
		attributes = map[string]any{}
	}
	var created *chat.Message
	if store, ok := s.deps.Chats.(chat.ActionStore); ok && store != nil {
		customerID := data.CustomerID
		if managed != nil && managed.CustomerID != uuid.Nil {
			customerID = managed.CustomerID
		}
		created, _ = store.CreateMessage(context.Background(), chat.MessageInput{Message: message, MessageType: "bot", SessionID: data.SessionID, OrganizationID: data.OrgID, CustomerID: customerID, AgentID: &data.AgentID, Attributes: attributes})
	}
	payload := map[string]any{
		"message": message, "type": "chat_response", "session_id": data.SessionID.String(),
		"transfer_to_human": boolAttribute(attributes, "transfer_to_human"),
		"transfer_reason":   attributes["transfer_reason"], "transfer_description": attributes["transfer_description"],
		"end_chat": boolAttribute(attributes, "end_chat"), "end_chat_reason": attributes["end_chat_reason"],
		"end_chat_description": attributes["end_chat_description"],
		"request_contact":      boolAttribute(attributes, "request_contact"),
		"request_rating":       boolAttribute(attributes, "request_rating"),
		"request_lead_capture": boolAttribute(attributes, "request_lead_capture"),
		"sources":              attributes["sources"], "shopify_output": attributes["shopify_output"],
		"create_ticket":  boolAttribute(attributes, "create_ticket"),
		"ticket_summary": attributes["ticket_summary"], "ticket_description": attributes["ticket_description"],
		"integration_type": attributes["integration_type"], "ticket_id": attributes["ticket_id"],
		"ticket_status": attributes["ticket_status"], "ticket_priority": attributes["ticket_priority"],
		"attributes": attributes,
	}
	if created != nil {
		payload["message_id"] = created.ID
		payload["created_at"] = created.CreatedAt.UTC().Format(time.RFC3339Nano)
	}
	_ = client.Emit("chat_response", payload)
	_ = s.agentNS.To(socket.Room(data.SessionID.String())).Emit("chat_reply", payload)
	s.BroadcastConversationUpdated(context.Background(), data.OrgID, data.SessionID, nil)
}

func (s *Server) prepareWidgetAttachments(ctx context.Context, data widgetSocketData, managed *session.ManagedSession, files []any, userID *uuid.UUID, requireHandoff bool) ([]chat.AttachmentInput, []map[string]any, error) {
	if s.deps.Agents == nil {
		return nil, nil, errors.New("Attachment settings are not available")
	}
	configured, err := s.deps.Agents.Get(ctx, data.AgentID, data.OrgID)
	if err != nil || configured == nil {
		return nil, nil, errors.New("Attachment settings are not available")
	}
	if !configured.AllowAttachments {
		return nil, nil, errors.New("Attachments are not allowed for this agent")
	}
	if requireHandoff {
		if detail, detailErr := s.deps.Chats.GetDetail(ctx, data.SessionID, data.OrgID); detailErr != nil || detail == nil || !hasAgentMessage(detail.Messages) {
			return nil, nil, errors.New("Attachments are only available when the chat is handed over to a human agent")
		}
	}
	allowed := attachmentTypes(configured.AllowedAttachmentTypes)
	inputs := make([]chat.AttachmentInput, 0, len(files))
	payload := make([]map[string]any, 0, len(files))
	for _, raw := range files {
		file := authMap(raw)
		filename := filepath.Base(strings.TrimSpace(stringValue(file["filename"])))
		contentType := strings.ToLower(strings.TrimSpace(stringValue(file["content_type"])))
		encoded := stringValue(file["content"])
		if filename == "" || encoded == "" || contentType == "" {
			return nil, nil, errors.New("Missing required file data: content, filename and content_type")
		}
		if strings.HasPrefix(encoded, "data:") {
			if comma := strings.Index(encoded, ","); comma >= 0 {
				encoded = encoded[comma+1:]
			}
		}
		content, decodeErr := base64.StdEncoding.DecodeString(encoded)
		if decodeErr != nil {
			content, decodeErr = base64.RawStdEncoding.DecodeString(encoded)
		}
		if decodeErr != nil {
			return nil, nil, errors.New("Invalid base64 attachment")
		}
		if len(content) == 0 || len(content) > 10*1024*1024 || (strings.HasPrefix(contentType, "image/") && len(content) > 5*1024*1024) {
			return nil, nil, errors.New("Attachment exceeds the maximum allowed size")
		}
		if _, ok := allowed[contentType]; !ok {
			return nil, nil, fmt.Errorf("File type %q is not allowed", contentType)
		}
		if expected := attachmentMIME(filepath.Ext(filename)); expected != "" && expected != contentType && !(contentType == "image/jpg" && expected == "image/jpeg") {
			return nil, nil, errors.New("File extension does not match content type")
		}
		if !validAttachmentBytes(content, contentType) {
			return nil, nil, errors.New("File content does not match the claimed type")
		}
		ext := strings.ToLower(filepath.Ext(filename))
		if ext == "" {
			ext = attachmentExtension(contentType)
		}
		key := filepath.ToSlash(filepath.Join("chat_attachments", data.OrgID.String(), uuid.NewString()+ext))
		fileURL := s.deps.Config.APIBasePath + "/files/download/" + key
		storedURL := fileURL
		if s.deps.Config.S3FileStorage {
			client, clientErr := storage.NewClient(storage.S3Config{Bucket: s.deps.Config.S3Bucket, Region: s.deps.Config.S3Region, AccessKeyID: s.deps.Config.AWSAccessKeyID, SecretKey: s.deps.Config.AWSSecretAccessKey, SessionToken: s.deps.Config.AWSSessionToken})
			if clientErr != nil || client.Put(ctx, key, content, contentType) != nil {
				return nil, nil, errors.New("Failed to upload attachment")
			}
			if signed, signErr := client.PresignGetContext(ctx, key, time.Duration(s.deps.Config.S3PresignExpiry)*time.Second); signErr == nil {
				fileURL = signed
			}
		} else {
			path := filepath.Join(s.deps.Config.UploadsDir, filepath.FromSlash(key))
			if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
				return nil, nil, err
			}
			if err := os.WriteFile(path, content, 0o644); err != nil {
				return nil, nil, err
			}
			if s.deps.Auth != nil {
				expires := time.Now().Add(time.Duration(s.deps.Config.S3PresignExpiry) * time.Second).Unix()
				if signature, signErr := s.deps.Auth.SignLocalAttachment(key, expires); signErr == nil {
					fileURL += fmt.Sprintf("?expires=%d&signature=%s", expires, signature)
				}
			}
		}
		inputs = append(inputs, chat.AttachmentInput{FileURL: storedURL, Filename: filename, ContentType: contentType, FileSize: int64(len(content)), OrganizationID: data.OrgID, CustomerID: &data.CustomerID, UserID: userID})
		payload = append(payload, map[string]any{"filename": filename, "file_url": fileURL, "content_type": contentType, "file_size": len(content)})
	}
	return inputs, payload, nil
}

func hasAgentMessage(messages []chat.Message) bool {
	for _, message := range messages {
		if strings.EqualFold(message.MessageType, "agent") {
			return true
		}
	}
	return false
}

func attachmentTypes(categories []string) map[string]struct{} {
	all := map[string]struct{}{"image/jpeg": {}, "image/jpg": {}, "image/png": {}, "image/gif": {}, "image/webp": {}, "application/pdf": {}, "application/msword": {}, "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {}, "text/plain": {}, "text/csv": {}, "application/vnd.ms-excel": {}, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {}}
	if len(categories) == 0 {
		return all
	}
	result := map[string]struct{}{}
	groups := map[string][]string{"images": {"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"}, "documents": {"application/pdf"}, "office": {"application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}, "text": {"text/plain", "text/csv"}}
	for _, category := range categories {
		if values, ok := groups[strings.ToLower(category)]; ok {
			for _, value := range values {
				result[value] = struct{}{}
			}
		} else if _, ok := all[strings.ToLower(category)]; ok {
			result[strings.ToLower(category)] = struct{}{}
		}
	}
	return result
}

func attachmentMIME(ext string) string {
	values := map[string]string{".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp", ".pdf": "application/pdf", ".doc": "application/msword", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".txt": "text/plain", ".csv": "text/csv", ".xls": "application/vnd.ms-excel", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
	return values[strings.ToLower(ext)]
}

func attachmentExtension(contentType string) string {
	values := map[string]string{"image/jpeg": ".jpg", "image/jpg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp", "application/pdf": ".pdf", "application/msword": ".doc", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx", "text/plain": ".txt", "text/csv": ".csv", "application/vnd.ms-excel": ".xls", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx"}
	return values[contentType]
}

func validAttachmentBytes(content []byte, contentType string) bool {
	if contentType == "text/plain" || contentType == "text/csv" {
		return utf8.Valid(content)
	}
	signatures := map[string][][]byte{"image/jpeg": {{0xff, 0xd8, 0xff}}, "image/jpg": {{0xff, 0xd8, 0xff}}, "image/png": {{0x89, 'P', 'N', 'G'}}, "image/gif": {{'G', 'I', 'F', '8'}}, "image/webp": {{'R', 'I', 'F', 'F'}}, "application/pdf": {{'%', 'P', 'D', 'F', '-'}}, "application/msword": {{0xd0, 0xcf, 0x11, 0xe0}}, "application/vnd.ms-excel": {{0xd0, 0xcf, 0x11, 0xe0}}, "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {{'P', 'K', 0x03, 0x04}}, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {{'P', 'K', 0x03, 0x04}}}
	for _, signature := range signatures[contentType] {
		if len(content) >= len(signature) && bytes.Equal(content[:len(signature)], signature) {
			return true
		}
	}
	return false
}

func (s *Server) generateWidgetReply(ctx context.Context, data widgetSocketData, managed *session.ManagedSession, message string) (channel.Reply, error) {
	if s.deps.Agents == nil {
		return channel.Reply{}, errors.New("agent service is not configured")
	}
	configured, agentErr := s.deps.Agents.Get(ctx, data.AgentID, data.OrgID)
	if agentErr != nil {
		return channel.Reply{}, agentErr
	}
	if configured == nil {
		return channel.Reply{}, errors.New("agent is not configured")
	}
	if !configured.AIRepliesEnabled {
		return channel.Reply{}, errors.New("AI replies are disabled")
	}
	if s.deps.AIConfigs == nil {
		return channel.Reply{}, errors.New("AI configuration is not available")
	}
	store, ok := s.deps.AIConfigs.(aiconfig.CredentialStore)
	if !ok || store == nil {
		return channel.Reply{}, errors.New("AI credentials are not available")
	}
	cfg, key, err := store.GetActiveAPIKey(ctx, data.OrgID)
	if err != nil || cfg == nil || strings.TrimSpace(key) == "" {
		if err != nil {
			return channel.Reply{}, err
		}
		return channel.Reply{}, errors.New("AI configuration is not available")
	}
	var leadConfig *leadcapture.Config
	if leadStore, ok := s.deps.LeadCapture.(leadcapture.Store); ok && leadStore != nil {
		leadConfig, _ = leadStore.GetOrCreate(ctx, data.AgentID, data.OrgID)
	}
	guardrailCtx := s.guardrailContext(ctx, configured)
	guardrailConfig := guardrailSettings(s.deps.Config)
	system := channelSystemPrompt(configured, leadConfig, managedChannel(managed), guardrailCtx, guardrailConfig)
	grounded, knowledgeContext := s.searchKnowledgeForReply(ctx, data.OrgID, data.AgentID, message, "")
	system += knowledgeContext
	messages := channelConversationMessages(ctx, s.deps.Chats, data.SessionID, data.OrgID)
	if len(messages) == 0 || messages[len(messages)-1].Role != "user" || messages[len(messages)-1].Content != message {
		messages = append(messages, channelAIMessage{Role: "user", Content: message})
	}
	tools, toolState := s.buildAITools(ctx, configured, data.OrgID, data.AgentID, data.CustomerID, data.SessionID)
	defer closeAIToolState(toolState)
	if toolState.MCPRuntime != nil {
		system += mcpAIInstructions
	}
	raw, toolState, err := completeChannelAIWithConfig(ctx, cfg, key, system, messages, 1200, tools, toolState)
	if err != nil {
		return channel.Reply{}, err
	}
	reply := parseChannelReply(raw)
	reply = applyAIToolState(reply, toolState)
	originalMessage := reply.Message
	var outputRules []string
	reply.Message, outputRules = guardrail.CheckOutput(originalMessage, guardrailCtx, guardrailConfig)
	if len(outputRules) > 0 {
		s.recordGuardrail(ctx, guardrail.EventInput{
			OrganizationID: data.OrgID, AgentID: data.AgentID, SessionID: data.SessionID,
			Surface: guardrail.SurfaceWidget, Layer: "output", Action: outputAction(outputRules),
			Rules: outputRules, CharLen: len([]rune(originalMessage)), Excerpt: originalMessage,
		})
	}
	return finalizeAIReply(configured, managedChannel(managed), leadConfig, reply, grounded), nil
}

func managedChannel(value *session.ManagedSession) string {
	if value == nil || strings.TrimSpace(value.Channel) == "" {
		return "web"
	}
	return value.Channel
}

func callOpenAIWidget(ctx context.Context, model, key, system, message string) (string, error) {
	body, _ := json.Marshal(map[string]any{"model": model, "messages": []map[string]string{{"role": "system", "content": system}, {"role": "user", "content": message}}, "temperature": 0.2})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.openai.com/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Content-Type", "application/json")
	response, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return "", fmt.Errorf("OpenAI returned HTTP %d", response.StatusCode)
	}
	var decoded struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(response.Body).Decode(&decoded); err != nil || len(decoded.Choices) == 0 {
		return "", errors.New("AI returned an empty response")
	}
	return strings.TrimSpace(decoded.Choices[0].Message.Content), nil
}

func callAnthropicWidget(ctx context.Context, model, key, system, message string) (string, error) {
	body, _ := json.Marshal(map[string]any{"model": model, "system": system, "max_tokens": 1024, "messages": []map[string]string{{"role": "user", "content": message}}})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.anthropic.com/v1/messages", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("x-api-key", key)
	req.Header.Set("anthropic-version", "2023-06-01")
	req.Header.Set("Content-Type", "application/json")
	response, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return "", fmt.Errorf("Anthropic returned HTTP %d", response.StatusCode)
	}
	var decoded struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
	}
	if err := json.NewDecoder(response.Body).Decode(&decoded); err != nil || len(decoded.Content) == 0 {
		return "", errors.New("AI returned an empty response")
	}
	return strings.TrimSpace(decoded.Content[0].Text), nil
}

func (s *Server) widgetData(client *socket.Socket) (widgetSocketData, bool) {
	data, ok := client.Data().(widgetSocketData)
	if !ok {
		s.emitError(client, "auth_error", "Authentication failed")
		return widgetSocketData{}, false
	}
	return data, true
}

func (s *Server) agentData(client *socket.Socket) (agentSocketData, bool) {
	data, ok := client.Data().(agentSocketData)
	if !ok {
		s.emitError(client, "auth_error", "Authentication failed")
		return agentSocketData{}, false
	}
	return data, true
}

func (s *Server) verifyWidgetToken(client *socket.Socket, data widgetSocketData) bool {
	if s.deps.Auth == nil {
		s.emitError(client, "auth_error", "Authentication failed")
		return false
	}
	claims, err := s.deps.Auth.VerifyConversationToken(data.Token)
	if err != nil || claims.WidgetID != data.WidgetID || claims.Subject != data.CustomerID.String() {
		s.emitError(client, "auth_error", "Authentication failed")
		return false
	}
	return true
}

func (s *Server) managedSession(ctx context.Context, data widgetSocketData) (*session.ManagedSession, error) {
	return s.managedByID(ctx, data.SessionID, data.OrgID)
}

func (s *Server) managedByID(ctx context.Context, sessionID, organizationID uuid.UUID) (*session.ManagedSession, error) {
	store, ok := s.deps.Sessions.(session.ActionStore)
	if !ok || store == nil {
		return nil, errors.New("session management service is not configured")
	}
	return store.GetManaged(ctx, sessionID, organizationID)
}

func (s *Server) pendingWidgetEvent(client *socket.Socket, event, message string) {
	_ = client.Emit("error", map[string]any{"error": message, "type": event})
}

func (s *Server) emitError(client *socket.Socket, errorType, message string) {
	_ = client.Emit("error", map[string]any{"error": message, "type": errorType})
}

func firstSocket(values []any) (*socket.Socket, bool) {
	if len(values) == 0 {
		return nil, false
	}
	client, ok := values[0].(*socket.Socket)
	return client, ok && client != nil
}

func firstValue(values []any) any {
	if len(values) == 0 {
		return nil
	}
	return values[0]
}

func authMap(value any) map[string]any {
	if value == nil {
		return map[string]any{}
	}
	if found, ok := value.(map[string]any); ok {
		return found
	}
	raw, err := json.Marshal(value)
	if err != nil {
		return map[string]any{}
	}
	var found map[string]any
	if json.Unmarshal(raw, &found) != nil || found == nil {
		return map[string]any{}
	}
	return found
}

func decodeMessagePayload(value any) messagePayload {
	var payload messagePayload
	data := authMap(value)
	payload.Message = stringValue(data["message"])
	payload.MessageType = stringValue(data["message_type"])
	payload.SessionID = stringValue(data["session_id"])
	payload.Room = stringValue(data["room"])
	payload.ClientMessageID = stringValue(data["client_message_id"])
	payload.EndChat = boolValue(data["end_chat"])
	payload.RequestRating = boolValue(data["request_rating"])
	payload.EndChatReason = stringValue(firstNonEmptyValue(data, "end_chat_reason", "reason"))
	payload.EndChatDescription = stringValue(firstNonEmptyValue(data, "end_chat_description", "description"))
	payload.Feedback = stringValue(data["feedback"])
	payload.Rating = intValue(data["rating"])
	if files, ok := data["files"].([]any); ok {
		payload.Files = files
	}
	if mentioned, ok := data["mentioned_user_ids"].([]any); ok {
		payload.MentionedUserIDs = make([]string, 0, len(mentioned))
		for _, value := range mentioned {
			if text, ok := value.(string); ok {
				payload.MentionedUserIDs = append(payload.MentionedUserIDs, text)
			}
		}
	}
	if formData, ok := data["form_data"].(map[string]any); ok {
		payload.FormData = formData
	}
	return payload
}

func (s *Server) resolveMentionedUsers(ctx context.Context, managed *session.ManagedSession, senderID uuid.UUID, rawIDs []string) ([]uuid.UUID, []map[string]any, error) {
	if len(rawIDs) == 0 {
		return nil, nil, nil
	}
	if len(rawIDs) > 20 {
		return nil, nil, errors.New("Invalid mentioned users")
	}
	requested := make([]uuid.UUID, 0, len(rawIDs))
	seen := make(map[uuid.UUID]struct{}, len(rawIDs))
	for _, rawID := range rawIDs {
		id, err := uuid.Parse(strings.TrimSpace(rawID))
		if err != nil {
			return nil, nil, errors.New("Invalid mentioned users")
		}
		if id == senderID {
			continue
		}
		if _, exists := seen[id]; exists {
			continue
		}
		seen[id] = struct{}{}
		requested = append(requested, id)
	}
	if len(requested) == 0 {
		return nil, nil, nil
	}
	store, ok := s.deps.Users.(user.TeammateStore)
	if !ok || store == nil {
		return nil, nil, nil
	}
	teammates, err := store.ListChatTeammates(ctx, managed.OrganizationID)
	if err != nil {
		return nil, nil, err
	}
	byID := make(map[uuid.UUID]user.Teammate, len(teammates))
	for _, teammate := range teammates {
		if teammateCanSeeManaged(teammate, managed) {
			byID[teammate.ID] = teammate
		}
	}
	validIDs := make([]uuid.UUID, 0, len(requested))
	validUsers := make([]map[string]any, 0, len(requested))
	for _, id := range requested {
		teammate, exists := byID[id]
		if !exists {
			continue
		}
		name := teammate.Email
		if teammate.FullName != nil && strings.TrimSpace(*teammate.FullName) != "" {
			name = *teammate.FullName
		}
		validIDs = append(validIDs, id)
		validUsers = append(validUsers, map[string]any{"id": id.String(), "name": name})
	}
	return validIDs, validUsers, nil
}

func stringValue(value any) string {
	switch found := value.(type) {
	case string:
		return found
	case json.Number:
		return found.String()
	default:
		return ""
	}
}

func boolValue(value any) bool {
	found, _ := value.(bool)
	return found
}

func intValue(value any) int {
	switch found := value.(type) {
	case int:
		return found
	case int64:
		return int(found)
	case float64:
		return int(found)
	case json.Number:
		value, _ := found.Int64()
		return int(value)
	default:
		return 0
	}
}

func firstNonEmptyValue(values map[string]any, keys ...string) any {
	for _, key := range keys {
		if value := stringValue(values[key]); strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func cleanText(value string, maximum int) string {
	value = strings.TrimSpace(value)
	value = strings.Map(func(r rune) rune {
		if r < 32 && r != '\n' && r != '\r' && r != '\t' {
			return -1
		}
		return r
	}, value)
	runes := []rune(value)
	if maximum > 0 && len(runes) > maximum {
		return string(runes[:maximum])
	}
	return string(runes)
}

func sanitizeMessage(value string) string {
	value = html.UnescapeString(value)
	value = markdownLinkPattern.ReplaceAllString(value, "$1")
	value = dangerousURI.ReplaceAllString(value, "")
	value = htmlTagPattern.ReplaceAllString(value, "")
	return cleanText(value, 8000)
}

func optionalText(value string) *string {
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

func widgetChannel(value string) bool {
	return value == "" || strings.EqualFold(value, "web") || strings.EqualFold(value, "shopify")
}

var contactEmailPattern = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

func dereferenceUUID(value *uuid.UUID) uuid.UUID {
	if value == nil {
		return uuid.Nil
	}
	return *value
}
func workflowConfigDefault(config map[string]any, key, fallback string) string {
	if value, ok := config[key].(string); ok && strings.TrimSpace(value) != "" {
		return value
	}
	return fallback
}
func workflowConfigSlice(config map[string]any, key string) []any {
	value, _ := config[key].([]any)
	return value
}

func workflowFormData(config map[string]any) map[string]any {
	return map[string]any{
		"title":              configStringValue(config, "form_title"),
		"description":        configStringValue(config, "form_description"),
		"submit_button_text": workflowConfigDefault(config, "submit_button_text", "Submit"),
		"fields":             workflowConfigSlice(config, "form_fields"),
		"form_full_screen":   workflowConfigBool(config, "form_full_screen"),
	}
}

func configStringValue(config map[string]any, key string) string {
	value, _ := config[key].(string)
	return value
}
func workflowConfigBool(config map[string]any, key string) bool {
	value, _ := config[key].(bool)
	return value
}

func boolAttribute(values map[string]any, key string) bool {
	if values == nil {
		return false
	}
	return boolValue(values[key])
}

func hasAnyPermission(found *user.User, names ...string) bool {
	if found == nil || found.Role == nil {
		return false
	}
	permissions := make(map[string]struct{}, len(found.Role.Permissions))
	for _, permission := range found.Role.Permissions {
		permissions[permission.Name] = struct{}{}
	}
	if _, ok := permissions["super_admin"]; ok {
		return true
	}
	for _, name := range names {
		if _, ok := permissions[name]; ok {
			return true
		}
	}
	return false
}

func visibilityForUser(found *user.User) chat.Visibility {
	visibility := chat.Visibility{}
	if found != nil {
		visibility.UserID = found.ID
	}
	if found == nil || found.Role == nil {
		return visibility
	}
	for _, permission := range found.Role.Permissions {
		switch permission.Name {
		case "super_admin":
			visibility.CanViewAll = true
			visibility.CanManageAll = true
		case "view_all_chats":
			visibility.CanViewAll = true
		case "manage_all_chats":
			visibility.CanManageAll = true
		case "view_assigned_chats":
			visibility.CanViewAssigned = true
		case "manage_assigned_chats":
			visibility.CanManageAssigned = true
		case "view_unassigned_chats":
			visibility.CanViewUnassigned = true
		}
	}
	return visibility
}

func calculateResponseDelay(configured *agent.Agent, replyText string) time.Duration {
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
