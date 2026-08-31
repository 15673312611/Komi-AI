package httpapi

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/chattermate/chattermate/backend-go/internal/auth"
	"github.com/chattermate/chattermate/backend-go/internal/chat"
	"github.com/chattermate/chattermate/backend-go/internal/user"
)

type fakeChatStore struct {
	listValues       []chat.Overview
	detail           *chat.Detail
	access           bool
	listFilter       chat.ListFilter
	checkAccessCalls int
	threadCounts     map[string]int64
	channelCounts    map[string]int64
	readErr          error
	readAt           time.Time
}

func (f *fakeChatStore) List(_ context.Context, filter chat.ListFilter) ([]chat.Overview, error) {
	f.listFilter = filter
	return f.listValues, nil
}

func (f *fakeChatStore) CheckAccess(context.Context, uuid.UUID, uuid.UUID, chat.Visibility) (bool, error) {
	f.checkAccessCalls++
	return f.access, nil
}

func (f *fakeChatStore) GetDetail(context.Context, uuid.UUID, uuid.UUID) (*chat.Detail, error) {
	return f.detail, nil
}

func (f *fakeChatStore) UnreadCounts(context.Context, uuid.UUID, chat.Visibility) (map[string]int64, error) {
	return f.threadCounts, nil
}

func (f *fakeChatStore) OpenCountsByChannel(context.Context, uuid.UUID, chat.Visibility) (map[string]int64, error) {
	return f.channelCounts, nil
}

func (f *fakeChatStore) MarkRead(context.Context, uuid.UUID, uuid.UUID, uuid.UUID, time.Time) error {
	f.readAt = time.Now()
	return f.readErr
}

func chatTestRouter(t *testing.T, current *user.User, store *fakeChatStore) http.Handler {
	t.Helper()
	cfg := testConfig()
	return NewRouter(Dependencies{
		Config: cfg,
		Logger: zerolog.Nop(),
		Auth:   auth.NewService(cfg),
		Users:  &fakeUserStore{byID: current},
		Chats:  store,
	})
}

func TestChatRoutesRequireInboxPermission(t *testing.T) {
	orgID := uuid.New()
	manager := managedUser(t, orgID, "view_all_chats")
	store := &fakeChatStore{}
	handler := chatTestRouter(t, manager, store)

	unauthenticated := httptest.NewRecorder()
	handler.ServeHTTP(unauthenticated, httptest.NewRequest(http.MethodGet, "/api/v1/chats/recent", nil))
	if unauthenticated.Code != http.StatusUnauthorized {
		t.Fatalf("unauthenticated status=%d body=%s", unauthenticated.Code, unauthenticated.Body.String())
	}

	withoutPermission := managedUser(t, orgID, "view_organization")
	forbidden := httptest.NewRecorder()
	chatTestRouter(t, withoutPermission, store).ServeHTTP(forbidden, widgetAppRequestWithToken(t, http.MethodGet, "/api/v1/chats/recent", "", withoutPermission))
	if forbidden.Code != http.StatusForbidden {
		t.Fatalf("missing permission status=%d body=%s", forbidden.Code, forbidden.Body.String())
	}

	allowed := httptest.NewRecorder()
	handler.ServeHTTP(allowed, widgetAppRequestWithToken(t, http.MethodGet, "/api/v1/chats/recent?limit=7&status=open", "", manager))
	if allowed.Code != http.StatusOK || store.listFilter.Limit != 7 || store.listFilter.Status != "open" || !store.listFilter.Visibility.CanViewAll {
		t.Fatalf("allowed status=%d filter=%#v body=%s", allowed.Code, store.listFilter, allowed.Body.String())
	}
}

func TestChatDetailEnforcesOrganizationVisibility(t *testing.T) {
	orgID := uuid.New()
	manager := managedUser(t, orgID, "view_all_chats")
	sessionID := uuid.New()
	store := &fakeChatStore{
		access: true,
		detail: &chat.Detail{
			SessionID: sessionID,
			Status:    "open",
			Channel:   "web",
			Messages:  []chat.Message{{ID: 1, Message: "hello", MessageType: "user", CreatedAt: time.Now().UTC()}},
			Tags:      []string{"priority"},
		},
	}
	handler := chatTestRouter(t, manager, store)

	response := httptest.NewRecorder()
	handler.ServeHTTP(response, widgetAppRequestWithToken(t, http.MethodGet, "/api/v1/chats/"+sessionID.String(), "", manager))
	if response.Code != http.StatusOK || !strings.Contains(response.Body.String(), `"session_id":"`+sessionID.String()+`"`) {
		t.Fatalf("detail status=%d body=%s", response.Code, response.Body.String())
	}

	store.access = false
	hidden := httptest.NewRecorder()
	handler.ServeHTTP(hidden, widgetAppRequestWithToken(t, http.MethodGet, "/api/v1/chats/"+sessionID.String(), "", manager))
	if hidden.Code != http.StatusNotFound {
		t.Fatalf("hidden detail status=%d body=%s", hidden.Code, hidden.Body.String())
	}
	if store.checkAccessCalls != 2 {
		t.Fatalf("check access calls=%d", store.checkAccessCalls)
	}
}

func TestChatUnreadShapesAndReadMigrationGuard(t *testing.T) {
	orgID := uuid.New()
	manager := managedUser(t, orgID, "view_all_chats")
	store := &fakeChatStore{
		threadCounts:  map[string]int64{"thread-1": 2},
		channelCounts: map[string]int64{"web": 3, "whatsapp": 1},
		access:        true,
		readErr:       chat.ErrReadStateUnavailable,
	}
	handler := chatTestRouter(t, manager, store)

	thread := httptest.NewRecorder()
	handler.ServeHTTP(thread, widgetAppRequestWithToken(t, http.MethodGet, "/api/v1/chats/inbox/thread-unread-counts", "", manager))
	if thread.Code != http.StatusOK || !strings.Contains(thread.Body.String(), `"thread-1":2`) {
		t.Fatalf("thread counts status=%d body=%s", thread.Code, thread.Body.String())
	}

	channels := httptest.NewRecorder()
	handler.ServeHTTP(channels, widgetAppRequestWithToken(t, http.MethodGet, "/api/v1/chats/inbox/unread-counts", "", manager))
	if channels.Code != http.StatusOK || !strings.Contains(channels.Body.String(), `"web":3`) || strings.Contains(channels.Body.String(), "thread-1") {
		t.Fatalf("channel counts status=%d body=%s", channels.Code, channels.Body.String())
	}

	store.access = false
	read := httptest.NewRecorder()
	handler.ServeHTTP(read, widgetAppRequestWithToken(t, http.MethodPut, "/api/v1/chats/"+uuid.NewString()+"/read", "", manager))
	if read.Code != http.StatusNotFound {
		t.Fatalf("inaccessible read status=%d body=%s", read.Code, read.Body.String())
	}

	store.access = true
	sessionID := uuid.New()
	store.detail = &chat.Detail{SessionID: sessionID, Status: "open"}
	read = httptest.NewRecorder()
	handler.ServeHTTP(read, widgetAppRequestWithToken(t, http.MethodPut, "/api/v1/chats/"+sessionID.String()+"/read", "", manager))
	if read.Code != http.StatusOK || !strings.Contains(read.Body.String(), sessionID.String()) {
		t.Fatalf("mark read status=%d body=%s", read.Code, read.Body.String())
	}
}
