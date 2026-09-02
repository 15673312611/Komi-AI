package integration

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/komi/komi/backend-go/internal/agent"
	"github.com/komi/komi/backend-go/internal/auth"
	"github.com/komi/komi/backend-go/internal/chat"
	"github.com/komi/komi/backend-go/internal/customer"
	"github.com/komi/komi/backend-go/internal/session"
	"github.com/komi/komi/backend-go/internal/widget"
	"github.com/komi/komi/backend-go/internal/widgetapp"
)

func openIntegrationPool(t *testing.T) (*pgxpool.Pool, context.Context) {
	t.Helper()
	dsn := os.Getenv("GO_POSTGRES_URL")
	if dsn == "" {
		t.Skip("set GO_POSTGRES_URL to run PostgreSQL write compatibility checks")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		cancel()
		t.Fatal(err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		cancel()
		t.Fatal(err)
	}
	t.Cleanup(func() {
		pool.Close()
		cancel()
	})
	return pool, ctx
}

func TestCurrentPostgresSchemaWritePaths(t *testing.T) {
	pool, ctx := openIntegrationPool(t)
	orgID := uuid.New()
	userID := uuid.New()
	agentID := uuid.New()
	sessionID := uuid.New()
	orgDomain := "go-compat-" + uuid.NewString() + ".invalid"
	email := "go-compat-" + uuid.NewString() + "@example.invalid"
	appRepo := widgetapp.NewRepository(pool)

	cleanup := func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		cleanupStatements := []struct {
			query string
			arg   any
		}{
			{`DELETE FROM chat_history WHERE session_id = $1`, sessionID},
			{`DELETE FROM session_to_agents WHERE session_id = $1`, sessionID},
			{`DELETE FROM widget_apps WHERE organization_id = $1`, orgID},
			{`DELETE FROM widgets WHERE organization_id = $1`, orgID},
			{`DELETE FROM agent_customizations WHERE agent_id = $1`, agentID},
			{`DELETE FROM agents WHERE id = $1`, agentID},
			{`DELETE FROM customers WHERE organization_id = $1`, orgID},
			{`DELETE FROM users WHERE id = $1`, userID},
			{`DELETE FROM organizations WHERE id = $1`, orgID},
		}
		for _, statement := range cleanupStatements {
			if _, err := pool.Exec(cleanupCtx, statement.query, statement.arg); err != nil {
				t.Logf("cleanup %q: %v", statement.query, err)
			}
		}
	}
	defer cleanup()

	_, err := pool.Exec(ctx, `
INSERT INTO organizations (id, name, domain, timezone, business_hours, settings, is_active)
VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
		orgID, "Go Compatibility Organization", orgDomain, "UTC",
		[]byte(`{"monday":{"start":"09:00","end":"17:00","enabled":true}}`),
		[]byte(`{"source":"go-integration"}`),
	)
	if err != nil {
		t.Fatal("insert organization:", err)
	}
	_, err = pool.Exec(ctx, `
INSERT INTO users (id, email, full_name, organization_id, is_active, is_online)
VALUES ($1, $2, $3, $4, TRUE, FALSE)`, userID, email, "Go Compatibility Agent", orgID)
	if err != nil {
		t.Fatal("insert user:", err)
	}

	agentRepo := agent.NewRepository(pool)
	createdAgent, err := agentRepo.Create(ctx, orgID, agent.CreateInput{
		Name:                   "go-compat-agent-" + uuid.NewString(),
		AgentType:              "general",
		Instructions:           []string{"Answer compatibility checks"},
		Tools:                  json.RawMessage(`[]`),
		IsActive:               true,
		TransferToHuman:        false,
		AIRepliesEnabled:       true,
		AskForRating:           true,
		HandoffCollectEmail:    true,
		HandoffCollectName:     true,
		EnableRateLimiting:     false,
		OverallLimitPerIP:      100,
		RequestsPerSecond:      1,
		AllowedAttachmentTypes: json.RawMessage(`[]`),
		TicketingEnabled:       true,
		GuardrailEnabled:       true,
	})
	if err != nil {
		t.Fatal("create agent:", err)
	}
	if createdAgent == nil || createdAgent.ID == uuid.Nil || createdAgent.Customization != nil {
		t.Fatalf("created agent=%#v", createdAgent)
	}
	agentID = createdAgent.ID

	customization, err := agentRepo.UpsertCustomization(ctx, agentID, orgID, agent.CustomizationInput{
		"chat_style":               json.RawMessage(`"GLASS"`),
		"widget_position":          json.RawMessage(`"FIXED"`),
		"customization_metadata":   json.RawMessage(`{"brand":"compat","version":2}`),
		"chat_initiation_messages": json.RawMessage(`["Hello"]`),
		"quick_actions":            json.RawMessage(`["Pricing"]`),
		"collect_email":            json.RawMessage(`true`),
	})
	if err != nil {
		t.Fatal("insert customization:", err)
	}
	if customization == nil || customization.ChatStyle == nil || *customization.ChatStyle != "GLASS" || customization.WidgetPosition == nil || *customization.WidgetPosition != "FIXED" {
		t.Fatalf("inserted customization=%#v", customization)
	}
	if customization.CustomizationMetadata["brand"] != "compat" || len(customization.ChatInitiationMessages) != 1 || !customization.CollectEmail {
		t.Fatalf("customization JSON fields=%#v", customization)
	}

	updatedCustomization, err := agentRepo.UpsertCustomization(ctx, agentID, orgID, agent.CustomizationInput{
		"chat_style":      json.RawMessage(`"TERMINAL"`),
		"widget_position": json.RawMessage(`"FLOATING"`),
	})
	if err != nil {
		t.Fatal("update customization:", err)
	}
	if updatedCustomization == nil || updatedCustomization.ChatStyle == nil || *updatedCustomization.ChatStyle != "TERMINAL" || updatedCustomization.WidgetPosition == nil || *updatedCustomization.WidgetPosition != "FLOATING" {
		t.Fatalf("updated customization=%#v", updatedCustomization)
	}

	widgetRepo := widget.NewRepository(pool)
	createdWidget, err := widgetRepo.Create(ctx, orgID, "Nullable Widget", nil)
	if err != nil {
		t.Fatal("create widget:", err)
	}
	if createdWidget == nil || createdWidget.AgentID != nil {
		t.Fatalf("created widget=%#v", createdWidget)
	}
	loadedWidget, err := widgetRepo.Get(ctx, createdWidget.ID)
	if err != nil || loadedWidget == nil || loadedWidget.AgentID != nil || loadedWidget.OrganizationID != orgID {
		t.Fatalf("loaded widget=%#v err=%v", loadedWidget, err)
	}
	schedule, err := widgetRepo.Schedule(ctx, orgID)
	if err != nil || schedule.Timezone != "UTC" || schedule.BusinessHours["monday"]["start"] != "09:00" {
		t.Fatalf("schedule=%#v err=%v", schedule, err)
	}
	if found, err := widgetRepo.Get(ctx, createdWidget.ID+"-wrong"); err != nil || found != nil {
		t.Fatalf("wrong widget lookup=%#v err=%v", found, err)
	}

	customerRepo := customer.NewRepository(pool)
	createdCustomer, err := customerRepo.Create(ctx, "nullable-"+uuid.NewString()+"@example.invalid", nil, orgID, nil, false)
	if err != nil {
		t.Fatal("create customer:", err)
	}
	if createdCustomer == nil || createdCustomer.FullName != nil || len(createdCustomer.MetaData) != 0 || createdCustomer.IsAuthenticated {
		t.Fatalf("created customer=%#v", createdCustomer)
	}
	if found, err := customerRepo.GetByEmail(ctx, createdCustomer.Email, uuid.New()); err != nil || found != nil {
		t.Fatalf("cross-org customer lookup=%#v err=%v", found, err)
	}
	mergedCustomer, err := customerRepo.UpdateMetaData(ctx, createdCustomer.ID, map[string]any{"plan": "pro", "seats": 3})
	if err != nil {
		t.Fatal("update customer metadata:", err)
	}
	if mergedCustomer == nil || mergedCustomer.MetaData["plan"] != "pro" || mergedCustomer.MetaData["seats"] != float64(3) {
		t.Fatalf("merged metadata=%#v", mergedCustomer)
	}
	identifiedCustomer, err := customerRepo.UpdateIdentity(ctx, createdCustomer.ID, nil, true)
	if err != nil {
		t.Fatal("update customer identity:", err)
	}
	if identifiedCustomer == nil || identifiedCustomer.FullName != nil || !identifiedCustomer.IsAuthenticated {
		t.Fatalf("identified customer=%#v", identifiedCustomer)
	}

	_, err = pool.Exec(ctx, `
INSERT INTO session_to_agents (session_id, user_id, agent_id, customer_id, organization_id, status, channel)
VALUES ($1, $2, $3, $4, $5, 'OPEN'::sessionstatus, 'web')`, sessionID, userID, agentID, createdCustomer.ID, orgID)
	if err != nil {
		t.Fatal("insert session:", err)
	}
	_, err = pool.Exec(ctx, `
INSERT INTO chat_history (organization_id, user_id, customer_id, agent_id, session_id, message, message_type, attributes)
VALUES ($1, $2, $3, $4, $5, $6, 'user', $7),
       ($1, NULL, $3, $4, $5, $8, 'bot', $9)`,
		orgID, userID, createdCustomer.ID, agentID, sessionID,
		"Can you help me?", []byte(`{"client_message_id":"compat-user"}`),
		"Yes, I can help.", []byte(`{"source":"compat"}`),
	)
	if err != nil {
		t.Fatal("insert chat history:", err)
	}
	chatRepo := chat.NewRepository(pool)
	chatVisibility := chat.Visibility{UserID: userID, CanViewAll: true, CanManageAll: true}
	sessionRepo := session.NewRepository(pool)
	tagsUpdated, err := sessionRepo.UpdateTags(ctx, sessionID, orgID, []string{"priority", "vip"})
	if err != nil || !tagsUpdated {
		t.Fatalf("update session tags updated=%t err=%v", tagsUpdated, err)
	}
	overviews, err := chatRepo.List(ctx, chat.ListFilter{OrganizationID: orgID, Visibility: chatVisibility, Limit: 20})
	if err != nil || len(overviews) != 1 || overviews[0].SessionID != sessionID || overviews[0].LastMessage != "Yes, I can help." || overviews[0].MessageCount != 2 {
		t.Fatalf("chat overviews=%#v err=%v", overviews, err)
	}
	detail, err := chatRepo.GetDetail(ctx, sessionID, orgID)
	if err != nil || detail == nil || len(detail.Messages) != 2 || detail.Messages[0].MessageType != "user" || detail.Customer.MetaData["plan"] != "pro" || len(detail.Tags) != 2 || detail.Tags[0] != "priority" {
		t.Fatalf("chat detail=%#v err=%v", detail, err)
	}
	var workflowState []byte
	if err := pool.QueryRow(ctx, `SELECT workflow_state FROM session_to_agents WHERE session_id = $1`, sessionID).Scan(&workflowState); err != nil {
		t.Fatal("read workflow state:", err)
	}
	var state map[string]any
	if err := json.Unmarshal(workflowState, &state); err != nil || state["conversation_tags"].([]any)[1] != "vip" {
		t.Fatalf("workflow state=%s err=%v", workflowState, err)
	}
	allowed, err := chatRepo.CheckAccess(ctx, sessionID, orgID, chatVisibility)
	if err != nil || !allowed {
		t.Fatalf("chat access allowed=%t err=%v", allowed, err)
	}
	threadCounts, err := chatRepo.UnreadCounts(ctx, orgID, chatVisibility)
	if err != nil || threadCounts[sessionID.String()] != 1 {
		t.Fatalf("thread unread counts=%#v err=%v", threadCounts, err)
	}
	channelCounts, err := chatRepo.OpenCountsByChannel(ctx, orgID, chatVisibility)
	if err != nil || channelCounts["web"] != 1 {
		t.Fatalf("channel counts=%#v err=%v", channelCounts, err)
	}
	if err := chatRepo.MarkRead(ctx, userID, sessionID, orgID, time.Now().UTC()); !errors.Is(err, chat.ErrReadStateUnavailable) {
		t.Fatalf("mark read error=%v, want ErrReadStateUnavailable", err)
	}
	loadedSession, err := sessionRepo.Get(ctx, sessionID)
	if err != nil || loadedSession == nil || loadedSession.CustomerID != createdCustomer.ID || loadedSession.Status != "OPEN" {
		t.Fatalf("loaded session=%#v err=%v", loadedSession, err)
	}
	if _, err := pool.Exec(ctx, `UPDATE session_to_agents SET user_id = NULL WHERE session_id = $1`, sessionID); err != nil {
		t.Fatal("unassign session:", err)
	}
	managedSession, err := sessionRepo.GetManaged(ctx, sessionID, orgID)
	if err != nil || managedSession == nil || managedSession.UserID != nil || managedSession.Status != "OPEN" {
		t.Fatalf("managed session=%#v err=%v", managedSession, err)
	}
	routed, err := sessionRepo.RouteToHuman(ctx, sessionID, orgID, "DIRECT_REQUEST", "Waiting for a teammate")
	if err != nil || !routed {
		t.Fatalf("route to human routed=%t err=%v", routed, err)
	}
	handedBack, err := sessionRepo.HandBackToAI(ctx, sessionID, orgID)
	if err != nil || !handedBack {
		t.Fatalf("hand back to AI handed_back=%t err=%v", handedBack, err)
	}
	aiUpdated, err := sessionRepo.SetAIAutoReply(ctx, sessionID, orgID, false)
	if err != nil || !aiUpdated {
		t.Fatalf("set AI auto reply updated=%t err=%v", aiUpdated, err)
	}
	takenOver, err := sessionRepo.Takeover(ctx, sessionID, orgID, userID)
	if err != nil || !takenOver {
		t.Fatalf("takeover taken=%t err=%v", takenOver, err)
	}
	reassigned, err := sessionRepo.Reassign(ctx, sessionID, orgID, userID)
	if err != nil || !reassigned {
		t.Fatalf("reassign reassigned=%t err=%v", reassigned, err)
	}
	humanAgent, err := sessionRepo.GetCustomerHumanAgent(ctx, createdCustomer.ID)
	if err != nil || humanAgent == nil || humanAgent.Name == nil || *humanAgent.Name != "Go Compatibility Agent" || humanAgent.ProfilePic != nil {
		t.Fatalf("human agent=%#v err=%v", humanAgent, err)
	}
	reason := "CUSTOMER_REQUEST"
	description := "Customer asked to close the compatibility chat"
	closed, err := sessionRepo.Close(ctx, sessionID, &reason, &description)
	if err != nil || !closed {
		t.Fatalf("close session closed=%t err=%v", closed, err)
	}
	var status, storedReason, storedDescription string
	if err := pool.QueryRow(ctx, `SELECT status::text, end_chat_reason::text, end_chat_description FROM session_to_agents WHERE session_id = $1`, sessionID).Scan(&status, &storedReason, &storedDescription); err != nil {
		t.Fatal("read closed session:", err)
	}
	if status != "CLOSED" || storedReason != reason || storedDescription != description {
		t.Fatalf("closed session status=%q reason=%q description=%q", status, storedReason, storedDescription)
	}
	if closed, err := sessionRepo.Close(ctx, sessionID, nil, nil); err != nil || !closed {
		t.Fatalf("idempotent close closed=%t err=%v", closed, err)
	}

	app, plainKey, err := appRepo.Create(ctx, widgetapp.CreateInput{
		Name:           "Nullable Widget App",
		OrganizationID: orgID,
		CreatedBy:      userID,
	})
	if err != nil {
		t.Fatal("create widget app:", err)
	}
	if app == nil || app.Description != nil || plainKey == "" || !auth.VerifyPassword(plainKey, app.APIKeyHash) {
		t.Fatalf("created widget app=%#v key=%q", app, plainKey)
	}
	validated, err := appRepo.ValidateAPIKey(ctx, plainKey)
	if err != nil || validated == nil || validated.ID != app.ID {
		t.Fatalf("validate widget app=%#v err=%v", validated, err)
	}
	if found, err := appRepo.Get(ctx, app.ID, uuid.New()); err != nil || found != nil {
		t.Fatalf("cross-org widget app lookup=%#v err=%v", found, err)
	}
	newName := "Updated Widget App"
	descriptionValue := "Updated description"
	active := false
	updatedApp, err := appRepo.Update(ctx, app.ID, orgID, widgetapp.UpdateInput{Name: &newName, Description: &descriptionValue, IsActive: &active})
	if err != nil || updatedApp == nil || updatedApp.Name != newName || updatedApp.Description == nil || *updatedApp.Description != descriptionValue || updatedApp.IsActive {
		t.Fatalf("updated widget app=%#v err=%v", updatedApp, err)
	}
	if apps, err := appRepo.List(ctx, orgID, false); err != nil || len(apps) != 0 {
		t.Fatalf("active widget apps=%#v err=%v", apps, err)
	}
	if apps, err := appRepo.List(ctx, orgID, true); err != nil || len(apps) != 1 || apps[0].ID != app.ID {
		t.Fatalf("all widget apps=%#v err=%v", apps, err)
	}
	rotatedApp, rotatedKey, err := appRepo.Regenerate(ctx, app.ID, orgID)
	if err != nil || rotatedApp == nil || rotatedKey == plainKey || !auth.VerifyPassword(rotatedKey, rotatedApp.APIKeyHash) {
		t.Fatalf("regenerated app=%#v key=%q err=%v", rotatedApp, rotatedKey, err)
	}
	if _, err := appRepo.ValidateAPIKey(ctx, plainKey); !errors.Is(err, pgx.ErrNoRows) {
		t.Fatalf("old widget app key error=%v, want pgx.ErrNoRows", err)
	}
	if valid, err := appRepo.Deactivate(ctx, app.ID, orgID); err != nil || !valid {
		t.Fatalf("deactivate widget app valid=%t err=%v", valid, err)
	}
	if valid, err := appRepo.Delete(ctx, app.ID, orgID); err != nil || !valid {
		t.Fatalf("delete widget app valid=%t err=%v", valid, err)
	}
}

func TestChatGetDetailRealDB(t *testing.T) {
	pool, ctx := openIntegrationPool(t)
	chatRepo := chat.NewRepository(pool)
	var sessionID, orgID uuid.UUID
	err := pool.QueryRow(ctx, `SELECT session_id, organization_id FROM session_to_agents ORDER BY assigned_at DESC LIMIT 1`).Scan(&sessionID, &orgID)
	if err != nil {
		t.Skipf("no session found: %v", err)
	}
	t.Logf("Testing session_id: %s, org_id: %s", sessionID, orgID)
	detail, err := chatRepo.GetDetail(ctx, sessionID, orgID)
	if err != nil {
		t.Fatalf("GetDetail error: %v", err)
	}
	if detail == nil {
		t.Fatalf("GetDetail returned nil detail")
	}
	t.Logf("detail: SessionID=%s, Customer=%+v, Agent=%+v, MessagesCount=%d, AIAutoReply=%t",
		detail.SessionID, detail.Customer, detail.Agent, len(detail.Messages), detail.AIAutoReply)
	for i, m := range detail.Messages {
		t.Logf("  Message %d: [%s] %s (author: %v, created_at: %s)", i, m.MessageType, m.Message, m.UserName, m.CreatedAt)
	}
}
