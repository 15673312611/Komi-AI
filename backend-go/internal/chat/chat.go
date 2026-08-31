package chat

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrReadStateUnavailable = errors.New("chat read state table is not available")

type Visibility struct {
	UserID            uuid.UUID
	CanViewAll        bool
	CanViewAssigned   bool
	CanManageAll      bool
	CanManageAssigned bool
	CanViewUnassigned bool
}

func (v Visibility) seesEverything() bool {
	return v.CanViewAll || v.CanManageAll
}

func (v Visibility) seesAssigned() bool {
	return v.CanViewAssigned || v.CanManageAssigned
}

type ListFilter struct {
	OrganizationID uuid.UUID
	Offset         int
	Limit          int
	AgentID        *uuid.UUID
	Status         string
	AssignedUserID *uuid.UUID
	UserName       string
	CustomerEmail  string
	DateFrom       *time.Time
	DateTo         *time.Time
	Visibility     Visibility
}

type Overview struct {
	Customer     CustomerInfo `json:"customer"`
	Agent        AgentInfo    `json:"agent"`
	LastMessage  string       `json:"last_message"`
	UpdatedAt    time.Time    `json:"updated_at"`
	MessageCount int64        `json:"message_count"`
	Status       string       `json:"status"`
	Channel      string       `json:"channel"`
	GroupID      *uuid.UUID   `json:"group_id"`
	UserID       *uuid.UUID   `json:"user_id"`
	UserName     *string      `json:"user_name"`
	AIAutoReply  bool         `json:"ai_auto_reply"`
	SessionID    uuid.UUID    `json:"session_id"`
}

type CustomerInfo struct {
	ID       uuid.UUID      `json:"id"`
	Email    string         `json:"email"`
	FullName *string        `json:"full_name"`
	MetaData map[string]any `json:"meta_data"`
}

type AgentInfo struct {
	ID                     uuid.UUID `json:"id"`
	Name                   string    `json:"name"`
	DisplayName            *string   `json:"display_name"`
	AIRepliesEnabled       bool      `json:"ai_replies_enabled"`
	AllowAttachments       bool      `json:"allow_attachments"`
	AllowedAttachmentTypes []string  `json:"allowed_attachment_types"`
}

type Message struct {
	ID          int64          `json:"id"`
	Message     string         `json:"message"`
	MessageType string         `json:"message_type"`
	CreatedAt   time.Time      `json:"created_at"`
	SessionID   *uuid.UUID     `json:"session_id,omitempty"`
	Attributes  map[string]any `json:"attributes,omitempty"`
	UserName    *string        `json:"user_name,omitempty"`
	Attachments []Attachment   `json:"attachments,omitempty"`
}

type Attachment struct {
	ID          int64  `json:"id"`
	FileURL     string `json:"file_url"`
	Filename    string `json:"filename"`
	ContentType string `json:"content_type"`
	FileSize    int64  `json:"file_size"`
}

type AttachmentInput struct {
	FileURL, Filename, ContentType string
	FileSize                       int64
	OrganizationID                 uuid.UUID
	CustomerID                     *uuid.UUID
	UserID                         *uuid.UUID
}

type Detail struct {
	Customer         CustomerInfo `json:"customer"`
	Agent            AgentInfo    `json:"agent"`
	Messages         []Message    `json:"messages"`
	Status           string       `json:"status"`
	Channel          string       `json:"channel"`
	ChannelAccountID *uuid.UUID   `json:"channel_account_id"`
	GroupID          *uuid.UUID   `json:"group_id"`
	SessionID        uuid.UUID    `json:"session_id"`
	UserID           *uuid.UUID   `json:"user_id"`
	UserName         *string      `json:"user_name"`
	AIAutoReply      bool         `json:"ai_auto_reply"`
	Tags             []string     `json:"tags"`
	CreatedAt        time.Time    `json:"created_at"`
	UpdatedAt        time.Time    `json:"updated_at"`
}

type MessageInput struct {
	Message        string
	MessageType    string
	SessionID      uuid.UUID
	OrganizationID uuid.UUID
	CustomerID     uuid.UUID
	AgentID        *uuid.UUID
	UserID         *uuid.UUID
	Attributes     map[string]any
}

type Store interface {
	List(ctx context.Context, filter ListFilter) ([]Overview, error)
	CheckAccess(ctx context.Context, sessionID, organizationID uuid.UUID, visibility Visibility) (bool, error)
	GetDetail(ctx context.Context, sessionID, organizationID uuid.UUID) (*Detail, error)
	UnreadCounts(ctx context.Context, organizationID uuid.UUID, visibility Visibility) (map[string]int64, error)
	OpenCountsByChannel(ctx context.Context, organizationID uuid.UUID, visibility Visibility) (map[string]int64, error)
	MarkRead(ctx context.Context, userID, sessionID, organizationID uuid.UUID, at time.Time) error
}

type ActionStore interface {
	Store
	CreateMessage(ctx context.Context, input MessageInput) (*Message, error)
	FindMessageByClientID(ctx context.Context, sessionID uuid.UUID, clientMessageID string) (bool, error)
}

type DeliveryStore interface {
	MarkDeliveryFailed(ctx context.Context, messageID int64, reason string) error
}

type AttachmentStore interface {
	AddAttachments(ctx context.Context, messageID int64, inputs []AttachmentInput) ([]Attachment, error)
}

type ReadStateStore interface {
	Store
	UnreadThreadCounts(ctx context.Context, organizationID uuid.UUID, userID uuid.UUID, visibility Visibility) (map[string]int64, error)
}

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	if pool == nil {
		return nil
	}
	return &Repository{pool: pool}
}

func (r *Repository) List(ctx context.Context, filter ListFilter) ([]Overview, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	if filter.Limit <= 0 {
		filter.Limit = 20
	}
	if filter.Offset < 0 {
		filter.Offset = 0
	}

	args := []any{filter.OrganizationID}
	conditions := []string{"s.organization_id = $1"}
	appendArg := func(condition string, value any) {
		args = append(args, value)
		conditions = append(conditions, fmt.Sprintf(condition, len(args)))
	}
	if filter.AgentID != nil {
		appendArg("s.agent_id = $%d", *filter.AgentID)
	}
	if status := normalizeStatusFilter(filter.Status); status != "" {
		values := strings.Split(status, ",")
		placeholders := make([]string, 0, len(values))
		for _, value := range values {
			args = append(args, strings.ToUpper(value))
			placeholders = append(placeholders, "$"+strconv.Itoa(len(args)))
		}
		conditions = append(conditions, "s.status::text IN ("+strings.Join(placeholders, ",")+")")
	}
	if filter.AssignedUserID != nil {
		appendArg("s.user_id = $%d", *filter.AssignedUserID)
	}
	if filter.UserName != "" {
		appendArg("u.full_name ILIKE $%d", "%"+filter.UserName+"%")
	}
	if filter.CustomerEmail != "" {
		appendArg("c.email ILIKE $%d", "%"+filter.CustomerEmail+"%")
	}
	if filter.DateFrom != nil {
		appendArg("h.created_at >= $%d", *filter.DateFrom)
	}
	if filter.DateTo != nil {
		appendArg("h.created_at <= $%d", *filter.DateTo)
	}
	if !filter.Visibility.seesEverything() {
		visibility := make([]string, 0, 3)
		if filter.Visibility.seesAssigned() {
			args = append(args, filter.Visibility.UserID)
			visibility = append(visibility, "s.user_id = $"+strconv.Itoa(len(args)))
			if filter.Visibility.CanViewAssigned {
				visibility = append(visibility, "EXISTS (SELECT 1 FROM user_groups ug WHERE ug.user_id = $"+strconv.Itoa(len(args))+" AND ug.group_id = s.group_id)")
			}
		}
		if filter.Visibility.CanViewUnassigned {
			visibility = append(visibility, "s.user_id IS NULL")
		}
		if len(visibility) == 0 {
			conditions = append(conditions, "FALSE")
		} else {
			conditions = append(conditions, "("+strings.Join(visibility, " OR ")+")")
		}
	}

	args = append(args, filter.Limit, filter.Offset)
	limitArg, offsetArg := len(args)-1, len(args)
	query := `
SELECT c.id, c.email, c.full_name,
       a.id, a.name, a.display_name, COALESCE(a.ai_replies_enabled, TRUE),
       COALESCE(a.allow_attachments, FALSE), a.allowed_attachment_types,
       s.status::text, COALESCE(s.channel, 'web'), s.group_id, s.user_id,
       u.full_name, s.session_id, latest.message,
       MAX(h.created_at), COUNT(h.id)
FROM chat_history h
JOIN session_to_agents s ON s.session_id = h.session_id
JOIN customers c ON c.id = h.customer_id
JOIN agents a ON a.id = h.agent_id
LEFT JOIN users u ON u.id = s.user_id
LEFT JOIN LATERAL (
    SELECT h2.message
    FROM chat_history h2
    WHERE h2.session_id = s.session_id AND h2.message_type <> 'private_note'
    ORDER BY h2.created_at DESC, h2.id DESC
    LIMIT 1
) latest ON TRUE
WHERE ` + strings.Join(conditions, " AND ") + `
GROUP BY c.id, c.email, c.full_name, a.id, a.name, a.display_name,
         a.ai_replies_enabled, a.allow_attachments,
         s.status, s.channel, s.group_id, s.user_id, u.full_name,
         s.session_id, latest.message
ORDER BY CASE WHEN s.status::text = 'TRANSFERRED' THEN 0
              WHEN s.status::text = 'OPEN' THEN 1 ELSE 2 END,
         MAX(h.created_at) DESC
LIMIT $` + strconv.Itoa(limitArg) + ` OFFSET $` + strconv.Itoa(offsetArg)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]Overview, 0)
	for rows.Next() {
		var (
			item                            Overview
			fullName, displayName, userName pgtype.Text
			groupID, userID                 pgtype.UUID
			latestMessage                   pgtype.Text
			allowedAttachmentTypes          []byte
			status, channel                 string
			updatedAt                       pgtype.Timestamptz
		)
		if err := rows.Scan(
			&item.Customer.ID, &item.Customer.Email, &fullName,
			&item.Agent.ID, &item.Agent.Name, &displayName, &item.Agent.AIRepliesEnabled,
			&item.Agent.AllowAttachments, &allowedAttachmentTypes,
			&status, &channel, &groupID, &userID, &userName, &item.SessionID,
			&latestMessage, &updatedAt, &item.MessageCount,
		); err != nil {
			return nil, err
		}
		item.Customer.FullName = textPointer(fullName)
		item.Agent.DisplayName = textPointer(displayName)
		item.Agent.AllowedAttachmentTypes = stringList(allowedAttachmentTypes)
		item.GroupID = uuidPointer(groupID)
		item.UserID = uuidPointer(userID)
		item.UserName = textPointer(userName)
		item.LastMessage = textString(latestMessage)
		item.Status = strings.ToLower(status)
		item.Channel = channel
		item.UpdatedAt = timeValue(updatedAt)
		item.Customer.MetaData = map[string]any{}
		item.AIAutoReply = item.Agent.AIRepliesEnabled
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if err := r.loadCustomerMetadata(ctx, result); err != nil {
		return nil, err
	}
	if err := r.loadSessionState(ctx, result); err != nil {
		return nil, err
	}
	return result, nil
}

func (r *Repository) GetDetail(ctx context.Context, sessionID, organizationID uuid.UUID) (*Detail, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	var (
		found                            Detail
		fullName, displayName, userName  pgtype.Text
		groupID, userID                  pgtype.UUID
		metadata, allowedAttachmentTypes []byte
		status, channel                  string
		createdAt, updatedAt             pgtype.Timestamptz
	)
	err := r.pool.QueryRow(ctx, `
SELECT c.id, c.email, c.full_name,
       a.id, a.name, a.display_name, COALESCE(a.ai_replies_enabled, TRUE),
       COALESCE(a.allow_attachments, FALSE), a.allowed_attachment_types,
       s.status::text, COALESCE(s.channel, 'web'), s.group_id, s.session_id,
       s.user_id, u.full_name,
       (SELECT MIN(created_at) FROM chat_history WHERE session_id = s.session_id),
       (SELECT MAX(created_at) FROM chat_history WHERE session_id = s.session_id),
       c.meta_data
FROM session_to_agents s
JOIN customers c ON c.id = s.customer_id
JOIN agents a ON a.id = s.agent_id
LEFT JOIN users u ON u.id = s.user_id
WHERE s.session_id = $1 AND s.organization_id = $2`,
		sessionID, organizationID,
	).Scan(
		&found.Customer.ID, &found.Customer.Email, &fullName,
		&found.Agent.ID, &found.Agent.Name, &displayName, &found.Agent.AIRepliesEnabled,
		&found.Agent.AllowAttachments, &allowedAttachmentTypes,
		&status, &channel, &groupID, &found.SessionID, &userID, &userName,
		&createdAt, &updatedAt, &metadata,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	found.Customer.FullName = textPointer(fullName)
	found.Customer.MetaData = objectJSON(metadata)
	found.Agent.DisplayName = textPointer(displayName)
	found.Agent.AllowedAttachmentTypes = stringList(allowedAttachmentTypes)
	found.Status = strings.ToLower(status)
	found.Channel = channel
	found.GroupID = uuidPointer(groupID)
	found.UserID = uuidPointer(userID)
	found.UserName = textPointer(userName)
	found.CreatedAt = timeValue(createdAt)
	found.UpdatedAt = timeValue(updatedAt)
	found.Tags = []string{}
	found.AIAutoReply = found.Agent.AIRepliesEnabled

	rows, err := r.pool.Query(ctx, `
SELECT h.id, h.message, h.message_type, h.created_at, h.session_id, h.attributes, u.full_name
FROM chat_history h
LEFT JOIN users u ON u.id = h.user_id
WHERE h.session_id = $1
ORDER BY h.created_at ASC, h.id ASC`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	found.Messages = make([]Message, 0)
	for rows.Next() {
		var (
			message          Message
			messageSessionID pgtype.UUID
			attributes       []byte
			messageUserName  pgtype.Text
		)
		if err := rows.Scan(&message.ID, &message.Message, &message.MessageType, &message.CreatedAt, &messageSessionID, &attributes, &messageUserName); err != nil {
			return nil, err
		}
		message.SessionID = uuidPointer(messageSessionID)
		message.Attributes = objectJSON(attributes)
		message.UserName = textPointer(messageUserName)
		found.Messages = append(found.Messages, message)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(found.Messages) > 0 {
		ids := make([]int64, 0, len(found.Messages))
		for _, message := range found.Messages {
			ids = append(ids, message.ID)
		}
		attachmentRows, attachmentErr := r.pool.Query(ctx, `
SELECT id, chat_history_id, file_url, filename, content_type, file_size
FROM file_attachments WHERE chat_history_id = ANY($1) ORDER BY id`, ids)
		if attachmentErr == nil {
			defer attachmentRows.Close()
			byMessage := map[int64][]Attachment{}
			for attachmentRows.Next() {
				var attachment Attachment
				var messageID int64
				if scanErr := attachmentRows.Scan(&attachment.ID, &messageID, &attachment.FileURL, &attachment.Filename, &attachment.ContentType, &attachment.FileSize); scanErr != nil {
					return nil, scanErr
				}
				byMessage[messageID] = append(byMessage[messageID], attachment)
			}
			if attachmentRows.Err() != nil {
				return nil, attachmentRows.Err()
			}
			for index := range found.Messages {
				found.Messages[index].Attachments = byMessage[found.Messages[index].ID]
			}
		}
	}
	if err := r.loadOneSessionState(ctx, &found); err != nil {
		return nil, err
	}
	return &found, nil
}

func (r *Repository) CheckAccess(ctx context.Context, sessionID, organizationID uuid.UUID, visibility Visibility) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("database is not configured")
	}
	args := []any{sessionID, organizationID}
	conditions := []string{"s.session_id = $1", "s.organization_id = $2"}
	if !visibility.seesEverything() {
		visible := make([]string, 0, 3)
		if visibility.seesAssigned() {
			args = append(args, visibility.UserID)
			userArg := "$" + strconv.Itoa(len(args))
			visible = append(visible, "s.user_id = "+userArg)
			if visibility.CanViewAssigned {
				visible = append(visible, "EXISTS (SELECT 1 FROM user_groups ug WHERE ug.user_id = "+userArg+" AND ug.group_id = s.group_id)")
			}
		}
		if visibility.CanViewUnassigned {
			visible = append(visible, "s.user_id IS NULL")
		}
		if len(visible) == 0 {
			conditions = append(conditions, "FALSE")
		} else {
			conditions = append(conditions, "("+strings.Join(visible, " OR ")+")")
		}
	}
	var allowed bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM session_to_agents s WHERE `+strings.Join(conditions, " AND ")+`)`, args...).Scan(&allowed)
	return allowed, err
}

func (r *Repository) UnreadCounts(ctx context.Context, organizationID uuid.UUID, visibility Visibility) (map[string]int64, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	args := []any{organizationID}
	conditions := []string{"s.organization_id = $1", "h.message_type = 'user'"}
	readStatesAvailable, err := r.readStateTableExists(ctx)
	if err != nil {
		return nil, err
	}
	join := ""
	if readStatesAvailable {
		args = append(args, visibility.UserID)
		readUserArg := "$" + strconv.Itoa(len(args))
		join = ` LEFT JOIN chat_read_states rs
    ON rs.session_id = s.session_id
   AND rs.user_id = ` + readUserArg + `
   AND rs.organization_id = s.organization_id`
		conditions = append(conditions, "(rs.last_read_at IS NULL OR h.created_at > rs.last_read_at)")
	}
	if !visibility.seesEverything() {
		visible := make([]string, 0, 3)
		if visibility.seesAssigned() {
			args = append(args, visibility.UserID)
			visible = append(visible, "s.user_id = $"+strconv.Itoa(len(args)))
			if visibility.CanViewAssigned {
				visible = append(visible, "EXISTS (SELECT 1 FROM user_groups ug WHERE ug.user_id = $"+strconv.Itoa(len(args))+" AND ug.group_id = s.group_id)")
			}
		}
		if visibility.CanViewUnassigned {
			visible = append(visible, "s.user_id IS NULL")
		}
		if len(visible) == 0 {
			conditions = append(conditions, "FALSE")
		} else {
			conditions = append(conditions, "("+strings.Join(visible, " OR ")+")")
		}
	}
	rows, err := r.pool.Query(ctx, `
SELECT s.session_id, COUNT(h.id)
FROM session_to_agents s
JOIN chat_history h ON h.session_id = s.session_id`+join+`
WHERE `+strings.Join(conditions, " AND ")+`
GROUP BY s.session_id
HAVING COUNT(h.id) > 0`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	counts := make(map[string]int64)
	for rows.Next() {
		var id uuid.UUID
		var count int64
		if err := rows.Scan(&id, &count); err != nil {
			return nil, err
		}
		counts[id.String()] = count
	}
	return counts, rows.Err()
}

func (r *Repository) OpenCountsByChannel(ctx context.Context, organizationID uuid.UUID, visibility Visibility) (map[string]int64, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	args := []any{organizationID}
	conditions := []string{"s.organization_id = $1", "s.status::text IN ('OPEN', 'TRANSFERRED')"}
	if !visibility.seesEverything() {
		visible := make([]string, 0, 3)
		if visibility.seesAssigned() {
			args = append(args, visibility.UserID)
			visible = append(visible, "s.user_id = $"+strconv.Itoa(len(args)))
			if visibility.CanViewAssigned {
				visible = append(visible, "EXISTS (SELECT 1 FROM user_groups ug WHERE ug.user_id = $"+strconv.Itoa(len(args))+" AND ug.group_id = s.group_id)")
			}
		}
		if visibility.CanViewUnassigned {
			visible = append(visible, "s.user_id IS NULL")
		}
		if len(visible) == 0 {
			conditions = append(conditions, "FALSE")
		} else {
			conditions = append(conditions, "("+strings.Join(visible, " OR ")+")")
		}
	}
	rows, err := r.pool.Query(ctx, `
SELECT COALESCE(s.channel, 'web'), COUNT(*)
FROM session_to_agents s
WHERE `+strings.Join(conditions, " AND ")+`
GROUP BY s.channel`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	counts := make(map[string]int64)
	for rows.Next() {
		var channel string
		var count int64
		if err := rows.Scan(&channel, &count); err != nil {
			return nil, err
		}
		counts[channel] = count
	}
	return counts, rows.Err()
}

func (r *Repository) MarkRead(ctx context.Context, userID, sessionID, organizationID uuid.UUID, at time.Time) error {
	if r == nil || r.pool == nil {
		return errors.New("database is not configured")
	}
	exists, err := r.readStateTableExists(ctx)
	if err != nil {
		return err
	}
	if !exists {
		return ErrReadStateUnavailable
	}
	_, err = r.pool.Exec(ctx, `
INSERT INTO chat_read_states (user_id, session_id, organization_id, last_read_at, created_at, updated_at)
VALUES ($1, $2, $3, $4, NOW(), NOW())
ON CONFLICT (user_id, session_id) DO UPDATE
SET organization_id = EXCLUDED.organization_id, last_read_at = EXCLUDED.last_read_at, updated_at = NOW()`,
		userID, sessionID, organizationID, at)
	return err
}

func (r *Repository) UnreadThreadCounts(ctx context.Context, organizationID, userID uuid.UUID, visibility Visibility) (map[string]int64, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	exists, err := r.readStateTableExists(ctx)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrReadStateUnavailable
	}

	args := []any{organizationID, userID}
	conditions := []string{"s.organization_id = $1"}
	if !visibility.seesEverything() {
		visible := make([]string, 0, 3)
		if visibility.seesAssigned() {
			visible = append(visible, "s.user_id = $2")
			if visibility.CanViewAssigned {
				visible = append(visible, "EXISTS (SELECT 1 FROM user_groups ug WHERE ug.user_id = $2 AND ug.group_id = s.group_id)")
			}
		}
		if visibility.CanViewUnassigned {
			visible = append(visible, "s.user_id IS NULL")
		}
		if len(visible) == 0 {
			conditions = append(conditions, "FALSE")
		} else {
			conditions = append(conditions, "("+strings.Join(visible, " OR ")+")")
		}
	}
	rows, err := r.pool.Query(ctx, `
SELECT s.session_id, COUNT(h.id)
FROM session_to_agents s
LEFT JOIN chat_read_states rs
  ON rs.session_id=s.session_id AND rs.user_id=$2 AND rs.organization_id=$1
LEFT JOIN chat_history h
  ON h.session_id=s.session_id
 AND h.organization_id=$1
 AND h.message_type='user'
 AND (rs.last_read_at IS NULL OR h.created_at > rs.last_read_at)
WHERE `+strings.Join(conditions, " AND ")+`
GROUP BY s.session_id
HAVING COUNT(h.id) > 0`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	counts := make(map[string]int64)
	for rows.Next() {
		var id uuid.UUID
		var count int64
		if err := rows.Scan(&id, &count); err != nil {
			return nil, err
		}
		counts[id.String()] = count
	}
	return counts, rows.Err()
}

func (r *Repository) CreateMessage(ctx context.Context, input MessageInput) (*Message, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	attributes := input.Attributes
	if attributes == nil {
		attributes = map[string]any{}
	}
	encoded, err := json.Marshal(attributes)
	if err != nil {
		return nil, err
	}
	message := &Message{
		Message:     input.Message,
		MessageType: input.MessageType,
		SessionID:   &input.SessionID,
		Attributes:  attributes,
	}
	err = r.pool.QueryRow(ctx, `
INSERT INTO chat_history (
    organization_id, user_id, customer_id, agent_id, session_id,
    message, message_type, attributes
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, created_at`, input.OrganizationID, input.UserID, input.CustomerID,
		input.AgentID, input.SessionID, input.Message, input.MessageType, encoded).
		Scan(&message.ID, &message.CreatedAt)
	if err != nil {
		return nil, err
	}
	return message, nil
}

func (r *Repository) AddAttachments(ctx context.Context, messageID int64, inputs []AttachmentInput) ([]Attachment, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	result := make([]Attachment, 0, len(inputs))
	for _, input := range inputs {
		var attachment Attachment
		err := r.pool.QueryRow(ctx, `
INSERT INTO file_attachments (file_url, filename, content_type, file_size, chat_history_id, organization_id, uploaded_by_user_id, uploaded_by_customer_id)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
RETURNING id, file_url, filename, content_type, file_size`, input.FileURL, input.Filename, input.ContentType, input.FileSize, messageID, input.OrganizationID, input.UserID, input.CustomerID).
			Scan(&attachment.ID, &attachment.FileURL, &attachment.Filename, &attachment.ContentType, &attachment.FileSize)
		if err != nil {
			return nil, err
		}
		result = append(result, attachment)
	}
	return result, nil
}

func (r *Repository) FindMessageByClientID(ctx context.Context, sessionID uuid.UUID, clientMessageID string) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("database is not configured")
	}
	var exists bool
	err := r.pool.QueryRow(ctx, `
SELECT EXISTS(
    SELECT 1 FROM chat_history
    WHERE session_id = $1
      AND attributes::jsonb ->> 'client_message_id' = $2
)`, sessionID, clientMessageID).Scan(&exists)
	return exists, err
}

func (r *Repository) MarkDeliveryFailed(ctx context.Context, messageID int64, reason string) error {
	if r == nil || r.pool == nil {
		return errors.New("database is not configured")
	}
	encoded, err := json.Marshal(map[string]any{"delivery_failed": true, "delivery_error": reason})
	if err != nil {
		return err
	}
	_, err = r.pool.Exec(ctx, `
UPDATE chat_history
SET attributes = (COALESCE(attributes::jsonb, '{}'::jsonb) || $2::jsonb)::json
WHERE id = $1`, messageID, encoded)
	return err
}

func (r *Repository) readStateTableExists(ctx context.Context) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(
SELECT 1 FROM information_schema.tables
WHERE table_schema = current_schema() AND table_name = 'chat_read_states')`).Scan(&exists)
	return exists, err
}

func (r *Repository) loadCustomerMetadata(ctx context.Context, values []Overview) error {
	if len(values) == 0 {
		return nil
	}
	ids := make([]uuid.UUID, 0, len(values))
	for _, value := range values {
		ids = append(ids, value.Customer.ID)
	}
	rows, err := r.pool.Query(ctx, `SELECT id, meta_data FROM customers WHERE id = ANY($1)`, ids)
	if err != nil {
		return err
	}
	defer rows.Close()
	metadata := make(map[uuid.UUID]map[string]any, len(ids))
	for rows.Next() {
		var id uuid.UUID
		var raw []byte
		if err := rows.Scan(&id, &raw); err != nil {
			return err
		}
		metadata[id] = objectJSON(raw)
	}
	if err := rows.Err(); err != nil {
		return err
	}
	for index := range values {
		values[index].Customer.MetaData = metadata[values[index].Customer.ID]
		if values[index].Customer.MetaData == nil {
			values[index].Customer.MetaData = map[string]any{}
		}
	}
	return nil
}

func (r *Repository) loadSessionState(ctx context.Context, values []Overview) error {
	if len(values) == 0 {
		return nil
	}
	ids := make([]uuid.UUID, 0, len(values))
	for _, value := range values {
		ids = append(ids, value.SessionID)
	}
	rows, err := r.pool.Query(ctx, `SELECT session_id, workflow_state FROM session_to_agents WHERE session_id = ANY($1)`, ids)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var id uuid.UUID
		var raw []byte
		if err := rows.Scan(&id, &raw); err != nil {
			return err
		}
		state := objectJSON(raw)
		for index := range values {
			if values[index].SessionID == id {
				values[index].AIAutoReply = boolFromState(state, values[index].Agent.AIRepliesEnabled)
			}
		}
	}
	return rows.Err()
}

func (r *Repository) loadOneSessionState(ctx context.Context, value *Detail) error {
	var raw []byte
	if err := r.pool.QueryRow(ctx, `SELECT workflow_state FROM session_to_agents WHERE session_id = $1`, value.SessionID).Scan(&raw); err != nil {
		return err
	}
	state := objectJSON(raw)
	value.AIAutoReply = boolFromState(state, value.Agent.AIRepliesEnabled)
	if rawTags, ok := state["conversation_tags"].([]any); ok {
		value.Tags = make([]string, 0, len(rawTags))
		for _, rawTag := range rawTags {
			if tag, ok := rawTag.(string); ok {
				value.Tags = append(value.Tags, tag)
			}
		}
	}
	return nil
}

func normalizeStatusFilter(value string) string {
	parts := strings.Split(strings.ToLower(strings.TrimSpace(value)), ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" || part == "all" {
			continue
		}
		result = append(result, part)
	}
	return strings.Join(result, ",")
}

func boolFromState(state map[string]any, fallback bool) bool {
	if value, ok := state["ai_auto_reply"].(bool); ok {
		return value
	}
	return fallback
}

func objectJSON(raw []byte) map[string]any {
	if len(raw) == 0 || string(raw) == "null" {
		return map[string]any{}
	}
	var value map[string]any
	if err := json.Unmarshal(raw, &value); err != nil || value == nil {
		return map[string]any{}
	}
	return value
}

func stringList(raw []byte) []string {
	if len(raw) == 0 || string(raw) == "null" {
		return nil
	}
	var value []string
	if json.Unmarshal(raw, &value) != nil {
		return nil
	}
	return value
}

func textPointer(value pgtype.Text) *string {
	if !value.Valid {
		return nil
	}
	result := value.String
	return &result
}

func textString(value pgtype.Text) string {
	if !value.Valid {
		return ""
	}
	return value.String
}

func uuidPointer(value pgtype.UUID) *uuid.UUID {
	if !value.Valid {
		return nil
	}
	result := uuid.UUID(value.Bytes)
	return &result
}

func timeValue(value pgtype.Timestamptz) time.Time {
	if !value.Valid {
		return time.Time{}
	}
	return value.Time
}
