package httpapi

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/komi/komi/backend-go/internal/mcptool"
)

func registerMCPToolRoutes(r chi.Router, deps Dependencies) {
	r.With(requireAllPermissions(deps, "manage_agents")).Post("/mcp-tools", createMCPTool(deps))
	r.With(requireAnyPermissions(deps, "view_all", "manage_agents")).Get("/mcp-tools", listMCPTools(deps))
	r.With(requireAnyPermissions(deps, "view_all", "manage_agents")).Get("/mcp-tools/{mcp_tool_id}", getMCPTool(deps))
	r.With(requireAllPermissions(deps, "manage_agents")).Post("/mcp-tools/{mcp_tool_id}/test", testMCPTool(deps))
	r.With(requireAllPermissions(deps, "manage_agents")).Put("/mcp-tools/{mcp_tool_id}", updateMCPTool(deps))
	r.With(requireAllPermissions(deps, "manage_agents")).Delete("/mcp-tools/{mcp_tool_id}", deleteMCPTool(deps))
	r.With(requireAllPermissions(deps, "manage_agents")).Post("/mcp-tools/agent-association", addMCPToolToAgent(deps))
	r.With(requireAllPermissions(deps, "manage_agents")).Delete("/mcp-tools/agent-association/{mcp_tool_id}/{agent_id}", removeMCPToolFromAgent(deps))
	r.With(requireAnyPermissions(deps, "view_all", "manage_agents")).Get("/mcp-tools/agent/{agent_id}", getAgentMCPTools(deps))
}

type mcpToolRequest struct {
	Name             string            `json:"name"`
	Description      *string           `json:"description"`
	TransportType    string            `json:"transport_type"`
	Enabled          *bool             `json:"enabled"`
	Command          *string           `json:"command"`
	Args             []string          `json:"args"`
	EnvVars          map[string]string `json:"env_vars"`
	URL              *string           `json:"url"`
	Headers          map[string]string `json:"headers"`
	Timeout          *int              `json:"timeout"`
	SSEReadTimeout   *int              `json:"sse_read_timeout"`
	TerminateOnClose *bool             `json:"terminate_on_close"`
}

type mcpAssociationRequest struct {
	MCPToolID int64     `json:"mcp_tool_id"`
	AgentID   uuid.UUID `json:"agent_id"`
}

func mcpStoreOrError(w http.ResponseWriter, deps Dependencies) mcptool.Store {
	if deps.MCPTools == nil {
		Error(w, http.StatusServiceUnavailable, "MCP tool storage is not configured")
		return nil
	}
	return deps.MCPTools
}

func mcpUserOrganization(r *http.Request) (uuid.UUID, bool) {
	current, ok := currentUserFromContext(r)
	if !ok || current.OrganizationID == nil {
		return uuid.Nil, false
	}
	return *current.OrganizationID, true
}

func mcpID(r *http.Request) (int64, error) {
	return strconv.ParseInt(chi.URLParam(r, "mcp_tool_id"), 10, 64)
}

func createMCPTool(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := mcpStoreOrError(w, deps)
		if store == nil {
			return
		}
		organizationID, ok := mcpUserOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		var body mcpToolRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		enabled := true
		if body.Enabled != nil {
			enabled = *body.Enabled
		}
		terminate := true
		if body.TerminateOnClose != nil {
			terminate = *body.TerminateOnClose
		}
		result, err := store.Create(r.Context(), mcptool.CreateInput{Name: body.Name, Description: body.Description, TransportType: body.TransportType, Enabled: enabled, Command: body.Command, Args: body.Args, EnvVars: body.EnvVars, URL: body.URL, Headers: body.Headers, Timeout: body.Timeout, SSEReadTimeout: body.SSEReadTimeout, TerminateOnClose: &terminate, OrganizationID: organizationID})
		if err != nil {
			writeMCPError(w, err, "MCP tool creation failed")
			return
		}
		JSON(w, http.StatusOK, result)
	}
}

func listMCPTools(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := mcpStoreOrError(w, deps)
		if store == nil {
			return
		}
		organizationID, ok := mcpUserOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		enabledOnly := true
		if value := r.URL.Query().Get("enabled_only"); value != "" {
			parsed, err := strconv.ParseBool(value)
			if err != nil {
				Error(w, http.StatusUnprocessableEntity, "Invalid enabled_only")
				return
			}
			enabledOnly = parsed
		}
		result, err := store.List(r.Context(), organizationID, enabledOnly)
		if err != nil {
			writeMCPError(w, err, "Error fetching MCP tools")
			return
		}
		JSON(w, http.StatusOK, result)
	}
}

func getMCPTool(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := mcpStoreOrError(w, deps)
		if store == nil {
			return
		}
		organizationID, ok := mcpUserOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		id, err := mcpID(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid MCP tool id")
			return
		}
		result, err := store.Get(r.Context(), id)
		if err != nil {
			writeMCPError(w, err, "Error fetching MCP tool")
			return
		}
		if result.OrganizationID != organizationID {
			Error(w, http.StatusForbidden, "Not authorized to access this MCP tool")
			return
		}
		JSON(w, http.StatusOK, result)
	}
}

func testMCPTool(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := mcpStoreOrError(w, deps)
		if store == nil {
			return
		}
		organizationID, ok := mcpUserOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		id, err := mcpID(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid MCP tool id")
			return
		}
		result := store.Test(r.Context(), id, organizationID)
		JSON(w, http.StatusOK, result)
	}
}

func updateMCPTool(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := mcpStoreOrError(w, deps)
		if store == nil {
			return
		}
		organizationID, ok := mcpUserOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		id, err := mcpID(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid MCP tool id")
			return
		}
		fields, err := decodeObject(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		result, err := store.Update(r.Context(), id, organizationID, fields)
		if err != nil {
			writeMCPError(w, err, "MCP tool update failed")
			return
		}
		JSON(w, http.StatusOK, result)
	}
}

func deleteMCPTool(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := mcpStoreOrError(w, deps)
		if store == nil {
			return
		}
		organizationID, ok := mcpUserOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		id, err := mcpID(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid MCP tool id")
			return
		}
		if err := store.Delete(r.Context(), id, organizationID); err != nil {
			writeMCPError(w, err, "MCP tool deletion failed")
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "MCP tool deleted successfully"})
	}
}

func addMCPToolToAgent(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := mcpStoreOrError(w, deps)
		if store == nil {
			return
		}
		organizationID, ok := mcpUserOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		var body mcpAssociationRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		result, err := store.AddToAgent(r.Context(), body.MCPToolID, body.AgentID, organizationID)
		if err != nil {
			writeMCPError(w, err, "Error adding MCP tool to agent")
			return
		}
		JSON(w, http.StatusOK, result)
	}
}

func removeMCPToolFromAgent(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := mcpStoreOrError(w, deps)
		if store == nil {
			return
		}
		organizationID, ok := mcpUserOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		id, err := mcpID(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid MCP tool id")
			return
		}
		agentID, err := uuid.Parse(chi.URLParam(r, "agent_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid agent id")
			return
		}
		if err := store.RemoveFromAgent(r.Context(), id, agentID, organizationID); err != nil {
			writeMCPError(w, err, "Error removing MCP tool from agent")
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "MCP tool removed from agent successfully"})
	}
}

func getAgentMCPTools(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := mcpStoreOrError(w, deps)
		if store == nil {
			return
		}
		organizationID, ok := mcpUserOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		agentID, err := uuid.Parse(chi.URLParam(r, "agent_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid agent id")
			return
		}
		result, err := store.AgentTools(r.Context(), agentID, organizationID)
		if err != nil {
			writeMCPError(w, err, "Error fetching MCP tools")
			return
		}
		JSON(w, http.StatusOK, result)
	}
}

func writeMCPError(w http.ResponseWriter, err error, fallback string) {
	switch {
	case errors.Is(err, mcptool.ErrNotFound):
		Error(w, http.StatusNotFound, "MCP tool or agent not found")
	case errors.Is(err, mcptool.ErrForbidden):
		Error(w, http.StatusForbidden, "Not authorized to access this MCP tool")
	case errors.Is(err, mcptool.ErrConflict):
		Error(w, http.StatusBadRequest, "MCP tool with this name already exists")
	case errors.Is(err, mcptool.ErrAssociation):
		Error(w, http.StatusNotFound, "Association not found")
	case errors.Is(err, mcptool.ErrInvalid):
		Error(w, http.StatusBadRequest, "Invalid MCP tool configuration")
	default:
		Error(w, http.StatusInternalServerError, fallback)
	}
}
