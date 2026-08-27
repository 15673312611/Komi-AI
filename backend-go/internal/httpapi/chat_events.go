package httpapi

import (
	"context"
	"strings"

	"github.com/google/uuid"

	"github.com/chattermate/chattermate/backend-go/internal/chat"
	"github.com/chattermate/chattermate/backend-go/internal/notification"
	"github.com/chattermate/chattermate/backend-go/internal/session"
	"github.com/chattermate/chattermate/backend-go/internal/user"
)

const (
	handoverNotice       = "You're now connected with a member of our team."
	queuedForHumanNotice = "I'm passing this to a member of our team. Someone will reply here shortly."
)

// emitChatEvent persists the notification and then pushes the same canonical
// object to an already-open dashboard socket. Both operations are side effects
// of chat work, so failures are intentionally isolated from the HTTP action.
func emitChatEvent(ctx context.Context, deps Dependencies, recipients []uuid.UUID, event, title, message string, metadata map[string]any) {
	items, err := notification.CreateChatEvent(ctx, deps.Notifications, recipients, event, title, message, metadata)
	if err != nil {
		deps.Logger.Warn().Err(err).Str("event", event).Msg("chat notification failed")
		return
	}
	if deps.Realtime == nil {
		return
	}
	for _, item := range items {
		deps.Realtime.EmitNotification(item)
	}
}

func chatNotificationRecipients(ctx context.Context, deps Dependencies, managed *session.ManagedSession, event string) []uuid.UUID {
	if deps.Users == nil || managed == nil {
		return nil
	}
	store, ok := deps.Users.(user.TeammateStore)
	if !ok || store == nil {
		return nil
	}
	teammates, err := store.ListChatTeammates(ctx, managed.OrganizationID)
	if err != nil {
		deps.Logger.Warn().Err(err).Msg("failed to resolve chat notification recipients")
		return nil
	}
	result := make([]uuid.UUID, 0, len(teammates))
	for _, teammate := range teammates {
		if teammate.ID == uuid.Nil || !teammateCanReceiveChatEvent(teammate, managed, event) {
			continue
		}
		result = append(result, teammate.ID)
	}
	return result
}

func teammateCanReceiveChatEvent(teammate user.Teammate, managed *session.ManagedSession, event string) bool {
	permissions := teammate.Permissions
	if hasTeammatePermission(permissions, "super_admin") ||
		hasTeammatePermission(permissions, "view_all_chats") ||
		hasTeammatePermission(permissions, "manage_all_chats") {
		return true
	}

	if event == "chat_assigned" {
		return false
	}
	if managed.UserID == nil {
		if hasTeammatePermission(permissions, "view_unassigned_chats") {
			return true
		}
		return managed.GroupID != nil &&
			hasTeammatePermission(permissions, "view_assigned_chats") &&
			teammateInGroup(teammate, *managed.GroupID)
	}
	if hasTeammatePermission(permissions, "view_assigned_chats") && managed.GroupID != nil && teammateInGroup(teammate, *managed.GroupID) {
		return true
	}
	return hasTeammatePermission(permissions, "view_assigned_chats") && managed.UserID != nil && *managed.UserID == teammate.ID
}

func sendExternalSessionMessage(ctx context.Context, deps Dependencies, managed *session.ManagedSession, text, messageType string, userID *uuid.UUID, attributes map[string]any) {
	if managed == nil || strings.TrimSpace(text) == "" || isWidgetChannel(managed.Channel) {
		return
	}
	if deps.Chats == nil {
		return
	}
	store, ok := deps.Chats.(chat.ActionStore)
	if !ok || store == nil {
		return
	}
	if attributes == nil {
		attributes = map[string]any{}
	}
	created, err := store.CreateMessage(ctx, chat.MessageInput{
		Message:        text,
		MessageType:    messageType,
		SessionID:      managed.ID,
		OrganizationID: managed.OrganizationID,
		CustomerID:     managed.CustomerID,
		AgentID:        managed.AgentID,
		UserID:         userID,
		Attributes:     attributes,
	})
	if err != nil {
		deps.Logger.Warn().Err(err).Str("session_id", managed.ID.String()).Msg("failed to persist external channel notice")
		return
	}
	deliverExternalSessionMessage(ctx, deps, managed, text, created)
}

func deliverExternalSessionMessage(ctx context.Context, deps Dependencies, managed *session.ManagedSession, text string, created *chat.Message) {
	if managed == nil || strings.TrimSpace(text) == "" || isWidgetChannel(managed.Channel) || deps.Sender == nil {
		return
	}
	if deps.Sender == nil {
		return
	}
	result := deps.Sender.DeliverSession(ctx, managed.ID, managed.OrganizationID, text)
	if result.OK {
		return
	}
	if deliveryStore, ok := deps.Chats.(chat.DeliveryStore); ok && deliveryStore != nil && created != nil {
		_ = deliveryStore.MarkDeliveryFailed(ctx, created.ID, result.Error)
	}
	deps.Logger.Warn().Str("session_id", managed.ID.String()).Str("reason", result.Error).Msg("external channel notice was not delivered")
}
