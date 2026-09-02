package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/komi/komi/backend-go/internal/auth"
	"github.com/komi/komi/backend-go/internal/chat"
	"github.com/komi/komi/backend-go/internal/session"
	"github.com/komi/komi/backend-go/internal/user"
)

type fakeSessionManagementStore struct {
	found       *session.Session
	tags        []string
	takeover    bool
	takeoverID  uuid.UUID
	closeCalled bool
}

func (f *fakeSessionManagementStore) Get(context.Context, uuid.UUID) (*session.Session, error) {
	return f.found, nil
}

func (f *fakeSessionManagementStore) GetCustomerHumanAgent(context.Context, uuid.UUID) (*session.HumanAgent, error) {
	return nil, nil
}

func (f *fakeSessionManagementStore) Close(context.Context, uuid.UUID, *string, *string) (bool, error) {
	f.closeCalled = true
	return true, nil
}

func (f *fakeSessionManagementStore) UpdateTags(_ context.Context, id, _ uuid.UUID, tags []string) (bool, error) {
	if f.found == nil || f.found.ID != id {
		return false, nil
	}
	f.tags = append([]string(nil), tags...)
	return true, nil
}

func (f *fakeSessionManagementStore) Takeover(_ context.Context, id, _ uuid.UUID, userID uuid.UUID) (bool, error) {
	if f.found == nil || f.found.ID != id || f.found.CustomerID == uuid.Nil || f.takeover || f.found.Status != "OPEN" {
		return false, nil
	}
	f.takeover = true
	f.takeoverID = userID
	return true, nil
}

func TestSessionManagementRoutesNormalizeTagsAndTakeOver(t *testing.T) {
	orgID := uuid.New()
	manager := managedUser(t, orgID, "manage_assigned_chats")
	sessionID := uuid.New()
	store := &fakeSessionManagementStore{found: &session.Session{ID: sessionID, CustomerID: uuid.New(), Status: "OPEN"}}
	chatStore := &fakeChatStore{
		access: true,
		detail: &chat.Detail{SessionID: sessionID, Status: "open", Messages: []chat.Message{}},
	}
	cfg := testConfig()
	handler := NewRouter(Dependencies{
		Config:   cfg,
		Logger:   zerolog.Nop(),
		Auth:     auth.NewService(cfg),
		Users:    &fakeUserStore{byID: manager},
		Chats:    chatStore,
		Sessions: store,
	})

	tags := httptest.NewRecorder()
	tagsRequest := widgetAppRequestWithToken(t, http.MethodPut, "/api/v1/sessions/"+sessionID.String()+"/tags", `{"tags":[" urgent ","Urgent","","priority"]}`, manager)
	handler.ServeHTTP(tags, tagsRequest)
	if tags.Code != http.StatusOK || strings.Join(store.tags, ",") != "urgent,priority" {
		t.Fatalf("tags status=%d stored=%v body=%s", tags.Code, store.tags, tags.Body.String())
	}

	takeover := httptest.NewRecorder()
	handler.ServeHTTP(takeover, widgetAppRequestWithToken(t, http.MethodPost, "/api/v1/sessions/"+sessionID.String()+"/takeover", "", manager))
	if takeover.Code != http.StatusOK || !store.takeover || store.takeoverID != manager.ID {
		t.Fatalf("takeover status=%d taken=%t id=%s body=%s", takeover.Code, store.takeover, store.takeoverID, takeover.Body.String())
	}

	takenAgain := httptest.NewRecorder()
	handler.ServeHTTP(takenAgain, widgetAppRequestWithToken(t, http.MethodPost, "/api/v1/sessions/"+sessionID.String()+"/takeover", "", manager))
	if takenAgain.Code != http.StatusBadRequest {
		t.Fatalf("second takeover status=%d body=%s", takenAgain.Code, takenAgain.Body.String())
	}
}

func TestSessionManagementRoutesRejectInvalidOrUnauthorizedChanges(t *testing.T) {
	orgID := uuid.New()
	manager := managedUser(t, orgID, "manage_assigned_chats")
	noManage := managedUser(t, orgID, "view_assigned_chats")
	sessionID := uuid.New()
	store := &fakeSessionManagementStore{found: &session.Session{ID: sessionID, CustomerID: uuid.New(), Status: "OPEN"}}
	chatStore := &fakeChatStore{access: true, detail: &chat.Detail{SessionID: sessionID}}
	cfg := testConfig()
	makeHandler := func(current *user.User) http.Handler {
		return NewRouter(Dependencies{
			Config:   cfg,
			Logger:   zerolog.Nop(),
			Auth:     auth.NewService(cfg),
			Users:    &fakeUserStore{byID: current},
			Chats:    chatStore,
			Sessions: store,
		})
	}

	invalid := httptest.NewRecorder()
	makeHandler(manager).ServeHTTP(invalid, widgetAppRequestWithToken(t, http.MethodPut, "/api/v1/sessions/not-a-uuid/tags", `{"tags":[]}`, manager))
	if invalid.Code != http.StatusBadRequest {
		t.Fatalf("invalid id status=%d body=%s", invalid.Code, invalid.Body.String())
	}

	tooMany := make([]string, 21)
	for i := range tooMany {
		tooMany[i] = "tag"
	}
	tooManyBody, _ := json.Marshal(map[string]any{"tags": tooMany})
	tooManyResponse := httptest.NewRecorder()
	makeHandler(manager).ServeHTTP(tooManyResponse, widgetAppRequestWithToken(t, http.MethodPut, "/api/v1/sessions/"+sessionID.String()+"/tags", string(tooManyBody), manager))
	if tooManyResponse.Code != http.StatusUnprocessableEntity {
		t.Fatalf("too many tags status=%d body=%s", tooManyResponse.Code, tooManyResponse.Body.String())
	}

	forbidden := httptest.NewRecorder()
	makeHandler(noManage).ServeHTTP(forbidden, widgetAppRequestWithToken(t, http.MethodPost, "/api/v1/sessions/"+sessionID.String()+"/takeover", "", noManage))
	if forbidden.Code != http.StatusForbidden {
		t.Fatalf("missing manage permission status=%d body=%s", forbidden.Code, forbidden.Body.String())
	}

	foreign := managedUser(t, uuid.New(), "manage_assigned_chats")
	chatStore.access = false
	foreignResponse := httptest.NewRecorder()
	makeHandler(foreign).ServeHTTP(foreignResponse, widgetAppRequestWithToken(t, http.MethodPut, "/api/v1/sessions/"+sessionID.String()+"/tags", `{"tags":["secret"]}`, foreign))
	if foreignResponse.Code != http.StatusNotFound {
		t.Fatalf("foreign organization status=%d body=%s", foreignResponse.Code, foreignResponse.Body.String())
	}
}
