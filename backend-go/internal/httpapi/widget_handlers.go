package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/komi/komi/backend-go/internal/agent"
	"github.com/komi/komi/backend-go/internal/auth"
	"github.com/komi/komi/backend-go/internal/customer"
	"github.com/komi/komi/backend-go/internal/session"
	"github.com/komi/komi/backend-go/internal/widget"
)

type createWidgetRequest struct {
	Name    string     `json:"name"`
	AgentID *uuid.UUID `json:"agent_id"`
}

type widgetCustomizationView struct {
	ChatBackgroundColor    *string        `json:"chat_background_color"`
	ChatTextColor          *string        `json:"chat_text_color"`
	ChatBubbleColor        *string        `json:"chat_bubble_color"`
	AccentColor            *string        `json:"accent_color"`
	FontFamily             *string        `json:"font_family"`
	PhotoURL               *string        `json:"photo_url"`
	ChatStyle              string         `json:"chat_style"`
	WidgetPosition         string         `json:"widget_position"`
	WelcomeTitle           *string        `json:"welcome_title"`
	WelcomeSubtitle        *string        `json:"welcome_subtitle"`
	WelcomeMessage         *string        `json:"welcome_message"`
	ChatInitiationMessages []string       `json:"chat_initiation_messages"`
	QuickActions           []string       `json:"quick_actions"`
	ShowCitations          bool           `json:"show_citations"`
	CollectEmail           bool           `json:"collect_email"`
	ShowAIDisclaimer       bool           `json:"show_ai_disclaimer"`
	AllowNewChat           bool           `json:"allow_new_chat"`
	CustomizationMetadata  map[string]any `json:"customization_metadata"`
}

type widgetAgentView struct {
	ID            uuid.UUID                `json:"id"`
	Name          string                   `json:"name"`
	DisplayName   *string                  `json:"display_name"`
	Customization *widgetCustomizationView `json:"customization"`
	Workflow      bool                     `json:"workflow"`
}

type widgetResponse struct {
	ID             string              `json:"id"`
	OrganizationID uuid.UUID           `json:"organization_id"`
	Agent          widgetAgentView     `json:"agent"`
	HumanAgent     *session.HumanAgent `json:"human_agent"`
	AgentID        *uuid.UUID          `json:"agent_id"`
	CustomerID     *string             `json:"customer_id,omitempty"`
	Token          *string             `json:"token"`
}

type widgetPresence struct {
	Mode      string `json:"mode"`
	Available bool   `json:"available"`
}

type scheduleStore interface {
	Schedule(ctx context.Context, organizationID uuid.UUID) (widget.OrganizationSchedule, error)
}

func registerWidgetRoutes(r chi.Router, deps Dependencies) {
	r.With(requireAuthenticated(deps)).Post("/widgets", createWidget(deps))
	r.With(requireAuthenticated(deps)).Get("/widgets", listWidgets(deps))
	r.With(requireAuthenticated(deps)).Get("/widgets/agent/{agent_id}", widgetsByAgent(deps))
	r.With(requireAuthenticated(deps)).Delete("/widgets/{widget_id}", deleteWidget(deps))

	// Register the static suffixes before /{widget_id}; this mirrors FastAPI's
	// route order and prevents "data" from being treated as a widget ID.
	r.Get("/widgets/{widget_id}/data", widgetUI(deps))
	r.Get("/widgets/{widget_id}", widgetData(deps))
	r.Post("/widgets/{widget_id}/end-chat", endChat(deps))
}

func createWidget(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Widgets == nil {
			Error(w, http.StatusInternalServerError, "Widget service is not configured")
			return
		}
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		var body createWidgetRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if strings.TrimSpace(body.Name) == "" {
			Error(w, http.StatusUnprocessableEntity, "Invalid widget data")
			return
		}
		created, err := deps.Widgets.Create(r.Context(), *current.OrganizationID, body.Name, body.AgentID)
		if err != nil {
			deps.Logger.Error().Err(err).Msg("create widget failed")
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		view, err := buildWidgetResponse(r, deps, created, nil, "")
		if err != nil {
			writeWidgetError(w, err)
			return
		}
		JSON(w, http.StatusOK, view)
	}
}

func listWidgets(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Widgets == nil {
			Error(w, http.StatusInternalServerError, "Widget service is not configured")
			return
		}
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		widgets, err := deps.Widgets.List(r.Context(), *current.OrganizationID)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		views := make([]widgetResponse, 0, len(widgets))
		for _, found := range widgets {
			view, err := buildWidgetResponse(r, deps, found, nil, "")
			if err != nil {
				writeWidgetError(w, err)
				return
			}
			views = append(views, *view)
		}
		JSON(w, http.StatusOK, views)
	}
}

func widgetsByAgent(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Widgets == nil {
			Error(w, http.StatusInternalServerError, "Widget service is not configured")
			return
		}
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		agentID, err := parsePathUUID(r, "agent_id")
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid agent ID")
			return
		}
		if deps.Agents == nil {
			Error(w, http.StatusInternalServerError, "Agent service is not configured")
			return
		}
		foundAgent, err := deps.Agents.Get(r.Context(), agentID, *current.OrganizationID)
		if err != nil || foundAgent == nil {
			Error(w, http.StatusNotFound, "Agent not found")
			return
		}
		widgets, err := deps.Widgets.ListByAgent(r.Context(), *current.OrganizationID, agentID)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		views := make([]widgetResponse, 0, len(widgets))
		for _, found := range widgets {
			view, err := buildWidgetResponse(r, deps, found, nil, "")
			if err != nil {
				writeWidgetError(w, err)
				return
			}
			views = append(views, *view)
		}
		JSON(w, http.StatusOK, views)
	}
}

func deleteWidget(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Widgets == nil {
			Error(w, http.StatusInternalServerError, "Widget service is not configured")
			return
		}
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		found, err := deps.Widgets.Get(r.Context(), chi.URLParam(r, "widget_id"))
		if err != nil || found == nil || found.OrganizationID != *current.OrganizationID {
			Error(w, http.StatusNotFound, "Widget not found")
			return
		}
		if err := deps.Widgets.Delete(r.Context(), found.ID, *current.OrganizationID); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				Error(w, http.StatusNotFound, "Widget not found")
				return
			}
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Widget deleted"})
	}
}

func widgetUI(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Auth == nil {
			Error(w, http.StatusInternalServerError, "Authentication service is not configured")
			return
		}
		found, foundAgent, err := loadPublicWidget(r, deps)
		if err != nil {
			writeWidgetError(w, err)
			return
		}
		claims := validWidgetConversationClaims(r, deps.Auth, found.ID)
		customerID := ""
		token := ""
		if claims != nil {
			customerID = claims.Subject
			token = bearerToken(r)
		}
		if foundAgent.RequireTokenAuth && customerID == "" {
			Error(w, http.StatusUnauthorized, "Authentication required. Token must be obtained from /api/v1/generate-token endpoint with valid API key.")
			return
		}
		if token == "" {
			extra := map[string]any{}
			if found.ID == deps.Config.ExploreWidgetID {
				if source := strings.TrimSpace(r.URL.Query().Get("source")); source != "" {
					extra["source"] = source
				}
			}
			var err error
			token, _, err = deps.Auth.CreateConversationToken(found.ID, "", "", extra)
			if err != nil {
				Error(w, http.StatusInternalServerError, "Failed to create conversation token")
				return
			}
		}
		presence := widgetPresenceFor(r, deps, found.OrganizationID, foundAgent)
		htmlBody := renderWidgetHTML(deps, found.ID, displayAgentName(foundAgent), foundAgent.Customization, customerID, token, foundAgent, presence)
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(htmlBody))
	}
}

func widgetData(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Auth == nil {
			Error(w, http.StatusInternalServerError, "Authentication service is not configured")
			return
		}
		found, foundAgent, err := loadPublicWidget(r, deps)
		if err != nil {
			writeWidgetError(w, err)
			return
		}
		claims := validWidgetConversationClaims(r, deps.Auth, found.ID)
		customerID := ""
		oldSource := ""
		if claims != nil {
			customerID = claims.Subject
			oldSource = claims.Source
		}
		if foundAgent.RequireTokenAuth && customerID == "" {
			Error(w, http.StatusUnauthorized, "Unauthorized - Token required")
			return
		}

		hasWorkflow := foundAgent.UseWorkflow && foundAgent.ActiveWorkflowID != nil
		askAnything := foundAgent.Customization != nil && strings.EqualFold(valueOrEmpty(foundAgent.Customization.ChatStyle), "ASK_ANYTHING")
		emailBypass := foundAgent.Customization == nil || !foundAgent.Customization.CollectEmail
		email := strings.TrimSpace(r.URL.Query().Get("email"))
		canCreate := customerID == "" && (email != "" || hasWorkflow || askAnything || emailBypass)

		var humanAgent *session.HumanAgent
		newToken := ""
		if canCreate {
			if deps.Customers == nil {
				Error(w, http.StatusInternalServerError, "Customer service is not configured")
				return
			}
			var foundCustomer *customer.Customer
			if email != "" {
				foundCustomer, err = deps.Customers.GetByEmail(r.Context(), email, found.OrganizationID)
				if err != nil {
					Error(w, http.StatusInternalServerError, "Failed to retrieve customer")
					return
				}
			}
			if foundCustomer == nil {
				fullName := (*string)(nil)
				customerEmail := email
				if customerEmail == "" {
					customerEmail = customer.PlaceholderEmail()
				}
				foundCustomer, err = deps.Customers.Create(r.Context(), customerEmail, fullName, found.OrganizationID, nil, false)
				if err != nil {
					Error(w, http.StatusInternalServerError, "Failed to create customer")
					return
				}
			}
			humanAgent, err = customerHumanAgent(r, deps, foundCustomer.ID)
			if err != nil {
				Error(w, http.StatusInternalServerError, "Failed to retrieve session information")
				return
			}
			extra := map[string]any{}
			if found.ID == deps.Config.ExploreWidgetID {
				if source := widgetFirstNonEmpty(r.URL.Query().Get("source"), oldSource); source != "" {
					extra["source"] = source
				}
			}
			newToken, _, err = deps.Auth.CreateConversationToken(found.ID, foundCustomer.ID.String(), customerEmailOf(foundCustomer), extra)
			if err != nil {
				Error(w, http.StatusInternalServerError, "Failed to create conversation token")
				return
			}
			customerID = foundCustomer.ID.String()
		} else if customerID == "" {
			Error(w, http.StatusUnauthorized, "Unauthorized")
			return
		} else {
			parsedCustomerID, parseErr := uuid.Parse(customerID)
			if parseErr != nil {
				Error(w, http.StatusUnauthorized, "Unauthorized")
				return
			}
			humanAgent, err = customerHumanAgent(r, deps, parsedCustomerID)
			if err != nil {
				Error(w, http.StatusInternalServerError, "Failed to retrieve session information")
				return
			}
		}

		view, err := buildWidgetResponse(r, deps, found, humanAgent, newToken)
		if err != nil {
			writeWidgetError(w, err)
			return
		}
		view.CustomerID = &customerID
		JSON(w, http.StatusOK, view)
	}
}

func endChat(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Auth == nil || deps.Sessions == nil || deps.Widgets == nil {
			Error(w, http.StatusInternalServerError, "Chat service is not configured")
			return
		}
		token := bearerToken(r)
		if token == "" {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		claims, err := deps.Auth.VerifyConversationToken(token)
		if err != nil {
			Error(w, http.StatusUnauthorized, "Invalid token")
			return
		}
		widgetID := chi.URLParam(r, "widget_id")
		if claims.WidgetID != widgetID {
			Error(w, http.StatusForbidden, "Widget mismatch")
			return
		}
		if _, err := deps.Widgets.Get(r.Context(), widgetID); err != nil {
			Error(w, http.StatusInternalServerError, "Failed to process end chat")
			return
		}
		var sessionIDText string
		if value := r.URL.Query().Get("session_id"); value != "" {
			sessionIDText = value
		} else {
			Error(w, http.StatusUnprocessableEntity, "session_id is required")
			return
		}
		sessionID, err := uuid.Parse(sessionIDText)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid session ID")
			return
		}
		customerID, err := uuid.Parse(claims.Subject)
		if err != nil {
			Error(w, http.StatusNotFound, "Session not found")
			return
		}
		foundSession, err := deps.Sessions.Get(r.Context(), sessionID)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to process end chat")
			return
		}
		if foundSession == nil || foundSession.CustomerID != customerID {
			Error(w, http.StatusNotFound, "Session not found")
			return
		}
		reason := optionalQuery(r, "reason")
		description := optionalQuery(r, "description")
		success, err := deps.Sessions.Close(r.Context(), sessionID, reason, description)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to process end chat")
			return
		}
		if !success {
			Error(w, http.StatusNotFound, "Session not found")
			return
		}
		JSON(w, http.StatusOK, map[string]any{
			"success":    true,
			"message":    "Chat session closed",
			"session_id": sessionIDText,
			"closed_at":  time.Now().UTC().Format("2006-01-02T15:04:05.999999"),
		})
	}
}

func loadPublicWidget(r *http.Request, deps Dependencies) (*widget.Widget, *agent.Agent, error) {
	if deps.Widgets == nil {
		return nil, nil, widgetHTTPError(http.StatusInternalServerError, "Widget service is not configured")
	}
	found, err := deps.Widgets.Get(r.Context(), chi.URLParam(r, "widget_id"))
	if err != nil {
		return nil, nil, widgetHTTPError(http.StatusInternalServerError, "Failed to retrieve widget")
	}
	if found == nil {
		return nil, nil, widgetHTTPError(http.StatusNotFound, "Widget not found")
	}
	if found.AgentID == nil || deps.Agents == nil {
		return nil, nil, widgetHTTPError(http.StatusNotFound, "Agent not found")
	}
	foundAgent, err := deps.Agents.Get(r.Context(), *found.AgentID, found.OrganizationID)
	if err != nil {
		return nil, nil, widgetHTTPError(http.StatusInternalServerError, "Failed to retrieve agent")
	}
	if foundAgent == nil {
		return nil, nil, widgetHTTPError(http.StatusNotFound, "Agent not found")
	}
	return found, foundAgent, nil
}

func buildWidgetResponse(r *http.Request, deps Dependencies, found *widget.Widget, humanAgent *session.HumanAgent, token string) (*widgetResponse, error) {
	if found == nil || found.AgentID == nil || deps.Agents == nil {
		return nil, widgetHTTPError(http.StatusNotFound, "Agent not found")
	}
	foundAgent, err := deps.Agents.Get(r.Context(), *found.AgentID, found.OrganizationID)
	if err != nil {
		return nil, widgetHTTPError(http.StatusInternalServerError, "Failed to retrieve agent")
	}
	if foundAgent == nil {
		return nil, widgetHTTPError(http.StatusNotFound, "Agent not found")
	}
	var tokenValue *string
	if token != "" {
		tokenValue = &token
	}
	return &widgetResponse{
		ID:             found.ID,
		OrganizationID: found.OrganizationID,
		Agent:          toWidgetAgentView(foundAgent),
		HumanAgent:     humanAgent,
		AgentID:        found.AgentID,
		Token:          tokenValue,
	}, nil
}

func toWidgetAgentView(found *agent.Agent) widgetAgentView {
	return widgetAgentView{
		ID:            found.ID,
		Name:          found.Name,
		DisplayName:   found.DisplayName,
		Customization: toWidgetCustomizationView(found.Customization),
		Workflow:      found.UseWorkflow && found.ActiveWorkflowID != nil,
	}
}

func toWidgetCustomizationView(found *agent.Customization) *widgetCustomizationView {
	if found == nil {
		return nil
	}
	style := valueOrDefault(found.ChatStyle, "CHATBOT")
	position := valueOrDefault(found.WidgetPosition, "FLOATING")
	initiations := found.ChatInitiationMessages
	if initiations == nil {
		initiations = []string{}
	}
	quickActions := found.QuickActions
	if quickActions == nil {
		quickActions = []string{}
	}
	metadata := found.CustomizationMetadata
	if metadata == nil {
		metadata = map[string]any{}
	}
	return &widgetCustomizationView{
		ChatBackgroundColor:    found.ChatBackgroundColor,
		ChatTextColor:          found.ChatTextColor,
		ChatBubbleColor:        found.ChatBubbleColor,
		AccentColor:            found.AccentColor,
		FontFamily:             found.FontFamily,
		PhotoURL:               found.PhotoURL,
		ChatStyle:              style,
		WidgetPosition:         position,
		WelcomeTitle:           found.WelcomeTitle,
		WelcomeSubtitle:        found.WelcomeSubtitle,
		WelcomeMessage:         found.WelcomeMessage,
		ChatInitiationMessages: initiations,
		QuickActions:           quickActions,
		ShowCitations:          found.ShowCitations,
		CollectEmail:           found.CollectEmail,
		ShowAIDisclaimer:       found.ShowAIDisclaimer,
		AllowNewChat:           found.AllowNewChat,
		CustomizationMetadata:  metadata,
	}
}

func customerHumanAgent(r *http.Request, deps Dependencies, customerID uuid.UUID) (*session.HumanAgent, error) {
	if deps.Sessions == nil {
		return nil, nil
	}
	return deps.Sessions.GetCustomerHumanAgent(r.Context(), customerID)
}

func validWidgetConversationClaims(r *http.Request, service *auth.Service, widgetID string) *auth.Claims {
	if service == nil {
		return nil
	}
	token := bearerToken(r)
	if token == "" {
		return nil
	}
	claims, err := service.VerifyConversationToken(token)
	if err != nil || claims.WidgetID != widgetID {
		return nil
	}
	return &claims
}

func bearerToken(r *http.Request) string {
	parts := strings.SplitN(r.Header.Get("Authorization"), " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return ""
	}
	return strings.TrimSpace(parts[1])
}

func displayAgentName(found *agent.Agent) string {
	if found.DisplayName != nil && strings.TrimSpace(*found.DisplayName) != "" {
		return *found.DisplayName
	}
	return found.Name
}

func customerEmailOf(found *customer.Customer) string {
	if found == nil {
		return ""
	}
	return found.Email
}

func widgetPresenceFor(r *http.Request, deps Dependencies, organizationID uuid.UUID, found *agent.Agent) widgetPresence {
	if found.AIRepliesEnabled {
		return widgetPresence{Mode: "ai", Available: true}
	}
	available := true
	if schedules, ok := deps.Widgets.(scheduleStore); ok {
		if schedule, err := schedules.Schedule(r.Context(), organizationID); err == nil {
			available = withinBusinessHours(schedule)
		}
	}
	return widgetPresence{Mode: "human", Available: available}
}

func withinBusinessHours(schedule widget.OrganizationSchedule) bool {
	location, err := time.LoadLocation(schedule.Timezone)
	if err != nil {
		location = time.UTC
	}
	now := time.Now().In(location)
	dayName := strings.ToLower(now.Weekday().String())
	entry := schedule.BusinessHours[dayName]
	if entry == nil {
		return false
	}
	enabled, _ := entry["enabled"].(bool)
	if !enabled {
		return false
	}
	start := parseClock(entry["start"], 9*60)
	end := parseClock(entry["end"], 17*60)
	minutes := now.Hour()*60 + now.Minute()
	return start <= minutes && minutes <= end
}

func parseClock(value any, fallback int) int {
	text, ok := value.(string)
	if !ok {
		return fallback
	}
	parts := strings.Split(text, ":")
	if len(parts) != 2 {
		return fallback
	}
	var hour, minute int
	if _, err := fmt.Sscanf(text, "%d:%d", &hour, &minute); err != nil || hour < 0 || hour > 23 || minute < 0 || minute > 59 {
		return fallback
	}
	return hour*60 + minute
}

func renderWidgetHTML(deps Dependencies, widgetID, agentName string, customization *agent.Customization, customerID, token string, found *agent.Agent, presence widgetPresence) string {
	widgetURL := strings.TrimRight(deps.Config.WidgetURL, "/")
	version := assetVersion(deps.Config.AssetsDir)
	query := ""
	if version != "" {
		query = "?v=" + version
	}
	runtime := map[string]string{
		"API_URL": strings.TrimRight(deps.Config.BackendURL, "/") + deps.Config.APIBasePath,
		"WS_URL":  websocketURL(deps.Config.BackendURL),
	}
	aiRepliesEnabled := found.AIRepliesEnabled
	customizationValue := customizationForHTML(customization, aiRepliesEnabled)
	return fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Widget</title>
    <script>window.APP_CONFIG = %s;</script>
    <script type="module" crossorigin src="%s/assets/widget.js%s"></script>
    <link rel="stylesheet" crossorigin href="%s/assets/widget.css%s">
    <script>
        window.__INITIAL_DATA__ = {
            widgetId: %s,
            agentName: %s,
            customization: %s,
            customerId: %s,
            initialToken: %s,
            customer: {},
            workflow: %t,
            allowAttachments: %t,
            presence: %s
        };
    </script>
</head>
<body><div id="app"></div></body>
</html>`, safeJSON(runtime), html.EscapeString(widgetURL), query, html.EscapeString(widgetURL), query,
		safeJSON(widgetID), safeJSON(agentName), safeJSON(customizationValue), safeJSON(customerID), safeJSON(token),
		found.UseWorkflow && found.ActiveWorkflowID != nil, found.AllowAttachments, safeJSON(presence))
}

func customizationForHTML(found *agent.Customization, aiRepliesEnabled bool) any {
	view := toWidgetCustomizationView(found)
	if view == nil {
		return map[string]any{}
	}
	value := map[string]any{}
	encoded, _ := json.Marshal(view)
	_ = json.Unmarshal(encoded, &value)
	value["show_ai_disclaimer"] = view.ShowAIDisclaimer && aiRepliesEnabled
	return value
}

func websocketURL(value string) string {
	value = strings.TrimRight(value, "/")
	switch {
	case strings.HasPrefix(value, "https://"):
		return "wss://" + strings.TrimPrefix(value, "https://")
	case strings.HasPrefix(value, "http://"):
		return "ws://" + strings.TrimPrefix(value, "http://")
	default:
		return value
	}
}

func assetVersion(directory string) string {
	paths := []string{filepath.Join(directory, "widget.js"), filepath.Join("..", directory, "widget.js")}
	for _, path := range paths {
		stat, err := os.Stat(path)
		if err == nil {
			return fmt.Sprintf("%d-%d", stat.ModTime().Unix(), stat.Size())
		}
	}
	return ""
}

func safeJSON(value any) string {
	encoded, _ := json.Marshal(value)
	encoded = []byte(strings.ReplaceAll(string(encoded), "<", "\\u003c"))
	encoded = []byte(strings.ReplaceAll(string(encoded), ">", "\\u003e"))
	encoded = []byte(strings.ReplaceAll(string(encoded), "&", "\\u0026"))
	return string(encoded)
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func valueOrDefault(value *string, fallback string) string {
	if strings.TrimSpace(valueOrEmpty(value)) == "" {
		return fallback
	}
	return *value
}

func widgetFirstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func optionalQuery(r *http.Request, key string) *string {
	value := r.URL.Query().Get(key)
	if value == "" {
		return nil
	}
	return &value
}

type widgetHTTPErrorValue struct {
	status int
	detail string
}

func (e widgetHTTPErrorValue) Error() string { return e.detail }

func widgetHTTPError(status int, detail string) error {
	return widgetHTTPErrorValue{status: status, detail: detail}
}

func writeWidgetError(w http.ResponseWriter, err error) {
	var typed widgetHTTPErrorValue
	if errors.As(err, &typed) {
		Error(w, typed.status, typed.detail)
		return
	}
	Error(w, http.StatusInternalServerError, err.Error())
}
