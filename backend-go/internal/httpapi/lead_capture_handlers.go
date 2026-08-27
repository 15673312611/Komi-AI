package httpapi

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/chattermate/chattermate/backend-go/internal/leadcapture"
	"github.com/chattermate/chattermate/backend-go/internal/user"
)

func registerLeadCaptureRoutes(r chi.Router, deps Dependencies) {
	r.With(requireAnyPermissions(deps, "view_agents", "manage_agents")).Get("/agent/{agent_id}/lead-capture", getLeadCaptureConfig(deps))
	r.With(requireAllPermissions(deps, "manage_agents")).Put("/agent/{agent_id}/lead-capture", updateLeadCaptureConfig(deps))
}

func getLeadCaptureConfig(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, agentID, ok := leadCaptureTarget(w, r, deps)
		if !ok {
			return
		}
		if deps.LeadCapture == nil {
			Error(w, http.StatusInternalServerError, "Lead capture service is not configured")
			return
		}
		config, err := deps.LeadCapture.GetOrCreate(r.Context(), agentID, *current.OrganizationID)
		if errors.Is(err, leadcapture.ErrNotFound) {
			Error(w, http.StatusNotFound, "Agent not found")
			return
		}
		if err != nil {
			deps.Logger.Error().Err(err).Msg("get lead capture config failed")
			Error(w, http.StatusInternalServerError, "Failed to fetch lead capture config")
			return
		}
		JSON(w, http.StatusOK, config)
	}
}

type leadCaptureUpdateRequest struct {
	Enabled                bool                `json:"enabled"`
	RequireConsent         bool                `json:"require_consent"`
	Guidance               *string             `json:"guidance"`
	Fields                 []leadcapture.Field `json:"fields"`
	AssignmentMode         string              `json:"assignment_mode"`
	AssignmentTargetUserID *uuid.UUID          `json:"assignment_target_user_id"`
	CRMSyncTarget          string              `json:"crm_sync_target"`
	SlackNotifyEnabled     bool                `json:"slack_notify_enabled"`
}

func updateLeadCaptureConfig(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, agentID, ok := leadCaptureTarget(w, r, deps)
		if !ok {
			return
		}
		var body leadCaptureUpdateRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if body.Fields == nil {
			body.Fields = []leadcapture.Field{}
		}
		if deps.LeadCapture == nil {
			Error(w, http.StatusInternalServerError, "Lead capture service is not configured")
			return
		}
		config, err := deps.LeadCapture.Update(r.Context(), agentID, *current.OrganizationID, leadcapture.UpdateInput{
			Enabled: body.Enabled, RequireConsent: body.RequireConsent, Guidance: body.Guidance,
			Fields: body.Fields, AssignmentMode: body.AssignmentMode,
			AssignmentTargetUserID: body.AssignmentTargetUserID, CRMSyncTarget: body.CRMSyncTarget,
			SlackNotifyEnabled: body.SlackNotifyEnabled,
		})
		switch {
		case errors.Is(err, leadcapture.ErrNotFound):
			Error(w, http.StatusNotFound, "Agent not found")
		case errors.Is(err, leadcapture.ErrAssignmentTarget), errors.Is(err, leadcapture.ErrInvalidField), errors.Is(err, leadcapture.ErrTooManyFields), errors.Is(err, leadcapture.ErrInvalidAssignmentMode), errors.Is(err, leadcapture.ErrInvalidCRMTarget):
			Error(w, http.StatusBadRequest, err.Error())
		case err != nil:
			deps.Logger.Error().Err(err).Msg("update lead capture config failed")
			Error(w, http.StatusInternalServerError, "Failed to update lead capture config")
		default:
			JSON(w, http.StatusOK, config)
		}
	}
}

func leadCaptureTarget(w http.ResponseWriter, r *http.Request, deps Dependencies) (*user.User, uuid.UUID, bool) {
	current, ok := currentUserFromContext(r)
	if !ok || current.OrganizationID == nil {
		Error(w, http.StatusForbidden, "User is not associated with any organization")
		return nil, uuid.Nil, false
	}
	agentID, err := parsePathUUID(r, "agent_id")
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, "Invalid agent ID")
		return nil, uuid.Nil, false
	}
	if deps.Agents == nil {
		Error(w, http.StatusInternalServerError, "Agent service is not configured")
		return nil, uuid.Nil, false
	}
	found, err := deps.Agents.Get(r.Context(), agentID, *current.OrganizationID)
	if err != nil {
		Error(w, http.StatusInternalServerError, "Failed to fetch agent")
		return nil, uuid.Nil, false
	}
	if found == nil {
		Error(w, http.StatusNotFound, "Agent not found")
		return nil, uuid.Nil, false
	}
	return current, agentID, true
}
