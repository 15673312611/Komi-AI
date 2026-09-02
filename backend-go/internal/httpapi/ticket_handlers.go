package httpapi

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/komi/komi/backend-go/internal/ticketing"
	"github.com/komi/komi/backend-go/internal/user"
)

type ticketCreateRequest struct {
	Title          string     `json:"title"`
	Description    *string    `json:"description"`
	Priority       string     `json:"priority"`
	Severity       *int       `json:"severity"`
	Tags           []string   `json:"tags"`
	CustomerID     *uuid.UUID `json:"customer_id"`
	CustomerEmail  *string    `json:"customer_email"`
	CustomerName   *string    `json:"customer_name"`
	SessionID      *uuid.UUID `json:"session_id"`
	AssigneeUserID *uuid.UUID `json:"assignee_user_id"`
	GroupID        *uuid.UUID `json:"group_id"`
}
type ticketUpdateRequest struct {
	Title                     *string    `json:"title"`
	Description               *string    `json:"description"`
	CustomerEmail             *string    `json:"customer_email"`
	CustomerName              *string    `json:"customer_name"`
	Status                    *string    `json:"status"`
	Priority                  *string    `json:"priority"`
	Severity                  *int       `json:"severity"`
	Tags                      *[]string  `json:"tags"`
	AssigneeUserID            *uuid.UUID `json:"assignee_user_id"`
	GroupID                   *uuid.UUID `json:"group_id"`
	ResolutionOutcome         *string    `json:"resolution_outcome"`
	ResolutionSummary         *string    `json:"resolution_summary"`
	CustomerResolutionMessage *string    `json:"customer_resolution_message"`
}
type ticketCommentRequest struct {
	Body       string `json:"body"`
	IsInternal *bool  `json:"is_internal"`
}
type ticketResolveRequest struct {
	Outcome           string  `json:"outcome"`
	ResolutionSummary *string `json:"resolution_summary"`
	CustomerMessage   *string `json:"customer_message"`
}
type ticketReopenRequest struct {
	Reason *string `json:"reason"`
}
type ticketInvestigateRequest struct {
	RunType     string  `json:"run_type"`
	ContextNote *string `json:"context_note"`
}
type ticketRejectRequest struct {
	Reason        *string `json:"reason"`
	Reinvestigate bool    `json:"reinvestigate"`
}
type rcaUpdateRequest struct {
	CustomerSummary *string `json:"customer_summary"`
	MarkReviewed    bool    `json:"mark_reviewed"`
}
type ticketSettingsUpdateRequest struct {
	AutonomyLevel              *int           `json:"autonomy_level"`
	AutoInvestigateOnCreate    *bool          `json:"auto_investigate_on_create"`
	MinConfidenceToAutoResolve *float64       `json:"min_confidence_to_auto_resolve"`
	ConfirmationTimeoutHours   *int           `json:"confirmation_timeout_hours"`
	CSATEnabled                *bool          `json:"csat_enabled"`
	SLATargets                 map[string]any `json:"sla_targets"`
	CreatedTemplate            *string        `json:"created_template"`
	ResolvedTemplate           *string        `json:"resolved_template"`
	JiraEscalationEnabled      *bool          `json:"jira_escalation_enabled"`
	JiraEscalationPriority     *string        `json:"jira_escalation_priority"`
	InvestigationMCPToolIDs    []int          `json:"investigation_mcp_tool_ids"`
	AlertWebhookEnabled        *bool          `json:"alert_webhook_enabled"`
	MaxToolCallsPerRun         *int           `json:"max_tool_calls_per_run"`
	MaxRunsPerTicket           *int           `json:"max_runs_per_ticket"`
}

func registerTicketRoutes(r chi.Router, deps Dependencies) {
	view := requireAnyPermissions(deps, "view_tickets", "manage_tickets")
	manage := requireAllPermissions(deps, "manage_tickets")
	r.With(view).Get("/tickets", listTickets(deps))
	r.With(view).Get("/tickets/stats", ticketStats(deps))
	r.With(requireAnyPermissions(deps, "manage_organization", "manage_tickets")).Get("/tickets/settings", getTicketSettings(deps))
	r.With(requireAllPermissions(deps, "manage_organization")).Put("/tickets/settings", updateTicketSettings(deps))
	r.With(view).Get("/tickets/by-session/{session_id}", getTicketBySession(deps))
	r.With(view).Get("/tickets/draft-from-session/{session_id}", draftTicketFromSession(deps))
	r.With(manage).Post("/tickets", createTicket(deps))
	r.With(view).Get("/tickets/{ticket_id}", getTicket(deps))
	r.With(manage).Patch("/tickets/{ticket_id}", updateTicket(deps))
	r.With(view).Post("/tickets/{ticket_id}/comments", addTicketComment(deps))
	r.With(manage).Post("/tickets/{ticket_id}/resolve", resolveTicket(deps))
	r.With(manage).Post("/tickets/{ticket_id}/reopen", reopenTicket(deps))
	r.With(manage).Post("/tickets/{ticket_id}/investigate", investigateTicket(deps))
	r.With(view).Get("/tickets/{ticket_id}/investigation", getTicketInvestigation(deps))
	r.With(requireAllPermissions(deps, "approve_ticket_actions")).Post("/tickets/{ticket_id}/proposal/approve", approveTicketProposal(deps))
	r.With(requireAllPermissions(deps, "approve_ticket_actions")).Post("/tickets/{ticket_id}/proposal/reject", rejectTicketProposal(deps))
	r.With(manage).Patch("/tickets/{ticket_id}/rca", updateTicketRCA(deps))
	r.With(manage).Post("/tickets/{ticket_id}/rca/send-customer", sendTicketRCA(deps))
}

func ticketStoreOrError(w http.ResponseWriter, deps Dependencies) ticketing.Store {
	if deps.Tickets == nil {
		Error(w, http.StatusServiceUnavailable, "ticket storage is not configured")
		return nil
	}
	return deps.Tickets
}
func ticketOrg(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	current, ok := currentUserFromContext(r)
	if !ok || current.OrganizationID == nil {
		Error(w, http.StatusForbidden, "User is not associated with any organization")
		return uuid.Nil, false
	}
	return *current.OrganizationID, true
}
func parseBoolQuery(value string) bool { parsed, _ := strconv.ParseBool(value); return parsed }

func listTickets(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketOrg(w, r)
		if !ok {
			return
		}
		var statuses []string
		if raw := r.URL.Query().Get("status"); raw != "" {
			for _, value := range strings.Split(raw, ",") {
				if strings.TrimSpace(value) != "" {
					statuses = append(statuses, strings.TrimSpace(value))
				}
			}
		}
		var assignee *uuid.UUID
		if raw := r.URL.Query().Get("assignee_id"); raw != "" {
			value, err := uuid.Parse(raw)
			if err != nil {
				Error(w, http.StatusUnprocessableEntity, "Invalid assignee ID")
				return
			}
			assignee = &value
		}
		page := queryInt(r, "page", 1)
		pageSize := queryInt(r, "page_size", 25)
		if page < 1 {
			page = 1
		}
		if pageSize < 1 {
			pageSize = 25
		}
		if pageSize > 100 {
			pageSize = 100
		}
		response, err := store.List(r.Context(), org, ticketing.ListFilter{Status: statuses, Priority: r.URL.Query().Get("priority"), AssigneeID: assignee, Unassigned: parseBoolQuery(r.URL.Query().Get("unassigned")), AIState: r.URL.Query().Get("ai_state"), Search: r.URL.Query().Get("search"), Sort: r.URL.Query().Get("sort"), Page: page, PageSize: pageSize})
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to fetch tickets")
			return
		}
		JSON(w, http.StatusOK, response)
	}
}
func queryInt(r *http.Request, name string, fallback int) int {
	value, err := strconv.Atoi(r.URL.Query().Get(name))
	if err != nil {
		return fallback
	}
	return value
}

func ticketStats(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketOrg(w, r)
		if !ok {
			return
		}
		value, err := store.Stats(r.Context(), org)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to fetch ticket stats")
			return
		}
		JSON(w, http.StatusOK, value)
	}
}
func getTicketSettings(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketOrg(w, r)
		if !ok {
			return
		}
		value, err := store.GetSettings(r.Context(), org)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to fetch ticket settings")
			return
		}
		if !hasAllPermissions(currentUserFromRequest(r), "manage_organization") {
			value.AlertWebhookSecret = nil
		}
		JSON(w, http.StatusOK, value)
	}
}
func currentUserFromRequest(r *http.Request) *user.User {
	current, _ := currentUserFromContext(r)
	return current
}
func updateTicketSettings(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketOrg(w, r)
		if !ok {
			return
		}
		var body ticketSettingsUpdateRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		value, err := store.UpdateSettings(r.Context(), org, ticketing.SettingsUpdate{AutonomyLevel: body.AutonomyLevel, AutoInvestigateOnCreate: body.AutoInvestigateOnCreate, MinConfidenceToAutoResolve: body.MinConfidenceToAutoResolve, ConfirmationTimeoutHours: body.ConfirmationTimeoutHours, CSATEnabled: body.CSATEnabled, SLATargets: body.SLATargets, CreatedTemplate: body.CreatedTemplate, ResolvedTemplate: body.ResolvedTemplate, JiraEscalationEnabled: body.JiraEscalationEnabled, JiraEscalationPriority: body.JiraEscalationPriority, InvestigationMCPToolIDs: body.InvestigationMCPToolIDs, AlertWebhookEnabled: body.AlertWebhookEnabled, MaxToolCallsPerRun: body.MaxToolCallsPerRun, MaxRunsPerTicket: body.MaxRunsPerTicket})
		if errors.Is(err, ticketing.ErrInvalid) {
			Error(w, http.StatusUnprocessableEntity, "Invalid ticket settings")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to update ticket settings")
			return
		}
		JSON(w, http.StatusOK, value)
	}
}

func getTicketBySession(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketOrg(w, r)
		if !ok {
			return
		}
		id, err := uuid.Parse(chi.URLParam(r, "session_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid session ID")
			return
		}
		value, err := store.GetBySession(r.Context(), org, id)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to fetch ticket")
			return
		}
		JSON(w, http.StatusOK, value)
	}
}
func draftTicketFromSession(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketOrg(w, r)
		if !ok {
			return
		}
		id, err := uuid.Parse(chi.URLParam(r, "session_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid session ID")
			return
		}
		title, description, err := store.DraftFromSession(r.Context(), org, id)
		if errors.Is(err, ticketing.ErrNotFound) {
			Error(w, http.StatusNotFound, "Session not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to build ticket draft")
			return
		}
		if title == "" {
			title = "Support issue from conversation"
		}
		JSON(w, http.StatusOK, map[string]string{"title": title, "description": description})
	}
}

func createTicket(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketOrg(w, r)
		if !ok {
			return
		}
		current, _ := currentUserFromContext(r)
		var body ticketCreateRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		value, err := store.Create(r.Context(), org, ticketing.CreateInput{Title: body.Title, Description: body.Description, Priority: body.Priority, Severity: body.Severity, Tags: body.Tags, CustomerID: body.CustomerID, CustomerEmail: body.CustomerEmail, CustomerName: body.CustomerName, SessionID: body.SessionID, AssigneeUserID: body.AssigneeUserID, GroupID: body.GroupID, CreatedByUserID: &current.ID})
		if errors.Is(err, ticketing.ErrInvalid) {
			Error(w, http.StatusUnprocessableEntity, "Invalid ticket data")
			return
		}
		if errors.Is(err, ticketing.ErrNotFound) {
			Error(w, http.StatusNotFound, "Referenced resource not found")
			return
		}
		if err != nil {
			deps.Logger.Error().Err(err).Msg("create ticket failed")
			Error(w, http.StatusInternalServerError, "Failed to create ticket")
			return
		}
		JSON(w, http.StatusCreated, value)
	}
}
func ticketID(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	value, err := uuid.Parse(chi.URLParam(r, "ticket_id"))
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, "Invalid ticket ID")
		return uuid.Nil, false
	}
	return value, true
}
func getTicket(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketOrg(w, r)
		if !ok {
			return
		}
		id, ok := ticketID(w, r)
		if !ok {
			return
		}
		value, err := store.Get(r.Context(), org, id)
		if errors.Is(err, ticketing.ErrNotFound) {
			Error(w, http.StatusNotFound, "Ticket not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to fetch ticket")
			return
		}
		JSON(w, http.StatusOK, value)
	}
}
func updateTicket(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketOrg(w, r)
		if !ok {
			return
		}
		id, ok := ticketID(w, r)
		if !ok {
			return
		}
		current, _ := currentUserFromContext(r)
		var body ticketUpdateRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		value, err := store.Update(r.Context(), org, id, ticketing.UpdateInput{Title: body.Title, Description: body.Description, CustomerEmail: body.CustomerEmail, CustomerName: body.CustomerName, Status: body.Status, Priority: body.Priority, Severity: body.Severity, Tags: body.Tags, AssigneeUserID: body.AssigneeUserID, GroupID: body.GroupID, ResolutionOutcome: body.ResolutionOutcome, ResolutionSummary: body.ResolutionSummary, CustomerResolutionMessage: body.CustomerResolutionMessage}, current.ID)
		if errors.Is(err, ticketing.ErrNotFound) {
			Error(w, http.StatusNotFound, "Ticket not found")
			return
		}
		if errors.Is(err, ticketing.ErrIllegalStatus) {
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, ticketing.ErrInvalid) {
			Error(w, http.StatusBadRequest, "Invalid ticket data")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to update ticket")
			return
		}
		JSON(w, http.StatusOK, value)
	}
}
func addTicketComment(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketOrg(w, r)
		if !ok {
			return
		}
		id, ok := ticketID(w, r)
		if !ok {
			return
		}
		current, _ := currentUserFromContext(r)
		var body ticketCommentRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		internal := true
		if body.IsInternal != nil {
			internal = *body.IsInternal
		}
		if !internal && !hasAnyPermissions(current, "manage_tickets") {
			Error(w, http.StatusForbidden, "Sending customer-visible replies requires manage_tickets")
			return
		}
		value, err := store.AddComment(r.Context(), org, id, ticketing.CommentInput{Body: body.Body, IsInternal: internal}, current.ID)
		if errors.Is(err, ticketing.ErrNotFound) {
			Error(w, http.StatusNotFound, "Ticket not found")
			return
		}
		if errors.Is(err, ticketing.ErrInvalid) {
			Error(w, http.StatusUnprocessableEntity, "Invalid comment")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to add comment")
			return
		}
		JSON(w, http.StatusCreated, value)
	}
}
func resolveTicket(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketOrg(w, r)
		if !ok {
			return
		}
		id, ok := ticketID(w, r)
		if !ok {
			return
		}
		current, _ := currentUserFromContext(r)
		var body ticketResolveRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		value, err := store.Resolve(r.Context(), org, id, ticketing.ResolveInput{Outcome: body.Outcome, ResolutionSummary: body.ResolutionSummary, CustomerMessage: body.CustomerMessage}, current.ID)
		if errors.Is(err, ticketing.ErrNotFound) {
			Error(w, http.StatusNotFound, "Ticket not found")
			return
		}
		if errors.Is(err, ticketing.ErrIllegalStatus) {
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to resolve ticket")
			return
		}
		JSON(w, http.StatusOK, value)
	}
}
func reopenTicket(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketOrg(w, r)
		if !ok {
			return
		}
		id, ok := ticketID(w, r)
		if !ok {
			return
		}
		current, _ := currentUserFromContext(r)
		var body ticketReopenRequest
		if r.ContentLength != 0 {
			_ = decodeJSON(r, &body)
		}
		value, err := store.Reopen(r.Context(), org, id, body.Reason, current.ID)
		if errors.Is(err, ticketing.ErrNotFound) {
			Error(w, http.StatusNotFound, "Ticket not found")
			return
		}
		if errors.Is(err, ticketing.ErrInvalid) {
			Error(w, http.StatusBadRequest, "Only resolved or closed tickets can be reopened")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to reopen ticket")
			return
		}
		JSON(w, http.StatusOK, value)
	}
}
func investigateTicket(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketOrg(w, r)
		if !ok {
			return
		}
		id, ok := ticketID(w, r)
		if !ok {
			return
		}
		current, _ := currentUserFromContext(r)
		body := ticketInvestigateRequest{RunType: "investigation"}
		if r.ContentLength != 0 {
			if err := decodeJSON(r, &body); err != nil {
				Error(w, http.StatusUnprocessableEntity, err.Error())
				return
			}
		}
		if body.RunType == "" {
			body.RunType = "investigation"
		}
		run, err := store.Investigate(r.Context(), org, id, body.RunType, "manual", body.ContextNote, current.ID)
		if errors.Is(err, ticketing.ErrNotFound) {
			Error(w, http.StatusNotFound, "Ticket not found")
			return
		}
		if errors.Is(err, ticketing.ErrActiveRun) {
			Error(w, http.StatusConflict, err.Error())
			return
		}
		if errors.Is(err, ticketing.ErrInvalid) {
			Error(w, http.StatusConflict, "This ticket is resolved — reopen it before running another investigation")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to enqueue investigation")
			return
		}
		JSON(w, http.StatusCreated, run)
	}
}
func getTicketInvestigation(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketOrg(w, r)
		if !ok {
			return
		}
		id, ok := ticketID(w, r)
		if !ok {
			return
		}
		var runID *uuid.UUID
		if raw := r.URL.Query().Get("run_id"); raw != "" {
			value, err := uuid.Parse(raw)
			if err != nil {
				Error(w, http.StatusUnprocessableEntity, "Invalid run ID")
				return
			}
			runID = &value
		}
		value, err := store.GetInvestigation(r.Context(), org, id, runID)
		if errors.Is(err, ticketing.ErrNotFound) {
			Error(w, http.StatusNotFound, "Ticket not found")
			return
		}
		if errors.Is(err, ticketing.ErrRunNotFound) {
			Error(w, http.StatusNotFound, "Run not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to fetch investigation")
			return
		}
		JSON(w, http.StatusOK, value)
	}
}
func approveTicketProposal(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketOrg(w, r)
		if !ok {
			return
		}
		id, ok := ticketID(w, r)
		if !ok {
			return
		}
		current, _ := currentUserFromContext(r)
		value, err := store.ApproveProposal(r.Context(), org, id, current.ID)
		if errors.Is(err, ticketing.ErrNoProposal) {
			Error(w, http.StatusNotFound, "No pending proposal for this ticket")
			return
		}
		if errors.Is(err, ticketing.ErrNotFound) {
			Error(w, http.StatusNotFound, "Ticket not found")
			return
		}
		if err != nil {
			Error(w, http.StatusBadRequest, "Failed to approve proposal")
			return
		}
		JSON(w, http.StatusOK, value)
	}
}
func rejectTicketProposal(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketOrg(w, r)
		if !ok {
			return
		}
		id, ok := ticketID(w, r)
		if !ok {
			return
		}
		current, _ := currentUserFromContext(r)
		var body ticketRejectRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		value, err := store.RejectProposal(r.Context(), org, id, current.ID, body.Reason, body.Reinvestigate)
		if errors.Is(err, ticketing.ErrNoProposal) {
			Error(w, http.StatusNotFound, "No pending proposal for this ticket")
			return
		}
		if errors.Is(err, ticketing.ErrNotFound) {
			Error(w, http.StatusNotFound, "Ticket not found")
			return
		}
		if err != nil {
			Error(w, http.StatusBadRequest, "Failed to reject proposal")
			return
		}
		JSON(w, http.StatusOK, value)
	}
}
func updateTicketRCA(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketOrg(w, r)
		if !ok {
			return
		}
		id, ok := ticketID(w, r)
		if !ok {
			return
		}
		current, _ := currentUserFromContext(r)
		var body rcaUpdateRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		value, err := store.UpdateRCA(r.Context(), org, id, current.ID, body.CustomerSummary, body.MarkReviewed)
		if errors.Is(err, ticketing.ErrRunNotFound) {
			Error(w, http.StatusNotFound, "No RCA document for this ticket")
			return
		}
		if errors.Is(err, ticketing.ErrNotFound) {
			Error(w, http.StatusNotFound, "Ticket not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to update RCA")
			return
		}
		JSON(w, http.StatusOK, value)
	}
}
func sendTicketRCA(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketOrg(w, r)
		if !ok {
			return
		}
		id, ok := ticketID(w, r)
		if !ok {
			return
		}
		current, _ := currentUserFromContext(r)
		value, err := store.SendRCA(r.Context(), org, id, current.ID)
		if errors.Is(err, ticketing.ErrRunNotFound) {
			Error(w, http.StatusNotFound, "No customer summary to send")
			return
		}
		if errors.Is(err, ticketing.ErrNotFound) {
			Error(w, http.StatusNotFound, "Ticket not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to send RCA")
			return
		}
		JSON(w, http.StatusOK, value)
	}
}
