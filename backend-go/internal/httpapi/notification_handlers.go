package httpapi

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/komi/komi/backend-go/internal/notification"
)

func registerNotificationRoutes(r chi.Router, deps Dependencies) {
	guard := requireAuthenticated(deps)
	r.With(guard).Get("/notifications", listNotifications(deps))
	r.With(guard).Patch("/notifications/{notification_id}/read", markNotificationRead(deps))
	r.With(guard).Post("/notifications/read-all", markAllNotificationsRead(deps))
	r.With(guard).Delete("/notifications/{notification_id}", deleteNotification(deps))
	r.With(guard).Delete("/notifications", clearNotifications(deps))
	r.With(guard).Get("/notifications/unread-count", unreadNotificationCount(deps))
	r.With(guard).Get("/notifications/settings", getNotificationSettings(deps))
	r.With(guard).Put("/notifications/settings", updateNotificationSettings(deps))
	r.With(guard).Post("/notifications/test", sendTestNotification(deps))
}

func notificationUser(r *http.Request) (uuid.UUID, bool) {
	current, ok := currentUserFromContext(r)
	if !ok {
		return uuid.Nil, false
	}
	return current.ID, true
}

func notificationStoreOrError(w http.ResponseWriter, deps Dependencies) notification.Store {
	if deps.Notifications == nil {
		Error(w, http.StatusServiceUnavailable, "notification storage is not configured")
		return nil
	}
	return deps.Notifications
}

func listNotifications(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := notificationStoreOrError(w, deps)
		if store == nil {
			return
		}
		userID, ok := notificationUser(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		skip, err := parseQueryInt(r.URL.Query().Get("skip"), 0, 0, 0)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid integer")
			return
		}
		limit, err := parseQueryInt(r.URL.Query().Get("limit"), 50, 1, 0)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid integer")
			return
		}
		items, err := store.List(r.Context(), userID, skip, limit)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to fetch notifications")
			return
		}
		JSON(w, http.StatusOK, items)
	}
}

func markNotificationRead(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := notificationStoreOrError(w, deps)
		if store == nil {
			return
		}
		userID, ok := notificationUser(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		id, err := strconv.ParseInt(chi.URLParam(r, "notification_id"), 10, 64)
		if err != nil || id < 1 {
			Error(w, http.StatusUnprocessableEntity, "Invalid notification id")
			return
		}
		if err := store.MarkRead(r.Context(), userID, id); err != nil {
			if errors.Is(err, notification.ErrNotFound) {
				Error(w, http.StatusNotFound, "Notification not found")
				return
			}
			Error(w, http.StatusInternalServerError, "Failed to update notification")
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Notification marked as read"})
	}
}

func markAllNotificationsRead(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := notificationStoreOrError(w, deps)
		if store == nil {
			return
		}
		userID, ok := notificationUser(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		updated, err := store.MarkAllRead(r.Context(), userID)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to update notifications")
			return
		}
		JSON(w, http.StatusOK, map[string]any{"message": "Notifications marked as read", "updated": updated})
	}
}

func deleteNotification(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := notificationStoreOrError(w, deps)
		if store == nil {
			return
		}
		userID, ok := notificationUser(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		id, err := strconv.ParseInt(chi.URLParam(r, "notification_id"), 10, 64)
		if err != nil || id < 1 {
			Error(w, http.StatusUnprocessableEntity, "Invalid notification id")
			return
		}
		if err := store.Delete(r.Context(), userID, id); err != nil {
			if errors.Is(err, notification.ErrNotFound) {
				Error(w, http.StatusNotFound, "Notification not found")
				return
			}
			Error(w, http.StatusInternalServerError, "Failed to delete notification")
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Notification deleted"})
	}
}

func clearNotifications(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := notificationStoreOrError(w, deps)
		if store == nil {
			return
		}
		userID, ok := notificationUser(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		deleted, err := store.Clear(r.Context(), userID)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to clear notifications")
			return
		}
		JSON(w, http.StatusOK, map[string]any{"message": "Notifications cleared", "deleted": deleted})
	}
}

func unreadNotificationCount(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := notificationStoreOrError(w, deps)
		if store == nil {
			return
		}
		userID, ok := notificationUser(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		count, err := store.UnreadCount(r.Context(), userID)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to get unread count")
			return
		}
		JSON(w, http.StatusOK, map[string]int64{"count": count})
	}
}

func getNotificationSettings(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := notificationStoreOrError(w, deps)
		if store == nil {
			return
		}
		userID, ok := notificationUser(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		settings, err := store.GetSettings(r.Context(), userID)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to fetch notification settings")
			return
		}
		JSON(w, http.StatusOK, settings)
	}
}

func updateNotificationSettings(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := notificationStoreOrError(w, deps)
		if store == nil {
			return
		}
		userID, ok := notificationUser(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		var body notification.SettingsUpdate
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		settings, err := store.UpdateSettings(r.Context(), userID, body)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to update notification settings")
			return
		}
		JSON(w, http.StatusOK, settings)
	}
}

func sendTestNotification(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := notificationStoreOrError(w, deps)
		if store == nil {
			return
		}
		userID, ok := notificationUser(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		if err := store.CreateTest(r.Context(), userID); err != nil {
			Error(w, http.StatusInternalServerError, "Failed to send test notification")
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Test notification sent successfully"})
	}
}
