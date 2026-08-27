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

	"github.com/chattermate/chattermate/backend-go/internal/auth"
	"github.com/chattermate/chattermate/backend-go/internal/user"
	"github.com/chattermate/chattermate/backend-go/internal/widgetapp"
)

type fakeWidgetAppManagementStore struct {
	apps          map[uuid.UUID]*widgetapp.App
	createKey     string
	regenerateKey string
	createInput   widgetapp.CreateInput
	lastListOrg   uuid.UUID
	lastInclude   bool
	deactivated   []uuid.UUID
	deleted       []uuid.UUID
	regenerated   []uuid.UUID
}

func (f *fakeWidgetAppManagementStore) ValidateAPIKey(context.Context, string) (*widgetapp.App, error) {
	return nil, nil
}

func (f *fakeWidgetAppManagementStore) Create(_ context.Context, input widgetapp.CreateInput) (*widgetapp.App, string, error) {
	if f.apps == nil {
		f.apps = make(map[uuid.UUID]*widgetapp.App)
	}
	f.createInput = input
	app := &widgetapp.App{
		ID:             uuid.New(),
		Name:           input.Name,
		Description:    input.Description,
		OrganizationID: input.OrganizationID,
		CreatedBy:      input.CreatedBy,
		IsActive:       true,
	}
	f.apps[app.ID] = app
	return app, f.createKey, nil
}

func (f *fakeWidgetAppManagementStore) List(_ context.Context, organizationID uuid.UUID, includeInactive bool) ([]*widgetapp.App, error) {
	f.lastListOrg = organizationID
	f.lastInclude = includeInactive
	result := make([]*widgetapp.App, 0)
	for _, app := range f.apps {
		if app.OrganizationID != organizationID || (!includeInactive && !app.IsActive) {
			continue
		}
		result = append(result, app)
	}
	return result, nil
}

func (f *fakeWidgetAppManagementStore) Get(_ context.Context, id, organizationID uuid.UUID) (*widgetapp.App, error) {
	app := f.apps[id]
	if app == nil || app.OrganizationID != organizationID {
		return nil, nil
	}
	return app, nil
}

func (f *fakeWidgetAppManagementStore) Update(_ context.Context, id, organizationID uuid.UUID, input widgetapp.UpdateInput) (*widgetapp.App, error) {
	app, _ := f.Get(context.Background(), id, organizationID)
	if app == nil {
		return nil, nil
	}
	if input.Name != nil {
		app.Name = *input.Name
	}
	if input.Description != nil {
		app.Description = input.Description
	}
	if input.IsActive != nil {
		app.IsActive = *input.IsActive
	}
	return app, nil
}

func (f *fakeWidgetAppManagementStore) Deactivate(_ context.Context, id, organizationID uuid.UUID) (bool, error) {
	app, _ := f.Get(context.Background(), id, organizationID)
	if app == nil {
		return false, nil
	}
	app.IsActive = false
	f.deactivated = append(f.deactivated, id)
	return true, nil
}

func (f *fakeWidgetAppManagementStore) Delete(_ context.Context, id, organizationID uuid.UUID) (bool, error) {
	app, _ := f.Get(context.Background(), id, organizationID)
	if app == nil {
		return false, nil
	}
	delete(f.apps, id)
	f.deleted = append(f.deleted, id)
	return true, nil
}

func (f *fakeWidgetAppManagementStore) Regenerate(_ context.Context, id, organizationID uuid.UUID) (*widgetapp.App, string, error) {
	app, _ := f.Get(context.Background(), id, organizationID)
	if app == nil {
		return nil, "", nil
	}
	key := f.regenerateKey
	if key == "" {
		key = "wak_regenerated"
	}
	f.regenerated = append(f.regenerated, id)
	return app, key, nil
}

func managedUser(t *testing.T, organizationID uuid.UUID, permissions ...string) *user.User {
	t.Helper()
	permissionValues := make([]user.Permission, 0, len(permissions))
	for _, permission := range permissions {
		permissionValues = append(permissionValues, user.Permission{Name: permission})
	}
	return &user.User{
		ID:             uuid.New(),
		Email:          "manager@example.com",
		FullName:       "Manager",
		IsActive:       true,
		OrganizationID: &organizationID,
		Role:           &user.Role{Permissions: permissionValues},
	}
}

func widgetAppRequestWithToken(t *testing.T, method, path string, body string, cfgUser *user.User) *http.Request {
	t.Helper()
	cfg := testConfig()
	token, err := auth.NewService(cfg).CreateAccessToken(cfgUser.ID.String(), cfgUser.OrganizationID.String())
	if err != nil {
		t.Fatal(err)
	}
	request := httptest.NewRequest(method, path, strings.NewReader(body))
	request.Header.Set("Authorization", "Bearer "+token)
	if body != "" {
		request.Header.Set("Content-Type", "application/json")
	}
	return request
}

func widgetAppRouter(t *testing.T, current *user.User, store *fakeWidgetAppManagementStore) http.Handler {
	t.Helper()
	return NewRouter(Dependencies{
		Config:     testConfig(),
		Logger:     zerolog.Nop(),
		Auth:       auth.NewService(testConfig()),
		Users:      &fakeUserStore{byID: current},
		WidgetApps: store,
	})
}

func TestWidgetAppManagementRequiresAuthenticationAndPermission(t *testing.T) {
	orgID := uuid.New()
	store := &fakeWidgetAppManagementStore{apps: map[uuid.UUID]*widgetapp.App{}}
	manager := managedUser(t, orgID, "manage_organization")
	handler := widgetAppRouter(t, manager, store)

	unauthenticated := httptest.NewRecorder()
	handler.ServeHTTP(unauthenticated, httptest.NewRequest(http.MethodGet, "/api/v1/widget-apps", nil))
	if unauthenticated.Code != http.StatusUnauthorized {
		t.Fatalf("unauthenticated status=%d body=%s", unauthenticated.Code, unauthenticated.Body.String())
	}

	withoutPermission := managedUser(t, orgID, "view_organization")
	forbidden := httptest.NewRecorder()
	widgetAppRouter(t, withoutPermission, store).ServeHTTP(forbidden, widgetAppRequestWithToken(t, http.MethodGet, "/api/v1/widget-apps", "", withoutPermission))
	if forbidden.Code != http.StatusForbidden {
		t.Fatalf("missing permission status=%d body=%s", forbidden.Code, forbidden.Body.String())
	}

	allowed := httptest.NewRecorder()
	handler.ServeHTTP(allowed, widgetAppRequestWithToken(t, http.MethodGet, "/api/v1/widget-apps", "", manager))
	if allowed.Code != http.StatusOK {
		t.Fatalf("authorized status=%d body=%s", allowed.Code, allowed.Body.String())
	}
}

func TestWidgetAppManagementCRUDAndOrganizationScope(t *testing.T) {
	orgID := uuid.New()
	otherOrgID := uuid.New()
	manager := managedUser(t, orgID, "manage_organization")
	otherManager := managedUser(t, otherOrgID, "manage_organization")
	active := &widgetapp.App{ID: uuid.New(), Name: "Active", OrganizationID: orgID, CreatedBy: manager.ID, IsActive: true}
	inactive := &widgetapp.App{ID: uuid.New(), Name: "Inactive", OrganizationID: orgID, CreatedBy: manager.ID, IsActive: false}
	foreign := &widgetapp.App{ID: uuid.New(), Name: "Foreign", OrganizationID: otherOrgID, CreatedBy: otherManager.ID, IsActive: true}
	store := &fakeWidgetAppManagementStore{apps: map[uuid.UUID]*widgetapp.App{
		active.ID: active, inactive.ID: inactive, foreign.ID: foreign,
	}, createKey: "wak_created", regenerateKey: "wak_rotated"}
	handler := widgetAppRouter(t, manager, store)

	create := httptest.NewRecorder()
	handler.ServeHTTP(create, widgetAppRequestWithToken(t, http.MethodPost, "/api/v1/widget-apps", `{"name":"  Production  ","description":"main widget"}`, manager))
	if create.Code != http.StatusCreated {
		t.Fatalf("create status=%d body=%s", create.Code, create.Body.String())
	}
	var created widgetAppView
	if err := json.Unmarshal(create.Body.Bytes(), &created); err != nil {
		t.Fatal(err)
	}
	if created.Name != "Production" || created.APIKey == nil || *created.APIKey != "wak_created" || store.createInput.OrganizationID != orgID || store.createInput.CreatedBy != manager.ID {
		t.Fatalf("created=%#v input=%#v", created, store.createInput)
	}

	list := httptest.NewRecorder()
	handler.ServeHTTP(list, widgetAppRequestWithToken(t, http.MethodGet, "/api/v1/widget-apps", "", manager))
	var listed struct {
		Total int             `json:"total"`
		Apps  []widgetAppView `json:"apps"`
	}
	if list.Code != http.StatusOK || json.Unmarshal(list.Body.Bytes(), &listed) != nil {
		t.Fatalf("list status=%d body=%s", list.Code, list.Body.String())
	}
	if listed.Total != 2 || store.lastListOrg != orgID || store.lastInclude {
		t.Fatalf("default list total=%d org=%s include=%t body=%s", listed.Total, store.lastListOrg, store.lastInclude, list.Body.String())
	}

	all := httptest.NewRecorder()
	handler.ServeHTTP(all, widgetAppRequestWithToken(t, http.MethodGet, "/api/v1/widget-apps?include_inactive=true", "", manager))
	if all.Code != http.StatusOK || !strings.Contains(all.Body.String(), inactive.ID.String()) || !store.lastInclude {
		t.Fatalf("include inactive status=%d include=%t body=%s", all.Code, store.lastInclude, all.Body.String())
	}

	getForeign := httptest.NewRecorder()
	handler.ServeHTTP(getForeign, widgetAppRequestWithToken(t, http.MethodGet, "/api/v1/widget-apps/"+foreign.ID.String(), "", manager))
	if getForeign.Code != http.StatusNotFound {
		t.Fatalf("foreign get status=%d body=%s", getForeign.Code, getForeign.Body.String())
	}

	update := httptest.NewRecorder()
	handler.ServeHTTP(update, widgetAppRequestWithToken(t, http.MethodPatch, "/api/v1/widget-apps/"+active.ID.String(), `{"name":"  Renamed ","is_active":false}`, manager))
	if update.Code != http.StatusOK || active.Name != "Renamed" || active.IsActive {
		t.Fatalf("update status=%d app=%#v body=%s", update.Code, active, update.Body.String())
	}

	regenerate := httptest.NewRecorder()
	handler.ServeHTTP(regenerate, widgetAppRequestWithToken(t, http.MethodPost, "/api/v1/widget-apps/"+active.ID.String()+"/regenerate-key", "", manager))
	if regenerate.Code != http.StatusOK || len(store.regenerated) != 1 || !strings.Contains(regenerate.Body.String(), `"api_key":"wak_rotated"`) {
		t.Fatalf("regenerate status=%d calls=%v body=%s", regenerate.Code, store.regenerated, regenerate.Body.String())
	}

	softDelete := httptest.NewRecorder()
	handler.ServeHTTP(softDelete, widgetAppRequestWithToken(t, http.MethodDelete, "/api/v1/widget-apps/"+inactive.ID.String(), "", manager))
	if softDelete.Code != http.StatusNoContent || len(store.deactivated) != 1 || store.deactivated[0] != inactive.ID {
		t.Fatalf("soft delete status=%d calls=%v body=%s", softDelete.Code, store.deactivated, softDelete.Body.String())
	}

	hardDelete := httptest.NewRecorder()
	widgetAppRouter(t, otherManager, store).ServeHTTP(hardDelete, widgetAppRequestWithToken(t, http.MethodDelete, "/api/v1/widget-apps/"+foreign.ID.String()+"?hard_delete=true", "", otherManager))
	if hardDelete.Code != http.StatusNoContent || len(store.deleted) != 1 || store.deleted[0] != foreign.ID {
		t.Fatalf("hard delete status=%d calls=%v body=%s", hardDelete.Code, store.deleted, hardDelete.Body.String())
	}
}

func TestWidgetAppManagementRejectsInvalidInput(t *testing.T) {
	orgID := uuid.New()
	manager := managedUser(t, orgID, "manage_organization")
	store := &fakeWidgetAppManagementStore{apps: map[uuid.UUID]*widgetapp.App{}}
	handler := widgetAppRouter(t, manager, store)

	cases := []struct {
		name string
		path string
		body string
	}{
		{"empty name", "/api/v1/widget-apps", `{"name":"  "}`},
		{"invalid include inactive", "/api/v1/widget-apps?include_inactive=maybe", ""},
		{"invalid id", "/api/v1/widget-apps/not-a-uuid", ""},
		{"invalid hard delete", "/api/v1/widget-apps/not-a-uuid?hard_delete=maybe", ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			method := http.MethodGet
			if strings.Contains(tc.path, "hard_delete") {
				method = http.MethodDelete
			}
			if tc.name == "empty name" {
				method = http.MethodPost
			}
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, widgetAppRequestWithToken(t, method, tc.path, tc.body, manager))
			if response.Code != http.StatusUnprocessableEntity {
				t.Fatalf("status=%d body=%s", response.Code, response.Body.String())
			}
		})
	}
}
