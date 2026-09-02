package notification

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound         = errors.New("notification not found")
	ErrDatabaseNotReady = errors.New("database is not configured")
)

type Notification struct {
	ID                   int64          `json:"id"`
	UserID               uuid.UUID      `json:"user_id"`
	Type                 string         `json:"type"`
	Title                string         `json:"title"`
	Message              string         `json:"message"`
	NotificationMetadata map[string]any `json:"notification_metadata,omitempty"`
	IsRead               bool           `json:"is_read"`
	CreatedAt            *time.Time     `json:"created_at,omitempty"`
}

type Settings struct {
	UserID             uuid.UUID  `json:"-"`
	NotifyNewChat      bool       `json:"notify_new_chat"`
	NotifyChatTransfer bool       `json:"notify_chat_transfer"`
	NotifyChatAssigned bool       `json:"notify_chat_assigned"`
	CreatedAt          *time.Time `json:"-"`
	UpdatedAt          *time.Time `json:"-"`
}

type SettingsUpdate struct {
	NotifyNewChat      *bool `json:"notify_new_chat"`
	NotifyChatTransfer *bool `json:"notify_chat_transfer"`
	NotifyChatAssigned *bool `json:"notify_chat_assigned"`
}

type Store interface {
	List(ctx context.Context, userID uuid.UUID, skip, limit int) ([]Notification, error)
	MarkRead(ctx context.Context, userID uuid.UUID, notificationID int64) error
	MarkAllRead(ctx context.Context, userID uuid.UUID) (int64, error)
	Delete(ctx context.Context, userID uuid.UUID, notificationID int64) error
	Clear(ctx context.Context, userID uuid.UUID) (int64, error)
	UnreadCount(ctx context.Context, userID uuid.UUID) (int64, error)
	GetSettings(ctx context.Context, userID uuid.UUID) (*Settings, error)
	UpdateSettings(ctx context.Context, userID uuid.UUID, update SettingsUpdate) (*Settings, error)
	CreateTest(ctx context.Context, userID uuid.UUID) error
}

// ChatEventStore is the business-event extension used by chat/session flows.
// Keeping it outside Store lets the existing notification fakes and read-only
// consumers remain small while production repositories can fan out one event
// with the same preference defaults as the Python service.
type ChatEventStore interface {
	CreateChatEvent(ctx context.Context, userIDs []uuid.UUID, event, title, message string, metadata map[string]any) ([]Notification, error)
}

// ChatMentionStore is separate from ChatEventStore because mentions are
// direct collaboration alerts and do not follow queue notification toggles.
type ChatMentionStore interface {
	CreateChatMentions(ctx context.Context, userIDs []uuid.UUID, sessionID uuid.UUID, messageID int64, senderName string, privateNote bool) ([]Notification, error)
}

// CreateChatEvent is deliberately best-effort for stores that only implement
// the CRUD API. Callers use it for side effects, so a missing event extension
// must not make the chat action itself fail.
func CreateChatEvent(ctx context.Context, store Store, userIDs []uuid.UUID, event, title, message string, metadata map[string]any) ([]Notification, error) {
	eventStore, ok := store.(ChatEventStore)
	if !ok || eventStore == nil {
		return nil, nil
	}
	return eventStore.CreateChatEvent(ctx, userIDs, event, title, message, metadata)
}

func CreateChatMentions(ctx context.Context, store Store, userIDs []uuid.UUID, sessionID uuid.UUID, messageID int64, senderName string, privateNote bool) ([]Notification, error) {
	mentionStore, ok := store.(ChatMentionStore)
	if !ok || mentionStore == nil {
		return nil, nil
	}
	return mentionStore.CreateChatMentions(ctx, userIDs, sessionID, messageID, senderName, privateNote)
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
		return ErrDatabaseNotReady
	}
	return nil
}

const notificationColumns = `id, user_id, type, title, message, notification_metadata, is_read, created_at`

func (r *Repository) List(ctx context.Context, userID uuid.UUID, skip, limit int) ([]Notification, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, `
SELECT `+notificationColumns+`
FROM notifications
WHERE user_id = $1
ORDER BY created_at DESC
OFFSET $2 LIMIT $3`, userID, skip, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]Notification, 0)
	for rows.Next() {
		item, err := scanNotification(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *item)
	}
	return items, rows.Err()
}

func (r *Repository) MarkRead(ctx context.Context, userID uuid.UUID, notificationID int64) error {
	if err := r.ready(); err != nil {
		return err
	}
	result, err := r.pool.Exec(ctx, `
UPDATE notifications SET is_read = TRUE
WHERE id = $1 AND user_id = $2`, notificationID, userID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *Repository) MarkAllRead(ctx context.Context, userID uuid.UUID) (int64, error) {
	if err := r.ready(); err != nil {
		return 0, err
	}
	result, err := r.pool.Exec(ctx, `
UPDATE notifications SET is_read = TRUE
WHERE user_id = $1 AND is_read = FALSE`, userID)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected(), nil
}

func (r *Repository) Delete(ctx context.Context, userID uuid.UUID, notificationID int64) error {
	if err := r.ready(); err != nil {
		return err
	}
	result, err := r.pool.Exec(ctx, `DELETE FROM notifications WHERE id = $1 AND user_id = $2`, notificationID, userID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *Repository) Clear(ctx context.Context, userID uuid.UUID) (int64, error) {
	if err := r.ready(); err != nil {
		return 0, err
	}
	result, err := r.pool.Exec(ctx, `DELETE FROM notifications WHERE user_id = $1`, userID)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected(), nil
}

func (r *Repository) UnreadCount(ctx context.Context, userID uuid.UUID) (int64, error) {
	if err := r.ready(); err != nil {
		return 0, err
	}
	var count int64
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`, userID).Scan(&count)
	return count, err
}

func (r *Repository) GetSettings(ctx context.Context, userID uuid.UUID) (*Settings, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	// Python creates the row lazily. ON CONFLICT keeps concurrent first reads
	// idempotent while preserving the database defaults for all three toggles.
	_, err := r.pool.Exec(ctx, `
INSERT INTO user_notification_settings (user_id)
VALUES ($1)
ON CONFLICT (user_id) DO NOTHING`, userID)
	if err != nil {
		return nil, err
	}
	return r.scanSettings(r.pool.QueryRow(ctx, `
SELECT user_id, notify_new_chat, notify_chat_transfer, notify_chat_assigned, created_at, updated_at
FROM user_notification_settings WHERE user_id = $1`, userID))
}

func (r *Repository) UpdateSettings(ctx context.Context, userID uuid.UUID, update SettingsUpdate) (*Settings, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	if _, err := r.GetSettings(ctx, userID); err != nil {
		return nil, err
	}
	parts := make([]string, 0, 3)
	args := make([]any, 0, 4)
	if update.NotifyNewChat != nil {
		args = append(args, *update.NotifyNewChat)
		parts = append(parts, fmt.Sprintf("notify_new_chat = $%d", len(args)))
	}
	if update.NotifyChatTransfer != nil {
		args = append(args, *update.NotifyChatTransfer)
		parts = append(parts, fmt.Sprintf("notify_chat_transfer = $%d", len(args)))
	}
	if update.NotifyChatAssigned != nil {
		args = append(args, *update.NotifyChatAssigned)
		parts = append(parts, fmt.Sprintf("notify_chat_assigned = $%d", len(args)))
	}
	if len(parts) > 0 {
		args = append(args, userID)
		_, err := r.pool.Exec(ctx, `UPDATE user_notification_settings SET `+strings.Join(parts, ", ")+`, updated_at = NOW() WHERE user_id = $`+fmt.Sprint(len(args)), args...)
		if err != nil {
			return nil, err
		}
	}
	return r.scanSettings(r.pool.QueryRow(ctx, `
SELECT user_id, notify_new_chat, notify_chat_transfer, notify_chat_assigned, created_at, updated_at
FROM user_notification_settings WHERE user_id = $1`, userID))
}

func (r *Repository) CreateTest(ctx context.Context, userID uuid.UUID) error {
	if err := r.ready(); err != nil {
		return err
	}
	metadata, err := json.Marshal(map[string]bool{"test": true})
	if err != nil {
		return err
	}
	_, err = r.pool.Exec(ctx, `
INSERT INTO notifications (user_id, type, title, message, notification_metadata, is_read)
VALUES ($1, 'CHAT'::notificationtype, $2, $3, $4, FALSE)`,
		userID, "Test Notification", "This is a test notification from Komi AI", metadata)
	return err
}

func (r *Repository) CreateChatEvent(ctx context.Context, userIDs []uuid.UUID, event, title, message string, metadata map[string]any) ([]Notification, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	event = strings.TrimSpace(strings.ToLower(event))
	defaultEnabled, ok := map[string]bool{
		"new_chat":      false,
		"chat_transfer": true,
		"chat_assigned": true,
	}[event]
	if !ok {
		return nil, fmt.Errorf("unknown chat notification event %q", event)
	}

	unique := make([]uuid.UUID, 0, len(userIDs))
	seen := make(map[uuid.UUID]struct{}, len(userIDs))
	for _, userID := range userIDs {
		if userID == uuid.Nil {
			continue
		}
		if _, exists := seen[userID]; exists {
			continue
		}
		seen[userID] = struct{}{}
		unique = append(unique, userID)
	}
	if len(unique) == 0 {
		return []Notification{}, nil
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	enabled := make(map[uuid.UUID]bool, len(unique))
	rows, err := tx.Query(ctx, `
SELECT user_id, notify_new_chat, notify_chat_transfer, notify_chat_assigned
FROM user_notification_settings
WHERE user_id = ANY($1::uuid[])`, unique)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var userID uuid.UUID
		var newChat, transfer, assigned bool
		if err := rows.Scan(&userID, &newChat, &transfer, &assigned); err != nil {
			rows.Close()
			return nil, err
		}
		switch event {
		case "new_chat":
			enabled[userID] = newChat
		case "chat_transfer":
			enabled[userID] = transfer
		case "chat_assigned":
			enabled[userID] = assigned
		}
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return nil, err
	}
	rows.Close()

	metadataCopy := make(map[string]any, len(metadata)+1)
	for key, value := range metadata {
		metadataCopy[key] = value
	}
	metadataCopy["event"] = event
	encodedMetadata, err := json.Marshal(metadataCopy)
	if err != nil {
		return nil, err
	}

	created := make([]Notification, 0, len(unique))
	for _, userID := range unique {
		want, exists := enabled[userID]
		if !exists {
			want = defaultEnabled
		}
		if !want {
			continue
		}
		var item Notification
		var createdAt pgtype.Timestamptz
		if err := tx.QueryRow(ctx, `
INSERT INTO notifications (user_id, type, title, message, notification_metadata, is_read)
VALUES ($1, 'CHAT'::notificationtype, $2, $3, $4, FALSE)
RETURNING id, created_at`, userID, title, message, encodedMetadata).Scan(&item.ID, &createdAt); err != nil {
			return nil, err
		}
		item.UserID = userID
		item.Type = "chat"
		item.Title = title
		item.Message = message
		item.NotificationMetadata = metadataCopy
		item.IsRead = false
		if createdAt.Valid {
			value := createdAt.Time
			item.CreatedAt = &value
		}
		created = append(created, item)
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return created, nil
}

func (r *Repository) CreateChatMentions(ctx context.Context, userIDs []uuid.UUID, sessionID uuid.UUID, messageID int64, senderName string, privateNote bool) ([]Notification, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	unique := make([]uuid.UUID, 0, len(userIDs))
	seen := make(map[uuid.UUID]struct{}, len(userIDs))
	for _, userID := range userIDs {
		if userID == uuid.Nil {
			continue
		}
		if _, exists := seen[userID]; exists {
			continue
		}
		seen[userID] = struct{}{}
		unique = append(unique, userID)
	}
	if len(unique) == 0 {
		return []Notification{}, nil
	}
	if strings.TrimSpace(senderName) == "" {
		senderName = "A teammate"
	}
	notificationMessage := senderName + " mentioned you in a customer reply."
	if privateNote {
		notificationMessage = senderName + " mentioned you in an internal note."
	}
	metadataValue := map[string]any{"session_id": sessionID.String(), "message_id": messageID, "event": "chat_mention"}
	metadata, err := json.Marshal(metadataValue)
	if err != nil {
		return nil, err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	created := make([]Notification, 0, len(unique))
	for _, userID := range unique {
		var item Notification
		var createdAt pgtype.Timestamptz
		if err := tx.QueryRow(ctx, `
INSERT INTO notifications (user_id, type, title, message, notification_metadata, is_read)
VALUES ($1, 'CHAT'::notificationtype, $2, $3, $4, FALSE)
RETURNING id, created_at`, userID, "You were mentioned in a conversation", notificationMessage, metadata).
			Scan(&item.ID, &createdAt); err != nil {
			return nil, err
		}
		item.UserID = userID
		item.Type = "chat"
		item.Title = "You were mentioned in a conversation"
		item.Message = notificationMessage
		item.NotificationMetadata = metadataValue
		if createdAt.Valid {
			value := createdAt.Time
			item.CreatedAt = &value
		}
		created = append(created, item)
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return created, nil
}

type rowScanner interface{ Scan(dest ...any) error }

func scanNotification(row rowScanner) (*Notification, error) {
	var (
		item      Notification
		typeName  string
		metadata  []byte
		createdAt pgtype.Timestamptz
	)
	if err := row.Scan(&item.ID, &item.UserID, &typeName, &item.Title, &item.Message, &metadata, &item.IsRead, &createdAt); err != nil {
		return nil, err
	}
	item.Type = strings.ToLower(typeName)
	if len(metadata) > 0 {
		if err := json.Unmarshal(metadata, &item.NotificationMetadata); err != nil {
			return nil, err
		}
	}
	if createdAt.Valid {
		value := createdAt.Time
		item.CreatedAt = &value
	}
	return &item, nil
}

func (r *Repository) scanSettings(row rowScanner) (*Settings, error) {
	var (
		settings  Settings
		createdAt pgtype.Timestamptz
		updatedAt pgtype.Timestamptz
	)
	if err := row.Scan(&settings.UserID, &settings.NotifyNewChat, &settings.NotifyChatTransfer, &settings.NotifyChatAssigned, &createdAt, &updatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if createdAt.Valid {
		value := createdAt.Time
		settings.CreatedAt = &value
	}
	if updatedAt.Valid {
		value := updatedAt.Time
		settings.UpdatedAt = &value
	}
	return &settings, nil
}
