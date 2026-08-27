package httpapi

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	knowledgeStore "github.com/chattermate/chattermate/backend-go/internal/knowledge"
	"github.com/chattermate/chattermate/backend-go/internal/user"
)

const (
	maxKnowledgePDFSize  = 25 * 1024 * 1024
	maxKnowledgePDFFiles = 20
)

type knowledgeURLsRequest struct {
	OrganizationID uuid.UUID `json:"org_id"`
	PDFURLs        []string  `json:"pdf_urls"`
	Websites       []string  `json:"websites"`
	Sitemaps       []string  `json:"sitemaps"`
	AgentID        *string   `json:"agent_id"`
	MaxLinks       *int      `json:"max_links"`
	CrawlScope     *string   `json:"crawl_scope"`
}

type knowledgeTextRequest struct {
	OrganizationID uuid.UUID `json:"org_id"`
	Title          string    `json:"title"`
	Content        string    `json:"content"`
	AgentID        *string   `json:"agent_id"`
}

type knowledgeLinkRequest struct {
	KnowledgeID int64  `json:"knowledge_id"`
	AgentID     string `json:"agent_id"`
}

type knowledgeSubpageRequest struct {
	SubpageName string  `json:"subpage_name"`
	Content     string  `json:"content"`
	URL         *string `json:"url"`
}

type knowledgePageRequest struct {
	Content string  `json:"content"`
	Title   *string `json:"title"`
}

func registerKnowledgeRoutes(r chi.Router, deps Dependencies) {
	view := requireAnyPermissions(deps, "view_knowledge", "manage_knowledge")
	manage := requireAllPermissions(deps, "manage_knowledge")
	r.With(manage).Post("/knowledge/upload/pdf", uploadKnowledgePDF(deps))
	r.Get("/knowledge/explore/progress/{queue_id}", exploreProgress(deps))
	r.With(manage).Post("/knowledge/add/urls", addKnowledgeURLs(deps))
	r.With(manage).Post("/knowledge/add/text", addKnowledgeText(deps))
	r.With(requireAuthenticated(deps)).Post("/knowledge/link", linkKnowledge(deps))
	r.With(requireAuthenticated(deps)).Delete("/knowledge/unlink", unlinkKnowledge(deps))
	r.With(view).Get("/knowledge/agent/{agent_id}", listKnowledgeByAgent(deps))
	r.With(requireAuthenticated(deps)).Get("/knowledge/queue/agent/{agent_id}", listKnowledgeQueueByAgent(deps))
	r.With(view).Get("/knowledge/queue/organization/{org_id}", listKnowledgeQueueByOrganization(deps))
	r.With(manage).Delete("/knowledge/queue/{queue_id}", deleteKnowledgeQueue(deps))
	r.With(view).Get("/knowledge/organization/{org_id}", listKnowledgeByOrganization(deps))
	r.With(view).Get("/knowledge/queue/{queue_id}", getKnowledgeQueue(deps))
	r.With(view).Get("/knowledge/processor/status", getKnowledgeProcessorStatus(deps))
	r.With(manage).Delete("/knowledge/{knowledge_id}", deleteKnowledge(deps))
	r.With(requireAuthenticated(deps)).Get("/knowledge/{knowledge_id}/content", getKnowledgeContent(deps))
	r.With(manage).Put("/knowledge/{knowledge_id}/chunk/{chunk_id:.*}", updateKnowledgeChunk(deps))
	r.With(manage).Delete("/knowledge/{knowledge_id}/chunk/{chunk_id:.*}", deleteKnowledgeChunk(deps))
	r.With(manage).Post("/knowledge/{knowledge_id}/subpage", addKnowledgeSubpage(deps))
	r.With(manage).Put("/knowledge/{knowledge_id}/page/{page_id:.*}", updateKnowledgePage(deps))
	r.With(manage).Delete("/knowledge/{knowledge_id}/page/{page_id:.*}", deleteKnowledgePage(deps))
}

func knowledgeRepository(w http.ResponseWriter, deps Dependencies) knowledgeStore.Store {
	if deps.Knowledge == nil {
		Error(w, http.StatusInternalServerError, "Knowledge service is not configured")
		return nil
	}
	return deps.Knowledge
}

func knowledgeOrganization(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	current, ok := currentUserFromContext(r)
	if !ok || current.OrganizationID == nil {
		Error(w, http.StatusForbidden, "User is not associated with any organization")
		return uuid.Nil, false
	}
	return *current.OrganizationID, true
}

func parseKnowledgeAgentID(raw *string) (*uuid.UUID, error) {
	if raw == nil || strings.TrimSpace(*raw) == "" {
		return nil, nil
	}
	id, err := uuid.Parse(strings.TrimSpace(*raw))
	if err != nil {
		return nil, errors.New("Invalid agent_id")
	}
	return &id, nil
}

func validateKnowledgeURL(raw string) error {
	parsed, err := url.Parse(strings.TrimSpace(strings.TrimRight(raw, "/")))
	if err != nil || parsed.Scheme != "https" || parsed.Hostname() == "" || !strings.Contains(parsed.Hostname(), ".") {
		return errors.New("Invalid URL format")
	}
	if strings.ContainsAny(parsed.Hostname(), "\\@") {
		return errors.New("Invalid URL format")
	}
	return nil
}

func validateKnowledgeURLs(values []string) error {
	for _, value := range values {
		if strings.TrimSpace(value) == "" {
			return errors.New("URL cannot be empty")
		}
		if err := validateKnowledgeURL(value); err != nil {
			return err
		}
	}
	return nil
}

func uploadKnowledgePDF(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		if err := r.ParseMultipartForm(maxKnowledgePDFSize*maxKnowledgePDFFiles + 1024*1024); err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid multipart form")
			return
		}
		orgID, err := uuid.Parse(strings.TrimSpace(r.FormValue("org_id")))
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid org_id")
			return
		}
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil || *current.OrganizationID != orgID {
			Error(w, http.StatusForbidden, "Unauthorized access to organization")
			return
		}
		agentID, err := parseKnowledgeAgentID(optionalKnowledgeString(r.FormValue("agent_id")))
		if err != nil {
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if agentID != nil && !knowledgeAgentInOrganization(r, deps, *agentID, orgID) {
			Error(w, http.StatusNotFound, "Agent not found")
			return
		}
		files := r.MultipartForm.File["files"]
		if len(files) == 0 {
			files = r.MultipartForm.File["file"]
		}
		if len(files) == 0 || len(files) > maxKnowledgePDFFiles {
			Error(w, http.StatusBadRequest, fmt.Sprintf("Too many files: at most %d per request", maxKnowledgePDFFiles))
			return
		}
		items := make([]map[string]any, 0, len(files))
		for _, header := range files {
			item, err := saveKnowledgePDF(r, store, orgID, agentID, header)
			if err != nil {
				Error(w, http.StatusBadRequest, err.Error())
				return
			}
			items = append(items, item)
		}
		JSON(w, http.StatusOK, map[string]any{
			"message":     "PDFs queued for processing,it will take a while to process, we will notify you when it is done",
			"queue_items": items,
		})
	}
}

func optionalKnowledgeString(value string) *string {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	return &value
}

func saveKnowledgePDF(r *http.Request, store knowledgeStore.Store, orgID uuid.UUID, agentID *uuid.UUID, header *multipart.FileHeader) (map[string]any, error) {
	if header.Size > maxKnowledgePDFSize {
		return nil, fmt.Errorf("PDF file exceeds %d MB", maxKnowledgePDFSize/(1024*1024))
	}
	file, err := header.Open()
	if err != nil {
		return nil, errors.New("Failed to read PDF")
	}
	defer file.Close()
	data, err := io.ReadAll(io.LimitReader(file, maxKnowledgePDFSize+1))
	if err != nil || len(data) > maxKnowledgePDFSize {
		return nil, errors.New("PDF file is too large")
	}
	if len(data) < 5 || string(data[:5]) != "%PDF-" {
		return nil, errors.New("Uploaded file is not a valid PDF")
	}
	name := filepath.Base(header.Filename)
	name = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || strings.ContainsRune("._-", r) {
			return r
		}
		return '_'
	}, name)
	if name == "" || name == "." || name == ".." {
		name = "upload.pdf"
	}
	tmpDir := filepath.Join("temp")
	if err := os.MkdirAll(tmpDir, 0o755); err != nil {
		return nil, errors.New("Failed to upload files")
	}
	path := filepath.Join(tmpDir, uuid.NewString()+"_"+name)
	if err := os.WriteFile(path, data, 0o600); err != nil {
		return nil, errors.New("Failed to upload files")
	}
	item, err := store.CreateQueue(r.Context(), knowledgeStore.QueueCreateInput{OrganizationID: orgID, AgentID: agentID, UserID: userIDPtr(currentUserFromContextMust(r)), SourceType: "pdf_file", Source: path, Metadata: map[string]any{"max_links": 25}})
	if err != nil {
		_ = os.Remove(path)
		return nil, err
	}
	return queueSummary(item), nil
}

func currentUserFromContextMust(r *http.Request) *user.User {
	found, _ := currentUserFromContext(r)
	return found
}

func userIDPtr(found *user.User) *uuid.UUID {
	if found == nil {
		return nil
	}
	id := found.ID
	return &id
}

func addKnowledgeURLs(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		var body knowledgeURLsRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		orgID, ok := knowledgeOrganization(w, r)
		if !ok {
			return
		}
		if body.OrganizationID != orgID {
			Error(w, http.StatusForbidden, "Unauthorized access to organization")
			return
		}
		if body.MaxLinks != nil && *body.MaxLinks < 1 {
			Error(w, http.StatusUnprocessableEntity, "max_links must be at least 1")
			return
		}
		if body.CrawlScope != nil && *body.CrawlScope != "path" && *body.CrawlScope != "host" && *body.CrawlScope != "domain" {
			Error(w, http.StatusUnprocessableEntity, "crawl_scope must be one of path, host, domain")
			return
		}
		all := append(append(append([]string{}, body.PDFURLs...), body.Websites...), body.Sitemaps...)
		if err := validateKnowledgeURLs(all); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		agentID, err := parseKnowledgeAgentID(body.AgentID)
		if err != nil {
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if agentID != nil && !knowledgeAgentInOrganization(r, deps, *agentID, orgID) {
			Error(w, http.StatusNotFound, "Agent not found")
			return
		}
		if existing, err := store.FindBySources(r.Context(), orgID, all); err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		} else if len(existing) > 0 {
			duplicates := make([]string, 0, len(existing))
			for _, item := range existing {
				duplicates = append(duplicates, item.Source)
			}
			JSON(w, http.StatusOK, map[string]any{"error": "Some URLs already exist in your knowledge base", "duplicate_urls": duplicates})
			return
		}
		items := make([]map[string]any, 0, len(all))
		for _, source := range body.PDFURLs {
			item, err := store.CreateQueue(r.Context(), knowledgeStore.QueueCreateInput{OrganizationID: orgID, AgentID: agentID, UserID: userIDPtr(currentUserFromContextMust(r)), SourceType: "pdf_url", Source: strings.TrimRight(source, "/"), Metadata: map[string]any{"max_links": 25}})
			if err != nil {
				Error(w, http.StatusInternalServerError, err.Error())
				return
			}
			items = append(items, queueSummary(item))
		}
		for _, source := range body.Websites {
			metadata := map[string]any{"max_links": 25}
			if body.MaxLinks != nil {
				metadata["max_links"] = *body.MaxLinks
			}
			if body.CrawlScope != nil {
				metadata["crawl_scope"] = *body.CrawlScope
			}
			item, err := store.CreateQueue(r.Context(), knowledgeStore.QueueCreateInput{OrganizationID: orgID, AgentID: agentID, UserID: userIDPtr(currentUserFromContextMust(r)), SourceType: "website", Source: strings.TrimRight(source, "/"), Metadata: metadata})
			if err != nil {
				Error(w, http.StatusInternalServerError, err.Error())
				return
			}
			items = append(items, queueSummary(item))
		}
		for _, source := range body.Sitemaps {
			item, err := store.CreateQueue(r.Context(), knowledgeStore.QueueCreateInput{OrganizationID: orgID, AgentID: agentID, UserID: userIDPtr(currentUserFromContextMust(r)), SourceType: "sitemap", Source: strings.TrimRight(source, "/"), Metadata: map[string]any{"max_links": 25}})
			if err != nil {
				Error(w, http.StatusInternalServerError, err.Error())
				return
			}
			items = append(items, queueSummary(item))
		}
		JSON(w, http.StatusOK, map[string]any{"message": "URLs queued for processing, it will take a while to process, we will notify you when it is done", "queue_items": items})
	}
}

func knowledgeAgentInOrganization(r *http.Request, deps Dependencies, id, orgID uuid.UUID) bool {
	if deps.Agents == nil {
		return false
	}
	found, err := deps.Agents.Get(r.Context(), id, orgID)
	return err == nil && found != nil && found.OrganizationID == orgID
}

func addKnowledgeText(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		var body knowledgeTextRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		orgID, ok := knowledgeOrganization(w, r)
		if !ok {
			return
		}
		if body.OrganizationID != orgID {
			Error(w, http.StatusForbidden, "Unauthorized access to organization")
			return
		}
		body.Title = strings.TrimSpace(body.Title)
		body.Content = strings.TrimSpace(body.Content)
		if body.Title == "" {
			Error(w, http.StatusUnprocessableEntity, "Title cannot be empty")
			return
		}
		if body.Content == "" {
			Error(w, http.StatusUnprocessableEntity, "Content cannot be empty")
			return
		}
		agentID, err := parseKnowledgeAgentID(body.AgentID)
		if err != nil {
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if agentID != nil && !knowledgeAgentInOrganization(r, deps, *agentID, orgID) {
			Error(w, http.StatusNotFound, "Agent not found")
			return
		}
		source, err := store.CreateTextSource(r.Context(), orgID, body.Title, body.Content, agentID)
		if err != nil {
			if strings.Contains(strings.ToLower(err.Error()), "already exists") {
				Error(w, http.StatusBadRequest, "A knowledge source with this title already exists")
			} else {
				Error(w, http.StatusInternalServerError, "Failed to add text source")
			}
			return
		}
		JSON(w, http.StatusOK, map[string]any{"message": "Text source added", "knowledge": map[string]any{"id": source.ID, "name": source.Source, "type": source.SourceType}})
	}
}

func linkKnowledge(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		orgID, ok := knowledgeOrganization(w, r)
		if !ok {
			return
		}
		knowledgeID, err := parseQueryInt64(r.URL.Query().Get("knowledge_id"))
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid knowledge_id")
			return
		}
		agentID, err := uuid.Parse(r.URL.Query().Get("agent_id"))
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid agent ID format")
			return
		}
		err = store.Link(r.Context(), knowledgeID, orgID, agentID)
		if errors.Is(err, knowledgeStore.ErrAlreadyLinked) {
			Error(w, http.StatusBadRequest, "Knowledge is already linked to this agent")
			return
		}
		if errors.Is(err, knowledgeStore.ErrNotFound) {
			Error(w, http.StatusNotFound, "Knowledge source not found or unauthorized access")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Knowledge linked to agent successfully"})
	}
}

func unlinkKnowledge(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		orgID, ok := knowledgeOrganization(w, r)
		if !ok {
			return
		}
		knowledgeID, err := parseQueryInt64(r.URL.Query().Get("knowledge_id"))
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid knowledge_id")
			return
		}
		agentID, err := uuid.Parse(r.URL.Query().Get("agent_id"))
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid agent ID format")
			return
		}
		err = store.Unlink(r.Context(), knowledgeID, orgID, agentID)
		if errors.Is(err, knowledgeStore.ErrNotFound) {
			Error(w, http.StatusNotFound, "Knowledge source not found or unauthorized access")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Knowledge unlinked from agent successfully"})
	}
}

func listKnowledgeByAgent(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		orgID, ok := knowledgeOrganization(w, r)
		if !ok {
			return
		}
		agentID, err := uuid.Parse(chi.URLParam(r, "agent_id"))
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid agent ID format")
			return
		}
		if !knowledgeAgentInOrganization(r, deps, agentID, orgID) {
			Error(w, http.StatusNotFound, "Agent not found")
			return
		}
		page, pageSize := paginationQuery(r)
		items, total, err := store.ListByAgent(r.Context(), orgID, agentID, (page-1)*pageSize, pageSize)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]any{"knowledge": items, "pagination": knowledgePagination(total, page, pageSize)})
	}
}

func listKnowledgeByOrganization(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		orgID, err := uuid.Parse(chi.URLParam(r, "org_id"))
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid organization ID format")
			return
		}
		currentOrg, ok := knowledgeOrganization(w, r)
		if !ok {
			return
		}
		if currentOrg != orgID {
			Error(w, http.StatusForbidden, "Unauthorized access to organization")
			return
		}
		page, pageSize := paginationQuery(r)
		items, total, err := store.ListByOrganization(r.Context(), orgID, (page-1)*pageSize, pageSize)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]any{"knowledge": items, "pagination": knowledgePagination(total, page, pageSize)})
	}
}

func paginationQuery(r *http.Request) (int, int) {
	page := 1
	size := 10
	if raw := r.URL.Query().Get("page"); raw != "" {
		if value, err := strconv.Atoi(raw); err == nil && value >= 1 {
			page = value
		}
	}
	if raw := r.URL.Query().Get("page_size"); raw != "" {
		if value, err := strconv.Atoi(raw); err == nil && value >= 1 && value <= 100 {
			size = value
		}
	}
	return page, size
}
func knowledgePagination(total, page, size int) map[string]any {
	pages := 0
	if size > 0 {
		pages = (total + size - 1) / size
	}
	return map[string]any{"total": total, "page": page, "page_size": size, "total_pages": pages}
}

func listKnowledgeQueueByAgent(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		orgID, ok := knowledgeOrganization(w, r)
		if !ok {
			return
		}
		agentID, err := uuid.Parse(chi.URLParam(r, "agent_id"))
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid agent ID format")
			return
		}
		items, err := store.ListQueueByAgent(r.Context(), orgID, agentID)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]any{"queue_items": queueSummaries(items)})
	}
}
func listKnowledgeQueueByOrganization(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		orgID, err := uuid.Parse(chi.URLParam(r, "org_id"))
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid organization ID format")
			return
		}
		currentOrg, ok := knowledgeOrganization(w, r)
		if !ok {
			return
		}
		if currentOrg != orgID {
			Error(w, http.StatusForbidden, "Unauthorized access to organization")
			return
		}
		items, err := store.ListQueueByOrganization(r.Context(), orgID)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]any{"queue_items": queueSummaries(items)})
	}
}
func deleteKnowledgeQueue(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		orgID, ok := knowledgeOrganization(w, r)
		if !ok {
			return
		}
		id, err := strconv.ParseInt(chi.URLParam(r, "queue_id"), 10, 64)
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid queue ID")
			return
		}
		deleted, err := store.DeleteQueue(r.Context(), id, orgID)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if !deleted {
			Error(w, http.StatusBadRequest, "Only failed or pending items can be removed from queue")
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Queue item deleted successfully"})
	}
}
func getKnowledgeQueue(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		orgID, ok := knowledgeOrganization(w, r)
		if !ok {
			return
		}
		id, err := strconv.ParseInt(chi.URLParam(r, "queue_id"), 10, 64)
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid queue ID")
			return
		}
		item, err := store.GetQueue(r.Context(), id)
		if errors.Is(err, knowledgeStore.ErrQueueNotFound) {
			JSON(w, http.StatusOK, map[string]string{"error": "Queue item not found"})
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if item.OrganizationID != orgID {
			JSON(w, http.StatusOK, map[string]string{"error": "Unauthorized access to queue item"})
			return
		}
		JSON(w, http.StatusOK, map[string]any{"id": item.ID, "status": item.Status, "error": item.Error, "created_at": item.CreatedAt, "updated_at": item.UpdatedAt})
	}
}
func getKnowledgeProcessorStatus(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		orgID, ok := knowledgeOrganization(w, r)
		if !ok {
			return
		}
		current, _ := currentUserFromContext(r)
		if current == nil {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		status, err := store.ProcessorStatus(r.Context(), orgID, current.ID)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]any{"last_run": status.LastRun, "is_running": status.Running, "error": status.Error, "queue_status": map[string]int{"pending": status.Pending, "processing": status.Processing, "completed": status.Completed, "failed": status.Failed}})
	}
}

func deleteKnowledge(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		orgID, ok := knowledgeOrganization(w, r)
		if !ok {
			return
		}
		id, err := strconv.ParseInt(chi.URLParam(r, "knowledge_id"), 10, 64)
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid knowledge ID")
			return
		}
		err = store.DeleteSource(r.Context(), id, orgID)
		if errors.Is(err, knowledgeStore.ErrNotFound) {
			Error(w, http.StatusNotFound, "Knowledge source not found")
			return
		}
		if err != nil {
			if strings.Contains(strings.ToLower(err.Error()), "unauthorized") {
				Error(w, http.StatusForbidden, "Unauthorized access to knowledge source")
			} else {
				Error(w, http.StatusInternalServerError, err.Error())
			}
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Knowledge source deleted successfully"})
	}
}
func sourceForEdit(w http.ResponseWriter, r *http.Request, store knowledgeStore.Store) (*knowledgeStore.Source, bool) {
	orgID, ok := knowledgeOrganization(w, r)
	if !ok {
		return nil, false
	}
	id, err := strconv.ParseInt(chi.URLParam(r, "knowledge_id"), 10, 64)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid knowledge ID")
		return nil, false
	}
	source, err := store.GetSource(r.Context(), id)
	if errors.Is(err, knowledgeStore.ErrNotFound) || source == nil {
		Error(w, http.StatusNotFound, "Knowledge source not found")
		return nil, false
	}
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return nil, false
	}
	if source.OrganizationID != orgID {
		Error(w, http.StatusForbidden, "Unauthorized access to knowledge source")
		return nil, false
	}
	return source, true
}
func getKnowledgeContent(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		source, ok := sourceForEdit(w, r, store)
		if !ok {
			return
		}
		chunks, err := store.GetContent(r.Context(), source)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Error accessing content: "+err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]any{"knowledge_id": source.ID, "source": source.Source, "source_type": source.SourceType, "chunks": chunks})
	}
}
func updateKnowledgeChunk(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		source, ok := sourceForEdit(w, r, store)
		if !ok {
			return
		}
		var body struct {
			Content string `json:"content"`
		}
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		err := store.UpdateChunk(r.Context(), source, chi.URLParam(r, "chunk_id"), body.Content)
		if errors.Is(err, knowledgeStore.ErrNoVectorTable) {
			Error(w, http.StatusBadRequest, "Knowledge source has no vector database table")
			return
		}
		if errors.Is(err, knowledgeStore.ErrNotFound) {
			Error(w, http.StatusNotFound, "Chunk not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Error updating chunk: "+err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Chunk updated successfully"})
	}
}
func deleteKnowledgeChunk(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		source, ok := sourceForEdit(w, r, store)
		if !ok {
			return
		}
		deleted, err := store.DeleteChunk(r.Context(), source, chi.URLParam(r, "chunk_id"))
		if errors.Is(err, knowledgeStore.ErrNoVectorTable) {
			Error(w, http.StatusBadRequest, "Knowledge source has no vector database table")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Error deleting chunk: "+err.Error())
			return
		}
		if !deleted {
			Error(w, http.StatusNotFound, "Chunk not found")
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Chunk deleted successfully"})
	}
}
func addKnowledgeSubpage(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		source, ok := sourceForEdit(w, r, store)
		if !ok {
			return
		}
		var body knowledgeSubpageRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		rawURL := ""
		if body.URL != nil {
			rawURL = *body.URL
		}
		err := store.AddSubpage(r.Context(), source, body.SubpageName, body.Content, rawURL)
		if errors.Is(err, knowledgeStore.ErrNoVectorTable) {
			Error(w, http.StatusBadRequest, "Knowledge source has no vector database table")
			return
		}
		if err != nil {
			if strings.Contains(strings.ToLower(err.Error()), "already exists") || strings.Contains(strings.ToLower(err.Error()), "same domain") {
				Error(w, http.StatusBadRequest, err.Error())
			} else {
				Error(w, http.StatusInternalServerError, "Error adding subpage: "+err.Error())
			}
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Subpage added successfully", "subpage_id": body.SubpageName})
	}
}
func updateKnowledgePage(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		source, ok := sourceForEdit(w, r, store)
		if !ok {
			return
		}
		var body knowledgePageRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		title := ""
		if body.Title != nil {
			title = *body.Title
		}
		count, err := store.ReplacePage(r.Context(), source, chi.URLParam(r, "page_id"), body.Content, title)
		if errors.Is(err, knowledgeStore.ErrNoVectorTable) {
			Error(w, http.StatusBadRequest, "Knowledge source has no vector database table")
			return
		}
		if errors.Is(err, knowledgeStore.ErrNotFound) || count == 0 {
			Error(w, http.StatusNotFound, "Page not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Error updating page: "+err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Page updated successfully", "page_id": chi.URLParam(r, "page_id")})
	}
}
func deleteKnowledgePage(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		source, ok := sourceForEdit(w, r, store)
		if !ok {
			return
		}
		count, err := store.DeletePage(r.Context(), source, chi.URLParam(r, "page_id"))
		if errors.Is(err, knowledgeStore.ErrNoVectorTable) {
			Error(w, http.StatusBadRequest, "Knowledge source has no vector database table")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Error deleting page: "+err.Error())
			return
		}
		if count == 0 {
			Error(w, http.StatusNotFound, "Page not found")
			return
		}
		JSON(w, http.StatusOK, map[string]any{"message": "Page deleted successfully", "removed_chunks": count})
	}
}

func queueSummary(item *knowledgeStore.QueueItem) map[string]any {
	if item == nil {
		return map[string]any{}
	}
	return map[string]any{"id": item.ID, "status": item.Status, "source": item.Source, "source_type": item.SourceType, "error": item.Error, "created_at": item.CreatedAt, "updated_at": item.UpdatedAt, "processing_stage": item.ProcessingStage, "progress_percentage": item.ProgressPercentage}
}
func queueSummaries(items []*knowledgeStore.QueueItem) []map[string]any {
	result := make([]map[string]any, 0, len(items))
	for _, item := range items {
		result = append(result, queueSummary(item))
	}
	return result
}
func parseQueryInt64(value string) (int64, error) {
	if strings.TrimSpace(value) == "" {
		return 0, errors.New("missing value")
	}
	return strconv.ParseInt(value, 10, 64)
}

func exploreProgress(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := knowledgeRepository(w, deps)
		if store == nil {
			return
		}
		// This endpoint is intentionally public because the Explore widget polls
		// it without an account. Queue ids are sequential, so constrain the lookup
		// to the dedicated Explore organization before returning source URLs or
		// crawl history.
		exploreOrg, err := uuid.Parse(deps.Config.ExploreSourceOrgID)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Explore source organization is not configured")
			return
		}
		id, err := strconv.ParseInt(chi.URLParam(r, "queue_id"), 10, 64)
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid queue ID")
			return
		}
		item, err := store.GetQueue(r.Context(), id)
		if errors.Is(err, knowledgeStore.ErrQueueNotFound) {
			Error(w, http.StatusNotFound, "Queue item not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if item.OrganizationID != exploreOrg {
			Error(w, http.StatusNotFound, "Queue item not found")
			return
		}
		stage := strings.ToLower(item.ProcessingStage)
		step := 1
		label := "Initializing"
		switch stage {
		case "crawling":
			step = 2
			label = "Crawling Website"
		case "embedding":
			step = 3
			label = "Processing Content"
		case "completed":
			step = 4
			label = "Completed"
		}
		progress := item.ProgressPercentage
		if item.Status == "completed" {
			progress = 100
		}
		overall := float64(step-1)*25 + progress/4
		if overall > 100 {
			overall = 100
		}
		latest := ""
		if len(item.CrawledURLs) > 0 {
			latest = item.CrawledURLs[len(item.CrawledURLs)-1]
		}
		JSON(w, http.StatusOK, map[string]any{"queue_id": item.ID, "status": item.Status, "processing_stage": item.ProcessingStage, "progress_percentage": item.ProgressPercentage, "overall_progress": float64(int(overall*10)) / 10, "current_stage": map[string]any{"label": label, "step": step, "total": 4}, "source": item.Source, "total_items": item.TotalItems, "processed_items": item.ProcessedItems, "created_at": item.CreatedAt, "updated_at": item.UpdatedAt, "crawled_url": optionalKnowledgeString(latest), "crawled_urls": item.CrawledURLs, "crawled_count": len(item.CrawledURLs), "is_complete": item.Status == "completed" || item.Status == "failed", "error_message": item.Error})
	}
}
