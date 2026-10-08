package httpapi

import (
	"encoding/json"
	"errors"
	"html"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/komi/komi/backend-go/internal/organization"
)

type cannedResponsePayload struct {
	Category string  `json:"category"`
	Title    string  `json:"title"`
	Content  string  `json:"content"`
	Shortcut *string `json:"shortcut"`
}

type cannedResponse struct {
	ID string `json:"id"`
	cannedResponsePayload
}

var (
	cannedHTMLPattern      = regexp.MustCompile(`(?is)<[^>]*>`)
	cannedLinkPattern      = regexp.MustCompile(`!?\[([^\]]*)\]\([^)]*\)`)
	defaultCannedResponses = []cannedResponse{
		{ID: "default-greeting", cannedResponsePayload: cannedResponsePayload{
			Category: "\u95ee\u5019", Title: "\u6807\u51c6\u6b22\u8fce\u8bed", Shortcut: stringPointer("/hello"), Content: "\u60a8\u597d\uff0c{{customer_name}}\uff01\u8bf7\u95ee\u6709\u4ec0\u4e48\u53ef\u4ee5\u5e2e\u60a8\u5904\u7406\uff1f",
		}},
		{ID: "default-shipping", cannedResponsePayload: cannedResponsePayload{
			Category: "\u7269\u6d41", Title: "\u7269\u6d41\u6838\u5b9e\u8bf4\u660e", Shortcut: stringPointer("/shipping"), Content: "\u6211\u6b63\u5728\u4e3a\u60a8\u6838\u5b9e\u8ba2\u5355 {{order_number}} \u7684\u6700\u65b0\u7269\u6d41\u4fe1\u606f\uff0c\u786e\u8ba4\u540e\u4f1a\u5c3d\u5feb\u56de\u590d\u60a8\u3002",
		}},
		{ID: "default-return", cannedResponsePayload: cannedResponsePayload{
			Category: "\u552e\u540e", Title: "\u9000\u6362\u8d27\u534f\u52a9", Shortcut: stringPointer("/return"), Content: "\u6211\u53ef\u4ee5\u534f\u52a9\u60a8\u6838\u5b9e\u9000\u6362\u8d27\u6761\u4ef6\u3002\u8bf7\u63d0\u4f9b\u8ba2\u5355\u53f7\u548c\u5546\u54c1\u60c5\u51b5\uff0c\u6211\u4f1a\u4e3a\u60a8\u7ee7\u7eed\u5904\u7406\u3002",
		}},
		{ID: "default-closing", cannedResponsePayload: cannedResponsePayload{
			Category: "\u7ed3\u675f", Title: "\u670d\u52a1\u7ed3\u675f\u8bed", Shortcut: stringPointer("/bye"), Content: "\u611f\u8c22\u60a8\u7684\u8054\u7cfb\u3002\u540e\u7eed\u5982\u6709\u95ee\u9898\uff0c\u6b22\u8fce\u968f\u65f6\u518d\u6b21\u54a8\u8be2\u3002",
		}},
	}
)

func registerCannedResponseRoutes(r chi.Router, deps Dependencies) {
	view := []string{"view_all_chats", "view_assigned_chats", "view_unassigned_chats", "manage_all_chats", "manage_assigned_chats"}
	r.With(requireAnyPermissions(deps, view...)).Get("/canned-responses", listCannedResponses(deps))
	r.With(requireAllPermissions(deps, "manage_organization")).Post("/canned-responses", createCannedResponse(deps))
	r.With(requireAllPermissions(deps, "manage_organization")).Put("/canned-responses/{response_id}", updateCannedResponse(deps))
	r.With(requireAllPermissions(deps, "manage_organization")).Delete("/canned-responses/{response_id}", deleteCannedResponse(deps))
}

func listCannedResponses(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		org, ok := loadCurrentOrganization(w, r, deps)
		if !ok {
			return
		}
		JSON(w, http.StatusOK, loadCannedResponses(org))
	}
}

func createCannedResponse(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		org, ok := loadCurrentOrganization(w, r, deps)
		if !ok {
			return
		}
		var payload cannedResponsePayload
		if err := decodeJSON(r, &payload); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		cleaned, err := normalizeCannedPayload(payload)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		responses := loadCannedResponses(org)
		if shortcutConflict(responses, cleaned.Shortcut, "") {
			Error(w, http.StatusConflict, "Shortcut already exists")
			return
		}
		created := cannedResponse{ID: uuid.NewString(), cannedResponsePayload: cleaned}
		responses = append(responses, created)
		if !saveCannedResponses(w, r, deps, org, responses) {
			return
		}
		JSON(w, http.StatusCreated, created)
	}
}

func updateCannedResponse(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		org, ok := loadCurrentOrganization(w, r, deps)
		if !ok {
			return
		}
		responseID := chi.URLParam(r, "response_id")
		var payload cannedResponsePayload
		if err := decodeJSON(r, &payload); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		cleaned, err := normalizeCannedPayload(payload)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		responses := loadCannedResponses(org)
		index := -1
		for i := range responses {
			if responses[i].ID == responseID {
				index = i
				break
			}
		}
		if index < 0 {
			Error(w, http.StatusNotFound, "Canned response not found")
			return
		}
		if shortcutConflict(responses, cleaned.Shortcut, responseID) {
			Error(w, http.StatusConflict, "Shortcut already exists")
			return
		}
		updated := cannedResponse{ID: responseID, cannedResponsePayload: cleaned}
		responses[index] = updated
		if !saveCannedResponses(w, r, deps, org, responses) {
			return
		}
		JSON(w, http.StatusOK, updated)
	}
}

func deleteCannedResponse(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		org, ok := loadCurrentOrganization(w, r, deps)
		if !ok {
			return
		}
		responseID := chi.URLParam(r, "response_id")
		responses := loadCannedResponses(org)
		remaining := make([]cannedResponse, 0, len(responses))
		found := false
		for _, response := range responses {
			if response.ID == responseID {
				found = true
				continue
			}
			remaining = append(remaining, response)
		}
		if !found {
			Error(w, http.StatusNotFound, "Canned response not found")
			return
		}
		if !saveCannedResponses(w, r, deps, org, remaining) {
			return
		}
		NoContent(w)
	}
}

func loadCurrentOrganization(w http.ResponseWriter, r *http.Request, deps Dependencies) (*organization.Organization, bool) {
	current, ok := currentUserFromContext(r)
	if !ok || current.OrganizationID == nil {
		Error(w, http.StatusForbidden, "User is not associated with any organization")
		return nil, false
	}
	if deps.Organizations == nil {
		Error(w, http.StatusInternalServerError, "Organization service is not configured")
		return nil, false
	}
	found, err := deps.Organizations.Get(r.Context(), *current.OrganizationID)
	if err != nil {
		Error(w, http.StatusInternalServerError, "Failed to load organization")
		return nil, false
	}
	if found == nil {
		Error(w, http.StatusNotFound, "Organization not found")
		return nil, false
	}
	return found, true
}

func loadCannedResponses(org *organization.Organization) []cannedResponse {
	if org == nil || org.Settings == nil {
		return cloneDefaultCannedResponses()
	}
	stored, ok := org.Settings["canned_responses"]
	if !ok {
		return cloneDefaultCannedResponses()
	}
	raw, err := json.Marshal(stored)
	if err != nil {
		return cloneDefaultCannedResponses()
	}
	var candidates []cannedResponse
	if json.Unmarshal(raw, &candidates) != nil {
		return cloneDefaultCannedResponses()
	}
	responses := make([]cannedResponse, 0, len(candidates))
	for _, candidate := range candidates {
		if candidate.ID == "" {
			continue
		}
		cleaned, err := normalizeCannedPayload(candidate.cannedResponsePayload)
		if err == nil {
			responses = append(responses, cannedResponse{ID: candidate.ID, cannedResponsePayload: cleaned})
		}
	}
	return responses
}

func cloneDefaultCannedResponses() []cannedResponse {
	result := make([]cannedResponse, len(defaultCannedResponses))
	copy(result, defaultCannedResponses)
	return result
}

func saveCannedResponses(w http.ResponseWriter, r *http.Request, deps Dependencies, org *organization.Organization, responses []cannedResponse) bool {
	if deps.Organizations == nil || org == nil {
		Error(w, http.StatusInternalServerError, "Organization service is not configured")
		return false
	}
	settings := make(map[string]any, len(org.Settings)+1)
	for key, value := range org.Settings {
		settings[key] = value
	}
	settings["canned_responses"] = responses
	raw, err := json.Marshal(settings)
	if err != nil {
		Error(w, http.StatusInternalServerError, "Failed to save canned responses")
		return false
	}
	if _, err := deps.Organizations.Update(r.Context(), org.ID, organization.UpdateInput{"settings": raw}); err != nil {
		Error(w, http.StatusInternalServerError, "Failed to save canned responses")
		return false
	}
	return true
}

func normalizeCannedPayload(payload cannedResponsePayload) (cannedResponsePayload, error) {
	category, err := normalizeCannedText(payload.Category, "Category", 64, false)
	if err != nil {
		return cannedResponsePayload{}, err
	}
	title, err := normalizeCannedText(payload.Title, "Title", 120, false)
	if err != nil {
		return cannedResponsePayload{}, err
	}
	content, err := normalizeCannedText(payload.Content, "Content", 8000, true)
	if err != nil {
		return cannedResponsePayload{}, err
	}
	shortcut := ""
	if payload.Shortcut != nil {
		shortcut = strings.TrimSpace(*payload.Shortcut)
	}
	if shortcut != "" && (!strings.HasPrefix(shortcut, "/") || utf8.RuneCountInString(shortcut) > 40 || strings.IndexFunc(shortcut, func(r rune) bool { return r == ' ' || r == '\t' || r == '\n' || r == '\r' }) >= 0) {
		return cannedResponsePayload{}, errors.New("Shortcut must start with /, contain no spaces, and be at most 40 characters")
	}
	var shortcutValue *string
	if shortcut != "" {
		shortcutValue = &shortcut
	}
	return cannedResponsePayload{Category: category, Title: title, Content: content, Shortcut: shortcutValue}, nil
}

func normalizeCannedText(value, label string, maximum int, multiline bool) (string, error) {
	value = cannedSanitize(value)
	value = strings.TrimSpace(value)
	if !multiline {
		value = strings.Join(strings.Fields(value), " ")
	}
	if value == "" {
		return "", errors.New(label + " is required")
	}
	if utf8.RuneCountInString(value) > maximum {
		return "", errors.New(label + " cannot exceed " + strconv.Itoa(maximum) + " characters")
	}
	return value, nil
}

func cannedSanitize(value string) string {
	value = html.UnescapeString(value)
	value = cannedLinkPattern.ReplaceAllString(value, "$1")
	return cannedHTMLPattern.ReplaceAllString(value, "")
}

func shortcutConflict(values []cannedResponse, shortcut *string, currentID string) bool {
	if shortcut == nil || *shortcut == "" {
		return false
	}
	for _, value := range values {
		if value.ID != currentID && value.Shortcut != nil && *value.Shortcut == *shortcut {
			return true
		}
	}
	return false
}

func stringPointer(value string) *string { return &value }
