package knowledge

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/url"
	"regexp"
	"sort"
	"strings"
	"time"
	"unicode"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotConfigured = errors.New("knowledge storage is not configured")
	ErrNotFound      = errors.New("knowledge source not found")
	ErrQueueNotFound = errors.New("queue item not found")
	ErrAlreadyLinked = errors.New("knowledge is already linked to this agent")
	ErrNotLinked     = errors.New("knowledge is not linked to this agent")
	ErrNoVectorTable = errors.New("knowledge source has no vector database table")
)

var identifierPattern = regexp.MustCompile(`^[A-Za-z0-9_-]+$`)

type AgentLink struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}

type Source struct {
	ID             int64       `json:"id"`
	Name           string      `json:"name"`
	Source         string      `json:"source"`
	SourceType     string      `json:"type"`
	Schema         *string     `json:"schema,omitempty"`
	TableName      *string     `json:"table_name,omitempty"`
	OrganizationID uuid.UUID   `json:"organization_id"`
	CreatedAt      *time.Time  `json:"created_at,omitempty"`
	UpdatedAt      *time.Time  `json:"updated_at,omitempty"`
	Agents         []AgentLink `json:"agents"`
}

type Page struct {
	Subpage   string     `json:"subpage"`
	CreatedAt *time.Time `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
}

type SourceWithPages struct {
	Source
	Pages []Page `json:"pages"`
	Error string `json:"error,omitempty"`
}

type Pagination struct {
	Total      int `json:"total"`
	Page       int `json:"page"`
	PageSize   int `json:"page_size"`
	TotalPages int `json:"total_pages"`
}

type ContentChunk struct {
	ID        string         `json:"id"`
	Content   string         `json:"content"`
	Metadata  map[string]any `json:"metadata"`
	CreatedAt *time.Time     `json:"created_at"`
}

// SearchResult is the small, transport-neutral projection consumed by the AI
// runtime. The full source/chunk records remain an HTTP concern; AI only needs
// grounded text plus the citation identity and relevance score.
type SearchResult struct {
	Content    string  `json:"content"`
	Name       string  `json:"name"`
	SourceType string  `json:"source_type"`
	Similarity float64 `json:"similarity"`
}

// SearchStore is optional so config-only fakes and existing HTTP tests do not
// need to implement the runtime search path.
type SearchStore interface {
	Store
	Search(ctx context.Context, organizationID, agentID uuid.UUID, source, query string, limit int) ([]SearchResult, error)
}

type QueueItem struct {
	ID                 int64          `json:"id"`
	OrganizationID     uuid.UUID      `json:"organization_id"`
	AgentID            *uuid.UUID     `json:"agent_id"`
	UserID             *uuid.UUID     `json:"user_id"`
	SourceType         string         `json:"source_type"`
	Source             string         `json:"source"`
	Status             string         `json:"status"`
	Error              *string        `json:"error"`
	QueueMetadata      map[string]any `json:"queue_metadata,omitempty"`
	Priority           int            `json:"priority,omitempty"`
	ProcessingStage    string         `json:"processing_stage"`
	ProgressPercentage float64        `json:"progress_percentage"`
	TotalItems         int            `json:"total_items"`
	ProcessedItems     int            `json:"processed_items"`
	CrawledURLs        []string       `json:"crawled_urls"`
	CreatedAt          *time.Time     `json:"created_at"`
	UpdatedAt          *time.Time     `json:"updated_at"`
}

type QueueCreateInput struct {
	OrganizationID uuid.UUID
	AgentID        *uuid.UUID
	UserID         *uuid.UUID
	SourceType     string
	Source         string
	Metadata       map[string]any
	Priority       int
}

type ProcessorStatus struct {
	LastRun    *time.Time `json:"last_run"`
	Running    bool       `json:"is_running"`
	Error      *string    `json:"error"`
	Pending    int        `json:"-"`
	Processing int        `json:"-"`
	Completed  int        `json:"-"`
	Failed     int        `json:"-"`
}

type Store interface {
	CreateQueue(ctx context.Context, input QueueCreateInput) (*QueueItem, error)
	GetQueue(ctx context.Context, id int64) (*QueueItem, error)
	ListQueueByAgent(ctx context.Context, orgID, agentID uuid.UUID) ([]*QueueItem, error)
	ListQueueByOrganization(ctx context.Context, orgID uuid.UUID) ([]*QueueItem, error)
	DeleteQueue(ctx context.Context, id int64, orgID uuid.UUID) (bool, error)
	ProcessorStatus(ctx context.Context, orgID, userID uuid.UUID) (ProcessorStatus, error)

	GetSource(ctx context.Context, id int64) (*Source, error)
	ListByAgent(ctx context.Context, orgID, agentID uuid.UUID, offset, limit int) ([]*SourceWithPages, int, error)
	ListByOrganization(ctx context.Context, orgID uuid.UUID, offset, limit int) ([]*SourceWithPages, int, error)
	FindBySources(ctx context.Context, orgID uuid.UUID, sources []string) ([]*Source, error)
	CreateTextSource(ctx context.Context, orgID uuid.UUID, title, content string, agentID *uuid.UUID) (*Source, error)
	DeleteSource(ctx context.Context, id int64, orgID uuid.UUID) error
	GetContent(ctx context.Context, source *Source) ([]ContentChunk, error)
	UpdateChunk(ctx context.Context, source *Source, chunkID, content string) error
	DeleteChunk(ctx context.Context, source *Source, chunkID string) (bool, error)
	AddSubpage(ctx context.Context, source *Source, subpage, content, rawURL string) error
	ReplacePage(ctx context.Context, source *Source, pageID, content, title string) (int, error)
	DeletePage(ctx context.Context, source *Source, pageID string) (int, error)
	Link(ctx context.Context, sourceID int64, orgID, agentID uuid.UUID) error
	Unlink(ctx context.Context, sourceID int64, orgID, agentID uuid.UUID) error
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

func (r *Repository) GetSource(ctx context.Context, id int64) (*Source, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanSource(r.pool.QueryRow(ctx, sourceProjection+` WHERE k.id = $1`, id))
}

const sourceProjection = `
SELECT k.id, k.source, k.source_type::text, k.schema, k.table_name,
       k.organization_id, k.created_at, k.updated_at
FROM knowledge k`

func (r *Repository) FindBySources(ctx context.Context, orgID uuid.UUID, sources []string) ([]*Source, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	if len(sources) == 0 {
		return []*Source{}, nil
	}
	rows, err := r.pool.Query(ctx, sourceProjection+` WHERE k.organization_id = $1 AND k.source = ANY($2::text[]) ORDER BY k.id`, orgID, sources)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items, err := collectSources(rows)
	if err != nil {
		return nil, err
	}
	return r.attachLinks(ctx, items)
}

func (r *Repository) ListByAgent(ctx context.Context, orgID, agentID uuid.UUID, offset, limit int) ([]*SourceWithPages, int, error) {
	if err := r.ready(); err != nil {
		return nil, 0, err
	}
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM knowledge k JOIN knowledge_to_agents ka ON ka.knowledge_id=k.id WHERE k.organization_id=$1 AND ka.agent_id=$2`, orgID, agentID).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, sourceProjection+` JOIN knowledge_to_agents ka ON ka.knowledge_id=k.id WHERE k.organization_id=$1 AND ka.agent_id=$2 ORDER BY k.id OFFSET $3 LIMIT $4`, orgID, agentID, offset, limit)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	items, err := collectSources(rows)
	if err != nil {
		return nil, 0, err
	}
	items, err = r.attachLinks(ctx, items)
	if err != nil {
		return nil, 0, err
	}
	return r.addPages(ctx, items)
}

func (r *Repository) ListByOrganization(ctx context.Context, orgID uuid.UUID, offset, limit int) ([]*SourceWithPages, int, error) {
	if err := r.ready(); err != nil {
		return nil, 0, err
	}
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM knowledge WHERE organization_id=$1`, orgID).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, sourceProjection+` WHERE k.organization_id=$1 ORDER BY k.id OFFSET $2 LIMIT $3`, orgID, offset, limit)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	items, err := collectSources(rows)
	if err != nil {
		return nil, 0, err
	}
	items, err = r.attachLinks(ctx, items)
	if err != nil {
		return nil, 0, err
	}
	return r.addPages(ctx, items)
}

func collectSources(rows pgx.Rows) ([]*Source, error) {
	items := make([]*Source, 0)
	for rows.Next() {
		item, err := scanSource(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func scanSource(row interface{ Scan(...any) error }) (*Source, error) {
	var (
		item             Source
		sourceType       string
		schema, table    pgtype.Text
		org              pgtype.UUID
		created, updated pgtype.Timestamptz
	)
	if err := row.Scan(&item.ID, &item.Source, &sourceType, &schema, &table, &org, &created, &updated); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	item.Name = item.Source
	item.SourceType = strings.ToLower(sourceType)
	item.Schema = textPtr(schema)
	item.TableName = textPtr(table)
	item.OrganizationID = uuidFromType(org)
	item.CreatedAt = timePtr(created)
	item.UpdatedAt = timePtr(updated)
	item.Agents = []AgentLink{}
	return &item, nil
}

func textPtr(value pgtype.Text) *string {
	if !value.Valid {
		return nil
	}
	result := value.String
	return &result
}

func timePtr(value pgtype.Timestamptz) *time.Time {
	if !value.Valid {
		return nil
	}
	result := value.Time
	return &result
}

func uuidFromType(value pgtype.UUID) uuid.UUID {
	if !value.Valid {
		return uuid.Nil
	}
	result, _ := uuid.FromBytes(value.Bytes[:])
	return result
}

func (r *Repository) attachLinks(ctx context.Context, items []*Source) ([]*Source, error) {
	if len(items) == 0 {
		return items, nil
	}
	ids := make([]int64, 0, len(items))
	byID := make(map[int64]*Source, len(items))
	for _, item := range items {
		ids = append(ids, item.ID)
		byID[item.ID] = item
	}
	rows, err := r.pool.Query(ctx, `
SELECT ka.knowledge_id, a.id, COALESCE(a.display_name, a.name)
FROM knowledge_to_agents ka JOIN agents a ON a.id=ka.agent_id
WHERE ka.knowledge_id = ANY($1::bigint[]) ORDER BY ka.knowledge_id, a.id`, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var sourceID int64
		var agentID uuid.UUID
		var name string
		if err := rows.Scan(&sourceID, &agentID, &name); err != nil {
			return nil, err
		}
		if item := byID[sourceID]; item != nil {
			item.Agents = append(item.Agents, AgentLink{ID: agentID, Name: name})
		}
	}
	return items, rows.Err()
}

func (r *Repository) addPages(ctx context.Context, items []*Source) ([]*SourceWithPages, int, error) {
	result := make([]*SourceWithPages, 0, len(items))
	for _, source := range items {
		pages, err := r.pages(ctx, source)
		if err != nil {
			view := SourceWithPages{Source: *source, Pages: []Page{}, Error: "Error accessing data: " + err.Error()}
			result = append(result, &view)
			continue
		}
		result = append(result, &SourceWithPages{Source: *source, Pages: pages})
	}
	return result, len(result), nil
}

func (r *Repository) pages(ctx context.Context, source *Source) ([]Page, error) {
	if source.TableName == nil || source.Schema == nil {
		return []Page{}, nil
	}
	if !validIdentifier(*source.Schema) || !validIdentifier(*source.TableName) {
		return nil, errors.New("invalid vector table identifier")
	}
	expr := pageIDExpression()
	rows, err := r.pool.Query(ctx, fmt.Sprintf(`SELECT DISTINCT %s AS subpage, MIN(created_at), MAX(updated_at) FROM %s.%s WHERE name=$1 GROUP BY %s ORDER BY MIN(created_at)`, expr, quote(*source.Schema), quote(*source.TableName), expr), source.Source)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	pages := make([]Page, 0)
	for rows.Next() {
		var subpage string
		var created, updated pgtype.Timestamptz
		if err := rows.Scan(&subpage, &created, &updated); err != nil {
			return nil, err
		}
		pages = append(pages, Page{Subpage: subpage, CreatedAt: timePtr(created), UpdatedAt: timePtr(updated)})
	}
	return pages, rows.Err()
}

func (r *Repository) CreateTextSource(ctx context.Context, orgID uuid.UUID, title, content string, agentID *uuid.UUID) (*Source, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	title = strings.TrimSpace(title)
	content = strings.TrimSpace(content)
	if title == "" || content == "" {
		return nil, errors.New("title and content are required")
	}
	if existing, err := r.FindBySources(ctx, orgID, []string{title}); err != nil {
		return nil, err
	} else if len(existing) > 0 {
		return nil, errors.New("a knowledge source with this title already exists")
	}
	table, err := r.ensureVectorTable(ctx, orgID)
	if err != nil {
		return nil, err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	var id int64
	if err := tx.QueryRow(ctx, `INSERT INTO knowledge (source, source_type, schema, table_name, organization_id) VALUES ($1,'CUSTOM'::sourcetype,'ai',$2,$3) RETURNING id`, title, table, orgID).Scan(&id); err != nil {
		return nil, err
	}
	if agentID != nil {
		if _, err := tx.Exec(ctx, `INSERT INTO knowledge_to_agents (knowledge_id, agent_id) VALUES ($1,$2)`, id, *agentID); err != nil {
			return nil, err
		}
	}
	filters := map[string]any{"name": title, "org_id": orgID.String(), "agent_id": agentIDs(agentID)}
	if err := upsertVector(ctx, tx, table, title, title, content, map[string]any{"url": title, "title": title, "agent_id": agentIDs(agentID)}, filters); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.GetSource(ctx, id)
}

func (r *Repository) DeleteSource(ctx context.Context, id int64, orgID uuid.UUID) error {
	if err := r.ready(); err != nil {
		return err
	}
	source, err := r.GetSource(ctx, id)
	if errors.Is(err, ErrNotFound) || source == nil {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	if source.OrganizationID != orgID {
		return errors.New("unauthorized access to knowledge source")
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if source.Schema != nil && source.TableName != nil && validIdentifier(*source.Schema) && validIdentifier(*source.TableName) {
		_, _ = tx.Exec(ctx, fmt.Sprintf(`DELETE FROM %s.%s WHERE name=$1`, quote(*source.Schema), quote(*source.TableName)), source.Source)
	}
	if _, err := tx.Exec(ctx, `DELETE FROM knowledge WHERE id=$1 AND organization_id=$2`, id, orgID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *Repository) GetContent(ctx context.Context, source *Source) ([]ContentChunk, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	if source == nil || source.Schema == nil || source.TableName == nil {
		return []ContentChunk{}, nil
	}
	if !validIdentifier(*source.Schema) || !validIdentifier(*source.TableName) {
		return nil, errors.New("invalid vector table identifier")
	}
	rows, err := r.pool.Query(ctx, fmt.Sprintf(`SELECT id, content, meta_data, created_at FROM %s.%s WHERE name=$1 ORDER BY created_at ASC`, quote(*source.Schema), quote(*source.TableName)), source.Source)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	chunks := make([]ContentChunk, 0)
	for rows.Next() {
		var id, content string
		var metadata []byte
		var created pgtype.Timestamptz
		if err := rows.Scan(&id, &content, &metadata, &created); err != nil {
			return nil, err
		}
		meta := map[string]any{}
		if len(metadata) > 0 {
			_ = json.Unmarshal(metadata, &meta)
		}
		chunks = append(chunks, ContentChunk{ID: id, Content: content, Metadata: meta, CreatedAt: timePtr(created)})
	}
	return chunks, rows.Err()
}

// Search performs an agent-scoped lexical search over the same per-organization
// vector tables used by the Python service. The Python runtime uses FastEmbed
// for semantic ranking; lexical ranking here is deliberately deterministic and
// also works for Chinese text without requiring a model download. It preserves
// the important business contract: only linked sources in this organization
// can be returned, at most three chunks are grounded, and citations identify
// the actual sources used.
func (r *Repository) Search(ctx context.Context, organizationID, agentID uuid.UUID, source, query string, limit int) ([]SearchResult, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	query = strings.TrimSpace(query)
	if query == "" || organizationID == uuid.Nil || agentID == uuid.Nil {
		return []SearchResult{}, nil
	}
	if limit < 1 || limit > 10 {
		limit = 3
	}

	rows, err := r.pool.Query(ctx, sourceProjection+`
JOIN knowledge_to_agents ka ON ka.knowledge_id=k.id
WHERE k.organization_id=$1 AND ka.agent_id=$2
  AND ($3 = '' OR k.source=$3)
ORDER BY k.id`, organizationID, agentID, strings.TrimSpace(source))
	if err != nil {
		return nil, err
	}
	sources, err := collectSources(rows)
	rows.Close()
	if err != nil {
		return nil, err
	}
	if len(sources) == 0 {
		return []SearchResult{}, nil
	}

	results := make([]SearchResult, 0, limit)
	for _, item := range sources {
		if item == nil || item.Schema == nil || item.TableName == nil ||
			!validIdentifier(*item.Schema) || !validIdentifier(*item.TableName) {
			continue
		}
		// A source can contain many crawl chunks. Bound each table read so a
		// malformed or unexpectedly large source cannot monopolize a chat turn;
		// the final ranking is still global across all linked sources.
		chunkRows, queryErr := r.pool.Query(ctx, fmt.Sprintf(`
SELECT id, COALESCE(content,''), COALESCE(meta_data,'{}'::jsonb)
FROM %s.%s
WHERE name=$1 AND content IS NOT NULL AND content <> ''
ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
LIMIT 2000`, quote(*item.Schema), quote(*item.TableName)), item.Source)
		if queryErr != nil {
			return nil, queryErr
		}
		for chunkRows.Next() {
			var id string
			var content string
			var metadata []byte
			if scanErr := chunkRows.Scan(&id, &content, &metadata); scanErr != nil {
				chunkRows.Close()
				return nil, scanErr
			}
			score := lexicalRelevance(query, content)
			if score <= 0 {
				continue
			}
			results = append(results, SearchResult{
				Content: strings.TrimSpace(content), Name: func() string {
					if strings.TrimSpace(item.Source) != "" {
						return item.Source
					}
					return id
				}(),
				SourceType: strings.ToLower(strings.TrimSpace(item.SourceType)), Similarity: score,
			})
		}
		if rowErr := chunkRows.Err(); rowErr != nil {
			chunkRows.Close()
			return nil, rowErr
		}
		chunkRows.Close()
	}

	sort.SliceStable(results, func(i, j int) bool {
		if results[i].Similarity == results[j].Similarity {
			if results[i].Name == results[j].Name {
				return results[i].Content < results[j].Content
			}
			return results[i].Name < results[j].Name
		}
		return results[i].Similarity > results[j].Similarity
	})
	if len(results) > limit {
		results = results[:limit]
	}
	return results, nil
}

func lexicalRelevance(query, content string) float64 {
	query = strings.TrimSpace(strings.ToLower(query))
	content = strings.ToLower(content)
	if query == "" || strings.TrimSpace(content) == "" {
		return 0
	}
	tokens := uniqueSearchTokens(query)
	if len(tokens) == 0 {
		return 0
	}
	matched := 0
	for _, token := range tokens {
		if strings.Contains(content, token) {
			matched++
		}
	}
	score := float64(matched) / float64(len(tokens))
	if strings.Contains(content, query) {
		score += 0.35
	}
	if score > 1 {
		return 1
	}
	return score
}

func uniqueSearchTokens(value string) []string {
	result := make([]string, 0)
	seen := map[string]struct{}{}
	current := strings.Builder{}
	flush := func() {
		if current.Len() == 0 {
			return
		}
		token := current.String()
		if _, ok := seen[token]; !ok {
			seen[token] = struct{}{}
			result = append(result, token)
		}
		current.Reset()
	}
	for _, r := range value {
		if unicode.Is(unicode.Han, r) {
			flush()
			token := string(r)
			if _, ok := seen[token]; !ok {
				seen[token] = struct{}{}
				result = append(result, token)
			}
			continue
		}
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			current.WriteRune(r)
			continue
		}
		flush()
	}
	flush()
	return result
}

func (r *Repository) UpdateChunk(ctx context.Context, source *Source, chunkID, content string) error {
	if err := r.requireVector(source); err != nil {
		return err
	}
	content = strings.TrimSpace(content)
	if content == "" {
		return errors.New("content cannot be empty")
	}
	embedding, err := r.embeddingLiteral(ctx, source.OrganizationID, content)
	if err != nil {
		return err
	}
	result, err := r.pool.Exec(ctx, fmt.Sprintf(`UPDATE %s.%s SET content=$1, embedding=$2::vector, content_hash=$3, updated_at=NOW() WHERE id=$4 AND name=$5`, quote(*source.Schema), quote(*source.TableName)), content, embedding, contentHash(content), chunkID, source.Source)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *Repository) DeleteChunk(ctx context.Context, source *Source, chunkID string) (bool, error) {
	if err := r.requireVector(source); err != nil {
		return false, err
	}
	result, err := r.pool.Exec(ctx, fmt.Sprintf(`DELETE FROM %s.%s WHERE id=$1 AND name=$2`, quote(*source.Schema), quote(*source.TableName)), chunkID, source.Source)
	return result.RowsAffected() > 0, err
}

func (r *Repository) AddSubpage(ctx context.Context, source *Source, subpage, content, rawURL string) error {
	if err := r.requireVector(source); err != nil {
		return err
	}
	subpage = strings.TrimSpace(subpage)
	content = strings.TrimSpace(content)
	if subpage == "" || content == "" {
		return errors.New("subpage_name and content are required")
	}
	var exists bool
	if err := r.pool.QueryRow(ctx, fmt.Sprintf(`SELECT EXISTS(SELECT 1 FROM %s.%s WHERE id=$1 AND name=$2)`, quote(*source.Schema), quote(*source.TableName)), subpage, source.Source).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return errors.New("subpage name already exists. Please use a unique name.")
	}
	if strings.TrimSpace(rawURL) != "" && !sameRegistrableDomain(source.Source, rawURL) {
		parent := domainOf(source.Source)
		return fmt.Errorf("subpage URL must be on the same domain as the source (%s)", parent)
	}
	ids, err := r.linkedAgentIDs(ctx, source.ID)
	if err != nil {
		return err
	}
	meta := map[string]any{"agent_id": ids, "title": subpage}
	if strings.TrimSpace(rawURL) != "" {
		meta["url"] = strings.TrimSpace(rawURL)
	}
	filters := map[string]any{"name": source.Source, "org_id": source.OrganizationID.String(), "agent_id": ids}
	return r.withTx(ctx, func(tx pgx.Tx) error {
		return upsertVector(ctx, tx, *source.TableName, source.Source, subpage, content, meta, filters)
	})
}

func (r *Repository) ReplacePage(ctx context.Context, source *Source, pageID, content, title string) (int, error) {
	if err := r.requireVector(source); err != nil {
		return 0, err
	}
	content = strings.TrimSpace(content)
	if content == "" {
		return 0, errors.New("page content cannot be empty")
	}
	expr := pageIDExpression()
	var existing int
	var metadata []byte
	if err := r.pool.QueryRow(ctx, fmt.Sprintf(`SELECT COUNT(*), COALESCE((array_agg(meta_data ORDER BY id))[1],'{}'::jsonb) FROM %s.%s WHERE name=$1 AND %s=$2`, quote(*source.Schema), quote(*source.TableName), expr), source.Source, pageID).Scan(&existing, &metadata); err != nil {
		return 0, err
	}
	if existing == 0 {
		return 0, ErrNotFound
	}
	meta := map[string]any{}
	_ = json.Unmarshal(metadata, &meta)
	if title != "" {
		meta["title"] = title
	}
	ids, err := r.linkedAgentIDs(ctx, source.ID)
	if err != nil {
		return 0, err
	}
	meta["agent_id"] = ids
	filters := map[string]any{"name": source.Source, "org_id": source.OrganizationID.String(), "agent_id": ids}
	if err := r.withTx(ctx, func(tx pgx.Tx) error {
		if err := upsertVector(ctx, tx, *source.TableName, source.Source, pageID, content, meta, filters); err != nil {
			return err
		}
		_, err := tx.Exec(ctx, fmt.Sprintf(`DELETE FROM %s.%s WHERE name=$1 AND %s=$2 AND id<>$2`, quote(*source.Schema), quote(*source.TableName), expr), source.Source, pageID)
		return err
	}); err != nil {
		return 0, err
	}
	return existing, nil
}

func (r *Repository) DeletePage(ctx context.Context, source *Source, pageID string) (int, error) {
	if err := r.requireVector(source); err != nil {
		return 0, err
	}
	expr := pageIDExpression()
	result, err := r.pool.Exec(ctx, fmt.Sprintf(`DELETE FROM %s.%s WHERE name=$1 AND %s=$2`, quote(*source.Schema), quote(*source.TableName), expr), source.Source, pageID)
	return int(result.RowsAffected()), err
}

func (r *Repository) Link(ctx context.Context, sourceID int64, orgID, agentID uuid.UUID) error {
	if err := r.ready(); err != nil {
		return err
	}
	source, err := r.GetSource(ctx, sourceID)
	if err != nil || source == nil || source.OrganizationID != orgID {
		return ErrNotFound
	}
	var agentOrg uuid.UUID
	if err := r.pool.QueryRow(ctx, `SELECT organization_id FROM agents WHERE id=$1`, agentID).Scan(&agentOrg); err != nil || agentOrg != orgID {
		return ErrNotFound
	}
	var exists bool
	if err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM knowledge_to_agents WHERE knowledge_id=$1 AND agent_id=$2)`, sourceID, agentID).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return ErrAlreadyLinked
	}
	return r.withTx(ctx, func(tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, `INSERT INTO knowledge_to_agents (knowledge_id,agent_id) VALUES ($1,$2)`, sourceID, agentID); err != nil {
			return err
		}
		return r.syncAgentsTx(ctx, tx, source)
	})
}

func (r *Repository) Unlink(ctx context.Context, sourceID int64, orgID, agentID uuid.UUID) error {
	if err := r.ready(); err != nil {
		return err
	}
	source, err := r.GetSource(ctx, sourceID)
	if err != nil || source == nil || source.OrganizationID != orgID {
		return ErrNotFound
	}
	return r.withTx(ctx, func(tx pgx.Tx) error {
		result, err := tx.Exec(ctx, `DELETE FROM knowledge_to_agents WHERE knowledge_id=$1 AND agent_id=$2`, sourceID, agentID)
		if err != nil {
			return err
		}
		if result.RowsAffected() == 0 {
			return ErrNotLinked
		}
		return r.syncAgentsTx(ctx, tx, source)
	})
}

func (r *Repository) linkedAgentIDs(ctx context.Context, sourceID int64) ([]string, error) {
	return linkedAgentIDs(ctx, r.pool, sourceID)
}

type queryer interface {
	Query(context.Context, string, ...any) (pgx.Rows, error)
}

func linkedAgentIDs(ctx context.Context, q queryer, sourceID int64) ([]string, error) {
	rows, err := q.Query(ctx, `SELECT agent_id FROM knowledge_to_agents WHERE knowledge_id=$1 ORDER BY agent_id`, sourceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]string, 0)
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		result = append(result, id.String())
	}
	return result, rows.Err()
}

func (r *Repository) syncAgentsTx(ctx context.Context, tx pgx.Tx, source *Source) error {
	if source.Schema == nil || source.TableName == nil {
		return nil
	}
	// Read through the transaction that just inserted/deleted the link. Using
	// the pool here starts a different snapshot and can leave vector filters
	// one link behind under PostgreSQL's default isolation level.
	ids, err := linkedAgentIDs(ctx, tx, source.ID)
	if err != nil {
		return err
	}
	filters := map[string]any{"name": source.Source, "org_id": source.OrganizationID.String(), "agent_id": ids}
	filtersJSON, _ := json.Marshal(filters)
	idsJSON, _ := json.Marshal(ids)
	_, err = tx.Exec(ctx, fmt.Sprintf(`UPDATE %s.%s SET filters=$1::jsonb, meta_data=CASE WHEN meta_data IS NULL THEN CASE WHEN $2::boolean THEN jsonb_build_object('agent_id',$3::jsonb) ELSE NULL END WHEN meta_data ? 'agent_id' THEN jsonb_set(meta_data,'{agent_id}',$3::jsonb) ELSE meta_data || jsonb_build_object('agent_id',$3::jsonb) END WHERE name=$4`, quote(*source.Schema), quote(*source.TableName)), string(filtersJSON), len(ids) > 0, string(idsJSON), source.Source)
	return err
}

func (r *Repository) withTx(ctx context.Context, fn func(pgx.Tx) error) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if err := fn(tx); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *Repository) requireVector(source *Source) error {
	if err := r.ready(); err != nil {
		return err
	}
	if source == nil || source.Schema == nil || source.TableName == nil {
		return ErrNoVectorTable
	}
	if !validIdentifier(*source.Schema) || !validIdentifier(*source.TableName) {
		return errors.New("invalid vector table identifier")
	}
	return nil
}

func (r *Repository) ensureVectorTable(ctx context.Context, orgID uuid.UUID) (string, error) {
	// Python/Agno uses the UUID spelling verbatim. The identifier is quoted in
	// every SQL statement, so preserving hyphens is required to read existing
	// vector rows during a Go cutover.
	table := "d_" + orgID.String()
	if !validIdentifier(table) {
		return "", errors.New("invalid vector table name")
	}
	_, err := r.pool.Exec(ctx, fmt.Sprintf(`CREATE SCHEMA IF NOT EXISTS ai; CREATE TABLE IF NOT EXISTS ai.%s (id TEXT PRIMARY KEY, name TEXT NOT NULL, meta_data JSONB, filters JSONB, content TEXT, embedding vector(384), usage JSONB, content_hash TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`, quote(table)))
	return table, err
}

func (r *Repository) embeddingLiteral(ctx context.Context, orgID uuid.UUID, content string) (string, error) {
	table, err := r.ensureVectorTable(ctx, orgID)
	if err != nil {
		return "", err
	}
	var typ string
	if err := r.pool.QueryRow(ctx, `SELECT format_type(a.atttypid,a.atttypmod) FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='ai' AND c.relname=$1 AND a.attname='embedding'`, table).Scan(&typ); err != nil {
		return "", err
	}
	dimension := 384
	if index := strings.Index(typ, "("); index >= 0 {
		var parsed int
		if _, scanErr := fmt.Sscanf(typ[index:], "(%d)", &parsed); scanErr == nil && parsed > 0 {
			dimension = parsed
		}
	}
	return hashedEmbedding(content, dimension), nil
}

func upsertVector(ctx context.Context, tx pgx.Tx, table, name, id, content string, metadata, filters map[string]any) error {
	if !validIdentifier(table) {
		return errors.New("invalid vector table identifier")
	}
	embedding := hashedEmbedding(content, 384)
	metadataJSON, _ := json.Marshal(metadata)
	filtersJSON, _ := json.Marshal(filters)
	_, err := tx.Exec(ctx, fmt.Sprintf(`INSERT INTO ai.%s (id,name,meta_data,filters,content,embedding,content_hash,created_at,updated_at) VALUES ($1,$2,$3::jsonb,$4::jsonb,$5,$6::vector,$7,NOW(),NOW()) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,meta_data=EXCLUDED.meta_data,filters=EXCLUDED.filters,content=EXCLUDED.content,embedding=EXCLUDED.embedding,content_hash=EXCLUDED.content_hash,updated_at=NOW()`, quote(table)), id, name, string(metadataJSON), string(filtersJSON), content, embedding, contentHash(content))
	return err
}

func hashedEmbedding(content string, dimension int) string {
	if dimension < 1 {
		dimension = 384
	}
	values := make([]float64, dimension)
	for i := 0; i < dimension; i++ {
		hash := sha256.Sum256([]byte(fmt.Sprintf("%d:%s", i, content)))
		var raw uint64
		for _, b := range hash[:8] {
			raw = (raw << 8) | uint64(b)
		}
		values[i] = float64(raw%2000000)/1000000.0 - 1.0
	}
	norm := 0.0
	for _, value := range values {
		norm += value * value
	}
	norm = math.Sqrt(norm)
	parts := make([]string, dimension)
	for i, value := range values {
		parts[i] = fmt.Sprintf("%.8f", value/norm)
	}
	return "[" + strings.Join(parts, ",") + "]"
}

func contentHash(content string) string {
	hash := sha256.Sum256([]byte(strings.TrimSpace(content)))
	return hex.EncodeToString(hash[:])
}

func agentIDs(agentID *uuid.UUID) []string {
	if agentID == nil {
		return []string{}
	}
	return []string{agentID.String()}
}

func pageIDExpression() string {
	return `CASE WHEN id ~ '_[0-9]+$' THEN substring(id from '^(.*)_[0-9]+$') ELSE id END`
}

func validIdentifier(value string) bool { return identifierPattern.MatchString(value) }

func quote(value string) string { return `"` + strings.ReplaceAll(value, `"`, `""`) + `"` }

func domainOf(raw string) string {
	parsed, err := url.Parse(raw)
	if err != nil || parsed.Hostname() == "" {
		parsed, _ = url.Parse("https://" + raw)
	}
	host := strings.ToLower(strings.TrimPrefix(parsed.Hostname(), "www."))
	parts := strings.Split(host, ".")
	if len(parts) <= 2 {
		return host
	}
	// Match the Python public-suffix approximation for common second-level
	// country-code domains. A plain last-two-label comparison would treat
	// a.example.co.uk and b.other.co.uk as the same source.
	secondLevel := map[string]struct{}{"co": {}, "com": {}, "org": {}, "net": {}, "edu": {}, "gov": {}, "ac": {}, "ltd": {}, "plc": {}, "me": {}, "or": {}, "ne": {}}
	if len(parts) > 2 && len(parts[len(parts)-1]) == 2 {
		if _, ok := secondLevel[parts[len(parts)-2]]; ok {
			return strings.Join(parts[len(parts)-3:], ".")
		}
	}
	return strings.Join(parts[len(parts)-2:], ".")
}

func sameRegistrableDomain(left, right string) bool {
	a, b := domainOf(left), domainOf(right)
	return a != "" && a == b
}

func (r *Repository) CreateQueue(ctx context.Context, input QueueCreateInput) (*QueueItem, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	metadata, _ := json.Marshal(input.Metadata)
	var itemID int64
	if err := r.pool.QueryRow(ctx, `INSERT INTO knowledge_queue (organization_id,agent_id,user_id,source_type,source,status,error,queue_metadata,priority,processing_stage,progress_percentage,total_items,processed_items,crawled_urls) VALUES ($1,$2,$3,$4,$5,'pending',NULL,$6::json,$7,'not_started',0,0,0,'[]'::json) RETURNING id`, input.OrganizationID, input.AgentID, input.UserID, strings.ToLower(input.SourceType), input.Source, string(metadata), input.Priority).Scan(&itemID); err != nil {
		return nil, err
	}
	return r.GetQueue(ctx, itemID)
}

const queueProjection = `SELECT id,organization_id,agent_id,user_id,source_type,source,status,error,queue_metadata,priority,processing_stage,progress_percentage,total_items,processed_items,crawled_urls,created_at,updated_at FROM knowledge_queue`

func (r *Repository) GetQueue(ctx context.Context, id int64) (*QueueItem, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	return scanQueue(r.pool.QueryRow(ctx, queueProjection+` WHERE id=$1`, id))
}

func scanQueue(row interface{ Scan(...any) error }) (*QueueItem, error) {
	var (
		item                       QueueItem
		org                        pgtype.UUID
		agentID, userID            pgtype.UUID
		errText, metadata, crawled []byte
		created, updated           pgtype.Timestamptz
		progress                   pgtype.Float8
		total, processed           pgtype.Int4
	)
	if err := row.Scan(&item.ID, &org, &agentID, &userID, &item.SourceType, &item.Source, &item.Status, &errText, &metadata, &item.Priority, &item.ProcessingStage, &progress, &total, &processed, &crawled, &created, &updated); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrQueueNotFound
		}
		return nil, err
	}
	item.OrganizationID = uuidFromType(org)
	item.AgentID = uuidPtr(agentID)
	item.UserID = uuidPtr(userID)
	item.Status = strings.ToLower(item.Status)
	item.SourceType = strings.ToLower(item.SourceType)
	item.Error = bytesStringPtr(errText)
	item.QueueMetadata = map[string]any{}
	if len(metadata) > 0 {
		_ = json.Unmarshal(metadata, &item.QueueMetadata)
	}
	item.CrawledURLs = parseCrawledURLs(crawled)
	if progress.Valid {
		item.ProgressPercentage = progress.Float64
	}
	if total.Valid {
		item.TotalItems = int(total.Int32)
	}
	if processed.Valid {
		item.ProcessedItems = int(processed.Int32)
	}
	item.CreatedAt = timePtr(created)
	item.UpdatedAt = timePtr(updated)
	return &item, nil
}

func uuidPtr(value pgtype.UUID) *uuid.UUID {
	if !value.Valid {
		return nil
	}
	result := uuidFromType(value)
	return &result
}

func bytesStringPtr(value []byte) *string {
	if len(value) == 0 {
		return nil
	}
	result := string(value)
	return &result
}

func parseCrawledURLs(value []byte) []string {
	result := []string{}
	if len(value) == 0 {
		return result
	}
	var values []any
	if json.Unmarshal(value, &values) != nil {
		return result
	}
	for _, item := range values {
		switch found := item.(type) {
		case string:
			result = append(result, found)
		case map[string]any:
			if value, ok := found["url"].(string); ok {
				result = append(result, value)
			}
		}
	}
	return result
}

func collectQueue(rows pgx.Rows) ([]*QueueItem, error) {
	items := make([]*QueueItem, 0)
	for rows.Next() {
		item, err := scanQueue(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) ListQueueByAgent(ctx context.Context, orgID, agentID uuid.UUID) ([]*QueueItem, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, queueProjection+` WHERE organization_id=$1 AND agent_id=$2 AND status IN ('pending','processing','failed') ORDER BY created_at DESC`, orgID, agentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return collectQueue(rows)
}

func (r *Repository) ListQueueByOrganization(ctx context.Context, orgID uuid.UUID) ([]*QueueItem, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, queueProjection+` WHERE organization_id=$1 AND status IN ('pending','processing','failed') ORDER BY created_at DESC`, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return collectQueue(rows)
}

func (r *Repository) DeleteQueue(ctx context.Context, id int64, orgID uuid.UUID) (bool, error) {
	if err := r.ready(); err != nil {
		return false, err
	}
	result, err := r.pool.Exec(ctx, `DELETE FROM knowledge_queue WHERE id=$1 AND organization_id=$2 AND status IN ('pending','failed')`, id, orgID)
	return result.RowsAffected() > 0, err
}

func (r *Repository) ProcessorStatus(ctx context.Context, orgID, userID uuid.UUID) (ProcessorStatus, error) {
	if err := r.ready(); err != nil {
		return ProcessorStatus{}, err
	}
	var result ProcessorStatus
	rows, err := r.pool.Query(ctx, `SELECT status, COUNT(*) FROM knowledge_queue WHERE organization_id=$1 AND user_id=$2 GROUP BY status`, orgID, userID)
	if err != nil {
		return result, err
	}
	defer rows.Close()
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return result, err
		}
		switch strings.ToLower(status) {
		case "pending":
			result.Pending = count
		case "processing":
			result.Processing = count
		case "completed":
			result.Completed = count
		case "failed":
			result.Failed = count
		}
	}
	return result, rows.Err()
}

func (r *Repository) UpdateQueueProgress(ctx context.Context, id int64, stage string, progress float64, total, processed int, crawledURL string) error {
	if err := r.ready(); err != nil {
		return err
	}
	if progress < 0 {
		progress = 0
	}
	if progress > 100 {
		progress = 100
	}
	_, err := r.pool.Exec(ctx, `UPDATE knowledge_queue SET processing_stage=COALESCE(NULLIF($2,''),processing_stage),progress_percentage=$3,total_items=$4,processed_items=$5,crawled_urls=CASE WHEN $6='' THEN crawled_urls WHEN COALESCE(crawled_urls::jsonb,'[]'::jsonb) @> to_jsonb(ARRAY[$6]::text[]) THEN crawled_urls ELSE (COALESCE(crawled_urls::jsonb,'[]'::jsonb) || to_jsonb(ARRAY[$6]::text[]))::json END,updated_at=NOW() WHERE id=$1`, id, stage, progress, total, processed, crawledURL)
	return err
}

func (r *Repository) SetQueueStatus(ctx context.Context, id int64, status string, errText *string) error {
	if err := r.ready(); err != nil {
		return err
	}
	_, err := r.pool.Exec(ctx, `UPDATE knowledge_queue SET status=$2::text,error=$3::text,processing_stage=CASE WHEN $2::text='completed' THEN 'completed' WHEN $2::text='failed' THEN 'failed' ELSE processing_stage END,progress_percentage=CASE WHEN $2::text='completed' THEN 100 ELSE progress_percentage END,updated_at=NOW() WHERE id=$1`, id, strings.ToLower(status), errText)
	return err
}

func (r *Repository) ClaimPending(ctx context.Context) (*QueueItem, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	var id int64
	err = tx.QueryRow(ctx, `SELECT id FROM knowledge_queue WHERE status='pending' ORDER BY priority DESC,created_at ASC FOR UPDATE SKIP LOCKED LIMIT 1`).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `UPDATE knowledge_queue SET status='processing',processing_stage='not_started',progress_percentage=0,updated_at=NOW() WHERE id=$1`, id); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.GetQueue(ctx, id)
}

func (r *Repository) addPagesForSource(ctx context.Context, source *Source) ([]Page, error) {
	return r.pages(ctx, source)
}

func (r *Repository) ensureSource(ctx context.Context, orgID uuid.UUID, sourceName, sourceType string) (*Source, error) {
	found, err := r.FindBySources(ctx, orgID, []string{sourceName})
	if err != nil {
		return nil, err
	}
	if len(found) > 0 {
		return found[0], nil
	}
	table, err := r.ensureVectorTable(ctx, orgID)
	if err != nil {
		return nil, err
	}
	var id int64
	if err := r.pool.QueryRow(ctx, `INSERT INTO knowledge(source,source_type,schema,table_name,organization_id) VALUES($1,$2::sourcetype,'ai',$3,$4) RETURNING id`, sourceName, strings.ToUpper(sourceType), table, orgID).Scan(&id); err != nil {
		return nil, err
	}
	return r.GetSource(ctx, id)
}

func (r *Repository) IndexDocument(ctx context.Context, source *Source, pageID, content string, metadata map[string]any) error {
	if err := r.requireVector(source); err != nil {
		return err
	}
	ids, err := r.linkedAgentIDs(ctx, source.ID)
	if err != nil {
		return err
	}
	if metadata == nil {
		metadata = map[string]any{}
	}
	metadata["agent_id"] = ids
	filters := map[string]any{"name": source.Source, "org_id": source.OrganizationID.String(), "agent_id": ids}
	return r.withTx(ctx, func(tx pgx.Tx) error {
		return upsertVectorWithDimension(ctx, tx, *source.TableName, source.Source, pageID, content, metadata, filters, 384)
	})
}

func upsertVectorWithDimension(ctx context.Context, tx pgx.Tx, table, name, id, content string, metadata, filters map[string]any, dimension int) error {
	if !validIdentifier(table) {
		return errors.New("invalid vector table identifier")
	}
	if dimension < 1 {
		dimension = 384
	}
	metadataJSON, _ := json.Marshal(metadata)
	filtersJSON, _ := json.Marshal(filters)
	_, err := tx.Exec(ctx, fmt.Sprintf(`INSERT INTO ai.%s(id,name,meta_data,filters,content,embedding,content_hash,created_at,updated_at) VALUES($1,$2,$3::jsonb,$4::jsonb,$5,$6::vector,$7,NOW(),NOW()) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,meta_data=EXCLUDED.meta_data,filters=EXCLUDED.filters,content=EXCLUDED.content,embedding=EXCLUDED.embedding,content_hash=EXCLUDED.content_hash,updated_at=NOW()`, quote(table)), id, name, string(metadataJSON), string(filtersJSON), content, hashedEmbedding(content, dimension), contentHash(content))
	return err
}
