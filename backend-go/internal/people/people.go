package people

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/komi/komi/backend-go/internal/crm"
)

var (
	ErrNotFound        = errors.New("person not found")
	ErrAnonymous       = errors.New("add an email or phone first - this person is anonymous")
	ErrInvalidPhone    = errors.New("enter the number in international format, e.g. +91 12345 67890")
	ErrPhoneConflict   = errors.New("that number already belongs to another person")
	ErrPhoneIdentity   = errors.New("this number is how their WhatsApp messages find them - changing it here would split them into a second person")
	ErrCRMNoConnection = errors.New("Connect a CRM in Settings -> Integrations first.")
	ErrCRMAnonymous    = errors.New("Add an email to this person before syncing to a CRM.")
	ErrCRMManualSync   = errors.New("CRM manual sync failed")
)

type ListFilter struct {
	Stage    string
	Search   string
	Page     int
	PageSize int
	View     string
}

type PersonListItem struct {
	ID           uuid.UUID      `json:"id"`
	Name         *string        `json:"name"`
	Email        *string        `json:"email"`
	Phone        *string        `json:"phone"`
	IsAnonymous  bool           `json:"is_anonymous"`
	LeadStage    string         `json:"lead_stage"`
	Qualified    bool           `json:"qualified"`
	Source       map[string]any `json:"source"`
	CapturedAt   *time.Time     `json:"captured_at"`
	LastActivity *time.Time     `json:"last_activity"`
	Synced       bool           `json:"synced"`
}

type ListResponse struct {
	Items    []PersonListItem `json:"items"`
	Total    int64            `json:"total"`
	Page     int              `json:"page"`
	PageSize int              `json:"page_size"`
}

type Stats struct {
	TotalPeople int64 `json:"total_people"`
	Anonymous   int64 `json:"anonymous"`
	NewLeads7d  int64 `json:"new_leads_7d"`
	Customers   int64 `json:"customers"`
	SyncedToCRM int64 `json:"synced_to_crm"`
}

type TimelineEntry struct {
	Stage string    `json:"stage"`
	At    time.Time `json:"at"`
}

type Conversation struct {
	SessionID   uuid.UUID  `json:"session_id"`
	AgentName   *string    `json:"agent_name"`
	Status      *string    `json:"status"`
	LastMessage *string    `json:"last_message"`
	CreatedAt   *time.Time `json:"created_at"`
}

type Detail struct {
	ID                 uuid.UUID       `json:"id"`
	Name               *string         `json:"name"`
	Email              *string         `json:"email"`
	Phone              *string         `json:"phone"`
	Identified         bool            `json:"identified"`
	IsAnonymous        bool            `json:"is_anonymous"`
	LeadStage          string          `json:"lead_stage"`
	Qualified          bool            `json:"qualified"`
	Source             map[string]any  `json:"source"`
	CreatedAt          *time.Time      `json:"created_at"`
	LeadQualifiedAt    *time.Time      `json:"lead_qualified_at"`
	MetaData           map[string]any  `json:"meta_data"`
	Summary            *string         `json:"summary"`
	CapturedAttributes map[string]any  `json:"captured_attributes"`
	Timeline           []TimelineEntry `json:"timeline"`
	Conversations      []Conversation  `json:"conversations"`
}

type UpdateInput struct {
	FullName *string
	Phone    *string
}

type CRMCustomerSync struct {
	Provider  string     `json:"provider"`
	ContactID *string    `json:"contact_id"`
	RecordURL *string    `json:"record_url"`
	SyncedAt  *time.Time `json:"synced_at"`
}

type CRMStatus struct {
	ConnectedProviders []string          `json:"connected_providers"`
	Synced             []CRMCustomerSync `json:"synced"`
}

type Store interface {
	List(ctx context.Context, organizationID uuid.UUID, filter ListFilter) ([]PersonListItem, int64, error)
	Stats(ctx context.Context, organizationID uuid.UUID) (*Stats, error)
	Detail(ctx context.Context, organizationID, customerID uuid.UUID) (*Detail, error)
	MarkCustomer(ctx context.Context, organizationID, customerID uuid.UUID) (*Detail, error)
	UpdatePerson(ctx context.Context, organizationID, customerID uuid.UUID, input UpdateInput) (*Detail, error)
	CRMStatus(ctx context.Context, organizationID, customerID uuid.UUID) (*CRMStatus, error)
	SyncCRM(ctx context.Context, organizationID, customerID uuid.UUID) (*CRMStatus, error)
}

type Repository struct {
	pool *pgxpool.Pool
	crm  *crm.Service
}

func NewRepository(pool *pgxpool.Pool, services ...*crm.Service) *Repository {
	if pool == nil {
		return nil
	}
	var service *crm.Service
	if len(services) > 0 {
		service = services[0]
	}
	return &Repository{pool: pool, crm: service}
}

func (r *Repository) SetCRMService(service *crm.Service) {
	if r != nil {
		r.crm = service
	}
}

func (r *Repository) List(ctx context.Context, organizationID uuid.UUID, filter ListFilter) ([]PersonListItem, int64, error) {
	if r == nil || r.pool == nil {
		return nil, 0, errors.New("database is not configured")
	}
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 {
		filter.PageSize = 20
	}

	args := []any{organizationID}
	where := []string{
		"c.organization_id = $1",
		"c.merged_into_customer_id IS NULL",
		"COALESCE(c.is_authenticated, FALSE) = FALSE",
		"la.last_activity IS NOT NULL",
	}
	if strings.EqualFold(filter.View, "anonymous") {
		where = append(where, "NOT ("+realEmailSQL()+" OR c.phone IS NOT NULL OR q.cid IS NOT NULL)")
	} else {
		where = append(where, "("+realEmailSQL()+" OR c.phone IS NOT NULL OR q.cid IS NOT NULL)")
	}
	stage := strings.ToLower(strings.TrimSpace(filter.Stage))
	if stage == "visitor" || stage == "lead" || stage == "customer" {
		args = append(args, strings.ToUpper(stage))
		where = append(where, fmt.Sprintf("c.lead_stage::text = $%d", len(args)))
	}
	if search := strings.TrimSpace(filter.Search); search != "" {
		args = append(args, "%"+search+"%")
		searchArg := fmt.Sprintf("$%d", len(args))
		clauses := []string{"c.full_name ILIKE " + searchArg, "c.email ILIKE " + searchArg}
		if digits := phoneSearchDigits(search); len(digits) >= 3 {
			args = append(args, "%"+strings.TrimPrefix(digits, "+")+"%")
			clauses = append(clauses, fmt.Sprintf("c.phone LIKE $%d", len(args)))
		}
		where = append(where, "("+strings.Join(clauses, " OR ")+")")
	}

	from := `
FROM customers c
LEFT JOIN (
    SELECT customer_id, MAX(created_at) AS last_activity
    FROM chat_history
    WHERE organization_id = $1
    GROUP BY customer_id
) la ON la.customer_id = c.id
LEFT JOIN (
    SELECT DISTINCT customer_id AS cid
    FROM lead_capture_responses
    WHERE organization_id = $1 AND qualified IS TRUE
) q ON q.cid = c.id
WHERE ` + strings.Join(where, " AND ")
	var total int64
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) "+from, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	listArgs := append([]any{}, args...)
	limitArg := len(listArgs) + 1
	listArgs = append(listArgs, filter.PageSize)
	offsetArg := len(listArgs) + 1
	listArgs = append(listArgs, (filter.Page-1)*filter.PageSize)
	query := `
SELECT c.id, c.email, c.full_name, c.phone, c.lead_stage::text, c.lead_source,
       c.lead_qualified_at, la.last_activity, q.cid
` + from + fmt.Sprintf(`
ORDER BY COALESCE(la.last_activity, c.created_at) DESC
LIMIT $%d OFFSET $%d`, limitArg, offsetArg)
	rows, err := r.pool.Query(ctx, query, listArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := make([]PersonListItem, 0)
	ids := make([]uuid.UUID, 0)
	type rawItem struct {
		item      PersonListItem
		email     string
		fullName  *string
		qualified bool
	}
	rawItems := make([]rawItem, 0)
	for rows.Next() {
		var (
			id                          uuid.UUID
			email, stage                string
			fullName, phone             pgtype.Text
			source                      []byte
			leadQualified, lastActivity pgtype.Timestamptz
			qualifiedValue              pgtype.UUID
		)
		if err := rows.Scan(&id, &email, &fullName, &phone, &stage, &source, &leadQualified, &lastActivity, &qualifiedValue); err != nil {
			return nil, 0, err
		}
		item := PersonListItem{
			ID: id, LeadStage: strings.ToLower(stage), Qualified: qualifiedValue.Valid,
			Source: objectJSON(source), CapturedAt: timePointer(leadQualified),
			LastActivity: timePointer(lastActivity), Synced: false,
		}
		item.Phone = textPointer(phone)
		rawItems = append(rawItems, rawItem{item: item, email: email, fullName: textPointer(fullName), qualified: qualifiedValue.Valid})
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	captured, err := r.capturedContactMap(ctx, ids)
	if err != nil {
		return nil, 0, err
	}
	for _, value := range rawItems {
		name, email, anonymous := resolveDisplay(value.email, value.fullName, captured[value.item.ID])
		value.item.Name = name
		value.item.Email = email
		value.item.IsAnonymous = anonymous
		items = append(items, value.item)
	}
	return items, total, nil
}

func (r *Repository) Stats(ctx context.Context, organizationID uuid.UUID) (*Stats, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	var result Stats
	identified := "(" + realEmailSQL() + ` OR c.phone IS NOT NULL OR EXISTS (
    SELECT 1 FROM lead_capture_responses lcr
    WHERE lcr.customer_id = c.id AND lcr.qualified IS TRUE
))`
	queries := []struct {
		target *int64
		sql    string
	}{
		{&result.TotalPeople, `SELECT COUNT(*) FROM customers c WHERE c.organization_id = $1 AND c.merged_into_customer_id IS NULL AND COALESCE(c.is_authenticated,FALSE)=FALSE AND EXISTS (SELECT 1 FROM chat_history h WHERE h.customer_id=c.id) AND ` + identified},
		{&result.Anonymous, `SELECT COUNT(*) FROM customers c WHERE c.organization_id = $1 AND c.merged_into_customer_id IS NULL AND COALESCE(c.is_authenticated,FALSE)=FALSE AND EXISTS (SELECT 1 FROM chat_history h WHERE h.customer_id=c.id) AND NOT ` + identified},
		{&result.NewLeads7d, `SELECT COUNT(*) FROM customers c WHERE c.organization_id = $1 AND c.merged_into_customer_id IS NULL AND COALESCE(c.is_authenticated,FALSE)=FALSE AND c.lead_stage::text = 'LEAD' AND c.lead_qualified_at >= NOW() - INTERVAL '7 days'`},
		{&result.Customers, `SELECT COUNT(*) FROM customers c WHERE c.organization_id = $1 AND c.merged_into_customer_id IS NULL AND COALESCE(c.is_authenticated,FALSE)=FALSE AND c.lead_stage::text = 'CUSTOMER'`},
	}
	for _, query := range queries {
		if err := r.pool.QueryRow(ctx, query.sql, organizationID).Scan(query.target); err != nil {
			return nil, err
		}
	}
	return &result, nil
}

func (r *Repository) Detail(ctx context.Context, organizationID, customerID uuid.UUID) (*Detail, error) {
	customer, err := r.getCustomer(ctx, organizationID, customerID)
	if err != nil {
		return nil, err
	}
	if customer == nil {
		return nil, ErrNotFound
	}
	return r.detailForCustomer(ctx, customer)
}

func (r *Repository) MarkCustomer(ctx context.Context, organizationID, customerID uuid.UUID) (*Detail, error) {
	customer, err := r.getCustomer(ctx, organizationID, customerID)
	if err != nil {
		return nil, err
	}
	if customer == nil {
		return nil, ErrNotFound
	}
	qualified, err := r.hasQualifiedCapture(ctx, customer.ID)
	if err != nil {
		return nil, err
	}
	if !identified(customer.Email, customer.Phone, qualified) {
		return nil, ErrAnonymous
	}
	if _, err := r.pool.Exec(ctx, `UPDATE customers SET lead_stage = 'CUSTOMER', updated_at = NOW() WHERE id = $1 AND organization_id = $2`, customer.ID, organizationID); err != nil {
		return nil, err
	}
	return r.Detail(ctx, organizationID, customer.ID)
}

func (r *Repository) UpdatePerson(ctx context.Context, organizationID, customerID uuid.UUID, input UpdateInput) (*Detail, error) {
	customer, err := r.getCustomer(ctx, organizationID, customerID)
	if err != nil {
		return nil, err
	}
	if customer == nil {
		return nil, ErrNotFound
	}

	var normalizedPhone *string
	if input.Phone != nil {
		if strings.TrimSpace(*input.Phone) != "" {
			normalized := normalizePhone(*input.Phone)
			if normalized == "" {
				return nil, ErrInvalidPhone
			}
			normalizedPhone = &normalized
		}
		if !sameString(normalizedPhone, customer.Phone) && r.phoneIsSoleIdentityKey(ctx, customer) {
			return nil, ErrPhoneIdentity
		}
		if normalizedPhone != nil {
			var conflict bool
			if err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM customers WHERE phone = $1 AND organization_id = $2 AND id <> $3 AND merged_into_customer_id IS NULL)`, *normalizedPhone, organizationID, customer.ID).Scan(&conflict); err != nil {
				return nil, err
			}
			if conflict {
				return nil, ErrPhoneConflict
			}
		}
	}

	sets := make([]string, 0, 2)
	args := []any{customer.ID}
	if input.FullName != nil && strings.TrimSpace(*input.FullName) != "" {
		args = append(args, strings.TrimSpace(*input.FullName))
		sets = append(sets, fmt.Sprintf("full_name = $%d", len(args)))
	}
	if input.Phone != nil {
		var value any
		if normalizedPhone != nil {
			value = *normalizedPhone
		}
		args = append(args, value)
		sets = append(sets, fmt.Sprintf("phone = $%d", len(args)))
	}
	if len(sets) > 0 {
		// The organization predicate is deliberately appended as a separate argument;
		// the customer lookup above already follows merge pointers within this org.
		args = append(args, organizationID)
		query := `UPDATE customers SET ` + strings.Join(sets, ", ") + fmt.Sprintf(`, updated_at = NOW() WHERE id = $1 AND organization_id = $%d`, len(args))
		if _, err := r.pool.Exec(ctx, query, args...); err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				return nil, ErrPhoneConflict
			}
			return nil, err
		}
	}
	return r.Detail(ctx, organizationID, customer.ID)
}

func (r *Repository) CRMStatus(ctx context.Context, organizationID, customerID uuid.UUID) (*CRMStatus, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	customer, err := r.getCustomer(ctx, organizationID, customerID)
	if err != nil {
		return nil, err
	}
	if customer == nil {
		return nil, ErrNotFound
	}
	result := &CRMStatus{ConnectedProviders: []string{}, Synced: []CRMCustomerSync{}}
	connections, err := r.pool.Query(ctx, `SELECT provider, status FROM crm_connections WHERE organization_id = $1 ORDER BY created_at`, organizationID)
	if err != nil {
		return nil, err
	}
	for connections.Next() {
		var provider, status string
		if err := connections.Scan(&provider, &status); err != nil {
			connections.Close()
			return nil, err
		}
		if strings.EqualFold(status, "active") {
			result.ConnectedProviders = append(result.ConnectedProviders, provider)
		}
	}
	if err := connections.Err(); err != nil {
		connections.Close()
		return nil, err
	}
	connections.Close()

	rows, err := r.pool.Query(ctx, `SELECT provider, contact_id, record_url, synced_at FROM crm_customer_syncs WHERE customer_id = $1 ORDER BY synced_at DESC`, customer.ID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var provider string
		var contactID, recordURL pgtype.Text
		var syncedAt pgtype.Timestamptz
		if err := rows.Scan(&provider, &contactID, &recordURL, &syncedAt); err != nil {
			return nil, err
		}
		result.Synced = append(result.Synced, CRMCustomerSync{Provider: provider, ContactID: textPointer(contactID), RecordURL: textPointer(recordURL), SyncedAt: timePointer(syncedAt)})
	}
	return result, rows.Err()
}

func (r *Repository) SyncCRM(ctx context.Context, organizationID, customerID uuid.UUID) (*CRMStatus, error) {
	if r == nil || r.pool == nil || r.crm == nil {
		return nil, errors.New("CRM service is not configured")
	}
	customer, err := r.getCustomer(ctx, organizationID, customerID)
	if err != nil {
		return nil, err
	}
	if customer == nil {
		return nil, ErrNotFound
	}
	if isPlaceholderEmail(customer.Email) {
		return nil, ErrCRMAnonymous
	}
	connections, err := r.crm.Repo.ListByOrganization(ctx, organizationID)
	if err != nil {
		return nil, err
	}
	active := make([]crm.Connection, 0, len(connections))
	for _, connection := range connections {
		if connection.Status == "active" && r.crm.Supported(connection.Provider) {
			active = append(active, connection)
		}
	}
	if len(active) == 0 {
		return nil, ErrCRMNoConnection
	}
	payload, err := r.crmPayload(ctx, customer)
	if err != nil {
		return nil, err
	}
	var synced int
	var failures []string
	for index := range active {
		connection := &active[index]
		result, pushErr := r.crm.PushLead(ctx, connection, payload)
		if pushErr != nil {
			if errors.Is(pushErr, crm.ErrAuth) {
				_ = r.crm.Repo.SetStatus(ctx, connection, "expired", pushErr.Error())
				failures = append(failures, connection.Provider+": reconnect required")
			} else if errors.Is(pushErr, crm.ErrTransient) {
				failures = append(failures, connection.Provider+": temporary error, try again")
			} else {
				failures = append(failures, connection.Provider+": "+pushErr.Error())
			}
			continue
		}
		if result.OK {
			if err := r.recordCRMSync(ctx, organizationID, customer.ID, connection.Provider, result); err != nil {
				return nil, err
			}
			synced++
			continue
		}
		if result.AuthFailed {
			_ = r.crm.Repo.SetStatus(ctx, connection, "expired", result.Error)
			failures = append(failures, connection.Provider+": reconnect required")
		} else if result.Error != "" {
			failures = append(failures, connection.Provider+": "+result.Error)
		} else {
			failures = append(failures, connection.Provider+": push failed")
		}
	}
	if synced == 0 && len(failures) > 0 {
		return nil, fmt.Errorf("%w: %s", ErrCRMManualSync, strings.Join(failures, "; "))
	}
	return r.CRMStatus(ctx, organizationID, customer.ID)
}

func (r *Repository) crmPayload(ctx context.Context, customer *customerRecord) (crm.LeadPayload, error) {
	rows, err := r.pool.Query(ctx, `SELECT field_values, summary, agent_id FROM lead_capture_responses WHERE customer_id=$1 ORDER BY created_at`, customer.ID)
	if err != nil {
		return crm.LeadPayload{}, err
	}
	defer rows.Close()
	attributes := map[string]any{}
	var summary string
	var latestAgent pgtype.UUID
	for rows.Next() {
		var values []byte
		var responseSummary pgtype.Text
		var agentID pgtype.UUID
		if err := rows.Scan(&values, &responseSummary, &agentID); err != nil {
			return crm.LeadPayload{}, err
		}
		for key, value := range objectJSON(values) {
			if value != nil && stringValue(value) != "" {
				attributes[key] = value
			}
		}
		if responseSummary.Valid && strings.TrimSpace(responseSummary.String) != "" {
			summary = responseSummary.String
		}
		if agentID.Valid {
			latestAgent = agentID
		}
	}
	if err := rows.Err(); err != nil {
		return crm.LeadPayload{}, err
	}
	labels := map[string]string{}
	if latestAgent.Valid {
		var fields []byte
		if err := r.pool.QueryRow(ctx, `SELECT fields FROM lead_capture_configs WHERE agent_id=$1`, uuid.UUID(latestAgent.Bytes)).Scan(&fields); err == nil {
			var configured []map[string]any
			if json.Unmarshal(fields, &configured) == nil {
				for _, field := range configured {
					key := stringValue(field["key"])
					label := stringValue(field["label"])
					if key != "" {
						labels[key] = firstNonEmptyPeople(label, key)
					}
				}
			}
		}
	}
	email := strings.ToLower(strings.TrimSpace(firstNonEmptyPeople(stringValue(attributes["email"]), customer.Email)))
	name := firstNonEmptyPeople(stringValue(attributes["name"]), valueOrString(customer.FullName))
	phone := firstNonEmptyPeople(stringValue(attributes["phone"]), valueOrString(customer.Phone))
	company := stringValue(attributes["company"])
	custom := map[string]string{}
	for key, value := range attributes {
		if key == "email" || key == "name" || key == "company" || key == "phone" {
			continue
		}
		text := stringValue(value)
		if text != "" {
			custom[firstNonEmptyPeople(labels[key], key)] = text
		}
	}
	for key, value := range customer.MetaData {
		text := stringValue(value)
		if text != "" {
			if _, exists := custom[key]; !exists {
				custom[key] = text
			}
		}
	}
	return crm.LeadPayload{Email: email, Name: name, Company: company, Phone: phone, Summary: summary, CustomFields: custom, SourceURL: stringValue(customer.LeadSource["page_url"])}, nil
}

func (r *Repository) recordCRMSync(ctx context.Context, organizationID, customerID uuid.UUID, provider string, result crm.PushResult) error {
	_, err := r.pool.Exec(ctx, `
INSERT INTO crm_customer_syncs (id,organization_id,customer_id,provider,contact_id,secondary_id,record_url,synced_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
ON CONFLICT (customer_id,provider) DO UPDATE SET
  organization_id=EXCLUDED.organization_id, contact_id=EXCLUDED.contact_id,
  secondary_id=EXCLUDED.secondary_id, record_url=EXCLUDED.record_url, synced_at=NOW()`,
		uuid.New(), organizationID, customerID, provider, nullablePeople(result.ContactID), nullablePeople(result.SecondaryID), nullablePeople(result.RecordURL))
	return err
}

func nullablePeople(value string) any {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}

func valueOrString(value *string) string {
	if value == nil {
		return ""
	}
	return strings.TrimSpace(*value)
}

func firstNonEmptyPeople(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

type customerRecord struct {
	ID              uuid.UUID
	Email           string
	FullName        *string
	Phone           *string
	MetaData        map[string]any
	LeadStage       string
	LeadSource      map[string]any
	LeadQualifiedAt *time.Time
	CreatedAt       *time.Time
	UpdatedAt       *time.Time
	IsAuthenticated bool
	MergedInto      *uuid.UUID
}

func (r *Repository) getCustomer(ctx context.Context, organizationID, customerID uuid.UUID) (*customerRecord, error) {
	current := customerID
	seen := map[uuid.UUID]struct{}{}
	for {
		if _, ok := seen[current]; ok {
			return nil, errors.New("customer merge cycle")
		}
		seen[current] = struct{}{}
		customer, err := r.scanCustomer(r.pool.QueryRow(ctx, `
SELECT id, email, full_name, phone, meta_data, lead_stage::text, lead_source,
       lead_qualified_at, created_at, updated_at, COALESCE(is_authenticated,FALSE),
       merged_into_customer_id
FROM customers WHERE id = $1 AND organization_id = $2`, current, organizationID))
		if err != nil {
			return nil, err
		}
		if customer == nil {
			return nil, nil
		}
		if customer.MergedInto == nil {
			return customer, nil
		}
		current = *customer.MergedInto
	}
}

func (r *Repository) scanCustomer(row interface{ Scan(...any) error }) (*customerRecord, error) {
	var (
		customer         customerRecord
		fullName, phone  pgtype.Text
		metadata, source []byte
		leadQualified    pgtype.Timestamptz
		created, updated pgtype.Timestamp
		merged           pgtype.UUID
	)
	err := row.Scan(&customer.ID, &customer.Email, &fullName, &phone, &metadata, &customer.LeadStage, &source, &leadQualified, &created, &updated, &customer.IsAuthenticated, &merged)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	customer.FullName = textPointer(fullName)
	customer.Phone = textPointer(phone)
	customer.MetaData = objectJSON(metadata)
	customer.LeadSource = objectJSON(source)
	customer.LeadQualifiedAt = timePointer(leadQualified)
	customer.CreatedAt = timestampPointer(created)
	customer.UpdatedAt = timestampPointer(updated)
	if merged.Valid {
		value := uuid.UUID(merged.Bytes)
		customer.MergedInto = &value
	}
	customer.LeadStage = strings.ToLower(customer.LeadStage)
	return &customer, nil
}

func (r *Repository) detailForCustomer(ctx context.Context, customer *customerRecord) (*Detail, error) {
	rows, err := r.pool.Query(ctx, `SELECT field_values, summary, qualified FROM lead_capture_responses WHERE customer_id = $1 ORDER BY created_at`, customer.ID)
	if err != nil {
		return nil, err
	}
	attributes := map[string]any{}
	qualified := false
	var summary *string
	for rows.Next() {
		var values []byte
		var responseSummary pgtype.Text
		var responseQualified bool
		if err := rows.Scan(&values, &responseSummary, &responseQualified); err != nil {
			rows.Close()
			return nil, err
		}
		if responseQualified {
			qualified = true
		}
		for key, value := range objectJSON(values) {
			attributes[key] = value
		}
		if responseSummary.Valid && strings.TrimSpace(responseSummary.String) != "" {
			value := responseSummary.String
			summary = &value
		}
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return nil, err
	}
	rows.Close()
	name, email, anonymous := resolveDisplay(customer.Email, customer.FullName, capturedContact{Email: stringValue(attributes["email"]), Name: stringValue(attributes["name"])})
	identifiedValue := identified(customer.Email, customer.Phone, qualified)
	detail := &Detail{
		ID: customer.ID, Name: name, Email: email, Phone: customer.Phone,
		Identified: identifiedValue, IsAnonymous: anonymous, LeadStage: customer.LeadStage,
		Qualified: qualified, Source: customer.LeadSource, CreatedAt: customer.CreatedAt,
		LeadQualifiedAt: customer.LeadQualifiedAt, MetaData: customer.MetaData,
		Summary: summary, CapturedAttributes: attributes,
		Timeline: timeline(customer), Conversations: []Conversation{},
	}
	conversations, err := r.conversations(ctx, customer.ID)
	if err != nil {
		return nil, err
	}
	detail.Conversations = conversations
	return detail, nil
}

func (r *Repository) conversations(ctx context.Context, customerID uuid.UUID) ([]Conversation, error) {
	rows, err := r.pool.Query(ctx, `
SELECT s.session_id, a.display_name, a.name, s.status::text, last_message.message, s.assigned_at
FROM session_to_agents s
LEFT JOIN agents a ON a.id = s.agent_id
LEFT JOIN LATERAL (
    SELECT h.message
    FROM chat_history h
    WHERE h.session_id = s.session_id
    ORDER BY h.created_at DESC, h.id DESC
    LIMIT 1
) last_message ON TRUE
WHERE s.customer_id = $1
ORDER BY s.assigned_at DESC NULLS LAST
LIMIT 20`, customerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]Conversation, 0)
	for rows.Next() {
		var sessionID uuid.UUID
		var displayName, agentName, status, lastMessage pgtype.Text
		var assignedAt pgtype.Timestamptz
		if err := rows.Scan(&sessionID, &displayName, &agentName, &status, &lastMessage, &assignedAt); err != nil {
			return nil, err
		}
		name := textPointer(displayName)
		if name == nil || strings.TrimSpace(*name) == "" {
			name = textPointer(agentName)
		}
		statusValue := strings.ToLower(status.String)
		result = append(result, Conversation{SessionID: sessionID, AgentName: name, Status: optionalString(statusValue), LastMessage: textPointer(lastMessage), CreatedAt: timePointer(assignedAt)})
	}
	return result, rows.Err()
}

func (r *Repository) hasQualifiedCapture(ctx context.Context, customerID uuid.UUID) (bool, error) {
	var value bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM lead_capture_responses WHERE customer_id = $1 AND qualified IS TRUE)`, customerID).Scan(&value)
	return value, err
}

func (r *Repository) phoneIsSoleIdentityKey(ctx context.Context, customer *customerRecord) bool {
	if customer.Phone == nil || *customer.Phone == "" {
		return false
	}
	email := strings.ToLower(customer.Email)
	if strings.HasSuffix(email, "@whatsapp.channel") || strings.HasSuffix(email, "@sms.channel") {
		return false
	}
	var exists bool
	if err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM channel_conversations WHERE customer_id = $1 AND channel_type IN ('whatsapp','sms'))`, customer.ID).Scan(&exists); err != nil {
		return false
	}
	return exists
}

func (r *Repository) capturedContactMap(ctx context.Context, ids []uuid.UUID) (map[uuid.UUID]capturedContact, error) {
	result := make(map[uuid.UUID]capturedContact)
	if len(ids) == 0 {
		return result, nil
	}
	rows, err := r.pool.Query(ctx, `SELECT customer_id, field_values FROM lead_capture_responses WHERE customer_id = ANY($1::uuid[]) AND qualified IS TRUE ORDER BY created_at`, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var id uuid.UUID
		var values []byte
		if err := rows.Scan(&id, &values); err != nil {
			return nil, err
		}
		fields := objectJSON(values)
		contact := result[id]
		if value := stringValue(fields["email"]); value != "" {
			contact.Email = value
		}
		if value := stringValue(fields["name"]); value != "" {
			contact.Name = value
		}
		result[id] = contact
	}
	return result, rows.Err()
}

type capturedContact struct {
	Email string
	Name  string
}

func resolveDisplay(email string, name *string, captured capturedContact) (*string, *string, bool) {
	if !isPlaceholderEmail(email) {
		return name, optionalString(email), false
	}
	if name != nil && strings.TrimSpace(*name) != "" {
		return name, nil, false
	}
	resolvedName := name
	if resolvedName == nil || strings.TrimSpace(*resolvedName) == "" {
		resolvedName = optionalString(captured.Name)
	}
	resolvedEmail := optionalString(captured.Email)
	if resolvedName != nil || resolvedEmail != nil {
		return resolvedName, resolvedEmail, false
	}
	return name, nil, true
}

func identified(email string, phone *string, qualified bool) bool {
	return !isPlaceholderEmail(email) || (phone != nil && strings.TrimSpace(*phone) != "") || qualified
}

func isPlaceholderEmail(email string) bool {
	lower := strings.ToLower(strings.TrimSpace(email))
	return lower == "" || strings.Contains(lower, "@noemail.com") || strings.HasSuffix(lower, ".channel")
}

func realEmailSQL() string {
	return "c.email <> '' AND c.email NOT ILIKE '%@noemail.com' AND c.email NOT ILIKE '%.channel'"
}

var phoneDigitsPattern = regexp.MustCompile(`^\+?[0-9]{3,}$`)

func phoneSearchDigits(value string) string {
	value = strings.Map(func(r rune) rune {
		if unicode.IsSpace(r) || strings.ContainsRune("-().", r) {
			return -1
		}
		return r
	}, strings.TrimSpace(value))
	if !phoneDigitsPattern.MatchString(value) {
		return ""
	}
	return value
}

var e164Pattern = regexp.MustCompile(`^\+[1-9][0-9]{7,14}$`)

func normalizePhone(value string) string {
	value = strings.Map(func(r rune) rune {
		if unicode.IsSpace(r) || strings.ContainsRune("-().", r) {
			return -1
		}
		return r
	}, strings.TrimSpace(value))
	if !e164Pattern.MatchString(value) {
		return ""
	}
	return value
}

func timeline(customer *customerRecord) []TimelineEntry {
	result := make([]TimelineEntry, 0, 3)
	if customer.CreatedAt != nil {
		result = append(result, TimelineEntry{Stage: "visitor", At: *customer.CreatedAt})
	}
	if customer.LeadQualifiedAt != nil {
		result = append(result, TimelineEntry{Stage: "lead", At: *customer.LeadQualifiedAt})
	}
	if customer.LeadStage == "customer" && customer.UpdatedAt != nil {
		result = append(result, TimelineEntry{Stage: "customer", At: *customer.UpdatedAt})
	}
	return result
}

func objectJSON(value []byte) map[string]any {
	if len(value) == 0 || string(value) == "null" {
		return nil
	}
	var result map[string]any
	if json.Unmarshal(value, &result) != nil {
		return nil
	}
	return result
}

func textPointer(value pgtype.Text) *string {
	if !value.Valid {
		return nil
	}
	result := value.String
	return &result
}

func timePointer(value pgtype.Timestamptz) *time.Time {
	if !value.Valid {
		return nil
	}
	result := value.Time
	return &result
}

func timestampPointer(value pgtype.Timestamp) *time.Time {
	if !value.Valid {
		return nil
	}
	result := value.Time
	return &result
}

func optionalString(value string) *string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return &value
}

func stringValue(value any) string {
	switch result := value.(type) {
	case string:
		return strings.TrimSpace(result)
	case json.Number:
		return result.String()
	case float64:
		return strconv.FormatFloat(result, 'f', -1, 64)
	case float32:
		return strconv.FormatFloat(float64(result), 'f', -1, 32)
	case int:
		return strconv.Itoa(result)
	case int64:
		return strconv.FormatInt(result, 10)
	case bool:
		return strconv.FormatBool(result)
	}
	return ""
}

func sameString(left, right *string) bool {
	if left == nil || right == nil {
		return left == nil && right == nil
	}
	return *left == *right
}
