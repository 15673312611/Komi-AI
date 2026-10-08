package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/komi/komi/backend-go/internal/agent"
	"github.com/komi/komi/backend-go/internal/aiconfig"
	"github.com/komi/komi/backend-go/internal/config"
	"github.com/komi/komi/backend-go/internal/storage"
	"github.com/komi/komi/backend-go/internal/user"
)

type createAgentRequest struct {
	Name                   string          `json:"name"`
	Description            *string         `json:"description"`
	AgentType              string          `json:"agent_type"`
	Instructions           []string        `json:"instructions"`
	Tools                  json.RawMessage `json:"tools"`
	IsActive               *bool           `json:"is_active"`
	IsDefault              *bool           `json:"is_default"`
	TransferToHuman        *bool           `json:"transfer_to_human"`
	AIRepliesEnabled       *bool           `json:"ai_replies_enabled"`
	AskForRating           *bool           `json:"ask_for_rating"`
	HandoffCollectEmail    *bool           `json:"handoff_collect_email"`
	HandoffCollectName     *bool           `json:"handoff_collect_name"`
	EnableRateLimiting     *bool           `json:"enable_rate_limiting"`
	OverallLimitPerIP      *int32          `json:"overall_limit_per_ip"`
	RequestsPerSecond      *float64        `json:"requests_per_sec"`
	UseWorkflow            *bool           `json:"use_workflow"`
	ActiveWorkflowID       *uuid.UUID      `json:"active_workflow_id"`
	AllowAttachments       *bool           `json:"allow_attachments"`
	AllowedAttachmentTypes json.RawMessage `json:"allowed_attachment_types"`
	RequireTokenAuth       *bool           `json:"require_token_auth"`
	TicketingEnabled       *bool           `json:"ticketing_enabled"`
	TopicScope             *string         `json:"topic_scope"`
	GuardrailPrompt        *string         `json:"guardrail_prompt"`
	GuardrailEnabled       *bool           `json:"guardrail_enabled"`
	DisplayName            *string         `json:"display_name"`
}

type instructionPromptRequest struct {
	Prompt               string   `json:"prompt"`
	ExistingInstructions []string `json:"existing_instructions"`
}

func registerAgentRoutes(r chi.Router, deps Dependencies) {
	if deps.Agents == nil && deps.DB != nil {
		deps.Agents = agent.NewRepository(deps.DB)
	}
	r.With(requireAllPermissions(deps, "manage_agents")).Post("/agent", createAgent(deps))
	r.With(requireAllPermissions(deps, "manage_agents")).Put("/agent/{agent_id}", updateAgent(deps))
	r.With(requireAllPermissions(deps, "manage_agents")).Put("/agent/{agent_id}/shopify", updateAgent(deps))
	r.With(requireAnyPermissions(deps, "view_agents", "manage_agents")).Get("/agent/list", listAgents(deps))
	r.With(requireAnyPermissions(deps, "view_agents", "manage_agents")).Get("/agent/list/shopify", listAgents(deps))
	r.With(requireAnyPermissions(deps, "view_agents", "manage_agents")).Get("/agent/{agent_id}", getAgent(deps))
	r.With(requireAnyPermissions(deps, "view_agents", "manage_agents")).Get("/agent/{agent_id}/shopify", getAgent(deps))
	r.With(requireAnyPermissions(deps, "view_agents", "manage_agents")).Get("/agent/guardrail-default", guardrailDefault(deps))
	r.With(requireAnyPermissions(deps, "view_agents", "manage_agents")).Get("/agent/roster", roster(deps))
	r.With(requireAllPermissions(deps, "manage_agents")).Post("/agent/{agent_id}/customization", updateCustomization(deps))
	r.With(requireAllPermissions(deps, "manage_agents")).Post("/agent/{agent_id}/customization/shopify", updateCustomization(deps))
	r.With(requireAllPermissions(deps, "manage_agents")).Put("/agent/{agent_id}/groups", updateGroups(deps))
	r.With(requireAllPermissions(deps, "manage_agents")).Post("/agent/generate-instructions", generateAgentInstructions(deps))
	r.With(requireAllPermissions(deps, "manage_agents")).Post("/agent/{agent_id}/customization/photo", uploadAgentPhoto(deps))
	r.With(requireAllPermissions(deps, "manage_agents")).Post("/agent/{agent_id}/customization/photo/shopify", uploadAgentPhoto(deps))
}

func createAgent(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Agents == nil {
			Error(w, http.StatusInternalServerError, "Agent service is not configured")
			return
		}
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		var body createAgentRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if len(body.Name) < 1 || len(body.Name) > 100 || body.AgentType == "" || body.Instructions == nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid agent data")
			return
		}
		input := agent.CreateInput{
			Name: body.Name, Description: body.Description, AgentType: body.AgentType, Instructions: body.Instructions,
			Tools: body.Tools, IsActive: boolDefault(body.IsActive, true), IsDefault: boolDefault(body.IsDefault, false),
			TransferToHuman: boolDefault(body.TransferToHuman, false), AIRepliesEnabled: boolDefault(body.AIRepliesEnabled, true),
			AskForRating: boolDefault(body.AskForRating, false), HandoffCollectEmail: boolDefault(body.HandoffCollectEmail, true),
			HandoffCollectName: boolDefault(body.HandoffCollectName, true), EnableRateLimiting: boolDefault(body.EnableRateLimiting, false),
			OverallLimitPerIP: intDefault(body.OverallLimitPerIP, 100), RequestsPerSecond: floatDefault(body.RequestsPerSecond, 1),
			UseWorkflow: boolDefault(body.UseWorkflow, false), ActiveWorkflowID: body.ActiveWorkflowID,
			AllowAttachments: boolDefault(body.AllowAttachments, false), AllowedAttachmentTypes: body.AllowedAttachmentTypes,
			RequireTokenAuth: boolDefault(body.RequireTokenAuth, false), TicketingEnabled: boolDefault(body.TicketingEnabled, true),
			TopicScope: body.TopicScope, GuardrailPrompt: body.GuardrailPrompt, GuardrailEnabled: boolDefault(body.GuardrailEnabled, true),
			DisplayName: body.DisplayName,
		}
		created, err := deps.Agents.Create(r.Context(), *current.OrganizationID, input)
		if err != nil {
			deps.Logger.Error().Err(err).Msg("create agent failed")
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusCreated, created)
	}
}

func listAgents(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		if deps.Agents == nil {
			Error(w, http.StatusInternalServerError, "Agent service is not configured")
			return
		}
		agents, err := deps.Agents.List(r.Context(), *current.OrganizationID)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, agents)
	}
}

func getAgent(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		id, err := parsePathUUID(r, "agent_id")
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid agent ID")
			return
		}
		if deps.Agents == nil {
			Error(w, http.StatusInternalServerError, "Agent service is not configured")
			return
		}
		found, err := deps.Agents.Get(r.Context(), id, *current.OrganizationID)
		if errors.Is(err, pgx.ErrNoRows) || found == nil {
			Error(w, http.StatusNotFound, "Agent not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, found)
	}
}

func updateAgent(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		id, err := parsePathUUID(r, "agent_id")
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid agent ID")
			return
		}
		input, err := decodeObject(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if deps.Agents == nil {
			Error(w, http.StatusInternalServerError, "Agent service is not configured")
			return
		}
		updated, err := deps.Agents.Update(r.Context(), id, *current.OrganizationID, input)
		if errors.Is(err, pgx.ErrNoRows) || updated == nil {
			Error(w, http.StatusNotFound, "Agent not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, updated)
	}
}

func roster(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil || deps.Agents == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		items, err := deps.Agents.Roster(r.Context(), *current.OrganizationID)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, items)
	}
}

func guardrailDefault(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		// The enforcement text is code-owned. Organization-specific replacement is
		// added with the organization repository slice; keeping this endpoint live
		// now preserves the dashboard contract and the safe fallback.
		JSON(w, http.StatusOK, map[string]string{"prompt": "You are an AI assistant for this business. Stay within the business scope."})
	}
}

func generateAgentInstructions(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		var body instructionPromptRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		prompt := strings.TrimSpace(body.Prompt)
		if prompt == "" {
			Error(w, http.StatusBadRequest, "Prompt cannot be empty")
			return
		}
		if len([]rune(prompt)) > 1000 {
			Error(w, http.StatusBadRequest, "Prompt exceeds maximum length of 1000 characters")
			return
		}
		cfg, key, err := loadAIConfig(r.Context(), deps, *current.OrganizationID)
		if errors.Is(err, aiconfig.ErrNotFound) {
			Error(w, http.StatusNotFound, "No AI configuration found for your organization")
			return
		}
		if err != nil {
			deps.Logger.Error().Err(err).Msg("load instruction-generation AI configuration failed")
			Error(w, http.StatusServiceUnavailable, "AI configuration is unavailable")
			return
		}
		system := `You are an expert at creating instructions for customer-service AI assistants.
Generate clear, concise, actionable instructions. Avoid contradictions, cover behavior and boundaries, and return 3-7 instructions total. Each instruction should be 1-3 sentences. If existing instructions are provided, preserve their core intent and order, avoid duplicates, and return the complete usable list. Return only the instructions, one per line, without commentary.`
		userPrompt := "Please generate instructions for an AI agent with this purpose:\n" + prompt
		if len(body.ExistingInstructions) > 0 {
			items := make([]string, 0, len(body.ExistingInstructions))
			for _, item := range body.ExistingInstructions {
				if item = strings.TrimSpace(item); item != "" {
					items = append(items, "- "+cleanActionText(item, 1000))
				}
			}
			if len(items) > 0 {
				userPrompt += "\n\nExisting instructions:\n" + strings.Join(items, "\n")
			}
		}
		result, err := callConfiguredAI(r.Context(), cfg, key, system, userPrompt, 800, false)
		if err != nil {
			deps.Logger.Error().Err(err).Msg("generate agent instructions failed")
			Error(w, http.StatusServiceUnavailable, "Failed to generate instructions")
			return
		}
		instructions := parseInstructionList(result)
		if len(instructions) == 0 {
			Error(w, http.StatusServiceUnavailable, "Failed to generate instructions")
			return
		}
		JSON(w, http.StatusOK, instructions)
	}
}

func uploadAgentPhoto(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		id, err := parsePathUUID(r, "agent_id")
		if err != nil {
			Error(w, http.StatusNotFound, "Agent not found")
			return
		}
		if deps.Agents == nil {
			Error(w, http.StatusServiceUnavailable, "Agent service is not configured")
			return
		}
		found, err := deps.Agents.Get(r.Context(), id, *current.OrganizationID)
		if err != nil || found == nil {
			Error(w, http.StatusNotFound, "Agent not found")
			return
		}
		if err := r.ParseMultipartForm(6 << 20); err != nil {
			Error(w, http.StatusBadRequest, "A photo file is required")
			return
		}
		file, header, err := r.FormFile("photo")
		if err != nil {
			Error(w, http.StatusBadRequest, "A photo file is required")
			return
		}
		defer file.Close()
		data, err := io.ReadAll(io.LimitReader(file, 5<<20+1))
		if err != nil || len(data) > 5<<20 {
			Error(w, http.StatusBadRequest, "File size exceeds maximum limit of 5MB")
			return
		}
		contentType := strings.ToLower(strings.TrimSpace(header.Header.Get("Content-Type")))
		if contentType == "" {
			contentType = http.DetectContentType(data)
		}
		if !allowedAgentPhotoType(contentType, data) {
			Error(w, http.StatusBadRequest, "Only JPEG, PNG and WebP images are allowed")
			return
		}
		if !validAgentImage(contentType, data) {
			Error(w, http.StatusBadRequest, "Invalid image file")
			return
		}
		name := uuid.NewString() + agentPhotoExtension(contentType, header.Filename)
		var photoURL string
		if deps.Config.S3FileStorage {
			client, clientErr := newS3Client(deps.Config)
			if clientErr != nil {
				Error(w, http.StatusServiceUnavailable, "S3 file storage is not configured")
				return
			}
			key := filepath.ToSlash(filepath.Join("agents", current.OrganizationID.String(), name))
			if err := client.Put(r.Context(), key, data, contentType); err != nil {
				deps.Logger.Error().Err(err).Msg("upload agent photo to S3 failed")
				Error(w, http.StatusBadGateway, "Failed to upload photo")
				return
			}
			photoURL = s3ObjectURL(deps.Config, key)
		} else {
			relative := filepath.Join("agents", current.OrganizationID.String(), name)
			full := filepath.Join(deps.Config.UploadsDir, relative)
			if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
				Error(w, http.StatusInternalServerError, "Failed to upload photo")
				return
			}
			if err := os.WriteFile(full, data, 0o600); err != nil {
				Error(w, http.StatusInternalServerError, "Failed to upload photo")
				return
			}
			photoURL = deps.Config.APIBasePath + "/uploads/" + filepath.ToSlash(relative)
		}
		old := found.Customization
		input := agent.CustomizationInput{"photo_url": json.RawMessage(fmt.Sprintf("%q", photoURL))}
		customization, err := deps.Agents.UpsertCustomization(r.Context(), id, *current.OrganizationID, input)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to save photo")
			return
		}
		if old != nil && old.PhotoURL != nil {
			_ = deleteStoredAgentPhoto(r.Context(), deps.Config, *old.PhotoURL)
		}
		JSON(w, http.StatusOK, customization)
	}
}

func allowedAgentPhotoType(contentType string, data []byte) bool {
	if contentType == "image/jpg" {
		contentType = "image/jpeg"
	}
	if contentType == "image/jpeg" && len(data) >= 3 && data[0] == 0xff && data[1] == 0xd8 && data[2] == 0xff {
		return true
	}
	if contentType == "image/png" && len(data) >= 8 && bytes.Equal(data[:8], []byte{137, 80, 78, 71, 13, 10, 26, 10}) {
		return true
	}
	return contentType == "image/webp" && len(data) >= 12 && string(data[:4]) == "RIFF" && string(data[8:12]) == "WEBP"
}

func validAgentImage(contentType string, data []byte) bool {
	if contentType == "image/webp" {
		return len(data) >= 16
	}
	_, _, err := image.DecodeConfig(bytes.NewReader(data))
	return err == nil
}

func agentPhotoExtension(contentType, filename string) string {
	switch contentType {
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	default:
		if ext := strings.ToLower(filepath.Ext(filename)); ext == ".jpg" || ext == ".jpeg" {
			return ext
		}
		return ".jpg"
	}
}

func newS3Client(cfg config.Config) (*storage.Client, error) {
	return storage.NewClient(storage.S3Config{Bucket: cfg.S3Bucket, Region: cfg.S3Region, AccessKeyID: cfg.AWSAccessKeyID, SecretKey: cfg.AWSSecretAccessKey, SessionToken: cfg.AWSSessionToken})
}

func s3ObjectURL(cfg config.Config, key string) string {
	return "https://" + cfg.S3Bucket + ".s3." + cfg.S3Region + ".amazonaws.com/" + strings.TrimLeft(filepath.ToSlash(key), "/")
}

func deleteStoredAgentPhoto(ctx context.Context, cfg config.Config, value string) error {
	if cfg.S3FileStorage && strings.HasPrefix(value, "http") {
		parsed, err := url.Parse(value)
		if err != nil {
			return err
		}
		key := strings.TrimPrefix(parsed.Path, "/")
		key = strings.TrimPrefix(key, cfg.S3Bucket+"/")
		client, err := newS3Client(cfg)
		if err != nil {
			return err
		}
		return client.Delete(ctx, key)
	}
	marker := cfg.APIBasePath + "/uploads/"
	index := strings.Index(value, marker)
	if index < 0 || cfg.UploadsDir == "" {
		return nil
	}
	relative := filepath.FromSlash(strings.TrimPrefix(value[index+len(marker):], "/"))
	full, err := filepath.Abs(filepath.Join(cfg.UploadsDir, relative))
	if err != nil {
		return err
	}
	root, err := filepath.Abs(cfg.UploadsDir)
	if err != nil {
		return err
	}
	if full != root && !strings.HasPrefix(full, root+string(os.PathSeparator)) {
		return errors.New("photo path escapes upload root")
	}
	return os.Remove(full)
}

func updateCustomization(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		id, err := parsePathUUID(r, "agent_id")
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid agent ID")
			return
		}
		input, err := decodeObject(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if deps.Agents == nil {
			Error(w, http.StatusInternalServerError, "Agent service is not configured")
			return
		}
		customization, err := deps.Agents.UpsertCustomization(r.Context(), id, *current.OrganizationID, input)
		if errors.Is(err, pgx.ErrNoRows) || customization == nil {
			Error(w, http.StatusNotFound, "Agent not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, customization)
	}
}

func updateGroups(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil || deps.Agents == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		id, err := parsePathUUID(r, "agent_id")
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid agent ID")
			return
		}
		var groupIDs []uuid.UUID
		if err := json.NewDecoder(r.Body).Decode(&groupIDs); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		updated, err := deps.Agents.UpdateGroups(r.Context(), id, *current.OrganizationID, groupIDs)
		if errors.Is(err, pgx.ErrNoRows) || updated == nil {
			Error(w, http.StatusNotFound, "Agent not found")
			return
		}
		if err != nil {
			if strings.Contains(strings.ToLower(err.Error()), "invalid group") {
				Error(w, http.StatusBadRequest, "Invalid group IDs provided")
				return
			}
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, updated)
	}
}

func currentUserFromContext(r *http.Request) (*user.User, bool) {
	found, ok := r.Context().Value(currentUserKey).(*user.User)
	return found, ok && found != nil
}

func requireAllPermissions(deps Dependencies, permissions ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			found, err := currentUser(r, deps)
			if err != nil {
				w.Header().Set("WWW-Authenticate", "Bearer")
				Error(w, http.StatusUnauthorized, err.Error())
				return
			}
			if !hasAllPermissions(found, permissions...) {
				Error(w, http.StatusForbidden, "Not enough permissions")
				return
			}
			ctx := contextWithUser(r, found)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func requireAnyPermissions(deps Dependencies, permissions ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			found, err := currentUser(r, deps)
			if err != nil {
				w.Header().Set("WWW-Authenticate", "Bearer")
				Error(w, http.StatusUnauthorized, err.Error())
				return
			}
			if !hasAnyPermissions(found, permissions...) {
				Error(w, http.StatusForbidden, "Not enough permissions")
				return
			}
			ctx := contextWithUser(r, found)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func hasAllPermissions(found *user.User, permissions ...string) bool {
	if found == nil || found.Role == nil {
		return false
	}
	has := make(map[string]struct{}, len(found.Role.Permissions))
	for _, permission := range found.Role.Permissions {
		has[permission.Name] = struct{}{}
	}
	if _, ok := has["super_admin"]; ok {
		return true
	}
	for _, required := range permissions {
		if _, ok := has[required]; !ok {
			return false
		}
	}
	return true
}

func hasAnyPermissions(found *user.User, permissions ...string) bool {
	if found == nil || found.Role == nil {
		return false
	}
	has := make(map[string]struct{}, len(found.Role.Permissions))
	for _, permission := range found.Role.Permissions {
		has[permission.Name] = struct{}{}
	}
	if _, ok := has["super_admin"]; ok {
		return true
	}
	for _, required := range permissions {
		if _, ok := has[required]; ok {
			return true
		}
	}
	return false
}

func contextWithUser(r *http.Request, found *user.User) context.Context {
	return context.WithValue(r.Context(), currentUserKey, found)
}

func decodeJSON(r *http.Request, value any) error {
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(value); err != nil {
		return errors.New("Invalid JSON body")
	}
	return nil
}

func decodeObject(r *http.Request) (map[string]json.RawMessage, error) {
	var value map[string]json.RawMessage
	if err := decodeJSON(r, &value); err != nil {
		return nil, err
	}
	if value == nil {
		return nil, errors.New("JSON body must be an object")
	}
	return value, nil
}

func parsePathUUID(r *http.Request, name string) (uuid.UUID, error) {
	return uuid.Parse(chi.URLParam(r, name))
}

func boolDefault(value *bool, fallback bool) bool {
	if value == nil {
		return fallback
	}
	return *value
}

func intDefault(value *int32, fallback int32) int32 {
	if value == nil {
		return fallback
	}
	return *value
}

func floatDefault(value *float64, fallback float64) float64 {
	if value == nil {
		return fallback
	}
	return *value
}
