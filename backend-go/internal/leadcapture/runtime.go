package leadcapture

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var leadEmailPattern = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

// CaptureInput is the transport-independent input for a conversational lead
// capture. The repository performs validation, capture-once, identity merge,
// customer promotion and response insertion in one transaction.
type CaptureInput struct {
	OrganizationID uuid.UUID
	AgentID        uuid.UUID
	CustomerID     uuid.UUID
	SessionID      uuid.UUID
	LeadData       map[string]any
	Summary        string
	Consent        bool
	PageURL        string
	Channel        string
}

type CaptureResult struct {
	ID             uuid.UUID      `json:"id"`
	OrganizationID uuid.UUID      `json:"organization_id"`
	AgentID        uuid.UUID      `json:"agent_id"`
	CustomerID     uuid.UUID      `json:"customer_id"`
	SessionID      uuid.UUID      `json:"session_id"`
	FieldValues    map[string]any `json:"field_values"`
	Summary        string         `json:"summary"`
	Consent        bool           `json:"consent"`
	Qualified      bool           `json:"qualified"`
	CreatedAt      time.Time      `json:"created_at"`
}

// RuntimeStore is implemented by the production repository. It is separate
// from Store so config-only fakes and HTTP handlers do not need runtime logic.
type RuntimeStore interface {
	Store
	Record(ctx context.Context, input CaptureInput) (*CaptureResult, error)
}

type leadCustomer struct {
	ID                   uuid.UUID
	Email                string
	FullName             *string
	Phone                *string
	OrganizationID       uuid.UUID
	IsAuthenticated      bool
	IsActive             bool
	LeadStage            string
	LeadSource           map[string]any
	MergedIntoCustomerID *uuid.UUID
}

type leadRowScanner interface {
	Scan(dest ...any) error
}

func (r *Repository) Record(ctx context.Context, input CaptureInput) (*CaptureResult, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	if input.OrganizationID == uuid.Nil || input.AgentID == uuid.Nil || input.CustomerID == uuid.Nil {
		return nil, nil
	}

	configured, err := r.GetOrCreate(ctx, input.AgentID, input.OrganizationID)
	if err != nil {
		return nil, err
	}
	if configured == nil || !configured.Enabled {
		return nil, nil
	}

	fieldValues := filterLeadFields(configured.Fields, input.LeadData)
	email := strings.TrimSpace(valueString(fieldValues["email"]))
	if !validLeadEmail(email) || (configured.RequireConsent && !input.Consent) {
		return nil, nil
	}
	name := strings.TrimSpace(valueString(fieldValues["name"]))

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Serialise captures for one organization/email pair. Besides preventing
	// two anonymous rows from both claiming the same existing customer, this
	// keeps the source/target phone swap below free from unique-index races.
	if _, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtext($1))`, input.OrganizationID.String()+":"+strings.ToLower(email)); err != nil {
		return nil, err
	}

	source, err := getLeadCustomer(ctx, tx, input.CustomerID, input.OrganizationID, true)
	if errors.Is(err, pgx.ErrNoRows) || source == nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if source.IsAuthenticated {
		return nil, nil
	}

	// A stale widget token can point at a row already merged by another turn.
	// Resolve it before checking capture-once so a merge never creates a second
	// lead under the tombstone customer.
	if source.MergedIntoCustomerID != nil && *source.MergedIntoCustomerID != uuid.Nil {
		source, err = getLeadCustomer(ctx, tx, *source.MergedIntoCustomerID, input.OrganizationID, true)
		if err != nil || source == nil || source.IsAuthenticated {
			return nil, err
		}
		input.CustomerID = source.ID
	}

	var captured bool
	if err := tx.QueryRow(ctx, `
SELECT EXISTS(
    SELECT 1 FROM lead_capture_responses
    WHERE customer_id = $1 AND agent_id = $2
)`, source.ID, input.AgentID).Scan(&captured); err != nil {
		return nil, err
	}
	if captured {
		return nil, nil
	}

	target := source
	if existing, findErr := findLeadCustomerByEmail(ctx, tx, email, input.OrganizationID, source.ID); findErr != nil {
		return nil, findErr
	} else if existing != nil {
		if err := mergeLeadCustomers(ctx, tx, source, existing); err != nil {
			return nil, err
		}
		target = existing
	}

	if name != "" {
		// Python's update_contact accepts a supplied name even when the customer
		// already has one; this keeps handoff and conversational capture aligned.
		value := name
		target.FullName = &value
	}
	if shouldReplaceLeadEmail(target, email) {
		target.Email = email
	}
	if target.Phone == nil {
		if phone := normalizeLeadPhone(valueString(fieldValues["phone"])); phone != "" {
			var conflict bool
			if err := tx.QueryRow(ctx, `
SELECT EXISTS(
    SELECT 1 FROM customers
    WHERE organization_id = $1 AND phone = $2 AND id <> $3
      AND merged_into_customer_id IS NULL
)`, target.OrganizationID, phone, target.ID).Scan(&conflict); err != nil {
				return nil, err
			}
			if !conflict {
				target.Phone = &phone
			}
		}
	}

	if err := updateLeadCustomer(ctx, tx, target, sourceLeadStage(target.LeadStage), input, configured, fieldValues); err != nil {
		return nil, err
	}

	fieldJSON, err := json.Marshal(fieldValues)
	if err != nil {
		return nil, err
	}
	var agentValue any = input.AgentID
	if input.AgentID == uuid.Nil {
		agentValue = nil
	}
	var sessionValue any = input.SessionID
	if input.SessionID == uuid.Nil {
		sessionValue = nil
	}
	result := &CaptureResult{
		ID:             uuid.New(),
		OrganizationID: input.OrganizationID,
		AgentID:        input.AgentID,
		CustomerID:     target.ID,
		SessionID:      input.SessionID,
		FieldValues:    fieldValues,
		Summary:        strings.TrimSpace(input.Summary),
		Consent:        input.Consent,
		Qualified:      true,
	}
	if err := tx.QueryRow(ctx, `
INSERT INTO lead_capture_responses (
    id, organization_id, agent_id, customer_id, session_id,
    field_values, summary, consent, qualified
)
VALUES ($1, $2, $3, $4, $5, $6::json, NULLIF($7, ''), $8, TRUE)
RETURNING id, created_at`, result.ID, result.OrganizationID, agentValue, result.CustomerID,
		sessionValue, string(fieldJSON), result.Summary, result.Consent).Scan(&result.ID, &result.CreatedAt); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return result, nil
}

func getLeadCustomer(ctx context.Context, tx pgx.Tx, id, organizationID uuid.UUID, lock bool) (*leadCustomer, error) {
	locking := ""
	if lock {
		locking = " FOR UPDATE"
	}
	var (
		found           leadCustomer
		fullName, phone pgtype.Text
		merged          pgtype.UUID
		leadSource      []byte
		stage           string
	)
	err := tx.QueryRow(ctx, `
SELECT id, email, full_name, phone, organization_id,
       COALESCE(is_authenticated, FALSE), COALESCE(is_active, TRUE),
       lead_stage::text, lead_source, merged_into_customer_id
FROM customers
WHERE id = $1 AND organization_id = $2`+locking, id, organizationID).Scan(
		&found.ID, &found.Email, &fullName, &phone, &found.OrganizationID,
		&found.IsAuthenticated, &found.IsActive, &stage, &leadSource, &merged,
	)
	if err != nil {
		return nil, err
	}
	if fullName.Valid {
		value := fullName.String
		found.FullName = &value
	}
	if phone.Valid {
		value := phone.String
		found.Phone = &value
	}
	if merged.Valid {
		value := uuid.UUID(merged.Bytes)
		found.MergedIntoCustomerID = &value
	}
	found.LeadStage = strings.ToUpper(stage)
	found.LeadSource = decodeLeadObject(leadSource)
	return &found, nil
}

func findLeadCustomerByEmail(ctx context.Context, tx pgx.Tx, email string, organizationID, excludedID uuid.UUID) (*leadCustomer, error) {
	var id uuid.UUID
	err := tx.QueryRow(ctx, `
SELECT id FROM customers
WHERE email = $1 AND organization_id = $2 AND id <> $3
  AND merged_into_customer_id IS NULL
FOR UPDATE`, email, organizationID, excludedID).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return getLeadCustomer(ctx, tx, id, organizationID, true)
}

func mergeLeadCustomers(ctx context.Context, tx pgx.Tx, source, target *leadCustomer) error {
	if source == nil || target == nil || source.ID == target.ID {
		return nil
	}
	for _, query := range []string{
		`UPDATE chat_history SET customer_id = $2 WHERE customer_id = $1`,
		`UPDATE session_to_agents SET customer_id = $2 WHERE customer_id = $1`,
		`UPDATE lead_capture_responses SET customer_id = $2 WHERE customer_id = $1`,
		`UPDATE ratings SET customer_id = $2 WHERE customer_id = $1`,
		`UPDATE channel_conversations SET customer_id = $2 WHERE customer_id = $1`,
	} {
		if _, err := tx.Exec(ctx, query, source.ID, target.ID); err != nil {
			return err
		}
	}
	if (target.FullName == nil || strings.TrimSpace(*target.FullName) == "") && source.FullName != nil && strings.TrimSpace(*source.FullName) != "" {
		value := strings.TrimSpace(*source.FullName)
		target.FullName = &value
	}
	if source.Phone != nil {
		moved := *source.Phone
		if _, err := tx.Exec(ctx, `UPDATE customers SET phone = NULL, updated_at = NOW() WHERE id = $1`, source.ID); err != nil {
			return err
		}
		if target.Phone == nil {
			target.Phone = &moved
		}
	}
	_, err := tx.Exec(ctx, `
UPDATE customers
SET merged_into_customer_id = $2, is_active = FALSE, updated_at = NOW()
WHERE id = $1`, source.ID, target.ID)
	return err
}

func updateLeadCustomer(ctx context.Context, tx pgx.Tx, target *leadCustomer, stage string, input CaptureInput, configured *Config, fieldValues map[string]any) error {
	if target == nil {
		return errors.New("lead customer is missing")
	}
	leadSource := target.LeadSource
	if leadSource == nil {
		leadSource = map[string]any{}
	}
	if strings.TrimSpace(input.Channel) == "" {
		input.Channel = "widget"
	}
	if _, exists := leadSource["channel"]; !exists || strings.TrimSpace(fmt.Sprint(leadSource["channel"])) == "" {
		leadSource["channel"] = input.Channel
	}
	leadSource["captured_at"] = time.Now().UTC().Format(time.RFC3339Nano)
	if input.SessionID != uuid.Nil {
		leadSource["session_id"] = input.SessionID.String()
	}
	if pageURL := strings.TrimSpace(input.PageURL); pageURL != "" {
		if len([]rune(pageURL)) > 500 {
			pageURL = string([]rune(pageURL)[:500])
		}
		leadSource["page_url"] = pageURL
	}
	encodedSource, err := json.Marshal(leadSource)
	if err != nil {
		return err
	}

	var fullName any
	if target.FullName != nil {
		fullName = *target.FullName
	}
	var phone any
	if target.Phone != nil {
		phone = *target.Phone
	}
	qualifiedAt := time.Now().UTC()
	promote := strings.EqualFold(stage, "VISITOR")
	if promote {
		stage = "LEAD"
	}
	// `configured` is intentionally accepted here to make the transaction's
	// input contract explicit; validation happened before the transaction.
	_ = configured
	_, err = tx.Exec(ctx, `
UPDATE customers
SET email = $2,
    full_name = $3,
    phone = $4,
    lead_stage = CASE WHEN $5 THEN 'LEAD'::leadstage ELSE lead_stage END,
    lead_qualified_at = CASE WHEN $5 THEN $6 ELSE lead_qualified_at END,
    lead_source = $7::json,
    updated_at = NOW()
WHERE id = $1 AND organization_id = $8`, target.ID, target.Email, fullName, phone,
		promote, qualifiedAt, string(encodedSource), input.OrganizationID)
	return err
}

func sourceLeadStage(stage string) string {
	stage = strings.ToUpper(strings.TrimSpace(stage))
	if stage == "" {
		return "VISITOR"
	}
	return stage
}

func filterLeadFields(configured []Field, values map[string]any) map[string]any {
	result := make(map[string]any)
	if values == nil {
		return result
	}
	allowed := make(map[string]struct{}, len(configured))
	for _, field := range configured {
		if key := strings.TrimSpace(field.Key); key != "" {
			allowed[key] = struct{}{}
		}
	}
	for key, value := range values {
		if _, ok := allowed[key]; len(allowed) > 0 && !ok {
			continue
		}
		if leadValuePresent(value) {
			result[key] = value
		}
	}
	return result
}

func leadValuePresent(value any) bool {
	if value == nil {
		return false
	}
	if text, ok := value.(string); ok {
		return strings.TrimSpace(text) != ""
	}
	return true
}

func valueString(value any) string {
	if value == nil {
		return ""
	}
	if text, ok := value.(string); ok {
		return text
	}
	return fmt.Sprint(value)
}

func validLeadEmail(value string) bool {
	return leadEmailPattern.MatchString(strings.TrimSpace(value))
}

func isLeadPlaceholderEmail(value string) bool {
	value = strings.ToLower(strings.TrimSpace(value))
	return value == "" || strings.Contains(value, "@noemail.com") || strings.HasSuffix(value, ".channel")
}

func shouldReplaceLeadEmail(customer *leadCustomer, email string) bool {
	if customer == nil || !isLeadPlaceholderEmail(customer.Email) || strings.EqualFold(customer.Email, email) {
		return false
	}
	// A phone-keyed channel customer uses `{id}@channel.channel` as a lookup
	// key. Replacing it would make the next inbound message create a duplicate.
	return !(strings.HasSuffix(strings.ToLower(customer.Email), ".channel") && customer.Phone != nil)
}

func normalizeLeadPhone(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	var builder strings.Builder
	for _, char := range value {
		switch {
		case char >= '0' && char <= '9':
			builder.WriteRune(char)
		case char == '+' && builder.Len() == 0:
			builder.WriteRune(char)
		case char == ' ' || char == '-' || char == '.' || char == '(' || char == ')':
		default:
			return ""
		}
	}
	result := builder.String()
	if len(result) < 9 || len(result) > 16 || !strings.HasPrefix(result, "+") || result[1] == '0' {
		return ""
	}
	return result
}

func decodeLeadObject(raw []byte) map[string]any {
	if len(raw) == 0 || string(raw) == "null" {
		return map[string]any{}
	}
	var value map[string]any
	if json.Unmarshal(raw, &value) != nil || value == nil {
		return map[string]any{}
	}
	return value
}
