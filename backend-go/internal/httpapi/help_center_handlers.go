package httpapi

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"image"
	_ "image/jpeg"
	"image/png"
	"io"
	"mime"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/chattermate/chattermate/backend-go/internal/config"
	"github.com/chattermate/chattermate/backend-go/internal/guardrail"
	"github.com/chattermate/chattermate/backend-go/internal/helpcenter"
	"github.com/chattermate/chattermate/backend-go/internal/knowledge"
)

const (
	maxHelpCenterImageBytes    = 2 * 1024 * 1024
	maxHelpCenterFAQImageBytes = 5 * 1024 * 1024
)

const helpCenterAskUnavailable = "Could not answer right now - please try again."

var helpCenterAskGate = make(chan struct{}, 4)

type helpCenterRateWindow struct {
	started time.Time
	count   int
}

var helpCenterAskRate = struct {
	sync.Mutex
	values map[string]helpCenterRateWindow
}{values: make(map[string]helpCenterRateWindow)}

func registerHelpCenterAdminRoutes(r chi.Router, deps Dependencies) {
	manage := requireAllPermissions(deps, "manage_knowledge")
	r.With(manage).Get("/help-center/settings", getHelpCenterSettings(deps))
	r.With(manage).Put("/help-center/settings", updateHelpCenterSettings(deps))
	r.With(manage).Post("/help-center/logo", uploadHelpCenterBranding(deps, false))
	r.With(manage).Delete("/help-center/logo", removeHelpCenterBranding(deps, false))
	r.With(manage).Post("/help-center/favicon", uploadHelpCenterBranding(deps, true))
	r.With(manage).Delete("/help-center/favicon", removeHelpCenterBranding(deps, true))
	r.With(manage).Post("/help-center/domain", setHelpCenterDomain(deps))
	r.With(manage).Delete("/help-center/domain", removeHelpCenterDomain(deps))
	r.With(manage).Get("/help-center/domain/status", getHelpCenterDomainStatus(deps))
	r.With(manage).Post("/help-center/domain/verify", verifyHelpCenterDomain(deps))

	r.With(manage).Get("/help-center/faqs", listHelpCenterFAQs(deps))
	r.With(manage).Get("/help-center/faqs/categories", listHelpCenterFAQCategories(deps))
	r.With(manage).Post("/help-center/faqs", createHelpCenterFAQ(deps))
	r.With(manage).Put("/help-center/faqs/{faq_id}", updateHelpCenterFAQ(deps))
	r.With(manage).Delete("/help-center/faqs/{faq_id}", deleteHelpCenterFAQ(deps))
	r.With(manage).Post("/help-center/faqs/bulk-status", bulkHelpCenterFAQStatus(deps))
	r.With(manage).Post("/help-center/faqs/bulk-delete", bulkDeleteHelpCenterFAQs(deps))
	r.With(manage).Post("/help-center/faqs/image", uploadHelpCenterFAQImage(deps))

	r.With(manage).Get("/help-center/generate/estimate", estimateHelpCenterGeneration(deps))
	r.With(manage).Post("/help-center/generate", startHelpCenterGeneration(deps))
	r.With(manage).Post("/help-center/import", startHelpCenterImport(deps))
	r.With(manage).Post("/help-center/import/pdf", startHelpCenterPDFImport(deps))
	r.With(manage).Get("/help-center/jobs", getHelpCenterJob(deps))
	r.With(manage).Get("/help-center/jobs/{job_id}", getHelpCenterJobByID(deps))

	// Backward compatibility aliases for nested routes if any clients use them
	r.With(manage).Get("/help-center/branding/settings", getHelpCenterSettings(deps))
	r.With(manage).Put("/help-center/branding/settings", updateHelpCenterSettings(deps))
	r.With(manage).Post("/help-center/branding/logo", uploadHelpCenterBranding(deps, false))
	r.With(manage).Delete("/help-center/branding/logo", removeHelpCenterBranding(deps, false))
	r.With(manage).Post("/help-center/branding/favicon", uploadHelpCenterBranding(deps, true))
	r.With(manage).Delete("/help-center/branding/favicon", removeHelpCenterBranding(deps, true))
	r.With(manage).Post("/help-center/domain/domain", setHelpCenterDomain(deps))
	r.With(manage).Delete("/help-center/domain/domain", removeHelpCenterDomain(deps))
	r.With(manage).Get("/help-center/domain/domain/status", getHelpCenterDomainStatus(deps))
	r.With(manage).Post("/help-center/domain/domain/verify", verifyHelpCenterDomain(deps))
	r.With(manage).Get("/help-center/faqs/faqs", listHelpCenterFAQs(deps))
	r.With(manage).Get("/help-center/faqs/faqs/categories", listHelpCenterFAQCategories(deps))
	r.With(manage).Post("/help-center/faqs/faqs", createHelpCenterFAQ(deps))
	r.With(manage).Put("/help-center/faqs/faqs/{faq_id}", updateHelpCenterFAQ(deps))
	r.With(manage).Delete("/help-center/faqs/faqs/{faq_id}", deleteHelpCenterFAQ(deps))
	r.With(manage).Post("/help-center/faqs/faqs/bulk-status", bulkHelpCenterFAQStatus(deps))
	r.With(manage).Post("/help-center/faqs/faqs/bulk-delete", bulkDeleteHelpCenterFAQs(deps))
	r.With(manage).Post("/help-center/faqs/faqs/image", uploadHelpCenterFAQImage(deps))
	r.With(manage).Get("/help-center/generation/generate/estimate", estimateHelpCenterGeneration(deps))
	r.With(manage).Post("/help-center/generation/generate", startHelpCenterGeneration(deps))
	r.With(manage).Post("/help-center/generation/import", startHelpCenterImport(deps))
	r.With(manage).Post("/help-center/generation/import/pdf", startHelpCenterPDFImport(deps))
	r.With(manage).Get("/help-center/generation/jobs", getHelpCenterJob(deps))
	r.With(manage).Get("/help-center/generation/jobs/{job_id}", getHelpCenterJobByID(deps))
}

func helpCenterRepository(w http.ResponseWriter, deps Dependencies) *helpcenter.Repository {
	if deps.HelpCenters == nil {
		Error(w, http.StatusServiceUnavailable, "Help center storage is not configured")
		return nil
	}
	return deps.HelpCenters
}

func helpCenterUser(r *http.Request) (uuid.UUID, *uuid.UUID, bool) {
	current, ok := currentUserFromContext(r)
	if !ok || current.OrganizationID == nil {
		return uuid.Nil, nil, false
	}
	id := current.ID
	org := *current.OrganizationID
	return org, &id, true
}

func helpCenterSettingsResponse(r *http.Request, deps Dependencies, row *helpcenter.Settings) map[string]any {
	result := map[string]any{
		"enabled": row.Enabled, "slug": row.Slug, "title": row.Title, "description": row.Description,
		"logo_url": row.LogoURL, "favicon_url": row.FaviconURL, "brand_color": row.BrandColor,
		"header_links": row.HeaderLinks, "cta_text": row.CTAText, "cta_url": row.CTAURL,
		"cta_enabled": row.CTAEnabled, "auto_generate": row.AutoGenerate, "agent_id": row.AgentID,
		"ai_search_enabled": row.AISearchEnabled, "chat_widget_enabled": row.ChatWidgetEnabled,
	}
	if deps.DB != nil {
		var published int
		_ = deps.DB.QueryRow(r.Context(), `SELECT COUNT(*) FROM faqs WHERE organization_id=$1 AND status='published'`, row.OrganizationID).Scan(&published)
		result["published_count"] = published
		rows, err := deps.DB.Query(r.Context(), `SELECT a.id,COALESCE(a.display_name,a.name),EXISTS(SELECT 1 FROM widgets w WHERE w.agent_id=a.id) FROM agents a WHERE a.organization_id=$1 ORDER BY COALESCE(a.display_name,a.name),a.id`, row.OrganizationID)
		if err == nil {
			defer rows.Close()
			agents := make([]map[string]any, 0)
			for rows.Next() {
				var id uuid.UUID
				var name string
				var widget bool
				if rows.Scan(&id, &name, &widget) == nil {
					agents = append(agents, map[string]any{"id": id, "name": name, "has_widget": widget})
				}
			}
			result["agents"] = agents
		}
	}
	result["plan_allowed"] = true
	result["live_url"] = helpCenterLiveURL(deps.Config, row)
	result["domain"] = helpCenterDomainResponse(deps.Config, row)
	return result
}

func helpCenterLiveURL(cfg config.Config, row *helpcenter.Settings) string {
	if row == nil || row.Slug == nil {
		return ""
	}
	base := strings.TrimRight(cfg.BackendURL, "/")
	if strings.EqualFold(cfg.HelpCenterPublicMode, "subdomain") && cfg.HelpCenterBaseDomain != "" {
		return "https://" + *row.Slug + "." + cfg.HelpCenterBaseDomain
	}
	return base + "/help/" + url.PathEscape(*row.Slug)
}

func helpCenterDomainResponse(cfg config.Config, row *helpcenter.Settings) map[string]any {
	result := map[string]any{"custom_domain": nil, "domain_status": row.DomainStatus(), "ssl_status": row.SSLStatus, "records": []any{}, "domain_verified_at": row.DomainVerifiedAt}
	if row.CustomDomain != nil && strings.TrimSpace(*row.CustomDomain) != "" {
		result["custom_domain"] = *row.CustomDomain
		result["records"] = []map[string]any{
			{"type": "CNAME", "host": *row.CustomDomain, "value": cfg.HelpCenterCNAME, "verified": row.CNAMERecordVerified},
			{"type": "TXT", "host": "_chattermate." + *row.CustomDomain, "value": "cm-verify=" + helpCenterStringValue(row.DomainVerificationToken), "verified": row.TXTRecordVerified},
		}
	}
	return result
}

func getHelpCenterSettings(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, _, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		row, err := repo.EnsureSettings(r.Context(), org)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, helpCenterSettingsResponse(r, deps, row))
	}
}

func updateHelpCenterSettings(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, _, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		var raw map[string]json.RawMessage
		if err := decodeJSON(r, &raw); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		values, err := parseHelpCenterSettings(raw)
		if err != nil {
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if id, exists := values["agent_id"]; exists && id != nil {
			var agent uuid.UUID
			if err := json.Unmarshal(raw["agent_id"], &agent); err != nil {
				Error(w, http.StatusBadRequest, "Invalid agent ID")
				return
			}
			var found bool
			if deps.DB != nil {
				_ = deps.DB.QueryRow(r.Context(), `SELECT EXISTS(SELECT 1 FROM agents WHERE id=$1 AND organization_id=$2)`, agent, org).Scan(&found)
			}
			if !found {
				Error(w, http.StatusNotFound, "Agent not found")
				return
			}
		}
		row, err := repo.EnsureSettings(r.Context(), org)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		_ = row
		row, err = repo.UpdateSettings(r.Context(), org, values)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, helpCenterSettingsResponse(r, deps, row))
	}
}

func parseHelpCenterSettings(raw map[string]json.RawMessage) (map[string]any, error) {
	values := make(map[string]any)
	stringFields := []string{"title", "description", "brand_color", "cta_text", "cta_url"}
	for _, field := range stringFields {
		if data, ok := raw[field]; ok {
			var value *string
			if string(data) != "null" {
				if err := json.Unmarshal(data, &value); err != nil {
					return nil, fmt.Errorf("invalid %s", field)
				}
			}
			values[field] = value
		}
	}
	for _, field := range []string{"enabled", "cta_enabled", "auto_generate", "ai_search_enabled", "chat_widget_enabled"} {
		if data, ok := raw[field]; ok {
			var value bool
			if err := json.Unmarshal(data, &value); err != nil {
				return nil, fmt.Errorf("invalid %s", field)
			}
			values[field] = value
		}
	}
	if data, ok := raw["agent_id"]; ok {
		if string(data) == "null" {
			values["agent_id"] = nil
		} else {
			var value uuid.UUID
			if err := json.Unmarshal(data, &value); err != nil {
				return nil, errors.New("Invalid agent ID")
			}
			values["agent_id"] = value
		}
	}
	if data, ok := raw["header_links"]; ok {
		var links []map[string]any
		if err := json.Unmarshal(data, &links); err != nil || len(links) > 6 {
			return nil, errors.New("header_links must be a list of at most 6 links")
		}
		values["header_links"] = links
	}
	if value, ok := values["brand_color"].(*string); ok && value != nil {
		matched, _ := regexp.MatchString(`^#[0-9a-fA-F]{3}([0-9a-fA-F]{3}|[0-9a-fA-F]{5})?$`, strings.TrimSpace(*value))
		if !matched {
			return nil, errors.New("brand_color must be a hex color like #4338CA")
		}
		*value = strings.TrimSpace(*value)
	}
	return values, nil
}

func uploadHelpCenterBranding(deps Dependencies, favicon bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, _, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		if err := r.ParseMultipartForm(maxHelpCenterImageBytes + 512*1024); err != nil {
			Error(w, http.StatusBadRequest, "Invalid multipart form")
			return
		}
		file, _, err := r.FormFile("file")
		if err != nil {
			Error(w, http.StatusBadRequest, "Image file is required")
			return
		}
		defer file.Close()
		limit := int64(maxHelpCenterImageBytes)
		if favicon {
			limit = 1 * 1024 * 1024
		}
		data, err := io.ReadAll(io.LimitReader(file, limit+1))
		if err != nil || int64(len(data)) > limit {
			Error(w, http.StatusRequestEntityTooLarge, "Image is too large")
			return
		}
		encoded, err := normalizeHelpCenterImage(data)
		if err != nil {
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		stored, err := saveHelpCenterAsset(deps.Config.UploadsDir, org, "branding", encoded)
		if err != nil {
			Error(w, http.StatusInternalServerError, "File upload failed")
			return
		}
		field := "logo_url"
		if favicon {
			field = "favicon_url"
		}
		row, err := repo.EnsureSettings(r.Context(), org)
		if err == nil {
			row, err = repo.UpdateSettings(r.Context(), org, map[string]any{field: stored})
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, helpCenterSettingsResponse(r, deps, row))
	}
}

func removeHelpCenterBranding(deps Dependencies, favicon bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, _, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		field := "logo_url"
		if favicon {
			field = "favicon_url"
		}
		row, err := repo.UpdateSettings(r.Context(), org, map[string]any{field: nil})
		if errors.Is(err, helpcenter.ErrNotFound) {
			row, err = repo.EnsureSettings(r.Context(), org)
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, helpCenterSettingsResponse(r, deps, row))
	}
}

func setHelpCenterDomain(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, _, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		var body struct {
			Domain string `json:"domain"`
		}
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		domain, err := normalizeHelpCenterDomain(body.Domain)
		if err != nil {
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		_, _ = repo.EnsureSettings(r.Context(), org)
		row, err := repo.SetDomain(r.Context(), org, domain)
		if errors.Is(err, helpcenter.ErrConflict) {
			Error(w, http.StatusConflict, "That domain is already in use.")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, helpCenterDomainResponse(deps.Config, row))
	}
}

func removeHelpCenterDomain(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, _, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		_, _ = repo.EnsureSettings(r.Context(), org)
		row, err := repo.ClearDomain(r.Context(), org)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, helpCenterDomainResponse(deps.Config, row))
	}
}

func getHelpCenterDomainStatus(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, _, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		row, err := repo.EnsureSettings(r.Context(), org)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, helpCenterDomainResponse(deps.Config, row))
	}
}

func verifyHelpCenterDomain(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, _, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		row, err := repo.EnsureSettings(r.Context(), org)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if row.CustomDomain == nil || strings.TrimSpace(*row.CustomDomain) == "" {
			Error(w, http.StatusBadRequest, "Set a custom domain first.")
			return
		}
		txt := false
		if row.DomainVerificationToken != nil {
			records, lookupErr := net.LookupTXT("_chattermate." + *row.CustomDomain)
			if lookupErr == nil {
				expected := "cm-verify=" + *row.DomainVerificationToken
				for _, record := range records {
					if strings.TrimSpace(record) == expected {
						txt = true
						break
					}
				}
			}
		}
		cname := false
		cnameValue, lookupErr := net.LookupCNAME(*row.CustomDomain)
		if lookupErr == nil {
			cname = strings.TrimSuffix(strings.ToLower(cnameValue), ".") == strings.TrimSuffix(strings.ToLower(deps.Config.HelpCenterCNAME), ".")
		}
		ssl := "none"
		if txt && cname {
			ssl = "pending"
			client := &http.Client{Timeout: 5 * time.Second, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}
			response, requestErr := client.Get("https://" + *row.CustomDomain)
			if requestErr == nil && response != nil {
				response.Body.Close()
				if response.StatusCode >= 200 && response.StatusCode < 500 {
					ssl = "active"
				}
			}
		}
		row, err = repo.SetDomainVerification(r.Context(), org, txt, cname, ssl)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, helpCenterDomainResponse(deps.Config, row))
	}
}

func listHelpCenterFAQs(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, _, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		page, size := paginationQuery(r)
		if size > 200 {
			size = 200
		}
		items, total, err := repo.ListFAQs(r.Context(), org, r.URL.Query().Get("status"), r.URL.Query().Get("category"), r.URL.Query().Get("q"), (page-1)*size, size)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]any{"faqs": items, "pagination": map[string]any{"total": total, "page": page, "page_size": size, "total_pages": (total + size - 1) / size}})
	}
}

func listHelpCenterFAQCategories(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, _, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		values, err := repo.Categories(r.Context(), org)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, values)
	}
}

func createHelpCenterFAQ(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, userID, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		var body struct {
			Question        string  `json:"question"`
			Answer          string  `json:"answer"`
			Category        string  `json:"category"`
			Status          string  `json:"status"`
			Slug            *string `json:"slug"`
			URLPath         *string `json:"url_path"`
			MetaTitle       *string `json:"meta_title"`
			MetaDescription *string `json:"meta_description"`
		}
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		body.Question = strings.TrimSpace(body.Question)
		body.Answer = strings.TrimSpace(body.Answer)
		body.Category = strings.TrimSpace(body.Category)
		if body.Question == "" || body.Answer == "" {
			Error(w, http.StatusUnprocessableEntity, "question and answer must not be blank")
			return
		}
		if body.Category == "" {
			body.Category = "General"
		}
		if body.Status == "" {
			body.Status = "draft"
		}
		if body.Status != "draft" && body.Status != "published" {
			Error(w, http.StatusBadRequest, "Invalid FAQ status")
			return
		}
		if body.URLPath != nil {
			if path, valid := helpcenter.NormalizeURLPath(*body.URLPath); valid {
				body.URLPath = &path
			} else if strings.TrimSpace(*body.URLPath) != "" {
				Error(w, http.StatusBadRequest, "Invalid article URL path")
				return
			}
		}
		item := helpcenter.FAQ{OrganizationID: org, Question: body.Question, Answer: body.Answer, Category: body.Category, Status: body.Status, Slug: body.Slug, URLPath: body.URLPath, MetaTitle: body.MetaTitle, MetaDescription: body.MetaDescription, SourceLabel: helpCenterStringPtr("Added manually"), CreatedBy: userID}
		created, err := repo.CreateFAQ(r.Context(), item)
		if errors.Is(err, helpcenter.ErrConflict) {
			Error(w, http.StatusConflict, "FAQ already exists")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusCreated, created)
	}
}

func updateHelpCenterFAQ(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, _, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		id, err := uuid.Parse(chi.URLParam(r, "faq_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid FAQ ID")
			return
		}
		var raw map[string]json.RawMessage
		if err := decodeJSON(r, &raw); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		values, err := faqUpdateValues(raw)
		if err != nil {
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if slug, exists := values["slug"]; exists && slug != nil {
			generated, err := repo.UniqueSlug(r.Context(), org, slug.(string), id)
			if err != nil {
				Error(w, http.StatusInternalServerError, err.Error())
				return
			}
			values["slug"] = generated
		}
		updated, err := repo.UpdateFAQ(r.Context(), org, id, values)
		if errors.Is(err, helpcenter.ErrNotFound) {
			Error(w, http.StatusNotFound, "FAQ not found")
			return
		}
		if errors.Is(err, helpcenter.ErrConflict) {
			Error(w, http.StatusConflict, "Another FAQ already uses that slug")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, updated)
	}
}

func faqUpdateValues(raw map[string]json.RawMessage) (map[string]any, error) {
	values := make(map[string]any)
	for _, field := range []string{"question", "answer", "category", "status", "meta_title", "meta_description"} {
		if data, ok := raw[field]; ok {
			var value *string
			if string(data) != "null" {
				if err := json.Unmarshal(data, &value); err != nil {
					return nil, fmt.Errorf("invalid %s", field)
				}
			}
			if value != nil {
				*value = strings.TrimSpace(*value)
			}
			values[field] = value
		}
	}
	if data, ok := raw["slug"]; ok {
		var value *string
		if string(data) != "null" {
			if err := json.Unmarshal(data, &value); err != nil {
				return nil, errors.New("invalid slug")
			}
		}
		if value != nil {
			*value = strings.TrimSpace(*value)
		}
		if value != nil && *value != "" {
			values["slug"] = *value
		}
	}
	if data, ok := raw["url_path"]; ok {
		var value *string
		if string(data) != "null" {
			if err := json.Unmarshal(data, &value); err != nil {
				return nil, errors.New("invalid url_path")
			}
		}
		if value == nil || strings.TrimSpace(helpCenterStringValue(value)) == "" {
			values["url_path"] = nil
		} else {
			normalized, valid := helpcenter.NormalizeURLPath(*value)
			if !valid {
				return nil, errors.New("Invalid article URL path")
			}
			values["url_path"] = normalized
		}
	}
	if value, ok := values["status"].(*string); ok && value != nil && *value != "draft" && *value != "published" {
		return nil, errors.New("Invalid FAQ status")
	}
	return values, nil
}

func deleteHelpCenterFAQ(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, _, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		id, err := uuid.Parse(chi.URLParam(r, "faq_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid FAQ ID")
			return
		}
		err = repo.DeleteFAQ(r.Context(), org, id)
		if errors.Is(err, helpcenter.ErrNotFound) {
			Error(w, http.StatusNotFound, "FAQ not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		NoContent(w)
	}
}

func bulkHelpCenterFAQStatus(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, _, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		var body struct {
			FAQIDs []uuid.UUID `json:"faq_ids"`
			Status string      `json:"status"`
		}
		if err := decodeJSON(r, &body); err != nil || len(body.FAQIDs) == 0 || len(body.FAQIDs) > 200 {
			Error(w, http.StatusUnprocessableEntity, "faq_ids is required")
			return
		}
		if body.Status != "draft" && body.Status != "published" {
			Error(w, http.StatusBadRequest, "Invalid FAQ status")
			return
		}
		count, err := repo.BulkStatus(r.Context(), org, body.FAQIDs, body.Status)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]any{"updated": count})
	}
}

func bulkDeleteHelpCenterFAQs(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, _, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		var body struct {
			FAQIDs []uuid.UUID `json:"faq_ids"`
		}
		if err := decodeJSON(r, &body); err != nil || len(body.FAQIDs) == 0 || len(body.FAQIDs) > 200 {
			Error(w, http.StatusUnprocessableEntity, "faq_ids is required")
			return
		}
		count, err := repo.BulkDelete(r.Context(), org, body.FAQIDs)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]any{"deleted": count})
	}
}

func uploadHelpCenterFAQImage(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, userID, ok := helpCenterUser(r)
		_ = userID
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		current, _ := currentUserFromContext(r)
		if current == nil || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		if err := r.ParseMultipartForm(maxHelpCenterFAQImageBytes + 512*1024); err != nil {
			Error(w, http.StatusBadRequest, "Invalid multipart form")
			return
		}
		file, _, err := r.FormFile("file")
		if err != nil {
			Error(w, http.StatusBadRequest, "Image file is required")
			return
		}
		defer file.Close()
		data, err := io.ReadAll(io.LimitReader(file, maxHelpCenterFAQImageBytes+1))
		if err != nil || len(data) > maxHelpCenterFAQImageBytes {
			Error(w, http.StatusRequestEntityTooLarge, "Image is too large")
			return
		}
		normalized, err := normalizeHelpCenterImage(data)
		if err != nil {
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		path, err := saveHelpCenterAsset(deps.Config.UploadsDir, *current.OrganizationID, "articles", normalized)
		if err != nil {
			Error(w, http.StatusInternalServerError, "File upload failed")
			return
		}
		JSON(w, http.StatusOK, map[string]string{"url": "/api/v1/uploads/" + strings.TrimPrefix(path, "/api/v1/uploads/")})
	}
}

func estimateHelpCenterGeneration(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, _, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		total, fresh, pages, calls, err := repo.Estimate(r.Context(), org)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]any{"total_sources": total, "new_sources": fresh, "pages": pages, "estimated_calls": calls, "metered": false, "remaining_credits": nil, "sources": []any{}})
	}
}

func startHelpCenterGeneration(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, userID, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		var body struct {
			KnowledgeIDs []int64 `json:"knowledge_ids"`
		}
		if r.Body != nil {
			_ = json.NewDecoder(r.Body).Decode(&body)
		}
		total, fresh, _, calls, err := repo.Estimate(r.Context(), org)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if total == 0 {
			Error(w, http.StatusBadRequest, "No knowledge sources to generate from. Add knowledge first.")
			return
		}
		if fresh == 0 && len(body.KnowledgeIDs) == 0 {
			Error(w, http.StatusConflict, "All knowledge sources already have FAQs.")
			return
		}
		job, err := repo.CreateJob(r.Context(), helpcenter.Job{OrganizationID: org, UserID: userID, JobType: "generate_all", KnowledgeIDs: body.KnowledgeIDs, Metered: false, Status: "pending", Stage: "not_started", ProgressPercentage: 0})
		_ = calls
		if errors.Is(err, helpcenter.ErrConflict) {
			Error(w, http.StatusConflict, "A job of this type is already running.")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusAccepted, job)
	}
}

func startHelpCenterImport(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, userID, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		var body struct {
			URL          string `json:"url"`
			Mode         string `json:"mode"`
			PreserveURLs bool   `json:"preserve_urls"`
		}
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		parsed, err := url.Parse(strings.TrimSpace(body.URL))
		if err != nil || parsed.Scheme != "https" || parsed.Hostname() == "" {
			Error(w, http.StatusBadRequest, "Invalid URL")
			return
		}
		if body.Mode == "" {
			body.Mode = "qa"
		}
		if body.Mode != "qa" && body.Mode != "articles" {
			Error(w, http.StatusBadRequest, "Invalid import mode")
			return
		}
		jobType := "import_url"
		if body.Mode == "articles" {
			jobType = "import_articles"
		}
		job, err := repo.CreateJob(r.Context(), helpcenter.Job{OrganizationID: org, UserID: userID, JobType: jobType, SourceURL: helpCenterStringPtr(body.URL), PreserveSourceURLs: body.PreserveURLs, Metered: body.Mode == "qa", Status: "pending", Stage: "not_started"})
		if errors.Is(err, helpcenter.ErrConflict) {
			Error(w, http.StatusConflict, "A job of this type is already running.")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusAccepted, job)
	}
}

func startHelpCenterPDFImport(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, userID, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		if err := r.ParseMultipartForm(25*1024*1024 + 512*1024); err != nil {
			Error(w, http.StatusBadRequest, "Invalid multipart form")
			return
		}
		file, header, err := r.FormFile("file")
		if err != nil {
			Error(w, http.StatusBadRequest, "PDF file is required")
			return
		}
		defer file.Close()
		data, err := io.ReadAll(io.LimitReader(file, 25*1024*1024+1))
		if err != nil || len(data) > 25*1024*1024 {
			Error(w, http.StatusRequestEntityTooLarge, "PDF is too large")
			return
		}
		if len(data) < 5 || string(data[:5]) != "%PDF-" {
			Error(w, http.StatusBadRequest, "Uploaded file is not a valid PDF")
			return
		}
		stored, err := saveHelpCenterAsset(deps.Config.UploadsDir, org, "help_center_imports", data)
		if err != nil {
			Error(w, http.StatusInternalServerError, "File upload failed")
			return
		}
		name := filepath.Base(header.Filename)
		job, err := repo.CreateJob(r.Context(), helpcenter.Job{OrganizationID: org, UserID: userID, JobType: "import_pdf", SourceURL: helpCenterStringPtr(stored), SourceFileName: helpCenterStringPtr(name), Metered: true, Status: "pending", Stage: "not_started"})
		if err != nil {
			_ = os.Remove(filepath.Join(deps.Config.UploadsDir, strings.TrimPrefix(stored, "/api/v1/uploads/")))
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusAccepted, job)
	}
}

func getHelpCenterJob(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, _, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		active := r.URL.Query().Get("active") != "false"
		job, err := repo.LatestJob(r.Context(), org, active)
		if errors.Is(err, helpcenter.ErrNotFound) {
			JSON(w, http.StatusOK, nil)
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, job)
	}
}

func getHelpCenterJobByID(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		repo := helpCenterRepository(w, deps)
		if repo == nil {
			return
		}
		org, _, ok := helpCenterUser(r)
		if !ok {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		id, err := strconv.ParseInt(chi.URLParam(r, "job_id"), 10, 64)
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid job ID")
			return
		}
		job, err := repo.GetJob(r.Context(), org, id)
		if errors.Is(err, helpcenter.ErrNotFound) {
			Error(w, http.StatusNotFound, "Job not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, job)
	}
}

func registerHelpCenterPublicRoutes(r chi.Router, deps Dependencies) {
	r.Get("/a/{slug}", publicHelpCenterArticle(deps))
	r.Post("/a/{slug}/feedback", publicHelpCenterFeedback(deps))
	r.Post("/ask", publicHelpCenterAsk(deps))
	r.Get("/healthz", publicHelpCenterHealth)
	r.Get("/robots.txt", publicHelpCenterRobots(deps))
	r.Get("/sitemap.xml", publicHelpCenterSitemap(deps))
	r.Get("/api/v1/help-center/images/{file_name}", serveHelpCenterImage(deps))
	r.Get("/*", publicHelpCenterCatchAll(deps))
}

func publicHelpCenterSettings(r *http.Request, deps Dependencies, path string) (*helpcenter.Settings, string, error) {
	if deps.HelpCenters == nil {
		return nil, "", helpcenter.ErrNotConfigured
	}
	host := normalizePublicHost(r.Host)
	if path == "" {
		path = r.URL.Path
	}
	if strings.EqualFold(deps.Config.HelpCenterPublicMode, "path") && strings.HasPrefix(path, "/help/") {
		value := strings.TrimPrefix(path, "/help/")
		parts := strings.SplitN(value, "/", 2)
		if len(parts) == 0 || parts[0] == "" {
			return nil, "", helpcenter.ErrNotFound
		}
		slug, err := url.PathUnescape(parts[0])
		if err != nil {
			return nil, "", helpcenter.ErrNotFound
		}
		row, err := deps.HelpCenters.GetSettingsBySlug(r.Context(), slug)
		if err != nil || !row.Enabled {
			return nil, "", helpcenter.ErrNotFound
		}
		return row, "/help/" + parts[0], nil
	}
	if host == "" {
		return nil, "", helpcenter.ErrNotFound
	}
	if strings.HasSuffix(host, "."+strings.ToLower(deps.Config.HelpCenterBaseDomain)) {
		label := strings.TrimSuffix(host, "."+strings.ToLower(deps.Config.HelpCenterBaseDomain))
		if label != "" && !strings.Contains(label, ".") {
			row, err := deps.HelpCenters.GetSettingsBySlug(r.Context(), label)
			if err != nil || !row.Enabled {
				return nil, "", helpcenter.ErrNotFound
			}
			return row, "", nil
		}
	}
	row, err := deps.HelpCenters.GetSettingsByHost(r.Context(), host)
	if err != nil || row == nil {
		return nil, "", helpcenter.ErrNotFound
	}
	return row, "", nil
}

func publicHelpCenterRoot(deps Dependencies, r *http.Request) (map[string]any, bool) {
	row, _, err := publicHelpCenterSettings(r, deps, r.URL.Path)
	if err != nil || row == nil {
		return nil, false
	}
	faqs, err := deps.HelpCenters.Published(r.Context(), row.OrganizationID, r.URL.Query().Get("q"))
	if err != nil {
		return nil, false
	}
	groups := map[string][]*helpcenter.FAQ{}
	order := make([]string, 0)
	for _, faq := range faqs {
		if _, exists := groups[faq.Category]; !exists {
			order = append(order, faq.Category)
		}
		groups[faq.Category] = append(groups[faq.Category], faq)
	}
	return map[string]any{"settings": row, "groups": groups, "categories": order}, true
}

func publicHelpCenterHTML(title string, body string) string {
	return "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>" + html.EscapeString(title) + "</title></head><body>" + body + "</body></html>"
}

func renderHelpCenterIndex(deps Dependencies, r *http.Request) (string, bool) {
	data, ok := publicHelpCenterRoot(deps, r)
	if !ok {
		return "", false
	}
	row := data["settings"].(*helpcenter.Settings)
	var builder strings.Builder
	builder.WriteString("<main><header><h1>")
	builder.WriteString(html.EscapeString(helpCenterStringValue(row.Title)))
	if row.Title == nil || helpCenterStringValue(row.Title) == "" {
		builder.WriteString("Help Center")
	}
	builder.WriteString("</h1><p>")
	builder.WriteString(html.EscapeString(helpCenterStringValue(row.Description)))
	builder.WriteString("</p></header>")
	groups := data["groups"].(map[string][]*helpcenter.FAQ)
	for _, category := range data["categories"].([]string) {
		builder.WriteString("<section><h2>" + html.EscapeString(category) + "</h2><ul>")
		for _, faq := range groups[category] {
			href := "/a/" + url.PathEscape(helpCenterStringValue(faq.Slug))
			if faq.URLPath != nil {
				href = *faq.URLPath
			}
			builder.WriteString("<li><a href=\"" + html.EscapeString(href) + "\">" + html.EscapeString(faq.Question) + "</a></li>")
		}
		builder.WriteString("</ul></section>")
	}
	builder.WriteString("</main>")
	return publicHelpCenterHTML(helpCenterStringValue(row.Title), builder.String()), true
}

func publicHelpCenterArticle(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		row, _, err := publicHelpCenterSettings(r, deps, r.URL.Path)
		if err != nil || row == nil {
			http.NotFound(w, r)
			return
		}
		faq, err := deps.HelpCenters.GetPublishedBySlug(r.Context(), row.OrganizationID, chi.URLParam(r, "slug"))
		if errors.Is(err, helpcenter.ErrNotFound) {
			http.NotFound(w, r)
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if faq.URLPath != nil {
			http.Redirect(w, r, *faq.URLPath, http.StatusMovedPermanently)
			return
		}
		body := "<main><article><p><a href=\"/\">Help Center</a></p><h1>" + html.EscapeString(faq.Question) + "</h1><p>" + safeFAQMarkdown(faq.Answer) + "</p><form method=\"post\" action=\"/a/" + url.PathEscape(chi.URLParam(r, "slug")) + "/feedback\"><button name=\"helpful\" value=\"true\">Helpful</button><button name=\"helpful\" value=\"false\">Not helpful</button></form></article></main>"
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = io.WriteString(w, publicHelpCenterHTML(faq.Question, body))
	}
}

func publicHelpCenterFeedback(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		row, _, err := publicHelpCenterSettings(r, deps, r.URL.Path)
		if err != nil || row == nil {
			http.NotFound(w, r)
			return
		}
		faq, err := deps.HelpCenters.GetPublishedBySlug(r.Context(), row.OrganizationID, chi.URLParam(r, "slug"))
		if errors.Is(err, helpcenter.ErrNotFound) {
			http.NotFound(w, r)
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		_ = r.ParseForm()
		helpful := r.FormValue("helpful") != "false"
		if err := deps.HelpCenters.RecordFeedback(r.Context(), row.OrganizationID, faq.ID, helpful); err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]any{"ok": true})
	}
}

func publicHelpCenterAsk(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		row, _, err := publicHelpCenterSettings(r, deps, r.URL.Path)
		if err != nil || row == nil {
			http.NotFound(w, r)
			return
		}
		var body struct {
			Question string `json:"question"`
		}
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		question := strings.TrimSpace(body.Question)
		if question == "" || utf8.RuneCountInString(question) > 500 {
			Error(w, http.StatusBadRequest, "Question is invalid")
			return
		}
		if !row.AISearchEnabled || row.AgentID == nil {
			Error(w, http.StatusNotFound, "AI answers are not enabled")
			return
		}
		if !allowHelpCenterAsk(publicHelpCenterClientIP(r), time.Minute, 20) || !allowHelpCenterAsk(publicHelpCenterClientIP(r), 24*time.Hour, 200) {
			Error(w, http.StatusTooManyRequests, "Too many questions - please try again later.")
			return
		}
		if deps.Agents == nil {
			Error(w, http.StatusServiceUnavailable, helpCenterAskUnavailable)
			return
		}
		configured, agentErr := deps.Agents.Get(r.Context(), *row.AgentID, row.OrganizationID)
		if agentErr != nil || configured == nil {
			Error(w, http.StatusServiceUnavailable, helpCenterAskUnavailable)
			return
		}
		guardCtx := guardrail.Context{OrganizationID: row.OrganizationID.String(), AgentID: configured.ID.String(), AgentType: configured.AgentType, GuardrailEnabled: configured.GuardrailEnabled}
		if configured.Description != nil {
			guardCtx.Description = *configured.Description
		}
		if configured.TopicScope != nil {
			guardCtx.TopicScope = *configured.TopicScope
		}
		if configured.GuardrailPrompt != nil {
			guardCtx.GuardrailPrompt = *configured.GuardrailPrompt
		}
		settings := guardrail.Settings{PolicyEnabled: deps.Config.GuardrailPolicyEnabled, InboundAction: deps.Config.GuardrailInboundAction, OfftopicAction: deps.Config.GuardrailOfftopicAction, OutputCheckEnabled: deps.Config.GuardrailOutputCheckEnabled, EventsEnabled: deps.Config.GuardrailEventsEnabled, StoreExcerpt: deps.Config.GuardrailStoreExcerpt}
		verdict := guardrail.CheckInbound(question, guardCtx, settings, true)
		_ = guardrail.RecordEvent(r.Context(), deps.GuardrailEvents, settings, guardrail.EventInput{OrganizationID: row.OrganizationID, AgentID: *row.AgentID, Surface: guardrail.SurfaceHelpCenter, Layer: "inbound", Action: helpCenterGuardrailAction(verdict), Rules: verdict.Rules, CharLen: utf8.RuneCountInString(question), Excerpt: question})
		if verdict.Block {
			Error(w, http.StatusServiceUnavailable, helpCenterAskUnavailable)
			return
		}

		select {
		case helpCenterAskGate <- struct{}{}:
			defer func() { <-helpCenterAskGate }()
		case <-r.Context().Done():
			Error(w, http.StatusServiceUnavailable, helpCenterAskUnavailable)
			return
		}
		answer, answerErr := answerHelpCenterQuestion(r, deps, row, question, guardCtx, settings)
		_ = deps.HelpCenters.LogQuery(r.Context(), row.OrganizationID, question, answerErr == nil && answer != "")
		if answerErr != nil || answer == "" {
			if answerErr != nil {
				deps.Logger.Warn().Err(answerErr).Msg("help center ask failed")
			}
			Error(w, http.StatusServiceUnavailable, helpCenterAskUnavailable)
			return
		}
		JSON(w, http.StatusOK, map[string]string{"answer": answer})
	}
}

func answerHelpCenterQuestion(r *http.Request, deps Dependencies, row *helpcenter.Settings, question string, guardCtx guardrail.Context, settings guardrail.Settings) (string, error) {
	cfg, key, err := loadAIConfig(r.Context(), deps, row.OrganizationID)
	if err != nil || cfg == nil {
		return "", err
	}
	faqs, err := deps.HelpCenters.Published(r.Context(), row.OrganizationID, question)
	if err != nil {
		return "", err
	}
	if len(faqs) > 5 {
		faqs = faqs[:5]
	}
	knowledgeResults := []knowledge.SearchResult{}
	if store, ok := deps.Knowledge.(knowledge.SearchStore); ok && store != nil {
		knowledgeResults, _ = store.Search(r.Context(), row.OrganizationID, *row.AgentID, "", question, 3)
	}
	var sources strings.Builder
	for _, faq := range faqs {
		sources.WriteString("FAQ: ")
		sources.WriteString(cleanActionText(faq.Question, 500))
		sources.WriteString("\nAnswer: ")
		sources.WriteString(cleanActionText(faq.Answer, 2500))
		sources.WriteString("\n\n")
	}
	for _, result := range knowledgeResults {
		sources.WriteString("KNOWLEDGE: ")
		sources.WriteString(cleanActionText(result.Name, 300))
		sources.WriteString("\n")
		sources.WriteString(cleanActionText(result.Content, 2500))
		sources.WriteString("\n\n")
	}
	system := guardrail.ApplyPolicy(`You answer public help-center questions. Answer only from the supplied published FAQ and knowledge-base excerpts. Use 1-4 short sentences of plain text with no Markdown. If no excerpt answers the question, say you could not find it in the help center and suggest contacting support. Never invent facts, policies, prices, or URLs.`, guardCtx, settings.PolicyEnabled)
	prompt := "VISITOR QUESTION:\n" + question + "\n\nPUBLISHED SOURCES:\n" + sources.String()
	raw, err := callConfiguredAI(r.Context(), cfg, key, system, prompt, 600, false)
	if err != nil {
		return "", err
	}
	answer, rules := guardrail.CheckOutput(raw, guardCtx, settings)
	_ = guardrail.RecordEvent(r.Context(), deps.GuardrailEvents, settings, guardrail.EventInput{OrganizationID: row.OrganizationID, AgentID: *row.AgentID, Surface: guardrail.SurfaceHelpCenter, Layer: "output", Action: "counted", Rules: rules, CharLen: utf8.RuneCountInString(answer), Excerpt: answer})
	return cleanHelpCenterAnswer(answer), nil
}

func cleanHelpCenterAnswer(value string) string {
	value = strings.TrimSpace(strings.ReplaceAll(strings.ReplaceAll(value, "\r", " "), "\n", " "))
	value = strings.Join(strings.Fields(value), " ")
	value = strings.Trim(value, "`#*_- ")
	if utf8.RuneCountInString(value) > 2400 {
		value = string([]rune(value)[:2400])
	}
	return value
}

func publicHelpCenterClientIP(r *http.Request) string {
	if r != nil {
		if forwarded := strings.TrimSpace(strings.Split(r.Header.Get("X-Forwarded-For"), ",")[0]); forwarded != "" {
			return forwarded
		}
		if host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr)); err == nil && host != "" {
			return host
		}
	}
	return "unknown"
}

func allowHelpCenterAsk(ip string, window time.Duration, maximum int) bool {
	if maximum < 1 {
		return false
	}
	key := ip + ":" + window.String()
	now := time.Now()
	helpCenterAskRate.Lock()
	defer helpCenterAskRate.Unlock()
	entry := helpCenterAskRate.values[key]
	if entry.started.IsZero() || now.Sub(entry.started) >= window {
		helpCenterAskRate.values[key] = helpCenterRateWindow{started: now, count: 1}
		return true
	}
	if entry.count >= maximum {
		return false
	}
	entry.count++
	helpCenterAskRate.values[key] = entry
	return true
}

func helpCenterGuardrailAction(verdict guardrail.Verdict) string {
	if verdict.Block {
		return "blocked"
	}
	return "counted"
}

func publicHelpCenterHealth(w http.ResponseWriter, _ *http.Request) {
	JSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func publicHelpCenterRobots(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		row, _, err := publicHelpCenterSettings(r, deps, r.URL.Path)
		if err != nil || row == nil {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		_, _ = io.WriteString(w, "User-agent: *\nAllow: /\nSitemap: "+helpCenterLiveURL(deps.Config, row)+"/sitemap.xml\n")
	}
}

func publicHelpCenterSitemap(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		row, _, err := publicHelpCenterSettings(r, deps, r.URL.Path)
		if err != nil || row == nil {
			http.NotFound(w, r)
			return
		}
		faqs, err := deps.HelpCenters.Published(r.Context(), row.OrganizationID, "")
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		base := helpCenterLiveURL(deps.Config, row)
		var builder strings.Builder
		builder.WriteString(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>` + html.EscapeString(base+"/") + `</loc></url>`)
		for _, faq := range faqs {
			path := "/a/" + url.PathEscape(helpCenterStringValue(faq.Slug))
			if faq.URLPath != nil {
				path = *faq.URLPath
			}
			builder.WriteString("<url><loc>" + html.EscapeString(base+path) + "</loc></url>")
		}
		builder.WriteString("</urlset>\n")
		w.Header().Set("Content-Type", "application/xml")
		_, _ = io.WriteString(w, builder.String())
	}
}

func publicHelpCenterCatchAll(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			if body, ok := renderHelpCenterIndex(deps, r); ok {
				w.Header().Set("Content-Type", "text/html; charset=utf-8")
				_, _ = io.WriteString(w, body)
				return
			}
		}
		row, base, err := publicHelpCenterSettings(r, deps, r.URL.Path)
		if err != nil || row == nil {
			http.NotFound(w, r)
			return
		}
		path := r.URL.Path
		if base != "" {
			path = strings.TrimPrefix(path, base)
			if path == "" {
				path = "/"
			}
		}
		if path == "/" {
			if body, ok := renderHelpCenterIndex(deps, r); ok {
				w.Header().Set("Content-Type", "text/html; charset=utf-8")
				_, _ = io.WriteString(w, body)
				return
			}
		}
		if path == "/ask" && r.Method == http.MethodPost {
			publicHelpCenterAsk(deps).ServeHTTP(w, r)
			return
		}
		// In path mode the dispatcher Python strips /help/{slug} before route
		// matching, so /help/{slug}/a/{article} reaches the slug route. The Go
		// router keeps the original path and must perform that second dispatch
		// explicitly here.
		if strings.HasPrefix(path, "/a/") {
			slug := strings.TrimPrefix(path, "/a/")
			if slug != "" && !strings.Contains(slug, "/") {
				if faq, faqErr := deps.HelpCenters.GetPublishedBySlug(r.Context(), row.OrganizationID, slug); faqErr == nil && faq != nil {
					if faq.URLPath != nil {
						http.Redirect(w, r, base+*faq.URLPath, http.StatusMovedPermanently)
						return
					}
					if body, ok := renderPublicFAQ(row, faq); ok {
						w.Header().Set("Content-Type", "text/html; charset=utf-8")
						_, _ = io.WriteString(w, body)
						return
					}
				}
			}
		}
		if faq, faqErr := deps.HelpCenters.GetPublishedByPath(r.Context(), row.OrganizationID, path); faqErr == nil && faq != nil {
			if body, ok := renderPublicFAQ(row, faq); ok {
				w.Header().Set("Content-Type", "text/html; charset=utf-8")
				_, _ = io.WriteString(w, body)
				return
			}
		}
		http.NotFound(w, r)
	}
}

func renderPublicFAQ(row *helpcenter.Settings, faq *helpcenter.FAQ) (string, bool) {
	if row == nil || faq == nil {
		return "", false
	}
	return publicHelpCenterHTML(faq.Question, "<main><article><h1>"+html.EscapeString(faq.Question)+"</h1><p>"+safeFAQMarkdown(faq.Answer)+"</p></article></main>"), true
}

func serveHelpCenterImage(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		name := filepath.Base(chi.URLParam(r, "file_name"))
		if name == "." || name == "" {
			http.NotFound(w, r)
			return
		}
		root := filepath.Join(deps.Config.UploadsDir, "help_center")
		matches, err := filepath.Glob(filepath.Join(root, "*", "articles", name))
		if err != nil || len(matches) == 0 {
			matches, _ = filepath.Glob(filepath.Join(root, "*", "branding", name))
		}
		if len(matches) == 0 {
			http.NotFound(w, r)
			return
		}
		http.ServeFile(w, r, matches[0])
	}
}

func normalizePublicHost(raw string) string {
	host := strings.ToLower(strings.TrimSpace(raw))
	if parsed, err := url.Parse("//" + host); err == nil && parsed.Hostname() != "" {
		return parsed.Hostname()
	}
	return strings.Split(host, ":")[0]
}

func normalizeHelpCenterDomain(raw string) (string, error) {
	value := strings.ToLower(strings.TrimSpace(raw))
	value = strings.TrimSuffix(strings.TrimPrefix(strings.TrimPrefix(value, "https://"), "http://"), ".")
	if slash := strings.IndexByte(value, '/'); slash >= 0 {
		value = value[:slash]
	}
	if value == "" || len(value) > 255 || strings.ContainsAny(value, "@ _") {
		return "", errors.New("domain is not a valid hostname")
	}
	if _, err := net.LookupHost(value); err != nil { /* DNS may be configured after claim; syntax remains sufficient. */
	}
	labels := strings.Split(value, ".")
	if len(labels) < 2 {
		return "", errors.New("domain is not a valid hostname")
	}
	for _, label := range labels {
		if label == "" || len(label) > 63 || label[0] == '-' || label[len(label)-1] == '-' {
			return "", errors.New("domain is not a valid hostname")
		}
		for _, r := range label {
			if !(r >= 'a' && r <= 'z' || r >= '0' && r <= '9' || r == '-') {
				return "", errors.New("domain is not a valid hostname")
			}
		}
	}
	return value, nil
}

func normalizeHelpCenterImage(data []byte) ([]byte, error) {
	config, format, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		return nil, errors.New("unsupported image")
	}
	if config.Width > 4000 || config.Height > 4000 {
		return nil, errors.New("image dimensions are too large")
	}
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, errors.New("unsupported image")
	}
	var out bytes.Buffer
	if err := png.Encode(&out, img); err != nil {
		return nil, err
	}
	_ = format
	return out.Bytes(), nil
}

func saveHelpCenterAsset(root string, org uuid.UUID, folder string, data []byte) (string, error) {
	if root == "" {
		root = "uploads"
	}
	relative := filepath.Join("help_center", org.String(), folder, assetName(data))
	full := filepath.Join(root, relative)
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		return "", err
	}
	if err := os.WriteFile(full, data, 0o600); err != nil {
		return "", err
	}
	return "/api/v1/uploads/" + filepath.ToSlash(relative), nil
}

func assetName(data []byte) string {
	sum := sha256.Sum256(append(data, byte(time.Now().UnixNano())))
	return hex.EncodeToString(sum[:])[:32] + ".png"
}

func safeFAQMarkdown(value string) string {
	escaped := html.EscapeString(value)
	escaped = strings.ReplaceAll(escaped, "\n", "<br>")
	return escaped
}

func helpCenterStringValue(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}
func helpCenterStringPtr(value string) *string { return &value }

var _ = mime.TypeByExtension
var _ = net.IPv4len
