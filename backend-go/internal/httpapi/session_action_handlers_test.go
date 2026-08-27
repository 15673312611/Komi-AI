package httpapi

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/chattermate/chattermate/backend-go/internal/agent"
	"github.com/chattermate/chattermate/backend-go/internal/auth"
	"github.com/chattermate/chattermate/backend-go/internal/chat"
	"github.com/chattermate/chattermate/backend-go/internal/session"
	"github.com/chattermate/chattermate/backend-go/internal/user"
)

type fakeActionSessionStore struct {
	*fakeSessionManagementStore
	managed      *session.ManagedSession
	routeCalled  bool
	aiEnabled    *bool
	handBack     bool
	reassignedTo uuid.UUID
}

func (f *fakeActionSessionStore) GetManaged(context.Context, uuid.UUID, uuid.UUID) (*session.ManagedSession, error) {
	return f.managed, nil
}

func (f *fakeActionSessionStore) RouteToHuman(_ context.Context, _ uuid.UUID, _ uuid.UUID, _, _ string) (bool, error) {
	if f.managed == nil || f.managed.UserID != nil || strings.EqualFold(f.managed.Status, "transferred") {
		return false, nil
	}
	f.routeCalled = true
	f.managed.Status = "TRANSFERRED"
	return true, nil
}

func (f *fakeActionSessionStore) SetAIAutoReply(_ context.Context, _ uuid.UUID, _ uuid.UUID, enabled bool) (bool, error) {
	if f.managed == nil {
		return false, nil
	}
	f.aiEnabled = &enabled
	if f.managed.WorkflowState == nil {
		f.managed.WorkflowState = map[string]any{}
	}
	f.managed.WorkflowState["ai_auto_reply"] = enabled
	return true, nil
}

func (f *fakeActionSessionStore) HandBackToAI(_ context.Context, _ uuid.UUID, _ uuid.UUID) (bool, error) {
	if f.managed == nil || strings.EqualFold(f.managed.Status, "closed") {
		return false, nil
	}
	f.handBack = true
	f.managed.UserID = nil
	f.managed.GroupID = nil
	f.managed.Status = "OPEN"
	return true, nil
}

func (f *fakeActionSessionStore) Reassign(_ context.Context, _ uuid.UUID, _ uuid.UUID, userID uuid.UUID) (bool, error) {
	if f.managed == nil || strings.EqualFold(f.managed.Status, "closed") {
		return false, nil
	}
	f.reassignedTo = userID
	f.managed.UserID = &userID
	f.managed.Status = "OPEN"
	return true, nil
}

type fakeActionChatStore struct {
	*fakeChatStore
	created  []chat.MessageInput
	existing bool
}

func (f *fakeActionChatStore) CreateMessage(_ context.Context, input chat.MessageInput) (*chat.Message, error) {
	f.created = append(f.created, input)
	return &chat.Message{ID: int64(len(f.created)), Message: input.Message, MessageType: input.MessageType}, nil
}

func (f *fakeActionChatStore) FindMessageByClientID(context.Context, uuid.UUID, string) (bool, error) {
	return f.existing, nil
}

type fakeActionUserStore struct {
	*fakeUserStore
	users     map[uuid.UUID]*user.User
	teammates []user.Teammate
}

func (f *fakeActionUserStore) FindActiveByID(ctx context.Context, id uuid.UUID) (*user.User, error) {
	if found := f.users[id]; found != nil {
		return found, nil
	}
	return f.fakeUserStore.FindActiveByID(ctx, id)
}

func (f *fakeActionUserStore) ListChatTeammates(context.Context, uuid.UUID) ([]user.Teammate, error) {
	return f.teammates, nil
}

func actionRouter(t *testing.T, current *user.User, users *fakeActionUserStore, sessions *fakeActionSessionStore, chats *fakeActionChatStore, foundAgent *agent.Agent) http.Handler {
	t.Helper()
	return NewRouter(Dependencies{
		Config:   testConfig(),
		Logger:   zerolog.Nop(),
		Auth:     auth.NewService(testConfig()),
		Users:    users,
		Agents:   &fakeAgentStore{found: foundAgent},
		Chats:    chats,
		Sessions: sessions,
	})
}

func TestSessionActionRoutesPersistAndScopeStateChanges(t *testing.T) {
	orgID := uuid.New()
	manager := managedUser(t, orgID, "manage_all_chats")
	target := managedUser(t, orgID, "manage_assigned_chats", "view_assigned_chats")
	foreign := managedUser(t, uuid.New(), "manage_all_chats")
	sessionID := uuid.New()
	agentID := uuid.New()
	managed := &session.ManagedSession{
		ID:             sessionID,
		OrganizationID: orgID,
		CustomerID:     uuid.New(),
		AgentID:        &agentID,
		UserID:         &target.ID,
		Status:         "OPEN",
		Channel:        "web",
	}
	sessionStore := &fakeActionSessionStore{
		fakeSessionManagementStore: &fakeSessionManagementStore{found: &session.Session{ID: sessionID, CustomerID: managed.CustomerID, Status: "OPEN"}},
		managed:                    managed,
	}
	chatStore := &fakeActionChatStore{fakeChatStore: &fakeChatStore{
		access: true,
		detail: &chat.Detail{SessionID: sessionID, Status: "open", Messages: []chat.Message{}},
	}}
	users := &fakeActionUserStore{
		fakeUserStore: &fakeUserStore{byID: manager},
		users:         map[uuid.UUID]*user.User{manager.ID: manager, target.ID: target, foreign.ID: foreign},
		teammates: []user.Teammate{
			{ID: target.ID, Email: target.Email, FullName: &target.FullName, Permissions: map[string]struct{}{"view_assigned_chats": {}, "manage_assigned_chats": {}}},
			{ID: foreign.ID, Email: foreign.Email, Permissions: map[string]struct{}{"view_assigned_chats": {}}},
		},
	}
	foundAgent := &agent.Agent{ID: agentID, OrganizationID: orgID, AIRepliesEnabled: true}
	handler := actionRouter(t, manager, users, sessionStore, chatStore, foundAgent)

	mentionable := httptest.NewRecorder()
	handler.ServeHTTP(mentionable, widgetAppRequestWithToken(t, http.MethodGet, "/api/v1/sessions/"+sessionID.String()+"/mentionable-teammates", "", manager))
	if mentionable.Code != http.StatusOK || !strings.Contains(mentionable.Body.String(), target.ID.String()) || strings.Contains(mentionable.Body.String(), foreign.ID.String()) {
		t.Fatalf("mentionable status=%d body=%s", mentionable.Code, mentionable.Body.String())
	}

	managed.UserID = &manager.ID
	end := httptest.NewRecorder()
	endBody := `{"message":"Done","request_rating":true,"client_message_id":"close-1"}`
	handler.ServeHTTP(end, widgetAppRequestWithToken(t, http.MethodPost, "/api/v1/sessions/"+sessionID.String()+"/end", endBody, manager))
	if end.Code != http.StatusOK || len(chatStore.created) != 1 || chatStore.created[0].MessageType != "system" || !sessionStore.closeCalled {
		t.Fatalf("end status=%d created=%#v close=%t body=%s", end.Code, chatStore.created, sessionStore.closeCalled, end.Body.String())
	}

	chatStore.existing = true
	idempotent := httptest.NewRecorder()
	handler.ServeHTTP(idempotent, widgetAppRequestWithToken(t, http.MethodPost, "/api/v1/sessions/"+sessionID.String()+"/end", endBody, manager))
	if idempotent.Code != http.StatusOK || len(chatStore.created) != 1 {
		t.Fatalf("idempotent end status=%d created=%d body=%s", idempotent.Code, len(chatStore.created), idempotent.Body.String())
	}

	managed.Status = "OPEN"
	managed.UserID = nil
	route := httptest.NewRecorder()
	handler.ServeHTTP(route, widgetAppRequestWithToken(t, http.MethodPost, "/api/v1/sessions/"+sessionID.String()+"/route-to-human", "", manager))
	if route.Code != http.StatusOK || !sessionStore.routeCalled || managed.Status != "TRANSFERRED" {
		t.Fatalf("route status=%d called=%t managed=%#v body=%s", route.Code, sessionStore.routeCalled, managed, route.Body.String())
	}

	managed.Status = "OPEN"
	managed.UserID = &manager.ID
	toggle := httptest.NewRecorder()
	handler.ServeHTTP(toggle, widgetAppRequestWithToken(t, http.MethodPost, "/api/v1/sessions/"+sessionID.String()+"/ai-auto-reply", `{"enabled":false}`, manager))
	if toggle.Code != http.StatusOK || sessionStore.aiEnabled == nil || *sessionStore.aiEnabled {
		t.Fatalf("toggle status=%d enabled=%v body=%s", toggle.Code, sessionStore.aiEnabled, toggle.Body.String())
	}

	managed.UserID = &target.ID
	handBack := httptest.NewRecorder()
	handler.ServeHTTP(handBack, widgetAppRequestWithToken(t, http.MethodPost, "/api/v1/sessions/"+sessionID.String()+"/hand-back-to-ai", "", manager))
	if handBack.Code != http.StatusOK || !sessionStore.handBack || managed.UserID != nil {
		t.Fatalf("hand back status=%d called=%t managed=%#v body=%s", handBack.Code, sessionStore.handBack, managed, handBack.Body.String())
	}

	managed.Status = "OPEN"
	managed.UserID = &manager.ID
	reassign := httptest.NewRecorder()
	reassignBody := `{"to_user_id":"` + target.ID.String() + `","note":"Please continue"}`
	handler.ServeHTTP(reassign, widgetAppRequestWithToken(t, http.MethodPost, "/api/v1/sessions/"+sessionID.String()+"/reassign", reassignBody, manager))
	if reassign.Code != http.StatusOK || sessionStore.reassignedTo != target.ID || len(chatStore.created) != 2 || chatStore.created[1].MessageType != "private_note" {
		t.Fatalf("reassign status=%d target=%s created=%#v body=%s", reassign.Code, sessionStore.reassignedTo, chatStore.created, reassign.Body.String())
	}
}

func TestSessionActionRoutesRejectMissingPermissionAndForeignTarget(t *testing.T) {
	orgID := uuid.New()
	noManage := managedUser(t, orgID, "view_assigned_chats")
	foreign := managedUser(t, uuid.New(), "manage_all_chats")
	sessionID := uuid.New()
	managed := &session.ManagedSession{ID: sessionID, OrganizationID: orgID, CustomerID: uuid.New(), UserID: &noManage.ID, Status: "OPEN"}
	sessions := &fakeActionSessionStore{
		fakeSessionManagementStore: &fakeSessionManagementStore{found: &session.Session{ID: sessionID, CustomerID: managed.CustomerID, Status: "OPEN"}},
		managed:                    managed,
	}
	chats := &fakeActionChatStore{fakeChatStore: &fakeChatStore{access: true, detail: &chat.Detail{SessionID: sessionID}}}
	users := &fakeActionUserStore{fakeUserStore: &fakeUserStore{byID: noManage}, users: map[uuid.UUID]*user.User{noManage.ID: noManage, foreign.ID: foreign}}
	handler := actionRouter(t, noManage, users, sessions, chats, &agent.Agent{ID: uuid.New(), OrganizationID: orgID, AIRepliesEnabled: true})

	for _, route := range []struct {
		method string
		path   string
	}{
		{http.MethodGet, "/mentionable-teammates"},
		{http.MethodPost, "/route-to-human"},
		{http.MethodPost, "/ai-auto-reply"},
		{http.MethodPost, "/hand-back-to-ai"},
		{http.MethodPost, "/reassign"},
	} {
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, widgetAppRequestWithToken(t, route.method, "/api/v1/sessions/"+sessionID.String()+route.path, `{"enabled":false}`, noManage))
		if response.Code != http.StatusForbidden {
			t.Fatalf("path=%s status=%d body=%s", route.path, response.Code, response.Body.String())
		}
	}

	manager := managedUser(t, orgID, "manage_all_chats")
	users.users[manager.ID] = manager
	managerHandler := actionRouter(t, manager, users, sessions, chats, &agent.Agent{ID: uuid.New(), OrganizationID: orgID, AIRepliesEnabled: true})
	response := httptest.NewRecorder()
	body := `{"to_user_id":"` + foreign.ID.String() + `"}`
	managerHandler.ServeHTTP(response, widgetAppRequestWithToken(t, http.MethodPost, "/api/v1/sessions/"+sessionID.String()+"/reassign", body, manager))
	if response.Code != http.StatusNotFound {
		t.Fatalf("foreign target status=%d body=%s", response.Code, response.Body.String())
	}
}
