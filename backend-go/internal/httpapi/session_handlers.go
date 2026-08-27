package httpapi

import (
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/chattermate/chattermate/backend-go/internal/chat"
	"github.com/chattermate/chattermate/backend-go/internal/session"
)

type conversationTagsRequest struct {
	Tags *[]string `json:"tags"`
}

func registerSessionRoutes(r chi.Router, deps Dependencies) {
	guard := requireChatManage(deps)
	r.With(guard).Get("/sessions/{session_id}/mentionable-teammates", listMentionableTeammates(deps))
	r.With(guard).Put("/sessions/{session_id}/tags", updateConversationTags(deps))
	r.With(guard).Post("/sessions/{session_id}/takeover", takeoverChat(deps))
	r.With(guard).Post("/sessions/{session_id}/end", endManagedChat(deps))
	r.With(guard).Post("/sessions/{session_id}/route-to-human", routeChatToHuman(deps))
	r.With(guard).Post("/sessions/{session_id}/ai-auto-reply", toggleAIAutoReply(deps))
	r.With(guard).Post("/sessions/{session_id}/hand-back-to-ai", handBackToAI(deps))
	r.With(guard).Post("/sessions/{session_id}/reassign", reassignChat(deps))
}

func requireChatManage(deps Dependencies) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			current, err := currentUser(r, deps)
			if err != nil {
				w.Header().Set("WWW-Authenticate", "Bearer")
				Error(w, http.StatusUnauthorized, err.Error())
				return
			}
			visibility, ok := chatVisibility(current)
			if !ok || (!visibility.CanManageAll && !visibility.CanManageAssigned) {
				Error(w, http.StatusForbidden, "Not enough permissions")
				return
			}
			ctx := contextWithChatVisibility(contextWithUser(r, current), visibility)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func updateConversationTags(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store, ok := deps.Sessions.(session.ManagementStore)
		if !ok || store == nil || deps.Chats == nil {
			Error(w, http.StatusInternalServerError, "Session service is not configured")
			return
		}
		current, currentOK := currentUserFromContext(r)
		visibility, visibilityOK := chatVisibilityFromContext(r)
		if !currentOK || current.OrganizationID == nil || !visibilityOK {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		sessionID, err := parseSessionPathID(r)
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid UUID format")
			return
		}
		if !sessionAccess(w, r, deps, sessionID, *current.OrganizationID, visibility) {
			return
		}
		var body conversationTagsRequest
		if err := decodeJSON(r, &body); err != nil || body.Tags == nil {
			Error(w, http.StatusUnprocessableEntity, "Tags must be a list")
			return
		}
		tags, err := normalizeConversationTags(*body.Tags)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		updated, err := store.UpdateTags(r.Context(), sessionID, *current.OrganizationID, tags)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to update conversation tags")
			return
		}
		if !updated {
			Error(w, http.StatusNotFound, "Chat session not found")
			return
		}
		writeUpdatedChatDetail(w, r, deps, sessionID, *current.OrganizationID)
	}
}

func takeoverChat(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store, ok := deps.Sessions.(session.ManagementStore)
		if !ok || store == nil || deps.Chats == nil {
			Error(w, http.StatusInternalServerError, "Session service is not configured")
			return
		}
		current, currentOK := currentUserFromContext(r)
		visibility, visibilityOK := chatVisibilityFromContext(r)
		if !currentOK || current.OrganizationID == nil || !visibilityOK {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		sessionID, err := parseSessionPathID(r)
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid UUID format")
			return
		}
		if !sessionAccess(w, r, deps, sessionID, *current.OrganizationID, visibility) {
			return
		}
		taken, err := store.Takeover(r.Context(), sessionID, *current.OrganizationID, current.ID)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to take over chat")
			return
		}
		if !taken {
			Error(w, http.StatusBadRequest, "Failed to take over chat")
			return
		}
		assigned := current.ID
		var managed *session.ManagedSession
		if actionStore, actionOK := deps.Sessions.(session.ActionStore); actionOK && actionStore != nil {
			managed, _ = actionStore.GetManaged(r.Context(), sessionID, *current.OrganizationID)
		}
		if managed == nil {
			// Keep lightweight management fakes useful while production repositories
			// provide the complete channel/session snapshot through ActionStore.
			if found, getErr := store.Get(r.Context(), sessionID); getErr == nil && found != nil {
				managed = &session.ManagedSession{
					ID:             found.ID,
					OrganizationID: *current.OrganizationID,
					CustomerID:     found.CustomerID,
					UserID:         &assigned,
					Status:         found.Status,
					Channel:        "web",
				}
			}
		}
		if managed != nil {
			sendExternalSessionMessage(r.Context(), deps, managed, handoverNotice, "agent", &assigned, map[string]any{
				"channel": managed.Channel, "handover_notice": true,
			})
			if deps.Realtime != nil {
				deps.Realtime.EmitWidgetSessionEvent(managed.ID, map[string]any{
					"type": "handle_taken_over", "session_id": managed.ID.String(),
					"user_name": current.FullName, "profile_picture": current.ProfilePic,
				})
				deps.Realtime.BroadcastConversationUpdated(r.Context(), managed.OrganizationID, managed.ID, []uuid.UUID{current.ID})
			}
		}
		writeUpdatedChatDetail(w, r, deps, sessionID, *current.OrganizationID)
	}
}

func sessionAccess(w http.ResponseWriter, r *http.Request, deps Dependencies, sessionID, organizationID uuid.UUID, visibility chat.Visibility) bool {
	allowed, err := deps.Chats.CheckAccess(r.Context(), sessionID, organizationID, visibility)
	if err != nil {
		Error(w, http.StatusInternalServerError, "Failed to access chat session")
		return false
	}
	if !allowed {
		Error(w, http.StatusNotFound, "Chat session not found")
		return false
	}
	return true
}

func writeUpdatedChatDetail(w http.ResponseWriter, r *http.Request, deps Dependencies, sessionID, organizationID uuid.UUID) {
	detail, err := deps.Chats.GetDetail(r.Context(), sessionID, organizationID)
	if err != nil {
		Error(w, http.StatusInternalServerError, "Failed to get chat details")
		return
	}
	if detail == nil {
		Error(w, http.StatusInternalServerError, "Failed to get chat details")
		return
	}
	JSON(w, http.StatusOK, detail)
}

func parseSessionPathID(r *http.Request) (uuid.UUID, error) {
	return uuid.Parse(chi.URLParam(r, "session_id"))
}

func normalizeConversationTags(values []string) ([]string, error) {
	if len(values) > 20 {
		return nil, errors.New("A conversation can have at most 20 tags")
	}
	result := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, raw := range values {
		value := strings.Join(strings.Fields(strings.TrimSpace(raw)), " ")
		if value == "" {
			continue
		}
		if len(value) > 64 {
			return nil, errors.New("Tags cannot exceed 64 characters")
		}
		key := strings.ToLower(value)
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, value)
	}
	return result, nil
}
