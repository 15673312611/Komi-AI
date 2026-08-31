package realtime

import (
	"context"

	"github.com/google/uuid"
	"github.com/zishang520/socket.io/v2/socket"
)

// BroadcastChannelMessage delivers channel-originated messages to the same
// agent rooms used by widget and dashboard messages. The widget namespace emit
// is retained for clients that observe a shared session during migration.
func (s *Server) BroadcastChannelMessage(ctx context.Context, organizationID, sessionID uuid.UUID, payload map[string]any) error {
	if s == nil || s.agentNS == nil {
		return nil
	}
	if payload == nil {
		payload = map[string]any{}
	}
	payload["session_id"] = sessionID.String()
	_ = s.agentNS.To(socket.Room(sessionID.String())).Emit("chat_reply", payload)
	_ = s.agentNS.To(socket.Room("org_chats_"+organizationID.String())).Emit("chat_reply", payload)
	if managed, err := s.managedByID(ctx, sessionID, organizationID); err == nil && managed != nil && managed.UserID != nil {
		_ = s.agentNS.To(socket.Room("user_"+managed.UserID.String())).Emit("chat_reply", payload)
	}
	_ = s.widgetNS.To(socket.Room(sessionID.String())).Emit("chat_response", payload)
	s.BroadcastConversationUpdated(ctx, organizationID, sessionID, nil)
	return nil
}
