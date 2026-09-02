package httpapi

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/komi/komi/backend-go/internal/chat"
	"github.com/komi/komi/backend-go/internal/user"
)

func registerChatRoutes(r chi.Router, deps Dependencies) {
	guard := requireChatView(deps)
	registerChatCommerceRoutes(r, deps, guard)
	registerChatAIRoutes(r, deps, guard)
	r.With(guard).Get("/chats", listChats(deps))
	r.With(guard).Get("/chats/", listChats(deps))
	r.With(guard).Get("/chats/recent", listChats(deps))
	r.With(guard).Get("/chats/recent/shopify", listChats(deps))
	r.With(guard).Get("/chats/inbox/thread-unread-counts", unreadThreadCounts(deps))
	r.With(guard).Get("/chats/inbox/unread-counts", unreadCounts(deps))
	r.With(guard).Put("/chats/{session_id}/read", markChatRead(deps))
	r.With(guard).Get("/chats/{session_id}", getChatDetail(deps))
}

func requireChatView(deps Dependencies) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			current, err := currentUser(r, deps)
			if err != nil {
				w.Header().Set("WWW-Authenticate", "Bearer")
				Error(w, http.StatusUnauthorized, err.Error())
				return
			}
			visibility, ok := chatVisibility(current)
			if !ok {
				Error(w, http.StatusForbidden, "Not enough permissions")
				return
			}
			ctx := contextWithChatVisibility(contextWithUser(r, current), visibility)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

type chatContextKey string

const chatVisibilityKey chatContextKey = "chat_visibility"

func contextWithChatVisibility(ctx context.Context, visibility chat.Visibility) context.Context {
	return context.WithValue(ctx, chatVisibilityKey, visibility)
}

func chatVisibilityFromContext(r *http.Request) (chat.Visibility, bool) {
	visibility, ok := r.Context().Value(chatVisibilityKey).(chat.Visibility)
	return visibility, ok
}

func chatVisibility(current *user.User) (chat.Visibility, bool) {
	if current == nil || current.Role == nil {
		return chat.Visibility{}, false
	}
	has := make(map[string]struct{}, len(current.Role.Permissions))
	for _, permission := range current.Role.Permissions {
		has[permission.Name] = struct{}{}
	}
	if _, ok := has["super_admin"]; ok {
		return chat.Visibility{
			UserID:            current.ID,
			CanViewAll:        true,
			CanManageAll:      true,
			CanViewAssigned:   true,
			CanManageAssigned: true,
			CanViewUnassigned: true,
		}, true
	}
	visibility := chat.Visibility{
		UserID:            current.ID,
		CanViewAll:        hasPermission(has, "view_all_chats"),
		CanManageAll:      hasPermission(has, "manage_all_chats"),
		CanViewAssigned:   hasPermission(has, "view_assigned_chats"),
		CanManageAssigned: hasPermission(has, "manage_assigned_chats"),
		CanViewUnassigned: hasPermission(has, "view_unassigned_chats"),
	}
	return visibility, visibility.CanViewAll || visibility.CanManageAll || visibility.CanViewAssigned || visibility.CanManageAssigned || visibility.CanViewUnassigned
}

func hasPermission(values map[string]struct{}, name string) bool {
	_, ok := values[name]
	return ok
}

func listChats(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Chats == nil {
			Error(w, http.StatusInternalServerError, "Chat service is not configured")
			return
		}
		current, ok := currentUserFromContext(r)
		visibility, visibilityOK := chatVisibilityFromContext(r)
		if !ok || current.OrganizationID == nil || !visibilityOK {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		filter, err := parseChatListFilter(r, *current.OrganizationID, visibility)
		if err != nil {
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		values, err := deps.Chats.List(r.Context(), filter)
		if err != nil {
			deps.Logger.Error().Err(err).Msg("list chats failed")
			Error(w, http.StatusInternalServerError, "Failed to fetch recent chats")
			return
		}
		JSON(w, http.StatusOK, values)
	}
}

func getChatDetail(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Chats == nil {
			Error(w, http.StatusInternalServerError, "Chat service is not configured")
			return
		}
		current, ok := currentUserFromContext(r)
		visibility, visibilityOK := chatVisibilityFromContext(r)
		if !ok || current.OrganizationID == nil || !visibilityOK {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		sessionID, err := parsePathUUID(r, "session_id")
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid UUID format")
			return
		}
		allowed, err := deps.Chats.CheckAccess(r.Context(), sessionID, *current.OrganizationID, visibility)
		if err != nil {
			deps.Logger.Error().Err(err).Msg("check access failed")
			Error(w, http.StatusInternalServerError, "Failed to fetch chat details")
			return
		}
		if !allowed {
			Error(w, http.StatusNotFound, "Chat session not found")
			return
		}
		value, err := deps.Chats.GetDetail(r.Context(), sessionID, *current.OrganizationID)
		if err != nil {
			deps.Logger.Error().Err(err).Msg("get chat detail failed")
			Error(w, http.StatusInternalServerError, "Failed to fetch chat details")
			return
		}
		if value == nil {
			Error(w, http.StatusNotFound, "Chat session not found")
			return
		}
		JSON(w, http.StatusOK, value)
	}
}

func unreadThreadCounts(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Chats == nil {
			Error(w, http.StatusInternalServerError, "Chat service is not configured")
			return
		}
		current, ok := currentUserFromContext(r)
		visibility, visibilityOK := chatVisibilityFromContext(r)
		if !ok || current.OrganizationID == nil || !visibilityOK {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		store, supported := deps.Chats.(chat.ReadStateStore)
		var counts map[string]int64
		var err error
		if supported && store != nil {
			counts, err = store.UnreadThreadCounts(r.Context(), *current.OrganizationID, current.ID, visibility)
		} else {
			counts, err = deps.Chats.UnreadCounts(r.Context(), *current.OrganizationID, visibility)
		}
		if err != nil {
			JSON(w, http.StatusOK, map[string]any{"counts": map[string]int{}})
			return
		}
		if counts == nil {
			counts = map[string]int64{}
		}
		JSON(w, http.StatusOK, map[string]any{"counts": counts})
	}
}

func unreadCounts(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Chats == nil {
			Error(w, http.StatusInternalServerError, "Chat service is not configured")
			return
		}
		current, ok := currentUserFromContext(r)
		visibility, visibilityOK := chatVisibilityFromContext(r)
		if !ok || current.OrganizationID == nil || !visibilityOK {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		if strings.HasSuffix(r.URL.Path, "/inbox/unread-counts") {
			channelCounts, channelErr := deps.Chats.OpenCountsByChannel(r.Context(), *current.OrganizationID, visibility)
			if channelErr != nil {
				Error(w, http.StatusInternalServerError, "Failed to fetch unread counts")
				return
			}
			JSON(w, http.StatusOK, channelCounts)
			return
		}
		counts, err := deps.Chats.UnreadCounts(r.Context(), *current.OrganizationID, visibility)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to fetch unread counts")
			return
		}
		JSON(w, http.StatusOK, map[string]any{"counts": counts})
	}
}

func markChatRead(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Chats == nil {
			Error(w, http.StatusInternalServerError, "Chat service is not configured")
			return
		}
		current, ok := currentUserFromContext(r)
		visibility, visibilityOK := chatVisibilityFromContext(r)
		if !ok || current.OrganizationID == nil || !visibilityOK {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		sessionID, err := parsePathUUID(r, "session_id")
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid UUID format")
			return
		}
		allowed, err := deps.Chats.CheckAccess(r.Context(), sessionID, *current.OrganizationID, visibility)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to mark chat as read")
			return
		}
		if !allowed {
			Error(w, http.StatusNotFound, "Chat session not found")
			return
		}
		readAt := time.Now().UTC()
		_ = deps.Chats.MarkRead(r.Context(), current.ID, sessionID, *current.OrganizationID, readAt)
		JSON(w, http.StatusOK, map[string]any{"session_id": sessionID, "last_read_at": readAt})
	}
}

func parseChatListFilter(r *http.Request, organizationID uuid.UUID, visibility chat.Visibility) (chat.ListFilter, error) {
	query := r.URL.Query()
	offset, err := parseQueryInt(query.Get("skip"), 0, 0, 0)
	if err != nil {
		return chat.ListFilter{}, errors.New("Invalid skip value")
	}
	limit, err := parseQueryInt(query.Get("limit"), 20, 1, 100)
	if err != nil {
		return chat.ListFilter{}, errors.New("Invalid limit value")
	}
	filter := chat.ListFilter{
		OrganizationID: organizationID,
		Offset:         offset,
		Limit:          limit,
		Status:         query.Get("status"),
		UserName:       query.Get("user_name"),
		CustomerEmail:  query.Get("customer_email"),
		Visibility:     visibility,
	}
	if value := query.Get("agent_id"); value != "" {
		id, parseErr := uuid.Parse(value)
		if parseErr != nil {
			return chat.ListFilter{}, errors.New("Invalid UUID format")
		}
		filter.AgentID = &id
	}
	if value := query.Get("user_id"); value != "" {
		id, parseErr := uuid.Parse(value)
		if parseErr != nil {
			return chat.ListFilter{}, errors.New("Invalid UUID format")
		}
		filter.AssignedUserID = &id
	}
	if value := query.Get("date_from"); value != "" {
		parsed, parseErr := time.Parse(time.RFC3339, value)
		if parseErr != nil {
			return chat.ListFilter{}, errors.New("Invalid date_from value")
		}
		filter.DateFrom = &parsed
	}
	if value := query.Get("date_to"); value != "" {
		parsed, parseErr := time.Parse(time.RFC3339, value)
		if parseErr != nil {
			return chat.ListFilter{}, errors.New("Invalid date_to value")
		}
		filter.DateTo = &parsed
	}
	return filter, nil
}

func parseQueryInt(value string, fallback, minimum, maximum int) (int, error) {
	if value == "" {
		return fallback, nil
	}
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed < minimum || (maximum > 0 && parsed > maximum) {
		return 0, errors.New("invalid integer")
	}
	return parsed, nil
}
