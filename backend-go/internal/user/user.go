package user

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Permission struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type Role struct {
	ID             int64        `json:"id"`
	Name           string       `json:"name"`
	Description    string       `json:"description"`
	Permissions    []Permission `json:"permissions"`
	OrganizationID *uuid.UUID   `json:"organization_id,omitempty"`
	IsDefault      bool         `json:"is_default"`
	CreatedAt      *time.Time   `json:"created_at,omitempty"`
	UpdatedAt      *time.Time   `json:"updated_at,omitempty"`
}

type Group struct {
	ID             uuid.UUID `json:"id"`
	Name           string    `json:"name"`
	Description    *string   `json:"description"`
	OrganizationID uuid.UUID `json:"organization_id"`
	Users          []User    `json:"users,omitempty"`
}

type User struct {
	ID             uuid.UUID  `json:"id"`
	Email          string     `json:"email"`
	FullName       string     `json:"full_name"`
	HashedPassword string     `json:"-"`
	IsActive       bool       `json:"is_active"`
	ProfilePic     string     `json:"profile_pic,omitempty"`
	IsOnline       bool       `json:"is_online"`
	LastSeen       *time.Time `json:"last_seen,omitempty"`
	OrganizationID *uuid.UUID `json:"organization_id,omitempty"`
	RoleID         *int64     `json:"-"`
	CreatedAt      *time.Time `json:"created_at,omitempty"`
	UpdatedAt      *time.Time `json:"updated_at,omitempty"`
	Role           *Role      `json:"role,omitempty"`
	Groups         []Group    `json:"groups,omitempty"`
}

// Teammate is the deliberately narrow user shape used by inbox assignment
// controls. Permissions and group membership stay internal to the visibility
// filter and are never serialized to dashboard clients.
type Teammate struct {
	ID          uuid.UUID
	Email       string
	FullName    *string
	ProfilePic  *string
	IsOnline    bool
	Permissions map[string]struct{}
	GroupIDs    []uuid.UUID
}

type TeammateStore interface {
	ListChatTeammates(ctx context.Context, organizationID uuid.UUID) ([]Teammate, error)
}

type Store interface {
	FindActiveByEmail(ctx context.Context, email string) (*User, error)
	FindActiveByID(ctx context.Context, id uuid.UUID) (*User, error)
	SetOnline(ctx context.Context, id uuid.UUID, online bool) error
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

const userQuery = `
SELECT
    u.id, u.email, u.full_name, u.hashed_password, u.is_active,
    u.profile_pic, u.is_online, u.last_seen, u.organization_id,
    u.role_id, u.created_at, u.updated_at,
    r.id, r.name, r.description, r.organization_id,
    COALESCE(
        json_agg(json_build_object(
            'id', p.id,
            'name', p.name,
            'description', p.description
        ) ORDER BY p.id) FILTER (WHERE p.id IS NOT NULL),
        '[]'::json
    )
FROM users u
LEFT JOIN roles r ON r.id = u.role_id
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id
WHERE %s AND u.is_active = TRUE
GROUP BY u.id, u.email, u.full_name, u.hashed_password, u.is_active,
         u.profile_pic, u.is_online, u.last_seen, u.organization_id,
         u.role_id, u.created_at, u.updated_at,
         r.id, r.name, r.description, r.organization_id`

func (r *Repository) FindActiveByEmail(ctx context.Context, email string) (*User, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	return r.find(ctx, "u.email = $1", email)
}

func (r *Repository) FindActiveByID(ctx context.Context, id uuid.UUID) (*User, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}
	return r.find(ctx, "u.id = $1", id)
}

func (r *Repository) find(ctx context.Context, predicate string, arg any) (*User, error) {
	return scanUser(r.pool.QueryRow(ctx, fmt.Sprintf(userQuery, predicate), arg))
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanUser(row rowScanner) (*User, error) {
	var (
		user                      User
		fullName, profilePic      pgtype.Text
		lastSeen, createdAt       pgtype.Timestamptz
		updatedAt                 pgtype.Timestamptz
		organizationID            pgtype.UUID
		roleID, roleDBID          pgtype.Int4
		roleName, roleDescription pgtype.Text
		roleOrganizationID        pgtype.UUID
		permissionsJSON           []byte
	)
	err := row.Scan(
		&user.ID, &user.Email, &fullName, &user.HashedPassword, &user.IsActive,
		&profilePic, &user.IsOnline, &lastSeen, &organizationID, &roleID,
		&createdAt, &updatedAt, &roleDBID, &roleName, &roleDescription,
		&roleOrganizationID, &permissionsJSON,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	user.FullName = fullName.String
	user.ProfilePic = profilePic.String
	user.OrganizationID = uuidValue(organizationID)
	user.RoleID = intValue(roleID)
	user.LastSeen = timeValue(lastSeen)
	user.CreatedAt = timeValue(createdAt)
	user.UpdatedAt = timeValue(updatedAt)
	if roleDBID.Valid {
		role := &Role{
			ID:             int64(roleDBID.Int32),
			Name:           roleName.String,
			Description:    roleDescription.String,
			OrganizationID: uuidValue(roleOrganizationID),
		}
		if len(permissionsJSON) > 0 {
			if err := json.Unmarshal(permissionsJSON, &role.Permissions); err != nil {
				return nil, err
			}
		}
		if role.Permissions == nil {
			role.Permissions = []Permission{}
		}
		user.Role = role
	}
	return &user, nil
}

func (r *Repository) SetOnline(ctx context.Context, id uuid.UUID, online bool) error {
	if r == nil || r.pool == nil {
		return errors.New("database is not configured")
	}
	_, err := r.pool.Exec(ctx, `UPDATE users SET is_online = $2, last_seen = NOW() WHERE id = $1`, id, online)
	return err
}

func (r *Repository) ListChatTeammates(ctx context.Context, organizationID uuid.UUID) ([]Teammate, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("database is not configured")
	}

	// Fetch permissions as rows instead of aggregating JSON. This keeps the
	// query compatible with the existing PostgreSQL schema and lets the HTTP
	// layer apply the session-specific assigned/group/unassigned visibility
	// rules before returning anyone to the caller.
	rows, err := r.pool.Query(ctx, `
SELECT DISTINCT u.id, u.email, u.full_name, u.profile_pic,
       COALESCE(u.is_online, FALSE), p.name
FROM users u
JOIN roles r ON r.id = u.role_id
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE u.organization_id = $1
  AND u.is_active = TRUE
  AND p.name = ANY($2::text[])
ORDER BY u.full_name NULLS LAST, u.email`, organizationID, []string{
		"view_all_chats", "manage_all_chats", "view_assigned_chats",
		"manage_assigned_chats", "view_unassigned_chats", "super_admin",
	})
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	byID := make(map[uuid.UUID]*Teammate)
	order := make([]uuid.UUID, 0)
	for rows.Next() {
		var (
			id                          uuid.UUID
			email, fullName, profilePic pgtype.Text
			isOnline                    bool
			permission                  string
		)
		if err := rows.Scan(&id, &email, &fullName, &profilePic, &isOnline, &permission); err != nil {
			return nil, err
		}
		item, ok := byID[id]
		if !ok {
			item = &Teammate{
				ID:          id,
				Email:       email.String,
				IsOnline:    isOnline,
				Permissions: make(map[string]struct{}),
				GroupIDs:    []uuid.UUID{},
			}
			if fullName.Valid {
				value := fullName.String
				item.FullName = &value
			}
			if profilePic.Valid {
				value := profilePic.String
				item.ProfilePic = &value
			}
			byID[id] = item
			order = append(order, id)
		}
		item.Permissions[permission] = struct{}{}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(order) == 0 {
		return []Teammate{}, nil
	}

	groupRows, err := r.pool.Query(ctx, `
SELECT user_id, group_id
FROM user_groups
WHERE user_id = ANY($1::uuid[])`, order)
	if err != nil {
		return nil, err
	}
	defer groupRows.Close()
	for groupRows.Next() {
		var userID, groupID uuid.UUID
		if err := groupRows.Scan(&userID, &groupID); err != nil {
			return nil, err
		}
		if item := byID[userID]; item != nil {
			item.GroupIDs = append(item.GroupIDs, groupID)
		}
	}
	if err := groupRows.Err(); err != nil {
		return nil, err
	}

	result := make([]Teammate, 0, len(order))
	for _, id := range order {
		result = append(result, *byID[id])
	}
	return result, nil
}

func uuidValue(value pgtype.UUID) *uuid.UUID {
	if !value.Valid {
		return nil
	}
	result := uuid.UUID(value.Bytes)
	return &result
}

func intValue(value pgtype.Int4) *int64 {
	if !value.Valid {
		return nil
	}
	result := int64(value.Int32)
	return &result
}

func timeValue(value pgtype.Timestamptz) *time.Time {
	if !value.Valid {
		return nil
	}
	result := value.Time
	return &result
}
