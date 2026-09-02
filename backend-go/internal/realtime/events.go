package realtime

import (
	"context"

	"github.com/google/uuid"
	"github.com/zishang520/socket.io/v2/socket"

	"github.com/komi/komi/backend-go/internal/notification"
	"github.com/komi/komi/backend-go/internal/session"
	"github.com/komi/komi/backend-go/internal/user"
)

// EmitNotification mirrors the user-scoped notification delivery used by the
// dashboard. Persistence remains the source of truth; this only accelerates an
// already-connected client.
func (s *Server) EmitNotification(item notification.Notification) {
	if s == nil || s.agentNS == nil || item.UserID == uuid.Nil {
		return
	}
	_ = s.agentNS.To(socket.Room("user_"+item.UserID.String())).Emit("notification", item)
}

func (s *Server) EmitAgentSessionEvent(sessionID uuid.UUID, payload map[string]any) {
	if s == nil || s.agentNS == nil {
		return
	}
	_ = s.agentNS.To(socket.Room(sessionID.String())).Emit("room_event", payload)
}

// EmitAgentChatReply publishes the canonical message event to both the
// conversation room and the actor's personal room. REST actions use the same
// fan-out as the Socket.IO composer so dashboard tabs converge immediately.
func (s *Server) EmitAgentChatReply(sessionID uuid.UUID, userID *uuid.UUID, payload map[string]any) {
	if s == nil || s.agentNS == nil {
		return
	}
	_ = s.agentNS.To(socket.Room(sessionID.String())).Emit("chat_reply", payload)
	if orgID, ok := payload["organization_id"].(string); ok && orgID != "" {
		_ = s.agentNS.To(socket.Room("org_chats_" + orgID)).Emit("chat_reply", payload)
	}
	if userID != nil && *userID != uuid.Nil {
		_ = s.agentNS.To(socket.Room("user_"+userID.String())).Emit("chat_reply", payload)
	}
}

// EmitWidgetChatResponse keeps the legacy widget event name used by the web
// client while REST session actions perform the underlying state transition.
func (s *Server) EmitWidgetChatResponse(sessionID uuid.UUID, payload map[string]any) {
	if s == nil || s.widgetNS == nil {
		return
	}
	_ = s.widgetNS.To(socket.Room(sessionID.String())).Emit("chat_response", payload)
}

func (s *Server) EmitWidgetSessionEvent(sessionID uuid.UUID, payload map[string]any) {
	if s == nil || s.widgetNS == nil {
		return
	}
	_ = s.widgetNS.To(socket.Room(sessionID.String())).Emit("room_event", payload)
}

func (s *Server) EmitAgentUserEvent(userID uuid.UUID, payload map[string]any) {
	if s == nil || s.agentNS == nil || userID == uuid.Nil {
		return
	}
	_ = s.agentNS.To(socket.Room("user_"+userID.String())).Emit("room_event", payload)
}

// BroadcastConversationUpdated is the Go counterpart of the Python inbox
// snapshot fan-out. State changes can make a thread enter or leave a user's
// visibility scope, so the former assignee receives conversation_removed while
// users who can still see it receive the full fresh detail.
func (s *Server) BroadcastConversationUpdated(ctx context.Context, organizationID, sessionID uuid.UUID, explicit []uuid.UUID) {
	if s == nil || s.agentNS == nil || s.deps.Chats == nil {
		return
	}
	detail, err := s.deps.Chats.GetDetail(ctx, sessionID, organizationID)
	if err != nil || detail == nil {
		return
	}
	managed, err := s.managedByID(ctx, sessionID, organizationID)
	if err != nil || managed == nil {
		return
	}

	visible := make(map[uuid.UUID]struct{})
	if teammates, ok := s.deps.Users.(user.TeammateStore); ok && teammates != nil {
		if values, listErr := teammates.ListChatTeammates(ctx, organizationID); listErr == nil {
			for _, teammate := range values {
				if teammateCanSeeManaged(teammate, managed) {
					visible[teammate.ID] = struct{}{}
				}
			}
		}
	}
	if managed.UserID != nil {
		visible[*managed.UserID] = struct{}{}
	}

	recipients := make(map[uuid.UUID]struct{}, len(visible)+len(explicit))
	for userID := range visible {
		recipients[userID] = struct{}{}
	}
	for _, userID := range explicit {
		if userID != uuid.Nil {
			recipients[userID] = struct{}{}
		}
	}
	_ = s.agentNS.To(socket.Room("org_chats_"+organizationID.String())).Emit("room_event", map[string]any{
		"type": "conversation_updated", "session_id": sessionID.String(), "chat": detail,
	})
	for userID := range recipients {
		if _, ok := visible[userID]; ok {
			_ = s.agentNS.To(socket.Room("user_"+userID.String())).Emit("room_event", map[string]any{
				"type": "conversation_updated", "session_id": sessionID.String(), "chat": detail,
			})
			continue
		}
		_ = s.agentNS.To(socket.Room("user_"+userID.String())).Emit("room_event", map[string]any{
			"type": "conversation_removed", "session_id": sessionID.String(),
		})
	}
}

func teammateCanSeeManaged(teammate user.Teammate, managed *session.ManagedSession) bool {
	permissions := teammate.Permissions
	if hasTeammatePermissionRealtime(permissions, "super_admin") ||
		hasTeammatePermissionRealtime(permissions, "view_all_chats") ||
		hasTeammatePermissionRealtime(permissions, "manage_all_chats") {
		return true
	}
	if managed.UserID != nil {
		if *managed.UserID == teammate.ID && (hasTeammatePermissionRealtime(permissions, "view_assigned_chats") || hasTeammatePermissionRealtime(permissions, "manage_assigned_chats")) {
			return true
		}
		return managed.GroupID != nil && hasTeammatePermissionRealtime(permissions, "view_assigned_chats") && teammateInGroupRealtime(teammate, *managed.GroupID)
	}
	if hasTeammatePermissionRealtime(permissions, "view_unassigned_chats") {
		return true
	}
	return managed.GroupID != nil && hasTeammatePermissionRealtime(permissions, "view_assigned_chats") && teammateInGroupRealtime(teammate, *managed.GroupID)
}

func hasTeammatePermissionRealtime(permissions map[string]struct{}, name string) bool {
	_, ok := permissions[name]
	return ok
}

func teammateInGroupRealtime(teammate user.Teammate, groupID uuid.UUID) bool {
	for _, candidate := range teammate.GroupIDs {
		if candidate == groupID {
			return true
		}
	}
	return false
}
