package httpapi

import (
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/komi/komi/backend-go/internal/chat"
	"github.com/komi/komi/backend-go/internal/session"
	"github.com/komi/komi/backend-go/internal/user"
)

type teammateView struct {
	ID         uuid.UUID `json:"id"`
	FullName   *string   `json:"full_name"`
	Email      string    `json:"email"`
	ProfilePic *string   `json:"profile_pic"`
	IsOnline   bool      `json:"is_online"`
}

type endChatRequest struct {
	Message            string `json:"message"`
	RequestRating      bool   `json:"request_rating"`
	EndChatReason      string `json:"end_chat_reason"`
	EndChatDescription string `json:"end_chat_description"`
	ClientMessageID    string `json:"client_message_id"`
}

type aiAutoReplyRequest struct {
	Enabled *bool `json:"enabled"`
}

type reassignChatRequest struct {
	ToUserID string `json:"to_user_id"`
	Note     string `json:"note"`
}

func loadActionSession(w http.ResponseWriter, r *http.Request, deps Dependencies) (*user.User, chat.Visibility, session.ActionStore, *session.ManagedSession, bool) {
	store, ok := deps.Sessions.(session.ActionStore)
	if !ok || store == nil || deps.Chats == nil {
		Error(w, http.StatusServiceUnavailable, "Session management service is not configured")
		return nil, chat.Visibility{}, nil, nil, false
	}
	current, currentOK := currentUserFromContext(r)
	visibility, visibilityOK := chatVisibilityFromContext(r)
	if !currentOK || current.OrganizationID == nil || !visibilityOK {
		Error(w, http.StatusForbidden, "User is not associated with any organization")
		return nil, chat.Visibility{}, nil, nil, false
	}
	sessionID, err := parseSessionPathID(r)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid UUID format")
		return nil, chat.Visibility{}, nil, nil, false
	}
	if !sessionAccess(w, r, deps, sessionID, *current.OrganizationID, visibility) {
		return nil, chat.Visibility{}, nil, nil, false
	}
	managed, err := store.GetManaged(r.Context(), sessionID, *current.OrganizationID)
	if err != nil {
		Error(w, http.StatusInternalServerError, "Failed to access chat session")
		return nil, chat.Visibility{}, nil, nil, false
	}
	if managed == nil {
		Error(w, http.StatusNotFound, "Chat session not found")
		return nil, chat.Visibility{}, nil, nil, false
	}
	return current, visibility, store, managed, true
}

func listMentionableTeammates(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, _, _, managed, ok := loadActionSession(w, r, deps)
		if !ok {
			return
		}
		teammatesStore, ok := deps.Users.(user.TeammateStore)
		if !ok || teammatesStore == nil {
			Error(w, http.StatusServiceUnavailable, "Teammate directory service is not configured")
			return
		}
		values, err := teammatesStore.ListChatTeammates(r.Context(), managed.OrganizationID)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to fetch teammates")
			return
		}
		result := make([]teammateView, 0, len(values))
		for _, teammate := range values {
			if teammate.ID == current.ID || !teammateCanSeeSession(teammate, managed) {
				continue
			}
			result = append(result, teammateView{
				ID:         teammate.ID,
				FullName:   teammate.FullName,
				Email:      teammate.Email,
				ProfilePic: teammate.ProfilePic,
				IsOnline:   teammate.IsOnline,
			})
		}
		JSON(w, http.StatusOK, result)
	}
}

func teammateCanSeeSession(teammate user.Teammate, managed *session.ManagedSession) bool {
	permissions := teammate.Permissions
	canViewAll := hasTeammatePermission(permissions, "super_admin") ||
		hasTeammatePermission(permissions, "view_all_chats") ||
		hasTeammatePermission(permissions, "manage_all_chats")
	if canViewAll {
		return true
	}
	canViewAssigned := hasTeammatePermission(permissions, "view_assigned_chats")
	canManageAssigned := hasTeammatePermission(permissions, "manage_assigned_chats")
	if managed.UserID != nil {
		if *managed.UserID == teammate.ID && (canViewAssigned || canManageAssigned) {
			return true
		}
		return managed.GroupID != nil && canViewAssigned && teammateInGroup(teammate, *managed.GroupID)
	}
	if hasTeammatePermission(permissions, "view_unassigned_chats") {
		return true
	}
	return managed.GroupID != nil && canViewAssigned && teammateInGroup(teammate, *managed.GroupID)
}

func teammateInGroup(teammate user.Teammate, groupID uuid.UUID) bool {
	for _, candidate := range teammate.GroupIDs {
		if candidate == groupID {
			return true
		}
	}
	return false
}

func hasTeammatePermission(permissions map[string]struct{}, name string) bool {
	_, ok := permissions[name]
	return ok
}

func endManagedChat(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, _, store, managed, ok := loadActionSession(w, r, deps)
		if !ok {
			return
		}
		if strings.EqualFold(managed.Status, "closed") {
			Error(w, http.StatusBadRequest, "This chat is already closed")
			return
		}
		if managed.UserID == nil || *managed.UserID != current.ID {
			Error(w, http.StatusForbidden, "Only the assigned agent can end this chat")
			return
		}
		var body endChatRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		clientMessageID := cleanActionText(body.ClientMessageID, 128)
		chatStore, ok := deps.Chats.(chat.ActionStore)
		if !ok || chatStore == nil {
			Error(w, http.StatusServiceUnavailable, "Chat message service is not configured")
			return
		}
		if clientMessageID != "" {
			exists, err := chatStore.FindMessageByClientID(r.Context(), managed.ID, clientMessageID)
			if err != nil {
				Error(w, http.StatusInternalServerError, "Failed to check closing message")
				return
			}
			if exists {
				writeUpdatedChatDetail(w, r, deps, managed.ID, managed.OrganizationID)
				return
			}
		}

		message := cleanActionText(body.Message, 8000)
		if message == "" {
			message = "Thank you for contacting us."
		}
		description := cleanActionText(body.EndChatDescription, 2000)
		if description == "" {
			description = "Agent manually ended the chat"
		}
		reason := normalizeEndChatReason(body.EndChatReason)
		requestRating := body.RequestRating && isWidgetChannel(managed.Channel)
		attributes := map[string]any{
			"end_chat":             true,
			"request_rating":       requestRating,
			"end_chat_reason":      reason,
			"end_chat_description": description,
		}
		if clientMessageID != "" {
			attributes["client_message_id"] = clientMessageID
		}
		created, err := chatStore.CreateMessage(r.Context(), chat.MessageInput{
			Message:        message,
			MessageType:    "system",
			SessionID:      managed.ID,
			OrganizationID: managed.OrganizationID,
			CustomerID:     managed.CustomerID,
			AgentID:        managed.AgentID,
			UserID:         &current.ID,
			Attributes:     attributes,
		})
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to persist closing message")
			return
		}
		reasonValue, descriptionValue := reason, description
		if closed, err := store.Close(r.Context(), managed.ID, &reasonValue, &descriptionValue); err != nil || !closed {
			Error(w, http.StatusInternalServerError, "Failed to close chat")
			return
		}
		canonical := map[string]any{
			"message_id": created.ID, "client_message_id": clientMessageID,
			"user_id": current.ID.String(), "message": message, "message_type": "system",
			"type": "agent_message", "session_id": managed.ID.String(),
			"created_at": created.CreatedAt.UTC().Format(time.RFC3339Nano),
			"user_name":  current.FullName, "attributes": attributes,
			"end_chat": true, "request_rating": requestRating,
			"end_chat_reason": reason, "end_chat_description": description,
		}
		deliverExternalSessionMessage(r.Context(), deps, managed, message, created)
		if deps.Realtime != nil {
			deps.Realtime.EmitAgentChatReply(managed.ID, &current.ID, canonical)
			if isWidgetChannel(managed.Channel) {
				deps.Realtime.EmitWidgetChatResponse(managed.ID, map[string]any{
					"message_id": created.ID, "message": message, "type": "agent_message",
					"session_id": managed.ID.String(), "agent_name": current.FullName,
					"end_chat": true, "request_rating": requestRating,
					"end_chat_reason": reason, "end_chat_description": description,
				})
			}
			deps.Realtime.BroadcastConversationUpdated(r.Context(), managed.OrganizationID, managed.ID, []uuid.UUID{current.ID})
		}
		writeUpdatedChatDetail(w, r, deps, managed.ID, managed.OrganizationID)
	}
}

func routeChatToHuman(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, _, store, managed, ok := loadActionSession(w, r, deps)
		if !ok {
			return
		}
		if strings.EqualFold(managed.Status, "closed") {
			Error(w, http.StatusBadRequest, "This chat is closed")
			return
		}
		if managed.UserID != nil {
			Error(w, http.StatusBadRequest, "A human is already handling this chat")
			return
		}
		if strings.EqualFold(managed.Status, "transferred") {
			Error(w, http.StatusBadRequest, "This chat is already waiting for a human")
			return
		}
		description := "Routed to the team by " + current.FullName
		if routed, err := store.RouteToHuman(r.Context(), managed.ID, managed.OrganizationID, "DIRECT_REQUEST", description); err != nil {
			Error(w, http.StatusInternalServerError, "Failed to route chat to a human")
			return
		} else if !routed {
			Error(w, http.StatusBadRequest, "This chat is already waiting for a human")
			return
		}
		recipients := chatNotificationRecipients(r.Context(), deps, managed, "chat_transfer")
		emitChatEvent(r.Context(), deps, recipients, "chat_transfer", "Chat waiting for a human", description, map[string]any{
			"session_id": managed.ID.String(), "transfer_reason": "DIRECT_REQUEST", "transfer_description": description,
		})
		sendExternalSessionMessage(r.Context(), deps, managed, queuedForHumanNotice, "bot", nil, map[string]any{
			"channel": managed.Channel, "transfer_to_human": true, "transfer_reason": "DIRECT_REQUEST",
			"transfer_description": description,
		})
		if deps.Realtime != nil {
			deps.Realtime.BroadcastConversationUpdated(r.Context(), managed.OrganizationID, managed.ID, nil)
		}
		writeUpdatedChatDetail(w, r, deps, managed.ID, managed.OrganizationID)
	}
}

func toggleAIAutoReply(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, _, store, managed, ok := loadActionSession(w, r, deps)
		if !ok {
			return
		}
		if strings.EqualFold(managed.Status, "closed") {
			Error(w, http.StatusBadRequest, "This chat is closed")
			return
		}
		var body aiAutoReplyRequest
		if err := decodeJSON(r, &body); err != nil || body.Enabled == nil {
			Error(w, http.StatusUnprocessableEntity, "enabled is required")
			return
		}
		if *body.Enabled {
			if deps.Agents == nil || managed.AgentID == nil {
				Error(w, http.StatusBadRequest, "AI auto-reply is disabled for this agent")
				return
			}
			found, err := deps.Agents.Get(r.Context(), *managed.AgentID, managed.OrganizationID)
			if err != nil {
				Error(w, http.StatusInternalServerError, "Failed to load chat agent")
				return
			}
			if found == nil || !found.AIRepliesEnabled {
				Error(w, http.StatusBadRequest, "AI auto-reply is disabled for this agent")
				return
			}
		}
		if updated, err := store.SetAIAutoReply(r.Context(), managed.ID, managed.OrganizationID, *body.Enabled); err != nil {
			Error(w, http.StatusInternalServerError, "Failed to update AI auto-reply")
			return
		} else if !updated {
			Error(w, http.StatusNotFound, "Chat session not found")
			return
		}
		if deps.Realtime != nil {
			deps.Realtime.BroadcastConversationUpdated(r.Context(), managed.OrganizationID, managed.ID, []uuid.UUID{current.ID})
		}
		writeUpdatedChatDetail(w, r, deps, managed.ID, managed.OrganizationID)
	}
}

func handBackToAI(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, _, store, managed, ok := loadActionSession(w, r, deps)
		if !ok {
			return
		}
		if strings.EqualFold(managed.Status, "closed") {
			Error(w, http.StatusBadRequest, "This chat is closed")
			return
		}
		if deps.Agents == nil || managed.AgentID == nil {
			Error(w, http.StatusBadRequest, "AI auto-reply is disabled for this agent")
			return
		}
		found, err := deps.Agents.Get(r.Context(), *managed.AgentID, managed.OrganizationID)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to load chat agent")
			return
		}
		if found == nil || !found.AIRepliesEnabled {
			Error(w, http.StatusBadRequest, "AI auto-reply is disabled for this agent")
			return
		}
		previousUserID := managed.UserID
		if handedBack, err := store.HandBackToAI(r.Context(), managed.ID, managed.OrganizationID); err != nil {
			Error(w, http.StatusInternalServerError, "Failed to hand chat back to AI")
			return
		} else if !handedBack {
			Error(w, http.StatusBadRequest, "Failed to hand chat back to AI")
			return
		}
		if deps.Realtime != nil {
			deps.Realtime.EmitAgentSessionEvent(managed.ID, map[string]any{
				"type": "handed_back_to_ai", "session_id": managed.ID.String(), "ai_auto_reply": true,
			})
			explicit := []uuid.UUID{}
			if previousUserID != nil {
				explicit = append(explicit, *previousUserID)
			}
			if current, ok := currentUserFromContext(r); ok && current != nil {
				explicit = append(explicit, current.ID)
			}
			deps.Realtime.BroadcastConversationUpdated(r.Context(), managed.OrganizationID, managed.ID, explicit)
		}
		writeUpdatedChatDetail(w, r, deps, managed.ID, managed.OrganizationID)
	}
}

func reassignChat(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, _, store, managed, ok := loadActionSession(w, r, deps)
		if !ok {
			return
		}
		if strings.EqualFold(managed.Status, "closed") || !strings.EqualFold(managed.Status, "open") {
			Error(w, http.StatusBadRequest, "Only open sessions can be reassigned")
			return
		}
		if managed.UserID == nil {
			Error(w, http.StatusBadRequest, "Chat must be handled by a user to reassign")
			return
		}
		previousUserID := *managed.UserID
		var body reassignChatRequest
		if r.URL.Query().Get("to_user_id") == "" && r.ContentLength != 0 {
			if err := decodeJSON(r, &body); err != nil {
				Error(w, http.StatusUnprocessableEntity, err.Error())
				return
			}
		}
		targetText := strings.TrimSpace(r.URL.Query().Get("to_user_id"))
		if body.ToUserID != "" {
			targetText = strings.TrimSpace(body.ToUserID)
		}
		if targetText == "" {
			Error(w, http.StatusUnprocessableEntity, "to_user_id is required")
			return
		}
		targetID, err := uuid.Parse(targetText)
		if err != nil || deps.Users == nil {
			Error(w, http.StatusNotFound, "User not found")
			return
		}
		target, err := deps.Users.FindActiveByID(r.Context(), targetID)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to load target user")
			return
		}
		if target == nil || target.OrganizationID == nil || *target.OrganizationID != managed.OrganizationID || !userCanManageChats(target) {
			Error(w, http.StatusNotFound, "User not found")
			return
		}

		note := cleanActionText(body.Note, 2000)
		if note != "" {
			chatStore, ok := deps.Chats.(chat.ActionStore)
			if !ok || chatStore == nil {
				Error(w, http.StatusServiceUnavailable, "Chat message service is not configured")
				return
			}
			if _, err := chatStore.CreateMessage(r.Context(), chat.MessageInput{
				Message:        note,
				MessageType:    "private_note",
				SessionID:      managed.ID,
				OrganizationID: managed.OrganizationID,
				CustomerID:     managed.CustomerID,
				AgentID:        managed.AgentID,
				UserID:         &current.ID,
				Attributes: map[string]any{
					"is_private":         true,
					"handoff_to_user_id": targetID.String(),
				},
			}); err != nil {
				Error(w, http.StatusInternalServerError, "Failed to persist handoff note")
				return
			}
		}
		if reassigned, err := store.Reassign(r.Context(), managed.ID, managed.OrganizationID, targetID); err != nil {
			Error(w, http.StatusInternalServerError, "Failed to reassign chat")
			return
		} else if !reassigned {
			Error(w, http.StatusBadRequest, "Failed to reassign chat")
			return
		}
		if deps.Realtime != nil {
			deps.Realtime.EmitWidgetSessionEvent(managed.ID, map[string]any{
				"type": "reassigned", "session_id": managed.ID.String(),
				"message": "Your conversation has been reassigned to another agent.",
			})
			deps.Realtime.EmitAgentUserEvent(targetID, map[string]any{
				"type": "reassigned", "session_id": managed.ID.String(), "assigned_to": targetID.String(),
			})
			if previousUserID != targetID {
				deps.Realtime.EmitAgentUserEvent(previousUserID, map[string]any{
					"type": "reassigned_from_you", "session_id": managed.ID.String(),
				})
			}
		}
		if previousUserID != targetID {
			emitChatEvent(r.Context(), deps, []uuid.UUID{targetID}, "chat_assigned", "Chat assigned to you", "A conversation has been assigned to you.", map[string]any{
				"session_id": managed.ID.String(),
			})
		}
		if deps.Realtime != nil {
			explicit := []uuid.UUID{previousUserID, targetID, current.ID}
			deps.Realtime.BroadcastConversationUpdated(r.Context(), managed.OrganizationID, managed.ID, explicit)
		}
		writeUpdatedChatDetail(w, r, deps, managed.ID, managed.OrganizationID)
	}
}

func userCanManageChats(found *user.User) bool {
	if found == nil || found.Role == nil {
		return false
	}
	for _, permission := range found.Role.Permissions {
		if permission.Name == "super_admin" || permission.Name == "manage_all_chats" || permission.Name == "manage_assigned_chats" {
			return true
		}
	}
	return false
}

func cleanActionText(value string, maximum int) string {
	value = strings.TrimSpace(value)
	value = strings.Map(func(r rune) rune {
		if r < 32 && r != '\n' && r != '\r' && r != '\t' {
			return -1
		}
		return r
	}, value)
	runes := []rune(value)
	if len(runes) > maximum {
		return string(runes[:maximum])
	}
	return string(runes)
}

func normalizeEndChatReason(value string) string {
	switch strings.TrimSpace(value) {
	case "ISSUE_RESOLVED", "CUSTOMER_REQUEST", "CONFIRMATION_RECEIVED", "FAREWELL", "THANK_YOU", "NATURAL_CONCLUSION", "TASK_COMPLETED":
		return strings.TrimSpace(value)
	default:
		return "ISSUE_RESOLVED"
	}
}

func isWidgetChannel(channel string) bool {
	return channel == "" || channel == "web" || channel == "shopify"
}
