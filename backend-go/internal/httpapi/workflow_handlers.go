package httpapi

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/chattermate/chattermate/backend-go/internal/workflow"
)

func registerWorkflowRoutes(r chi.Router, deps Dependencies) {
	r.With(requireAllPermissions(deps, "manage_agents")).Post("/workflow", createWorkflow(deps))
	r.With(requireAnyPermissions(deps, "view_all", "manage_agents")).Get("/workflow/agent/{agent_id}", getWorkflowByAgent(deps))
	r.With(requireAllPermissions(deps, "manage_agents")).Put("/workflow/{workflow_id}", updateWorkflow(deps))
	r.With(requireAllPermissions(deps, "manage_agents")).Delete("/workflow/{workflow_id}", deleteWorkflow(deps))
	r.With(requireAllPermissions(deps, "manage_agents")).Put("/workflow/{workflow_id}/nodes", replaceWorkflowNodes(deps))
	r.With(requireAnyPermissions(deps, "view_all", "manage_agents")).Get("/workflow/{workflow_id}/nodes", getWorkflowNodes(deps))
	// Python's single-node handlers use get_current_user rather than a
	// workflow-specific permission dependency; retain that authentication
	// surface for compatibility.
	r.With(requireAuthenticated(deps)).Put("/workflow/{workflow_id}/nodes/{node_id}", updateWorkflowNode(deps))
	r.With(requireAuthenticated(deps)).Get("/workflow/{workflow_id}/nodes/{node_id}", getWorkflowNode(deps))
}

type workflowCreateRequest struct {
	Name            string         `json:"name"`
	Description     *string        `json:"description"`
	Status          string         `json:"status"`
	IsTemplate      bool           `json:"is_template"`
	DefaultLanguage string         `json:"default_language"`
	CanvasData      map[string]any `json:"canvas_data"`
	Settings        map[string]any `json:"settings"`
	AgentID         uuid.UUID      `json:"agent_id"`
}

type workflowNodesRequest struct {
	Nodes       []map[string]any `json:"nodes"`
	Connections []map[string]any `json:"connections"`
}

func workflowStoreOrError(w http.ResponseWriter, deps Dependencies) workflow.Store {
	if deps.Workflows == nil {
		Error(w, http.StatusServiceUnavailable, "workflow storage is not configured")
		return nil
	}
	return deps.Workflows
}

func workflowUser(r *http.Request) (uuid.UUID, uuid.UUID, bool) {
	current, ok := currentUserFromContext(r)
	if !ok || current.OrganizationID == nil {
		return uuid.Nil, uuid.Nil, false
	}
	return current.ID, *current.OrganizationID, true
}

func createWorkflow(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := workflowStoreOrError(w, deps)
		if store == nil {
			return
		}
		userID, organizationID, ok := workflowUser(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		var body workflowCreateRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		created, err := store.Create(r.Context(), workflow.CreateInput{
			Name: body.Name, Description: body.Description, Status: body.Status, IsTemplate: body.IsTemplate,
			DefaultLanguage: body.DefaultLanguage, CanvasData: body.CanvasData, Settings: body.Settings,
			AgentID: body.AgentID, CreatedBy: userID, OrganizationID: organizationID,
		})
		if err != nil {
			writeWorkflowError(w, err, "Failed to create workflow")
			return
		}
		JSON(w, http.StatusCreated, created)
	}
}

func getWorkflowByAgent(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := workflowStoreOrError(w, deps)
		if store == nil {
			return
		}
		_, organizationID, ok := workflowUser(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		agentID, err := uuid.Parse(chi.URLParam(r, "agent_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid agent id")
			return
		}
		result, err := store.GetByAgent(r.Context(), agentID, organizationID)
		if err != nil {
			writeWorkflowError(w, err, "Failed to get workflow")
			return
		}
		JSON(w, http.StatusOK, result)
	}
}

func updateWorkflow(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := workflowStoreOrError(w, deps)
		if store == nil {
			return
		}
		_, organizationID, ok := workflowUser(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		workflowID, err := uuid.Parse(chi.URLParam(r, "workflow_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid workflow id")
			return
		}
		fields, err := decodeObject(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		updated, err := store.Update(r.Context(), workflowID, organizationID, fields)
		if err != nil {
			writeWorkflowError(w, err, "Failed to update workflow")
			return
		}
		JSON(w, http.StatusOK, updated)
	}
}

func deleteWorkflow(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := workflowStoreOrError(w, deps)
		if store == nil {
			return
		}
		_, organizationID, ok := workflowUser(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		workflowID, err := uuid.Parse(chi.URLParam(r, "workflow_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid workflow id")
			return
		}
		if err := store.Delete(r.Context(), workflowID, organizationID); err != nil {
			writeWorkflowError(w, err, "Failed to delete workflow")
			return
		}
		NoContent(w)
	}
}

func replaceWorkflowNodes(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := workflowStoreOrError(w, deps)
		if store == nil {
			return
		}
		_, organizationID, ok := workflowUser(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		workflowID, err := uuid.Parse(chi.URLParam(r, "workflow_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid workflow id")
			return
		}
		var body workflowNodesRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		result, err := store.ReplaceNodes(r.Context(), workflowID, organizationID, body.Nodes, body.Connections)
		if err != nil {
			writeWorkflowError(w, err, "Failed to replace workflow nodes")
			return
		}
		JSON(w, http.StatusOK, result)
	}
}

func getWorkflowNodes(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := workflowStoreOrError(w, deps)
		if store == nil {
			return
		}
		_, organizationID, ok := workflowUser(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		workflowID, err := uuid.Parse(chi.URLParam(r, "workflow_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid workflow id")
			return
		}
		result, err := store.GetNodes(r.Context(), workflowID, organizationID)
		if err != nil {
			writeWorkflowError(w, err, "Failed to get workflow nodes")
			return
		}
		JSON(w, http.StatusOK, result)
	}
}

func updateWorkflowNode(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := workflowStoreOrError(w, deps)
		if store == nil {
			return
		}
		_, organizationID, ok := workflowUser(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		workflowID, err := uuid.Parse(chi.URLParam(r, "workflow_id"))
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid workflow id")
			return
		}
		nodeID, err := uuid.Parse(chi.URLParam(r, "node_id"))
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid node id")
			return
		}
		fields, err := decodeObject(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		result, err := store.UpdateNode(r.Context(), workflowID, nodeID, organizationID, fields)
		if err != nil {
			writeWorkflowError(w, err, "Failed to update workflow node")
			return
		}
		JSON(w, http.StatusOK, result)
	}
}

func getWorkflowNode(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := workflowStoreOrError(w, deps)
		if store == nil {
			return
		}
		_, organizationID, ok := workflowUser(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		workflowID, err := uuid.Parse(chi.URLParam(r, "workflow_id"))
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid workflow id")
			return
		}
		nodeID, err := uuid.Parse(chi.URLParam(r, "node_id"))
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid node id")
			return
		}
		result, err := store.GetNode(r.Context(), workflowID, nodeID, organizationID)
		if err != nil {
			writeWorkflowError(w, err, "Failed to get workflow node")
			return
		}
		JSON(w, http.StatusOK, result)
	}
}

func writeWorkflowError(w http.ResponseWriter, err error, fallback string) {
	switch {
	case errors.Is(err, workflow.ErrNotFound):
		Error(w, http.StatusNotFound, "Workflow or node not found")
	case errors.Is(err, workflow.ErrWrongOrganization):
		Error(w, http.StatusBadRequest, "Workflow does not belong to your organization")
	case errors.Is(err, workflow.ErrConflict):
		Error(w, http.StatusBadRequest, "Workflow conflicts with existing data")
	case errors.Is(err, workflow.ErrInvalid):
		Error(w, http.StatusBadRequest, "Invalid workflow data")
	default:
		Error(w, http.StatusInternalServerError, fallback)
	}
}
