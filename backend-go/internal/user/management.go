package user

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var (
	ErrRoleNotFound          = errors.New("role not found")
	ErrPermissionNotFound    = errors.New("permission not found")
	ErrDefaultRoleExists     = errors.New("organization already has a default role")
	ErrDefaultRole           = errors.New("cannot modify default role")
	ErrRoleInUse             = errors.New("cannot delete role that is assigned to users")
	ErrUngrantablePermission = errors.New("cannot grant a permission the caller does not hold")
)

type UngrantablePermissionsError struct {
	Names []string
}

func (e *UngrantablePermissionsError) Error() string {
	return fmt.Sprintf("cannot grant a permission you do not hold: %s", strings.Join(e.Names, ", "))
}

func (e *UngrantablePermissionsError) Unwrap() error { return ErrUngrantablePermission }

type UserCreateInput struct {
	Email          string
	FullName       string
	HashedPassword string
	OrganizationID uuid.UUID
	RoleID         int64
	IsActive       bool
}

type UserUpdateInput struct {
	Email           *string
	FullName        *string
	HashedPassword  *string
	IsActive        *bool
	RoleID          *int64
	ProfilePic      *string
	ClearProfilePic bool
	IsOnline        *bool
	SetLastSeen     bool
}

type RoleCreateInput struct {
	Name           string
	Description    *string
	OrganizationID uuid.UUID
	IsDefault      bool
	PermissionIDs  []int64
}

type RoleUpdateInput struct {
	Name          *string
	Description   *string
	IsDefault     *bool
	PermissionIDs *[]int64
}

type GroupCreateInput struct {
	Name           string
	Description    *string
	OrganizationID uuid.UUID
}

type GroupUpdateInput struct {
	Name        *string
	Description *string
}

type TeamAgentStats struct {
	ID            uuid.UUID  `json:"id"`
	FullName      string     `json:"full_name"`
	Email         string     `json:"email"`
	ProfilePic    *string    `json:"profile_pic"`
	IsOnline      bool       `json:"is_online"`
	LastSeen      *time.Time `json:"last_seen"`
	IsActive      bool       `json:"is_active"`
	Role          *string    `json:"role"`
	IsAdmin       bool       `json:"is_admin"`
	Groups        []string   `json:"groups"`
	ActiveChats   int64      `json:"active_chats"`
	ResolvedChats int64      `json:"resolved_chats"`
	Capacity      int64      `json:"capacity"`
}

type TeamKPIs struct {
	TeamSize          int64 `json:"team_size"`
	Admins            int64 `json:"admins"`
	Agents            int64 `json:"agents"`
	OnlineNow         int64 `json:"online_now"`
	ActiveChats       int64 `json:"active_chats"`
	TotalCapacity     int64 `json:"total_capacity"`
	WaitingHandoff    int64 `json:"waiting_handoff"`
	OldestWaitMinutes int64 `json:"oldest_wait_minutes"`
}

type TeamOverview struct {
	KPIs   TeamKPIs         `json:"kpis"`
	Agents []TeamAgentStats `json:"agents"`
}

// These interfaces keep the authentication store small. Existing login fakes
// only need Store, while management routes require the richer contract.
type UserManagementStore interface {
	CreateUser(ctx context.Context, input UserCreateInput) (*User, error)
	ListUsers(ctx context.Context, organizationID uuid.UUID) ([]*User, error)
	GetUser(ctx context.Context, id uuid.UUID) (*User, error)
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	UpdateUser(ctx context.Context, id uuid.UUID, input UserUpdateInput) (*User, error)
	DeleteUser(ctx context.Context, id uuid.UUID) error
	ListUsersWithAnyPermission(ctx context.Context, organizationID uuid.UUID, permissions []string) ([]*User, error)
	TeamOverview(ctx context.Context, organizationID uuid.UUID) (*TeamOverview, error)
	RegisterFCMToken(ctx context.Context, userID uuid.UUID, token string) error
	RemoveFCMToken(ctx context.Context, userID uuid.UUID, token string) error
}

type RoleStore interface {
	CreateRole(ctx context.Context, input RoleCreateInput) (*Role, error)
	ListRoles(ctx context.Context, organizationID uuid.UUID) ([]*Role, error)
	GetRole(ctx context.Context, id int64) (*Role, error)
	UpdateRole(ctx context.Context, id int64, input RoleUpdateInput) (*Role, error)
	DeleteRole(ctx context.Context, id int64) error
	IsRoleInUse(ctx context.Context, id int64) (bool, error)
	GetDefaultRole(ctx context.Context, organizationID uuid.UUID) (*Role, error)
	GetPermissionsByIDs(ctx context.Context, ids []int64) ([]Permission, error)
	ListPermissions(ctx context.Context) ([]Permission, error)
	GetPermissionByName(ctx context.Context, name string) (*Permission, error)
	AddRolePermission(ctx context.Context, roleID int64, permissionID int64) error
	RemoveRolePermission(ctx context.Context, roleID int64, permissionID int64) error
	ResolveChatScope(ctx context.Context, current *User, base *Role, seeAllAI, seeAllOrg *bool) (*Role, error)
}

type GroupStore interface {
	ListGroups(ctx context.Context, organizationID uuid.UUID) ([]*Group, error)
	GetGroup(ctx context.Context, id uuid.UUID) (*Group, error)
	CreateGroup(ctx context.Context, input GroupCreateInput) (*Group, error)
	UpdateGroup(ctx context.Context, id uuid.UUID, input GroupUpdateInput) (*Group, error)
	DeleteGroup(ctx context.Context, id uuid.UUID) error
	AddUserToGroup(ctx context.Context, groupID, userID uuid.UUID) (bool, error)
	RemoveUserFromGroup(ctx context.Context, groupID, userID uuid.UUID) (bool, error)
}

const managedUserQuery = `
SELECT
    u.id, u.email, u.full_name, u.hashed_password, COALESCE(u.is_active, FALSE),
    u.profile_pic, COALESCE(u.is_online, FALSE), u.last_seen, u.organization_id,
    u.role_id, u.created_at, u.updated_at,
    r.id, r.name, r.description, r.organization_id, COALESCE(r.is_default, FALSE),
    r.created_at, r.updated_at,
    COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
            'id', p.id, 'name', p.name, 'description', p.description
        ) ORDER BY p.id)
        FROM role_permissions rp2 JOIN permissions p ON p.id = rp2.permission_id
        WHERE rp2.role_id = r.id
    ), '[]'::jsonb),
    COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
            'id', g.id::text, 'name', g.name, 'description', g.description,
            'organization_id', g.organization_id::text
        ) ORDER BY g.name)
        FROM user_groups ug2 JOIN groups g ON g.id = ug2.group_id
        WHERE ug2.user_id = u.id
    ), '[]'::jsonb)
FROM users u
LEFT JOIN roles r ON r.id = u.role_id
WHERE %s`

func (r *Repository) ensurePool() error {
	if r == nil || r.pool == nil {
		return errors.New("database is not configured")
	}
	return nil
}

func (r *Repository) listManagedUsers(ctx context.Context, predicate string, args ...any) ([]*User, error) {
	if err := r.ensurePool(); err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, fmt.Sprintf(managedUserQuery, predicate), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]*User, 0)
	for rows.Next() {
		found, err := scanManagedUser(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, found)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return result, nil
}

func scanManagedUser(row rowScanner) (*User, error) {
	var (
		found                                 User
		email, fullName, password, profilePic pgtype.Text
		lastSeen, createdAt, updatedAt        pgtype.Timestamptz
		organizationID                        pgtype.UUID
		roleID, roleDBID                      pgtype.Int4
		roleName, roleDescription             pgtype.Text
		roleOrganizationID                    pgtype.UUID
		roleDefault                           bool
		roleCreatedAt, roleUpdatedAt          pgtype.Timestamptz
		permissionsJSON, groupsJSON           []byte
	)
	if err := row.Scan(
		&found.ID, &email, &fullName, &password, &found.IsActive,
		&profilePic, &found.IsOnline, &lastSeen, &organizationID,
		&roleID, &createdAt, &updatedAt,
		&roleDBID, &roleName, &roleDescription, &roleOrganizationID, &roleDefault,
		&roleCreatedAt, &roleUpdatedAt, &permissionsJSON, &groupsJSON,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	found.Email = email.String
	found.FullName = fullName.String
	found.HashedPassword = password.String
	found.ProfilePic = profilePic.String
	found.OrganizationID = uuidValue(organizationID)
	found.RoleID = intValue(roleID)
	found.LastSeen = timeValue(lastSeen)
	found.CreatedAt = timeValue(createdAt)
	found.UpdatedAt = timeValue(updatedAt)
	if roleDBID.Valid {
		found.Role = &Role{
			ID:             int64(roleDBID.Int32),
			Name:           roleName.String,
			Description:    roleDescription.String,
			OrganizationID: uuidValue(roleOrganizationID),
			IsDefault:      roleDefault,
			CreatedAt:      timeValue(roleCreatedAt),
			UpdatedAt:      timeValue(roleUpdatedAt),
			Permissions:    []Permission{},
		}
		if len(permissionsJSON) > 0 {
			if err := json.Unmarshal(permissionsJSON, &found.Role.Permissions); err != nil {
				return nil, err
			}
		}
	}
	found.Groups = []Group{}
	if len(groupsJSON) > 0 {
		if err := json.Unmarshal(groupsJSON, &found.Groups); err != nil {
			return nil, err
		}
	}
	return &found, nil
}

func (r *Repository) CreateUser(ctx context.Context, input UserCreateInput) (*User, error) {
	if err := r.ensurePool(); err != nil {
		return nil, err
	}
	var id uuid.UUID
	err := r.pool.QueryRow(ctx, `
INSERT INTO users (id, email, full_name, hashed_password, organization_id, role_id, is_active, is_online, last_seen)
VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, NOW())
RETURNING id`, uuid.New(), input.Email, input.FullName, input.HashedPassword,
		input.OrganizationID, input.RoleID, input.IsActive).Scan(&id)
	if err != nil {
		return nil, err
	}
	return r.GetUser(ctx, id)
}

func (r *Repository) ListUsers(ctx context.Context, organizationID uuid.UUID) ([]*User, error) {
	return r.listManagedUsers(ctx, "u.organization_id = $1 ORDER BY u.created_at DESC", organizationID)
}

func (r *Repository) GetUser(ctx context.Context, id uuid.UUID) (*User, error) {
	users, err := r.listManagedUsers(ctx, "u.id = $1", id)
	if err != nil {
		return nil, err
	}
	if len(users) == 0 {
		return nil, nil
	}
	return users[0], nil
}

func (r *Repository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	users, err := r.listManagedUsers(ctx, "u.email = $1", email)
	if err != nil {
		return nil, err
	}
	if len(users) == 0 {
		return nil, nil
	}
	return users[0], nil
}

func (r *Repository) UpdateUser(ctx context.Context, id uuid.UUID, input UserUpdateInput) (*User, error) {
	if err := r.ensurePool(); err != nil {
		return nil, err
	}
	sets := make([]string, 0, 8)
	args := make([]any, 0, 8)
	add := func(column string, value any) {
		args = append(args, value)
		sets = append(sets, column+" = $"+strconv.Itoa(len(args)))
	}
	if input.Email != nil {
		add("email", *input.Email)
	}
	if input.FullName != nil {
		add("full_name", *input.FullName)
	}
	if input.HashedPassword != nil {
		add("hashed_password", *input.HashedPassword)
	}
	if input.IsActive != nil {
		add("is_active", *input.IsActive)
	}
	if input.RoleID != nil {
		add("role_id", *input.RoleID)
	}
	if input.ClearProfilePic {
		sets = append(sets, "profile_pic = NULL")
	} else if input.ProfilePic != nil {
		add("profile_pic", *input.ProfilePic)
	}
	if input.IsOnline != nil {
		add("is_online", *input.IsOnline)
	}
	if input.SetLastSeen {
		sets = append(sets, "last_seen = NOW()")
	}
	if len(sets) == 0 {
		return r.GetUser(ctx, id)
	}
	sets = append(sets, "updated_at = NOW()")
	args = append(args, id)
	_, err := r.pool.Exec(ctx, "UPDATE users SET "+strings.Join(sets, ", ")+" WHERE id = $"+strconv.Itoa(len(args)), args...)
	if err != nil {
		return nil, err
	}
	return r.GetUser(ctx, id)
}

func (r *Repository) DeleteUser(ctx context.Context, id uuid.UUID) error {
	if err := r.ensurePool(); err != nil {
		return err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `DELETE FROM user_groups WHERE user_id = $1`, id); err != nil {
		return err
	}
	result, err := tx.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return tx.Commit(ctx)
}

func (r *Repository) ListUsersWithAnyPermission(ctx context.Context, organizationID uuid.UUID, permissions []string) ([]*User, error) {
	if len(permissions) == 0 {
		return []*User{}, nil
	}
	return r.listManagedUsers(ctx, `
u.organization_id = $1 AND u.is_active = TRUE AND EXISTS (
    SELECT 1 FROM role_permissions rp3
    JOIN permissions p3 ON p3.id = rp3.permission_id
    WHERE rp3.role_id = u.role_id AND p3.name = ANY($2::text[])
)
ORDER BY u.full_name NULLS LAST, u.email`, organizationID, permissions)
}

func (r *Repository) TeamOverview(ctx context.Context, organizationID uuid.UUID) (*TeamOverview, error) {
	users, err := r.ListUsers(ctx, organizationID)
	if err != nil {
		return nil, err
	}
	if err := r.ensurePool(); err != nil {
		return nil, err
	}
	type counts struct{ active, resolved int64 }
	perUser := make(map[uuid.UUID]counts)
	rows, err := r.pool.Query(ctx, `
SELECT user_id,
       COUNT(*) FILTER (WHERE status::text = 'OPEN') AS active_count,
       COUNT(*) FILTER (WHERE status::text = 'CLOSED') AS resolved_count
FROM session_to_agents
WHERE organization_id = $1 AND user_id IS NOT NULL
GROUP BY user_id`, organizationID)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var id uuid.UUID
		var value counts
		if err := rows.Scan(&id, &value.active, &value.resolved); err != nil {
			rows.Close()
			return nil, err
		}
		perUser[id] = value
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return nil, err
	}
	rows.Close()
	var waiting int64
	var oldest pgtype.Timestamptz
	if err := r.pool.QueryRow(ctx, `
SELECT COUNT(*), MIN(assigned_at)
FROM session_to_agents
WHERE organization_id = $1 AND status::text = 'TRANSFERRED' AND user_id IS NULL`, organizationID).
		Scan(&waiting, &oldest); err != nil {
		return nil, err
	}
	oldestMinutes := int64(0)
	if oldest.Valid {
		minutes := int64(time.Since(oldest.Time).Seconds() / 60)
		if minutes > 0 {
			oldestMinutes = minutes
		}
	}
	result := &TeamOverview{Agents: make([]TeamAgentStats, 0, len(users))}
	for _, found := range users {
		roleName := (*string)(nil)
		isAdmin := false
		if found.Role != nil {
			roleName = &found.Role.Name
			isAdmin = found.Role.Name == "Admin"
			for _, permission := range found.Role.Permissions {
				if permission.Name == "manage_organization" || permission.Name == "super_admin" {
					isAdmin = true
				}
			}
		}
		groups := make([]string, 0, len(found.Groups))
		for _, group := range found.Groups {
			groups = append(groups, group.Name)
		}
		value := perUser[found.ID]
		profilePic := (*string)(nil)
		if found.ProfilePic != "" {
			value := found.ProfilePic
			profilePic = &value
		}
		result.Agents = append(result.Agents, TeamAgentStats{
			ID: found.ID, FullName: found.FullName, Email: found.Email,
			ProfilePic: profilePic, IsOnline: found.IsOnline, LastSeen: found.LastSeen,
			IsActive: found.IsActive, Role: roleName, IsAdmin: isAdmin, Groups: groups,
			ActiveChats: value.active, ResolvedChats: value.resolved, Capacity: 5,
		})
	}
	for _, agent := range result.Agents {
		result.KPIs.TeamSize++
		result.KPIs.TotalCapacity += agent.Capacity
		result.KPIs.ActiveChats += agent.ActiveChats
		if agent.IsAdmin {
			result.KPIs.Admins++
		}
		if agent.IsOnline {
			result.KPIs.OnlineNow++
		}
	}
	result.KPIs.Agents = result.KPIs.TeamSize - result.KPIs.Admins
	result.KPIs.WaitingHandoff = waiting
	result.KPIs.OldestWaitMinutes = oldestMinutes
	return result, nil
}

func (r *Repository) RegisterFCMToken(ctx context.Context, userID uuid.UUID, token string) error {
	if err := r.ensurePool(); err != nil {
		return err
	}
	_, err := r.pool.Exec(ctx, `
INSERT INTO fcm_tokens (id, user_id, token)
VALUES ($1, $2, $3)
ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, updated_at = NOW()`, uuid.New(), userID, token)
	return err
}

func (r *Repository) RemoveFCMToken(ctx context.Context, userID uuid.UUID, token string) error {
	if err := r.ensurePool(); err != nil {
		return err
	}
	_, err := r.pool.Exec(ctx, `DELETE FROM fcm_tokens WHERE user_id = $1 AND token = $2`, userID, token)
	return err
}

const roleQuery = `
SELECT r.id, r.name, r.description, r.organization_id, COALESCE(r.is_default, FALSE),
       r.created_at, r.updated_at,
       COALESCE((
           SELECT jsonb_agg(jsonb_build_object(
               'id', p.id, 'name', p.name, 'description', p.description
           ) ORDER BY p.id)
           FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id
           WHERE rp.role_id = r.id
       ), '[]'::jsonb)
FROM roles r
WHERE %s`

func (r *Repository) listRoles(ctx context.Context, predicate string, args ...any) ([]*Role, error) {
	if err := r.ensurePool(); err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, fmt.Sprintf(roleQuery, predicate), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]*Role, 0)
	for rows.Next() {
		role, err := scanRole(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, role)
	}
	return result, rows.Err()
}

func scanRole(row rowScanner) (*Role, error) {
	var (
		role                 Role
		description          pgtype.Text
		organizationID       pgtype.UUID
		id                   pgtype.Int4
		createdAt, updatedAt pgtype.Timestamptz
		permissionsJSON      []byte
	)
	if err := row.Scan(&id, &role.Name, &description, &organizationID, &role.IsDefault,
		&createdAt, &updatedAt, &permissionsJSON); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	role.ID = int64(id.Int32)
	role.Description = description.String
	role.OrganizationID = uuidValue(organizationID)
	role.CreatedAt = timeValue(createdAt)
	role.UpdatedAt = timeValue(updatedAt)
	role.Permissions = []Permission{}
	if len(permissionsJSON) > 0 {
		if err := json.Unmarshal(permissionsJSON, &role.Permissions); err != nil {
			return nil, err
		}
	}
	return &role, nil
}

func (r *Repository) CreateRole(ctx context.Context, input RoleCreateInput) (*Role, error) {
	if err := r.ensurePool(); err != nil {
		return nil, err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	var id int64
	if err := tx.QueryRow(ctx, `
INSERT INTO roles (name, description, organization_id, is_default)
VALUES ($1, $2, $3, $4) RETURNING id`, input.Name, input.Description, input.OrganizationID, input.IsDefault).Scan(&id); err != nil {
		return nil, err
	}
	if err := insertRolePermissions(ctx, tx, id, input.PermissionIDs); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.GetRole(ctx, id)
}

func insertRolePermissions(ctx context.Context, tx pgx.Tx, roleID int64, permissionIDs []int64) error {
	for _, permissionID := range permissionIDs {
		if _, err := tx.Exec(ctx, `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`, roleID, permissionID); err != nil {
			return err
		}
	}
	return nil
}

func (r *Repository) ListRoles(ctx context.Context, organizationID uuid.UUID) ([]*Role, error) {
	return r.listRoles(ctx, "r.organization_id = $1 ORDER BY r.name", organizationID)
}

func (r *Repository) GetRole(ctx context.Context, id int64) (*Role, error) {
	roles, err := r.listRoles(ctx, "r.id = $1", id)
	if err != nil {
		return nil, err
	}
	if len(roles) == 0 {
		return nil, nil
	}
	return roles[0], nil
}

func (r *Repository) UpdateRole(ctx context.Context, id int64, input RoleUpdateInput) (*Role, error) {
	if err := r.ensurePool(); err != nil {
		return nil, err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	sets := make([]string, 0, 3)
	args := make([]any, 0, 3)
	if input.Name != nil {
		args = append(args, *input.Name)
		sets = append(sets, "name = $"+strconv.Itoa(len(args)))
	}
	if input.Description != nil {
		args = append(args, *input.Description)
		sets = append(sets, "description = $"+strconv.Itoa(len(args)))
	}
	if input.IsDefault != nil {
		args = append(args, *input.IsDefault)
		sets = append(sets, "is_default = $"+strconv.Itoa(len(args)))
	}
	if len(sets) > 0 {
		sets = append(sets, "updated_at = NOW()")
		args = append(args, id)
		if _, err := tx.Exec(ctx, "UPDATE roles SET "+strings.Join(sets, ", ")+" WHERE id = $"+strconv.Itoa(len(args)), args...); err != nil {
			return nil, err
		}
	}
	if input.PermissionIDs != nil {
		if _, err := tx.Exec(ctx, `DELETE FROM role_permissions WHERE role_id = $1`, id); err != nil {
			return nil, err
		}
		if err := insertRolePermissions(ctx, tx, id, *input.PermissionIDs); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.GetRole(ctx, id)
}

func (r *Repository) DeleteRole(ctx context.Context, id int64) error {
	if err := r.ensurePool(); err != nil {
		return err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `DELETE FROM role_permissions WHERE role_id = $1`, id); err != nil {
		return err
	}
	result, err := tx.Exec(ctx, `DELETE FROM roles WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return tx.Commit(ctx)
}

func (r *Repository) IsRoleInUse(ctx context.Context, id int64) (bool, error) {
	if err := r.ensurePool(); err != nil {
		return false, err
	}
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM users WHERE role_id = $1)`, id).Scan(&exists)
	return exists, err
}

func (r *Repository) GetDefaultRole(ctx context.Context, organizationID uuid.UUID) (*Role, error) {
	roles, err := r.listRoles(ctx, "r.organization_id = $1 AND r.is_default = TRUE LIMIT 1", organizationID)
	if err != nil {
		return nil, err
	}
	if len(roles) == 0 {
		return nil, nil
	}
	return roles[0], nil
}

func (r *Repository) GetPermissionsByIDs(ctx context.Context, ids []int64) ([]Permission, error) {
	if err := r.ensurePool(); err != nil {
		return nil, err
	}
	if len(ids) == 0 {
		return []Permission{}, nil
	}
	intIDs := make([]int32, len(ids))
	for i, id := range ids {
		intIDs[i] = int32(id)
	}
	rows, err := r.pool.Query(ctx, `SELECT id, name, description FROM permissions WHERE id = ANY($1::int4[]) ORDER BY id`, intIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	permissions := make([]Permission, 0, len(ids))
	for rows.Next() {
		var permission Permission
		var description pgtype.Text
		if err := rows.Scan(&permission.ID, &permission.Name, &description); err != nil {
			return nil, err
		}
		permission.Description = description.String
		permissions = append(permissions, permission)
	}
	return permissions, rows.Err()
}

func (r *Repository) ListPermissions(ctx context.Context) ([]Permission, error) {
	if err := r.ensurePool(); err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, `SELECT id, name, description FROM permissions ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]Permission, 0)
	for rows.Next() {
		var permission Permission
		var description pgtype.Text
		if err := rows.Scan(&permission.ID, &permission.Name, &description); err != nil {
			return nil, err
		}
		permission.Description = description.String
		result = append(result, permission)
	}
	return result, rows.Err()
}

func (r *Repository) GetPermissionByName(ctx context.Context, name string) (*Permission, error) {
	if err := r.ensurePool(); err != nil {
		return nil, err
	}
	var permission Permission
	var description pgtype.Text
	err := r.pool.QueryRow(ctx, `SELECT id, name, description FROM permissions WHERE name = $1`, name).
		Scan(&permission.ID, &permission.Name, &description)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	permission.Description = description.String
	return &permission, nil
}

func (r *Repository) AddRolePermission(ctx context.Context, roleID int64, permissionID int64) error {
	if err := r.ensurePool(); err != nil {
		return err
	}
	_, err := r.pool.Exec(ctx, `
INSERT INTO role_permissions (role_id, permission_id)
SELECT $1, $2
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = $1 AND permission_id = $2)`, roleID, permissionID)
	return err
}

func (r *Repository) RemoveRolePermission(ctx context.Context, roleID int64, permissionID int64) error {
	if err := r.ensurePool(); err != nil {
		return err
	}
	_, err := r.pool.Exec(ctx, `DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2`, roleID, permissionID)
	return err
}

func roleHasPermission(role *Role, name string) bool {
	if role == nil {
		return false
	}
	for _, permission := range role.Permissions {
		if permission.Name == name {
			return true
		}
	}
	return false
}

func (r *Repository) ResolveChatScope(ctx context.Context, current *User, base *Role, seeAllAI, seeAllOrg *bool) (*Role, error) {
	if base == nil || base.OrganizationID == nil {
		return base, nil
	}
	currentAI := roleHasPermission(base, "view_unassigned_chats")
	currentOrg := roleHasPermission(base, "view_all_chats")
	wantedAI, wantedOrg := currentAI, currentOrg
	if seeAllAI != nil {
		wantedAI = *seeAllAI
	}
	if seeAllOrg != nil {
		wantedOrg = *seeAllOrg
	}
	if wantedAI == currentAI && wantedOrg == currentOrg || roleHasPermission(base, "super_admin") {
		return base, nil
	}
	desired := make(map[string]struct{}, len(base.Permissions)+2)
	for _, permission := range base.Permissions {
		desired[permission.Name] = struct{}{}
	}
	if wantedAI {
		desired["view_unassigned_chats"] = struct{}{}
	} else {
		delete(desired, "view_unassigned_chats")
	}
	if wantedOrg {
		desired["view_all_chats"] = struct{}{}
	} else {
		delete(desired, "view_all_chats")
	}
	missing := make([]string, 0)
	for permission := range desired {
		if !roleHasPermission(current.Role, permission) {
			missing = append(missing, permission)
		}
	}
	if roleHasPermission(current.Role, "super_admin") {
		missing = nil
	}
	if len(missing) > 0 {
		sort.Strings(missing)
		return nil, &UngrantablePermissionsError{Names: missing}
	}
	roles, err := r.ListRoles(ctx, *base.OrganizationID)
	if err != nil {
		return nil, err
	}
	for _, candidate := range roles {
		candidateNames := make(map[string]struct{}, len(candidate.Permissions))
		for _, permission := range candidate.Permissions {
			candidateNames[permission.Name] = struct{}{}
		}
		if equalStringSet(candidateNames, desired) {
			return candidate, nil
		}
	}
	names := make([]string, 0, len(desired))
	for name := range desired {
		names = append(names, name)
	}
	sort.Strings(names)
	permissions, err := r.permissionsByNames(ctx, names)
	if err != nil {
		return nil, err
	}
	if len(permissions) != len(names) {
		return nil, ErrPermissionNotFound
	}
	taken := make(map[string]struct{}, len(roles))
	for _, candidate := range roles {
		taken[candidate.Name] = struct{}{}
	}
	label := chatScopeLabel(wantedAI, wantedOrg)
	baseName := unscopedRoleName(base.Name)
	preferred := fmt.Sprintf("%s (%s)", baseName, label)
	name := preferred
	for suffix := 2; ; suffix++ {
		if _, exists := taken[name]; !exists {
			break
		}
		name = preferred + " " + strconv.Itoa(suffix)
	}
	permissionIDs := make([]int64, 0, len(permissions))
	for _, permission := range permissions {
		permissionIDs = append(permissionIDs, permission.ID)
	}
	description := fmt.Sprintf("%s, scoped to %s", baseName, label)
	return r.CreateRole(ctx, RoleCreateInput{
		Name: name, Description: &description, OrganizationID: *base.OrganizationID,
		IsDefault: false, PermissionIDs: permissionIDs,
	})
}

func equalStringSet(left, right map[string]struct{}) bool {
	if len(left) != len(right) {
		return false
	}
	for name := range left {
		if _, ok := right[name]; !ok {
			return false
		}
	}
	return true
}

func (r *Repository) permissionsByNames(ctx context.Context, names []string) ([]Permission, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, name, description FROM permissions WHERE name = ANY($1::text[]) ORDER BY id`, names)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]Permission, 0, len(names))
	for rows.Next() {
		var permission Permission
		var description pgtype.Text
		if err := rows.Scan(&permission.ID, &permission.Name, &description); err != nil {
			return nil, err
		}
		permission.Description = description.String
		result = append(result, permission)
	}
	return result, rows.Err()
}

func chatScopeLabel(seeAllAI, seeAllOrg bool) string {
	switch {
	case seeAllAI && seeAllOrg:
		return "all chats"
	case seeAllOrg:
		return "all chats, no AI queue"
	case seeAllAI:
		return "assigned + AI queue"
	default:
		return "assigned only"
	}
}

func unscopedRoleName(name string) string {
	labels := []string{"all chats", "all chats, no AI queue", "assigned + AI queue", "assigned only"}
	for _, label := range labels {
		for suffix := 1; suffix < 1000; suffix++ {
			candidate := " (" + label + ")"
			if suffix > 1 {
				candidate += " " + strconv.Itoa(suffix)
			}
			if strings.HasSuffix(name, candidate) {
				return strings.TrimSuffix(name, candidate)
			}
			if suffix > 1 {
				break
			}
		}
	}
	return name
}

func scanGroup(row rowScanner) (*Group, error) {
	var (
		group          Group
		description    pgtype.Text
		organizationID uuid.UUID
	)
	if err := row.Scan(&group.ID, &group.Name, &description, &organizationID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	group.OrganizationID = organizationID
	if description.Valid {
		value := description.String
		group.Description = &value
	}
	group.Users = []User{}
	return &group, nil
}

func (r *Repository) listGroups(ctx context.Context, predicate string, args ...any) ([]*Group, error) {
	if err := r.ensurePool(); err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, `SELECT id, name, description, organization_id FROM groups WHERE `+predicate, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	groups := make([]*Group, 0)
	for rows.Next() {
		group, err := scanGroup(rows)
		if err != nil {
			return nil, err
		}
		groups = append(groups, group)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	for _, group := range groups {
		members, err := r.listManagedUsers(ctx, `EXISTS (SELECT 1 FROM user_groups ug3 WHERE ug3.user_id = u.id AND ug3.group_id = $1) ORDER BY u.created_at DESC`, group.ID)
		if err != nil {
			return nil, err
		}
		group.Users = make([]User, 0, len(members))
		for _, member := range members {
			group.Users = append(group.Users, *member)
		}
	}
	return groups, nil
}

func (r *Repository) ListGroups(ctx context.Context, organizationID uuid.UUID) ([]*Group, error) {
	return r.listGroups(ctx, "organization_id = $1 ORDER BY name", organizationID)
}

func (r *Repository) GetGroup(ctx context.Context, id uuid.UUID) (*Group, error) {
	groups, err := r.listGroups(ctx, "id = $1", id)
	if err != nil {
		return nil, err
	}
	if len(groups) == 0 {
		return nil, nil
	}
	return groups[0], nil
}

func (r *Repository) CreateGroup(ctx context.Context, input GroupCreateInput) (*Group, error) {
	if err := r.ensurePool(); err != nil {
		return nil, err
	}
	id := uuid.New()
	if err := r.pool.QueryRow(ctx, `
INSERT INTO groups (id, name, description, organization_id)
VALUES ($1, $2, $3, $4) RETURNING id`, id, input.Name, input.Description, input.OrganizationID).Scan(&id); err != nil {
		return nil, err
	}
	return r.GetGroup(ctx, id)
}

func (r *Repository) UpdateGroup(ctx context.Context, id uuid.UUID, input GroupUpdateInput) (*Group, error) {
	if err := r.ensurePool(); err != nil {
		return nil, err
	}
	sets := make([]string, 0, 2)
	args := make([]any, 0, 2)
	if input.Name != nil {
		args = append(args, *input.Name)
		sets = append(sets, "name = $"+strconv.Itoa(len(args)))
	}
	if input.Description != nil {
		args = append(args, *input.Description)
		sets = append(sets, "description = $"+strconv.Itoa(len(args)))
	}
	if len(sets) > 0 {
		sets = append(sets, "updated_at = NOW()")
		args = append(args, id)
		if _, err := r.pool.Exec(ctx, "UPDATE groups SET "+strings.Join(sets, ", ")+" WHERE id = $"+strconv.Itoa(len(args)), args...); err != nil {
			return nil, err
		}
	}
	return r.GetGroup(ctx, id)
}

func (r *Repository) DeleteGroup(ctx context.Context, id uuid.UUID) error {
	if err := r.ensurePool(); err != nil {
		return err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `DELETE FROM user_groups WHERE group_id = $1`, id); err != nil {
		return err
	}
	result, err := tx.Exec(ctx, `DELETE FROM groups WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return tx.Commit(ctx)
}

func (r *Repository) AddUserToGroup(ctx context.Context, groupID, userID uuid.UUID) (bool, error) {
	if err := r.ensurePool(); err != nil {
		return false, err
	}
	var valid bool
	if err := r.pool.QueryRow(ctx, `
SELECT EXISTS (
    SELECT 1 FROM groups g JOIN users u ON u.organization_id = g.organization_id
    WHERE g.id = $1 AND u.id = $2
)`, groupID, userID).Scan(&valid); err != nil {
		return false, err
	}
	if !valid {
		return false, nil
	}
	_, err := r.pool.Exec(ctx, `INSERT INTO user_groups (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, groupID, userID)
	return err == nil, err
}

func (r *Repository) RemoveUserFromGroup(ctx context.Context, groupID, userID uuid.UUID) (bool, error) {
	if err := r.ensurePool(); err != nil {
		return false, err
	}
	var valid bool
	if err := r.pool.QueryRow(ctx, `
SELECT EXISTS (
    SELECT 1 FROM groups g JOIN users u ON u.organization_id = g.organization_id
    WHERE g.id = $1 AND u.id = $2
)`, groupID, userID).Scan(&valid); err != nil {
		return false, err
	}
	if !valid {
		return false, nil
	}
	_, err := r.pool.Exec(ctx, `DELETE FROM user_groups WHERE group_id = $1 AND user_id = $2`, groupID, userID)
	return err == nil, err
}
