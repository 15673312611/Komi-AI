package helpcenter

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotConfigured = errors.New("help center storage is not configured")
	ErrNotFound      = errors.New("help center resource not found")
	ErrConflict      = errors.New("help center resource already exists")
)

const (
	DefaultBrandColor = "#4338CA"
	DefaultCTAText    = "Contact us"
)

type Settings struct {
	ID                      uuid.UUID        `json:"id"`
	OrganizationID          uuid.UUID        `json:"organization_id"`
	Enabled                 bool             `json:"enabled"`
	Slug                    *string          `json:"slug"`
	Title                   *string          `json:"title"`
	Description             *string          `json:"description"`
	LogoURL                 *string          `json:"logo_url"`
	FaviconURL              *string          `json:"favicon_url"`
	BrandColor              string           `json:"brand_color"`
	HeaderLinks             []map[string]any `json:"header_links"`
	CTAText                 *string          `json:"cta_text"`
	CTAURL                  *string          `json:"cta_url"`
	CTAEnabled              bool             `json:"cta_enabled"`
	AutoGenerate            bool             `json:"auto_generate"`
	AgentID                 *uuid.UUID       `json:"agent_id"`
	AISearchEnabled         bool             `json:"ai_search_enabled"`
	ChatWidgetEnabled       bool             `json:"chat_widget_enabled"`
	CustomDomain            *string          `json:"custom_domain"`
	DomainVerificationToken *string          `json:"domain_verification_token"`
	TXTRecordVerified       bool             `json:"txt_record_verified"`
	CNAMERecordVerified     bool             `json:"cname_record_verified"`
	SSLStatus               string           `json:"ssl_status"`
	DomainVerifiedAt        *time.Time       `json:"domain_verified_at"`
	CreatedAt               *time.Time       `json:"created_at,omitempty"`
	UpdatedAt               *time.Time       `json:"updated_at,omitempty"`
}

func (s *Settings) DomainVerified() bool {
	return s != nil && s.CustomDomain != nil && strings.TrimSpace(*s.CustomDomain) != "" && s.TXTRecordVerified && s.CNAMERecordVerified
}

func (s *Settings) DomainStatus() string {
	if s == nil || s.CustomDomain == nil || strings.TrimSpace(*s.CustomDomain) == "" {
		return "unverified"
	}
	if s.DomainVerified() {
		return "verified"
	}
	return "pending"
}

type FAQ struct {
	ID              uuid.UUID  `json:"id"`
	OrganizationID  uuid.UUID  `json:"organization_id,omitempty"`
	Question        string     `json:"question"`
	Answer          string     `json:"answer"`
	Category        string     `json:"category"`
	Slug            *string    `json:"slug"`
	URLPath         *string    `json:"url_path"`
	SourceURL       *string    `json:"source_url"`
	MetaTitle       *string    `json:"meta_title"`
	MetaDescription *string    `json:"meta_description"`
	Status          string     `json:"status"`
	KnowledgeID     *int64     `json:"knowledge_id"`
	SourceLabel     *string    `json:"source_label"`
	GenerationJobID *int64     `json:"generation_job_id,omitempty"`
	CreatedBy       *uuid.UUID `json:"created_by,omitempty"`
	SortOrder       int        `json:"sort_order,omitempty"`
	HelpfulYes      int        `json:"helpful_yes"`
	HelpfulNo       int        `json:"helpful_no"`
	CreatedAt       *time.Time `json:"created_at,omitempty"`
	UpdatedAt       *time.Time `json:"updated_at,omitempty"`
}

type Job struct {
	ID                 int64      `json:"id"`
	OrganizationID     uuid.UUID  `json:"organization_id,omitempty"`
	UserID             *uuid.UUID `json:"user_id,omitempty"`
	JobType            string     `json:"job_type"`
	KnowledgeID        *int64     `json:"knowledge_id,omitempty"`
	KnowledgeIDs       []int64    `json:"knowledge_ids,omitempty"`
	SourceURL          *string    `json:"source_url"`
	SourceFileName     *string    `json:"source_file_name,omitempty"`
	PreserveSourceURLs bool       `json:"preserve_urls,omitempty"`
	LLMCalls           int        `json:"llm_calls,omitempty"`
	Metered            bool       `json:"metered,omitempty"`
	Status             string     `json:"status"`
	Stage              string     `json:"stage"`
	ProgressPercentage float64    `json:"progress_percentage"`
	FAQsCreated        int        `json:"faqs_created"`
	Error              *string    `json:"error"`
	CreatedAt          *time.Time `json:"created_at,omitempty"`
	UpdatedAt          *time.Time `json:"updated_at,omitempty"`
}

type Repository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *Repository {
	if pool == nil {
		return nil
	}
	return &Repository{pool: pool}
}

func (r *Repository) ready() error {
	if r == nil || r.pool == nil {
		return ErrNotConfigured
	}
	return nil
}

const settingsProjection = `
SELECT id, organization_id, enabled, slug, title, description, logo_url,
       COALESCE(favicon_url, NULL), brand_color, COALESCE(header_links, '[]'::json),
       cta_text, cta_url, COALESCE(cta_enabled, TRUE), auto_generate, agent_id,
       ai_search_enabled, COALESCE(chat_widget_enabled, TRUE), custom_domain,
       domain_verification_token, txt_record_verified, cname_record_verified,
       ssl_status, domain_verified_at, created_at, updated_at
FROM help_center_settings`

func (r *Repository) GetSettingsByOrganization(ctx context.Context, organizationID uuid.UUID) (*Settings, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanSettings(r.pool.QueryRow(ctx, settingsProjection+` WHERE organization_id=$1`, organizationID))
}

func (r *Repository) GetSettingsBySlug(ctx context.Context, slug string) (*Settings, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanSettings(r.pool.QueryRow(ctx, settingsProjection+` WHERE slug=$1`, strings.ToLower(strings.TrimSpace(slug))))
}

func (r *Repository) GetSettingsByHost(ctx context.Context, host string) (*Settings, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanSettings(r.pool.QueryRow(ctx, settingsProjection+` WHERE lower(custom_domain)=$1 AND txt_record_verified=true AND cname_record_verified=true AND enabled=true`, strings.ToLower(strings.TrimSpace(host))))
}

func (r *Repository) ListVerifiedDomains(ctx context.Context) ([]string, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, `SELECT custom_domain FROM help_center_settings WHERE custom_domain IS NOT NULL AND txt_record_verified=true AND cname_record_verified=true`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]string, 0)
	for rows.Next() {
		var domain string
		if err := rows.Scan(&domain); err != nil {
			return nil, err
		}
		result = append(result, domain)
	}
	return result, rows.Err()
}

func scanSettings(row interface{ Scan(...any) error }) (*Settings, error) {
	var (
		item                                               Settings
		id, organizationID, agentID                        pgtype.UUID
		slug, title, description, logo, favicon            pgtype.Text
		brandColor, ctaText, ctaURL, customDomain          pgtype.Text
		domainToken, sslStatus                             pgtype.Text
		headerLinks                                        []byte
		createdAt, updatedAt, verifiedAt                   pgtype.Timestamptz
		enabled, ctaEnabled, autoGenerate, aiSearchEnabled bool
		chatWidgetEnabled, txtVerified, cnameVerified      bool
	)
	if err := row.Scan(&id, &organizationID, &enabled, &slug, &title, &description, &logo, &favicon, &brandColor, &headerLinks, &ctaText, &ctaURL, &ctaEnabled, &autoGenerate, &agentID, &aiSearchEnabled, &chatWidgetEnabled, &customDomain, &domainToken, &txtVerified, &cnameVerified, &sslStatus, &verifiedAt, &createdAt, &updatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	item.ID = uuidFromType(id)
	item.OrganizationID = uuidFromType(organizationID)
	item.Enabled = enabled
	item.Slug = textPtr(slug)
	item.Title = textPtr(title)
	item.Description = textPtr(description)
	item.LogoURL = textPtr(logo)
	item.FaviconURL = textPtr(favicon)
	item.BrandColor = textValue(brandColor, DefaultBrandColor)
	item.HeaderLinks = decodeLinks(headerLinks)
	item.CTAText = textPtr(ctaText)
	item.CTAURL = textPtr(ctaURL)
	item.CTAEnabled = ctaEnabled
	item.AutoGenerate = autoGenerate
	item.AgentID = uuidPtr(agentID)
	item.AISearchEnabled = aiSearchEnabled
	item.ChatWidgetEnabled = chatWidgetEnabled
	item.CustomDomain = textPtr(customDomain)
	item.DomainVerificationToken = textPtr(domainToken)
	item.TXTRecordVerified = txtVerified
	item.CNAMERecordVerified = cnameVerified
	item.SSLStatus = textValue(sslStatus, "none")
	item.DomainVerifiedAt = timePtr(verifiedAt)
	item.CreatedAt = timePtr(createdAt)
	item.UpdatedAt = timePtr(updatedAt)
	return &item, nil
}

func (r *Repository) EnsureSettings(ctx context.Context, organizationID uuid.UUID) (*Settings, error) {
	if found, err := r.GetSettingsByOrganization(ctx, organizationID); err == nil {
		return found, nil
	} else if !errors.Is(err, ErrNotFound) {
		return nil, err
	}
	name := "help"
	_ = r.pool.QueryRow(ctx, `SELECT COALESCE(NULLIF(name,''),'help') FROM organizations WHERE id=$1`, organizationID).Scan(&name)
	base := slugify(name)
	for index := 1; index < 1000; index++ {
		slug := base
		if index > 1 {
			suffix := "-" + strconv.Itoa(index)
			slug = strings.TrimSuffix(base[:min(len(base), 63-len(suffix))], "-") + suffix
		}
		id := uuid.New()
		_, err := r.pool.Exec(ctx, `INSERT INTO help_center_settings (id,organization_id,enabled,slug,brand_color,header_links,cta_text,cta_enabled,auto_generate,ai_search_enabled,chat_widget_enabled,ssl_status,txt_record_verified,cname_record_verified) VALUES ($1,$2,false,$3,$4,'[]'::jsonb,$5,true,true,true,true,'none',false,false) ON CONFLICT (organization_id) DO NOTHING`, id, organizationID, slug, DefaultBrandColor, DefaultCTAText)
		if err != nil {
			if strings.Contains(strings.ToLower(err.Error()), "slug") {
				continue
			}
			return nil, err
		}
		return r.GetSettingsByOrganization(ctx, organizationID)
	}
	return nil, ErrConflict
}

func (r *Repository) UpdateSettings(ctx context.Context, organizationID uuid.UUID, values map[string]any) (*Settings, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	if len(values) == 0 {
		return r.GetSettingsByOrganization(ctx, organizationID)
	}
	allowed := map[string]string{
		"enabled": "enabled", "title": "title", "description": "description", "brand_color": "brand_color",
		"header_links": "header_links", "cta_text": "cta_text", "cta_url": "cta_url", "cta_enabled": "cta_enabled",
		"auto_generate": "auto_generate", "agent_id": "agent_id", "ai_search_enabled": "ai_search_enabled",
		"chat_widget_enabled": "chat_widget_enabled",
	}
	columns := make([]string, 0, len(values))
	args := []any{organizationID}
	for key, value := range values {
		column, ok := allowed[key]
		if !ok {
			continue
		}
		if key == "header_links" {
			encoded, err := json.Marshal(value)
			if err != nil {
				return nil, err
			}
			args = append(args, string(encoded))
			columns = append(columns, column+"=$"+strconv.Itoa(len(args))+"::jsonb")
			continue
		}
		args = append(args, value)
		columns = append(columns, column+"=$"+strconv.Itoa(len(args)))
	}
	if len(columns) == 0 {
		return r.GetSettingsByOrganization(ctx, organizationID)
	}
	query := `UPDATE help_center_settings SET ` + strings.Join(columns, ",") + `,updated_at=NOW() WHERE organization_id=$1`
	result, err := r.pool.Exec(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	if result.RowsAffected() == 0 {
		return nil, ErrNotFound
	}
	return r.GetSettingsByOrganization(ctx, organizationID)
}

func (r *Repository) SetDomain(ctx context.Context, organizationID uuid.UUID, domain string) (*Settings, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	tokenBytes := make([]byte, 24)
	if _, err := rand.Read(tokenBytes); err != nil {
		return nil, err
	}
	token := hex.EncodeToString(tokenBytes)
	result, err := r.pool.Exec(ctx, `UPDATE help_center_settings SET custom_domain=$2,domain_verification_token=$3,txt_record_verified=false,cname_record_verified=false,ssl_status='none',domain_verified_at=NULL,updated_at=NOW() WHERE organization_id=$1`, organizationID, strings.ToLower(strings.TrimSpace(domain)), token)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "unique") {
			return nil, ErrConflict
		}
		return nil, err
	}
	if result.RowsAffected() == 0 {
		return nil, ErrNotFound
	}
	return r.GetSettingsByOrganization(ctx, organizationID)
}

func (r *Repository) ClearDomain(ctx context.Context, organizationID uuid.UUID) (*Settings, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	_, err := r.pool.Exec(ctx, `UPDATE help_center_settings SET custom_domain=NULL,domain_verification_token=NULL,txt_record_verified=false,cname_record_verified=false,ssl_status='none',domain_verified_at=NULL,updated_at=NOW() WHERE organization_id=$1`, organizationID)
	if err != nil {
		return nil, err
	}
	return r.GetSettingsByOrganization(ctx, organizationID)
}

func (r *Repository) SetDomainVerification(ctx context.Context, organizationID uuid.UUID, txt, cname bool, sslStatus string) (*Settings, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	verifiedAt := any(nil)
	if txt && cname {
		verifiedAt = time.Now().UTC()
	}
	_, err := r.pool.Exec(ctx, `UPDATE help_center_settings SET txt_record_verified=$2,cname_record_verified=$3,ssl_status=$4,domain_verified_at=$5,updated_at=NOW() WHERE organization_id=$1`, organizationID, txt, cname, sslStatus, verifiedAt)
	if err != nil {
		return nil, err
	}
	return r.GetSettingsByOrganization(ctx, organizationID)
}

const faqProjection = `SELECT id,organization_id,question,answer,category,slug,url_path,source_url,meta_title,meta_description,status,knowledge_id,source_label,generation_job_id,created_by,sort_order,helpful_yes,helpful_no,created_at,updated_at FROM faqs`

func scanFAQ(row interface{ Scan(...any) error }) (*FAQ, error) {
	var (
		item                                                              FAQ
		org, createdBy                                                    pgtype.UUID
		slug, urlPath, sourceURL, metaTitle, metaDescription, sourceLabel pgtype.Text
		knowledgeID, jobID                                                pgtype.Int8
		createdAt, updatedAt                                              pgtype.Timestamptz
	)
	if err := row.Scan(&item.ID, &org, &item.Question, &item.Answer, &item.Category, &slug, &urlPath, &sourceURL, &metaTitle, &metaDescription, &item.Status, &knowledgeID, &sourceLabel, &jobID, &createdBy, &item.SortOrder, &item.HelpfulYes, &item.HelpfulNo, &createdAt, &updatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	item.OrganizationID = uuidFromType(org)
	item.Slug = textPtr(slug)
	item.URLPath = textPtr(urlPath)
	item.SourceURL = textPtr(sourceURL)
	item.MetaTitle = textPtr(metaTitle)
	item.MetaDescription = textPtr(metaDescription)
	item.SourceLabel = textPtr(sourceLabel)
	item.KnowledgeID = int64Ptr(knowledgeID)
	item.GenerationJobID = int64Ptr(jobID)
	item.CreatedBy = uuidPtr(createdBy)
	item.CreatedAt = timePtr(createdAt)
	item.UpdatedAt = timePtr(updatedAt)
	return &item, nil
}

func (r *Repository) ListFAQs(ctx context.Context, organizationID uuid.UUID, status, category, search string, offset, limit int) ([]*FAQ, int, error) {
	if err := r.ready(); err != nil {
		return nil, 0, err
	}
	conditions := []string{"organization_id=$1"}
	args := []any{organizationID}
	add := func(condition string, value any) {
		args = append(args, value)
		conditions = append(conditions, fmt.Sprintf(condition, len(args)))
	}
	if strings.TrimSpace(status) != "" {
		add("status=$%d", strings.ToLower(strings.TrimSpace(status)))
	}
	if strings.TrimSpace(category) != "" {
		add("category=$%d", strings.TrimSpace(category))
	}
	if strings.TrimSpace(search) != "" {
		add("(question ILIKE $%d OR answer ILIKE $%d)", "%"+strings.TrimSpace(search)+"%")
		// The condition above intentionally uses one placeholder twice.
		conditions[len(conditions)-1] = fmt.Sprintf("(question ILIKE $%d OR answer ILIKE $%d)", len(args), len(args))
	}
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM faqs WHERE `+strings.Join(conditions, " AND "), args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	if limit <= 0 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}
	args = append(args, limit, offset)
	rows, err := r.pool.Query(ctx, faqProjection+` WHERE `+strings.Join(conditions, " AND ")+` ORDER BY sort_order,id LIMIT $`+strconv.Itoa(len(args)-1)+` OFFSET $`+strconv.Itoa(len(args)), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	items := make([]*FAQ, 0)
	for rows.Next() {
		item, err := scanFAQ(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}
	return items, total, rows.Err()
}

func (r *Repository) Categories(ctx context.Context, organizationID uuid.UUID) ([]string, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, `SELECT DISTINCT category FROM faqs WHERE organization_id=$1 ORDER BY category`, organizationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]string, 0)
	for rows.Next() {
		var category string
		if err := rows.Scan(&category); err != nil {
			return nil, err
		}
		result = append(result, category)
	}
	return result, rows.Err()
}

func (r *Repository) GetFAQ(ctx context.Context, organizationID, id uuid.UUID) (*FAQ, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanFAQ(r.pool.QueryRow(ctx, faqProjection+` WHERE organization_id=$1 AND id=$2`, organizationID, id))
}

func (r *Repository) GetPublishedBySlug(ctx context.Context, organizationID uuid.UUID, slug string) (*FAQ, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanFAQ(r.pool.QueryRow(ctx, faqProjection+` WHERE organization_id=$1 AND slug=$2 AND status='published'`, organizationID, slug))
}

func (r *Repository) GetPublishedByPath(ctx context.Context, organizationID uuid.UUID, path string) (*FAQ, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanFAQ(r.pool.QueryRow(ctx, faqProjection+` WHERE organization_id=$1 AND url_path=$2 AND status='published'`, organizationID, path))
}

func (r *Repository) Published(ctx context.Context, organizationID uuid.UUID, search string) ([]*FAQ, error) {
	items, _, err := r.ListFAQs(ctx, organizationID, "published", "", search, 0, 1000)
	return items, err
}

// LogQuery records public Ask AI usage without retaining model output. It is
// deliberately best-effort at the handler boundary so analytics cannot alter
// whether a visitor receives an answer.
func (r *Repository) LogQuery(ctx context.Context, organizationID uuid.UUID, query string, answered bool) error {
	if err := r.ready(); err != nil {
		return err
	}
	_, err := r.pool.Exec(ctx, `
INSERT INTO help_center_queries (id, organization_id, query, answered)
VALUES ($1, $2, $3, $4)`, uuid.New(), organizationID, query, answered)
	return err
}

func (r *Repository) CountPublished(ctx context.Context, organizationID uuid.UUID) (int, error) {
	if err := r.ready(); err != nil {
		return 0, err
	}
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM faqs WHERE organization_id=$1 AND status='published'`, organizationID).Scan(&count)
	return count, err
}

func (r *Repository) CreateFAQ(ctx context.Context, item FAQ) (*FAQ, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	if item.ID == uuid.Nil {
		item.ID = uuid.New()
	}
	if item.Category == "" {
		item.Category = "General"
	}
	if item.Status == "" {
		item.Status = "draft"
	}
	if item.Slug == nil || strings.TrimSpace(valueOrEmpty(item.Slug)) == "" {
		slug, err := r.UniqueSlug(ctx, item.OrganizationID, item.Question, uuid.Nil)
		if err != nil {
			return nil, err
		}
		item.Slug = &slug
	}
	_, err := r.pool.Exec(ctx, `INSERT INTO faqs (id,organization_id,question,answer,category,slug,url_path,source_url,meta_title,meta_description,status,knowledge_id,source_label,generation_job_id,created_by,sort_order,helpful_yes,helpful_no) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,0,0)`, item.ID, item.OrganizationID, item.Question, item.Answer, item.Category, item.Slug, item.URLPath, item.SourceURL, item.MetaTitle, item.MetaDescription, item.Status, item.KnowledgeID, item.SourceLabel, item.GenerationJobID, item.CreatedBy, item.SortOrder)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "unique") {
			return nil, ErrConflict
		}
		return nil, err
	}
	return r.GetFAQ(ctx, item.OrganizationID, item.ID)
}

func (r *Repository) UpdateFAQ(ctx context.Context, organizationID, id uuid.UUID, values map[string]any) (*FAQ, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	allowed := map[string]string{"question": "question", "answer": "answer", "category": "category", "status": "status", "slug": "slug", "url_path": "url_path", "meta_title": "meta_title", "meta_description": "meta_description"}
	columns := make([]string, 0, len(values))
	args := []any{organizationID, id}
	for key, value := range values {
		if column, ok := allowed[key]; ok {
			args = append(args, value)
			columns = append(columns, column+"=$"+strconv.Itoa(len(args)))
		}
	}
	if len(columns) > 0 {
		result, err := r.pool.Exec(ctx, `UPDATE faqs SET `+strings.Join(columns, ",")+`,updated_at=NOW() WHERE organization_id=$1 AND id=$2`, args...)
		if err != nil {
			if strings.Contains(strings.ToLower(err.Error()), "unique") {
				return nil, ErrConflict
			}
			return nil, err
		}
		if result.RowsAffected() == 0 {
			return nil, ErrNotFound
		}
	}
	return r.GetFAQ(ctx, organizationID, id)
}

func (r *Repository) DeleteFAQ(ctx context.Context, organizationID, id uuid.UUID) error {
	if err := r.ready(); err != nil {
		return err
	}
	result, err := r.pool.Exec(ctx, `DELETE FROM faqs WHERE organization_id=$1 AND id=$2`, organizationID, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *Repository) BulkStatus(ctx context.Context, organizationID uuid.UUID, ids []uuid.UUID, status string) (int, error) {
	if err := r.ready(); err != nil {
		return 0, err
	}
	result, err := r.pool.Exec(ctx, `UPDATE faqs SET status=$3,updated_at=NOW() WHERE organization_id=$1 AND id=ANY($2::uuid[])`, organizationID, ids, strings.ToLower(status))
	return int(result.RowsAffected()), err
}

func (r *Repository) BulkDelete(ctx context.Context, organizationID uuid.UUID, ids []uuid.UUID) (int, error) {
	if err := r.ready(); err != nil {
		return 0, err
	}
	result, err := r.pool.Exec(ctx, `DELETE FROM faqs WHERE organization_id=$1 AND id=ANY($2::uuid[])`, organizationID, ids)
	return int(result.RowsAffected()), err
}

func (r *Repository) RecordFeedback(ctx context.Context, organizationID, id uuid.UUID, helpful bool) error {
	if err := r.ready(); err != nil {
		return err
	}
	column := "helpful_no"
	if helpful {
		column = "helpful_yes"
	}
	_, err := r.pool.Exec(ctx, `UPDATE faqs SET `+column+`=`+column+`+1 WHERE organization_id=$1 AND id=$2 AND status='published'`, organizationID, id)
	return err
}

func (r *Repository) UniqueSlug(ctx context.Context, organizationID uuid.UUID, source string, exclude uuid.UUID) (string, error) {
	base := slugify(source)
	for index := 1; index < 10000; index++ {
		candidate := base
		if index > 1 {
			suffix := "-" + strconv.Itoa(index)
			candidate = strings.TrimSuffix(base[:min(len(base), 80-len(suffix))], "-") + suffix
		}
		var exists bool
		if err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM faqs WHERE organization_id=$1 AND slug=$2 AND ($3::uuid='00000000-0000-0000-0000-000000000000' OR id<>$3))`, organizationID, candidate, exclude).Scan(&exists); err != nil {
			return "", err
		}
		if !exists {
			return candidate, nil
		}
	}
	return "", ErrConflict
}

// NormalizeURLPath converts a full URL or a root-relative path into the form
// stored by the Python help center. It intentionally rejects reserved paths so
// an imported article cannot shadow /api, /ask, or the article routes.
func NormalizeURLPath(raw string) (string, bool) {
	candidate := strings.TrimSpace(raw)
	if candidate == "" {
		return "", false
	}
	if parsed, err := url.Parse(candidate); err == nil && parsed.Scheme != "" {
		candidate = parsed.Path
	}
	if index := strings.IndexAny(candidate, "?#"); index >= 0 {
		candidate = candidate[:index]
	}
	candidate, err := url.PathUnescape(candidate)
	if err != nil {
		return "", false
	}
	if !strings.HasPrefix(candidate, "/") {
		candidate = "/" + candidate
	}
	candidate = regexp.MustCompile(`/+`).ReplaceAllString(candidate, "/")
	candidate = strings.TrimRight(candidate, "/")
	if candidate == "" || len(candidate) > 400 || strings.ContainsAny(candidate, "\x00\r\n") {
		return "", false
	}
	segments := strings.Split(strings.TrimPrefix(candidate, "/"), "/")
	if len(segments) == 0 || segments[0] == "" || segments[0] == "." || segments[0] == ".." {
		return "", false
	}
	for _, segment := range segments {
		if segment == "." || segment == ".." {
			return "", false
		}
	}
	reserved := map[string]struct{}{"a": {}, "ask": {}, "api": {}, "help": {}, "healthz": {}, "robots.txt": {}, "sitemap.xml": {}, ".well-known": {}, "static": {}, "uploads": {}}
	if _, exists := reserved[strings.ToLower(segments[0])]; exists {
		return "", false
	}
	return candidate, true
}

func (r *Repository) CreateJob(ctx context.Context, job Job) (*Job, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	if job.Status == "" {
		job.Status = "pending"
	}
	if job.Stage == "" {
		job.Stage = "not_started"
	}
	if job.JobType == "" {
		job.JobType = "generate_all"
	}
	metadata, _ := json.Marshal(job.KnowledgeIDs)
	var id int64
	err := r.pool.QueryRow(ctx, `INSERT INTO faq_generation_jobs (organization_id,user_id,job_type,knowledge_id,knowledge_ids,source_url,source_file_name,preserve_source_urls,metered,status,stage,progress_percentage,faqs_created) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`, job.OrganizationID, job.UserID, job.JobType, job.KnowledgeID, string(metadata), job.SourceURL, job.SourceFileName, job.PreserveSourceURLs, job.Metered, job.Status, job.Stage, job.ProgressPercentage, job.FAQsCreated).Scan(&id)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "unique") {
			return nil, ErrConflict
		}
		return nil, err
	}
	return r.GetJob(ctx, job.OrganizationID, id)
}

const jobProjection = `SELECT id,organization_id,user_id,job_type,knowledge_id,knowledge_ids,source_url,source_file_name,preserve_source_urls,llm_calls,metered,status,stage,progress_percentage,faqs_created,error,created_at,updated_at FROM faq_generation_jobs`

func (r *Repository) GetJob(ctx context.Context, organizationID uuid.UUID, id int64) (*Job, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanJob(r.pool.QueryRow(ctx, jobProjection+` WHERE organization_id=$1 AND id=$2`, organizationID, id))
}

func (r *Repository) LatestJob(ctx context.Context, organizationID uuid.UUID, active bool) (*Job, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	where := ""
	if active {
		where = ` AND status IN ('pending','processing')`
	}
	return scanJob(r.pool.QueryRow(ctx, jobProjection+` WHERE organization_id=$1`+where+` ORDER BY created_at DESC,id DESC LIMIT 1`, organizationID))
}

func scanJob(row interface{ Scan(...any) error }) (*Job, error) {
	var (
		item                                             Job
		org, userID                                      pgtype.UUID
		knowledgeID                                      pgtype.Int8
		knowledgeIDs, sourceURL, sourceFileName, errText []byte
		preserve, metered                                bool
		createdAt, updatedAt                             pgtype.Timestamptz
	)
	if err := row.Scan(&item.ID, &org, &userID, &item.JobType, &knowledgeID, &knowledgeIDs, &sourceURL, &sourceFileName, &preserve, &item.LLMCalls, &metered, &item.Status, &item.Stage, &item.ProgressPercentage, &item.FAQsCreated, &errText, &createdAt, &updatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	item.OrganizationID = uuidFromType(org)
	item.UserID = uuidPtr(userID)
	item.KnowledgeID = int64Ptr(knowledgeID)
	item.SourceURL = bytesTextPtr(sourceURL)
	item.SourceFileName = bytesTextPtr(sourceFileName)
	item.PreserveSourceURLs = preserve
	item.Metered = metered
	item.Error = bytesTextPtr(errText)
	item.CreatedAt = timePtr(createdAt)
	item.UpdatedAt = timePtr(updatedAt)
	if len(knowledgeIDs) > 0 {
		_ = json.Unmarshal(knowledgeIDs, &item.KnowledgeIDs)
	}
	return &item, nil
}

func (r *Repository) UpdateJob(ctx context.Context, id int64, status, stage string, progress float64, faqsCreated int, errText *string) error {
	if err := r.ready(); err != nil {
		return err
	}
	_, err := r.pool.Exec(ctx, `UPDATE faq_generation_jobs SET status=$2,stage=$3,progress_percentage=$4,faqs_created=$5,error=$6,updated_at=NOW() WHERE id=$1`, id, status, stage, progress, faqsCreated, errText)
	return err
}

func (r *Repository) Estimate(ctx context.Context, organizationID uuid.UUID) (total, fresh, pages, calls int, err error) {
	if err = r.ready(); err != nil {
		return
	}
	if err = r.pool.QueryRow(ctx, `SELECT COUNT(*),COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM faqs f WHERE f.organization_id=k.organization_id AND f.knowledge_id=k.id)) FROM knowledge k WHERE k.organization_id=$1`, organizationID).Scan(&total, &fresh); err != nil {
		return
	}
	// A source's table is shared by its organization. Count distinct page ids
	// only for rows that have a valid schema/table recorded by the Python app.
	var rawPages int
	if err = r.pool.QueryRow(ctx, `SELECT COALESCE(SUM(1),0) FROM knowledge WHERE organization_id=$1`, organizationID).Scan(&rawPages); err != nil {
		return
	}
	pages = rawPages
	calls = fresh
	if calls == 0 && total > 0 {
		calls = 1
	}
	return
}

var nonSlug = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	value = nonSlug.ReplaceAllString(value, "-")
	value = strings.Trim(value, "-")
	if value == "" {
		value = "article"
	}
	if len(value) > 80 {
		value = strings.Trim(value[:80], "-")
	}
	return value
}

func decodeLinks(raw []byte) []map[string]any {
	var value []map[string]any
	if len(raw) == 0 || json.Unmarshal(raw, &value) != nil || value == nil {
		return []map[string]any{}
	}
	return value
}

func uuidFromType(value pgtype.UUID) uuid.UUID {
	if !value.Valid {
		return uuid.Nil
	}
	return uuid.UUID(value.Bytes)
}

func uuidPtr(value pgtype.UUID) *uuid.UUID {
	if !value.Valid {
		return nil
	}
	result := uuidFromType(value)
	return &result
}

func textPtr(value pgtype.Text) *string {
	if !value.Valid {
		return nil
	}
	result := value.String
	return &result
}

func textValue(value pgtype.Text, fallback string) string {
	if !value.Valid || value.String == "" {
		return fallback
	}
	return value.String
}

func timePtr(value pgtype.Timestamptz) *time.Time {
	if !value.Valid {
		return nil
	}
	result := value.Time
	return &result
}

func int64Ptr(value pgtype.Int8) *int64 {
	if !value.Valid {
		return nil
	}
	result := value.Int64
	return &result
}

func bytesTextPtr(value []byte) *string {
	if len(value) == 0 || string(value) == "null" {
		return nil
	}
	result := string(value)
	return &result
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func min(left, right int) int {
	if left < right {
		return left
	}
	return right
}
