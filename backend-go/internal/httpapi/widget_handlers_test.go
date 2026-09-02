package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/komi/komi/backend-go/internal/agent"
	"github.com/komi/komi/backend-go/internal/auth"
	"github.com/komi/komi/backend-go/internal/customer"
	"github.com/komi/komi/backend-go/internal/session"
	"github.com/komi/komi/backend-go/internal/widget"
	"github.com/komi/komi/backend-go/internal/widgetapp"
)

type fakeWidgetStore struct {
	found   *widget.Widget
	created bool
	deleted bool
}

func (f *fakeWidgetStore) Create(_ context.Context, organizationID uuid.UUID, name string, agentID *uuid.UUID) (*widget.Widget, error) {
	f.created = true
	if f.found == nil {
		f.found = &widget.Widget{ID: "widget-1", OrganizationID: organizationID, AgentID: agentID}
	}
	f.found.Name = name
	return f.found, nil
}

func (f *fakeWidgetStore) Get(_ context.Context, id string) (*widget.Widget, error) {
	if f.found != nil && f.found.ID == id {
		return f.found, nil
	}
	return nil, nil
}

func (f *fakeWidgetStore) List(_ context.Context, organizationID uuid.UUID) ([]*widget.Widget, error) {
	if f.found != nil && f.found.OrganizationID == organizationID {
		return []*widget.Widget{f.found}, nil
	}
	return []*widget.Widget{}, nil
}

func (f *fakeWidgetStore) ListByAgent(_ context.Context, organizationID, agentID uuid.UUID) ([]*widget.Widget, error) {
	if f.found != nil && f.found.OrganizationID == organizationID && f.found.AgentID != nil && *f.found.AgentID == agentID {
		return []*widget.Widget{f.found}, nil
	}
	return []*widget.Widget{}, nil
}

func (f *fakeWidgetStore) Delete(_ context.Context, id string, organizationID uuid.UUID) error {
	if f.found == nil || f.found.ID != id || f.found.OrganizationID != organizationID {
		return nil
	}
	f.deleted = true
	f.found = nil
	return nil
}

type fakeAgentStore struct {
	found *agent.Agent
}

func (f *fakeAgentStore) Create(context.Context, uuid.UUID, agent.CreateInput) (*agent.Agent, error) {
	return f.found, nil
}
func (f *fakeAgentStore) Get(context.Context, uuid.UUID, uuid.UUID) (*agent.Agent, error) {
	return f.found, nil
}
func (f *fakeAgentStore) List(context.Context, uuid.UUID) ([]*agent.Agent, error) {
	if f.found == nil {
		return []*agent.Agent{}, nil
	}
	return []*agent.Agent{f.found}, nil
}
func (f *fakeAgentStore) Roster(context.Context, uuid.UUID) ([]agent.RosterItem, error) {
	return []agent.RosterItem{}, nil
}
func (f *fakeAgentStore) Update(context.Context, uuid.UUID, uuid.UUID, agent.UpdateInput) (*agent.Agent, error) {
	return f.found, nil
}
func (f *fakeAgentStore) UpdateGroups(context.Context, uuid.UUID, uuid.UUID, []uuid.UUID) (*agent.Agent, error) {
	return f.found, nil
}
func (f *fakeAgentStore) UpsertCustomization(context.Context, uuid.UUID, uuid.UUID, agent.CustomizationInput) (*agent.Customization, error) {
	if f.found == nil {
		return nil, nil
	}
	return f.found.Customization, nil
}

type fakeCustomerStore struct {
	byEmail *customer.Customer
	created *customer.Customer
}

func (f *fakeCustomerStore) GetByEmail(context.Context, string, uuid.UUID) (*customer.Customer, error) {
	return f.byEmail, nil
}
func (f *fakeCustomerStore) Create(_ context.Context, email string, fullName *string, organizationID uuid.UUID, metadata map[string]any, authenticated bool) (*customer.Customer, error) {
	if f.created == nil {
		f.created = &customer.Customer{ID: uuid.New(), Email: email, OrganizationID: organizationID}
	}
	f.created.FullName = fullName
	f.created.MetaData = metadata
	f.created.IsAuthenticated = authenticated
	return f.created, nil
}
func (f *fakeCustomerStore) UpdateIdentity(_ context.Context, id uuid.UUID, fullName *string, authenticated bool) (*customer.Customer, error) {
	if f.byEmail != nil {
		f.byEmail.ID = id
		f.byEmail.FullName = fullName
		f.byEmail.IsAuthenticated = authenticated
		return f.byEmail, nil
	}
	return f.created, nil
}
func (f *fakeCustomerStore) UpdateMetaData(_ context.Context, _ uuid.UUID, values map[string]any) (*customer.Customer, error) {
	if f.byEmail != nil {
		f.byEmail.MetaData = values
		return f.byEmail, nil
	}
	if f.created != nil {
		f.created.MetaData = values
	}
	return f.created, nil
}

type fakeSessionStore struct {
	found  *session.Session
	closed bool
}

func (f *fakeSessionStore) Get(context.Context, uuid.UUID) (*session.Session, error) {
	return f.found, nil
}
func (f *fakeSessionStore) GetCustomerHumanAgent(context.Context, uuid.UUID) (*session.HumanAgent, error) {
	return nil, nil
}
func (f *fakeSessionStore) Close(context.Context, uuid.UUID, *string, *string) (bool, error) {
	f.closed = true
	return true, nil
}

type fakeWidgetAppStore struct {
	app *widgetapp.App
}

func (f *fakeWidgetAppStore) ValidateAPIKey(context.Context, string) (*widgetapp.App, error) {
	return f.app, nil
}

func widgetTestDependencies(t *testing.T) (Dependencies, *fakeWidgetStore, *fakeCustomerStore, *agent.Agent) {
	t.Helper()
	orgID := uuid.New()
	agentID := uuid.New()
	widgetStore := &fakeWidgetStore{found: &widget.Widget{ID: "widget-1", Name: "Support", OrganizationID: orgID, AgentID: &agentID}}
	name := "Support Bot"
	foundAgent := &agent.Agent{
		ID:               agentID,
		Name:             "support",
		DisplayName:      &name,
		OrganizationID:   orgID,
		AIRepliesEnabled: true,
		Customization: &agent.Customization{
			ChatStyle:        stringPtr("CHATBOT"),
			WidgetPosition:   stringPtr("FLOATING"),
			ShowAIDisclaimer: true,
		},
	}
	cfg := testConfig()
	cfg.BackendURL = "https://api.example.test"
	cfg.WidgetURL = "https://widget.example.test"
	cfg.ExploreWidgetID = "explore"
	deps := Dependencies{
		Config:    cfg,
		Logger:    zerolog.Nop(),
		Auth:      auth.NewService(cfg),
		Widgets:   widgetStore,
		Agents:    &fakeAgentStore{found: foundAgent},
		Customers: &fakeCustomerStore{},
		Sessions:  &fakeSessionStore{},
	}
	return deps, widgetStore, deps.Customers.(*fakeCustomerStore), foundAgent
}

func stringPtr(value string) *string { return &value }

func TestWidgetUIEmbedsRuntimeConfigAndConversationToken(t *testing.T) {
	deps, _, _, _ := widgetTestDependencies(t)
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/widgets/widget-1/data", nil)
	NewRouter(deps).ServeHTTP(response, request)
	if response.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", response.Code, response.Body.String())
	}
	body := response.Body.String()
	for _, expected := range []string{"window.APP_CONFIG", `"API_URL":"https://api.example.test/api/v1"`, `"WS_URL":"wss://api.example.test"`, "widget-1", "initialToken:"} {
		if !strings.Contains(body, expected) {
			t.Fatalf("HTML missing %q: %s", expected, body)
		}
	}
	match := regexp.MustCompile(`initialToken: "([^"]+)"`).FindStringSubmatch(body)
	if len(match) != 2 {
		t.Fatal("initial token was not embedded")
	}
	claims, err := deps.Auth.VerifyConversationToken(match[1])
	if err != nil || claims.WidgetID != "widget-1" {
		t.Fatalf("embedded token claims=%#v err=%v", claims, err)
	}
	if response.Header().Get("Cache-Control") != "no-store" {
		t.Fatalf("cache-control=%q", response.Header().Get("Cache-Control"))
	}
}

func TestWidgetDataCreatesAnonymousCustomerAndRotatesToken(t *testing.T) {
	deps, _, customers, _ := widgetTestDependencies(t)
	ui := httptest.NewRecorder()
	NewRouter(deps).ServeHTTP(ui, httptest.NewRequest(http.MethodGet, "/api/v1/widgets/widget-1/data", nil))
	match := regexp.MustCompile(`initialToken: "([^"]+)"`).FindStringSubmatch(ui.Body.String())
	request := httptest.NewRequest(http.MethodGet, "/api/v1/widgets/widget-1", nil)
	request.Header.Set("Authorization", "Bearer "+match[1])
	response := httptest.NewRecorder()
	NewRouter(deps).ServeHTTP(response, request)
	if response.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", response.Code, response.Body.String())
	}
	if customers.created == nil || customers.created.Email == "" {
		t.Fatal("anonymous customer was not created")
	}
	var body map[string]any
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body["customer_id"] != customers.created.ID.String() || body["token"] == nil {
		t.Fatalf("widget data=%v", body)
	}
}

func TestEndChatRequiresOwnedConversationToken(t *testing.T) {
	deps, _, _, _ := widgetTestDependencies(t)
	customerID := uuid.New()
	sessionID := uuid.New()
	deps.Sessions = &fakeSessionStore{found: &session.Session{ID: sessionID, CustomerID: customerID, Status: "OPEN"}}
	token, _, err := deps.Auth.CreateConversationToken("widget-1", customerID.String(), "", nil)
	if err != nil {
		t.Fatal(err)
	}
	request := httptest.NewRequest(http.MethodPost, "/api/v1/widgets/widget-1/end-chat?session_id="+sessionID.String(), nil)
	request.Header.Set("Authorization", "Bearer "+token)
	response := httptest.NewRecorder()
	NewRouter(deps).ServeHTTP(response, request)
	if response.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", response.Code, response.Body.String())
	}
	if !deps.Sessions.(*fakeSessionStore).closed {
		t.Fatal("session was not closed")
	}

	noAuth := httptest.NewRecorder()
	NewRouter(deps).ServeHTTP(noAuth, httptest.NewRequest(http.MethodPost, "/api/v1/widgets/widget-1/end-chat?session_id="+sessionID.String(), nil))
	if noAuth.Code != http.StatusUnauthorized {
		t.Fatalf("missing token status=%d", noAuth.Code)
	}
}

func TestGenerateWidgetTokenChecksAPIKeyAndWidgetOrganization(t *testing.T) {
	deps, _, customers, _ := widgetTestDependencies(t)
	deps.WidgetApps = &fakeWidgetAppStore{app: &widgetapp.App{ID: uuid.New(), OrganizationID: deps.Widgets.(*fakeWidgetStore).found.OrganizationID, IsActive: true}}
	request := httptest.NewRequest(http.MethodPost, "/api/v1/generate-token", strings.NewReader(`{"widget_id":"widget-1","customer_email":"person@example.com","custom_data":{"plan":"pro"},"ttl_seconds":3600}`))
	request.Header.Set("Authorization", "Bearer wak_test")
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	NewRouter(deps).ServeHTTP(response, request)
	if response.Code != http.StatusCreated {
		t.Fatalf("status=%d body=%s", response.Code, response.Body.String())
	}
	if customers.created == nil || !customers.created.IsAuthenticated {
		t.Fatal("authenticated customer was not created")
	}
	var body struct {
		Data struct {
			Token string `json:"token"`
		} `json:"data"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	claims, err := deps.Auth.VerifyConversationToken(body.Data.Token)
	if err != nil || claims.CustomerID != customers.created.ID.String() || claims.CustomData["plan"] != "pro" {
		t.Fatalf("claims=%#v err=%v", claims, err)
	}

	missingKey := httptest.NewRecorder()
	missingRequest := httptest.NewRequest(http.MethodPost, "/api/v1/generate-token", strings.NewReader(`{"widget_id":"widget-1"}`))
	NewRouter(deps).ServeHTTP(missingKey, missingRequest)
	if missingKey.Code != http.StatusUnauthorized {
		t.Fatalf("missing API key status=%d", missingKey.Code)
	}
}
