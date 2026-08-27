package integration

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/chattermate/chattermate/backend-go/internal/auth"
	"github.com/chattermate/chattermate/backend-go/internal/user"
)

func TestUserRoleGroupManagementAgainstPostgres(t *testing.T) {
	pool, ctx := openIntegrationPool(t)
	orgID := uuid.New()
	foreignOrgID := uuid.New()
	adminID := uuid.New()
	memberID := uuid.New()
	adminRoleName := "go-management-admin-" + uuid.NewString()
	memberRoleName := "go-management-member-" + uuid.NewString()
	groupName := "go-management-group-" + uuid.NewString()
	adminEmail := "go-management-admin-" + uuid.NewString() + "@example.invalid"
	memberEmail := "go-management-member-" + uuid.NewString() + "@example.invalid"
	// Remove only fixtures from an interrupted prior run. All generated values
	// use this test-specific prefix, so this cannot touch application data.
	for _, statement := range []string{
		`DELETE FROM fcm_tokens WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'go-management-%')`,
		`DELETE FROM user_groups WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'go-management-%') OR group_id IN (SELECT id FROM groups WHERE organization_id IN (SELECT id FROM organizations WHERE domain LIKE 'go-management-%'))`,
		`DELETE FROM users WHERE email LIKE 'go-management-%'`,
		`DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE organization_id IN (SELECT id FROM organizations WHERE domain LIKE 'go-management-%'))`,
		`DELETE FROM roles WHERE organization_id IN (SELECT id FROM organizations WHERE domain LIKE 'go-management-%')`,
		`DELETE FROM groups WHERE organization_id IN (SELECT id FROM organizations WHERE domain LIKE 'go-management-%')`,
		`DELETE FROM organizations WHERE domain LIKE 'go-management-%'`,
	} {
		if _, err := pool.Exec(ctx, statement); err != nil {
			t.Fatalf("remove stale fixture %q: %v", statement, err)
		}
	}

	cleanupCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cleanup := func() {
		cleanupStatements := []struct {
			query string
			args  []any
		}{
			{`DELETE FROM fcm_tokens WHERE user_id IN ($1, $2)`, []any{adminID, memberID}},
			{`DELETE FROM user_groups WHERE user_id IN ($1, $2)`, []any{adminID, memberID}},
			{`DELETE FROM users WHERE id IN ($1, $2)`, []any{adminID, memberID}},
			{`DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE name IN ($1, $2))`, []any{adminRoleName, memberRoleName}},
			{`DELETE FROM roles WHERE name IN ($1, $2)`, []any{adminRoleName, memberRoleName}},
			{`DELETE FROM groups WHERE name = $1`, []any{groupName}},
			{`DELETE FROM organizations WHERE id IN ($1, $2)`, []any{orgID, foreignOrgID}},
		}
		for _, statement := range cleanupStatements {
			if _, err := pool.Exec(cleanupCtx, statement.query, statement.args...); err != nil {
				t.Logf("cleanup %q: %v", statement.query, err)
			}
		}
	}
	defer cleanup()

	for _, organization := range []struct {
		id     uuid.UUID
		name   string
		domain string
	}{
		{orgID, "Go Management Organization", "go-management-" + uuid.NewString() + ".invalid"},
		{foreignOrgID, "Go Foreign Organization", "go-management-foreign-" + uuid.NewString() + ".invalid"},
	} {
		_, err := pool.Exec(ctx, `
INSERT INTO organizations (id, name, domain, timezone, business_hours, settings, is_active)
VALUES ($1, $2, $3, 'UTC', $4, $5, TRUE)`, organization.id, organization.name, organization.domain,
			[]byte(`{"monday":{"start":"09:00","end":"17:00","enabled":true}}`), []byte(`{}`))
		if err != nil {
			t.Fatal("insert organization:", err)
		}
	}

	permissionIDs := make(map[string]int64)
	rows, err := pool.Query(ctx, `SELECT id, name FROM permissions WHERE name = ANY($1::text[])`, []string{"super_admin", "manage_users", "manage_roles", "view_assigned_chats", "view_unassigned_chats", "view_all_chats"})
	if err != nil {
		t.Fatal("load permissions:", err)
	}
	for rows.Next() {
		var id int64
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			rows.Close()
			t.Fatal("scan permission:", err)
		}
		permissionIDs[name] = id
	}
	rows.Close()
	for _, name := range []string{"super_admin", "manage_users", "manage_roles", "view_assigned_chats", "view_unassigned_chats", "view_all_chats"} {
		if permissionIDs[name] == 0 {
			t.Skipf("permission %q is not seeded in this database", name)
		}
	}

	var adminRoleID, memberRoleID int64
	if err := pool.QueryRow(ctx, `INSERT INTO roles (name, description, organization_id, is_default) VALUES ($1, 'admin', $2, FALSE) RETURNING id`, adminRoleName, orgID).Scan(&adminRoleID); err != nil {
		t.Fatal("insert admin role:", err)
	}
	if err := pool.QueryRow(ctx, `INSERT INTO roles (name, description, organization_id, is_default) VALUES ($1, 'member', $2, TRUE) RETURNING id`, memberRoleName, orgID).Scan(&memberRoleID); err != nil {
		t.Fatal("insert member role:", err)
	}
	for _, rolePermission := range []struct {
		roleID int64
		name   string
	}{
		{adminRoleID, "super_admin"},
		{adminRoleID, "manage_users"},
		{adminRoleID, "manage_roles"},
		{memberRoleID, "view_assigned_chats"},
	} {
		if _, err := pool.Exec(ctx, `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`, rolePermission.roleID, permissionIDs[rolePermission.name]); err != nil {
			t.Fatal("insert role permission:", err)
		}
	}

	hashed, err := auth.HashPassword("Good-pass1")
	if err != nil {
		t.Fatal("hash password:", err)
	}
	for _, account := range []struct {
		id     uuid.UUID
		email  string
		roleID int64
		orgID  uuid.UUID
	}{
		{adminID, adminEmail, adminRoleID, orgID},
		{memberID, memberEmail, memberRoleID, orgID},
	} {
		if _, err := pool.Exec(ctx, `
INSERT INTO users (id, email, full_name, hashed_password, organization_id, role_id, is_active, is_online)
VALUES ($1, $2, $3, $4, $5, $6, TRUE, FALSE)`, account.id, account.email, "Management User", hashed, account.orgID, account.roleID); err != nil {
			t.Fatal("insert user:", err)
		}
	}

	repo := user.NewRepository(pool)
	admin, err := repo.GetUser(ctx, adminID)
	if err != nil || admin == nil || admin.Role == nil || !hasPermission(admin.Role, "super_admin") {
		t.Fatalf("loaded admin=%#v err=%v", admin, err)
	}
	users, err := repo.ListUsers(ctx, orgID)
	if err != nil || len(users) != 2 {
		t.Fatalf("users=%#v err=%v", users, err)
	}

	created, err := repo.CreateGroup(ctx, user.GroupCreateInput{Name: groupName, OrganizationID: orgID})
	if err != nil || created == nil {
		t.Fatalf("create group=%#v err=%v", created, err)
	}
	added, err := repo.AddUserToGroup(ctx, created.ID, memberID)
	if err != nil || !added {
		t.Fatalf("add member added=%t err=%v", added, err)
	}
	foreignAdded, err := repo.AddUserToGroup(ctx, created.ID, uuid.New())
	if err != nil || foreignAdded {
		t.Fatalf("foreign member added=%t err=%v", foreignAdded, err)
	}
	loadedGroup, err := repo.GetGroup(ctx, created.ID)
	if err != nil || loadedGroup == nil || len(loadedGroup.Users) != 1 || loadedGroup.Users[0].ID != memberID {
		t.Fatalf("loaded group=%#v err=%v", loadedGroup, err)
	}

	updated, err := repo.UpdateUser(ctx, memberID, user.UserUpdateInput{FullName: stringPtr("Renamed Member")})
	if err != nil || updated == nil || updated.FullName != "Renamed Member" {
		t.Fatalf("updated user=%#v err=%v", updated, err)
	}
	overview, err := repo.TeamOverview(ctx, orgID)
	if err != nil || overview == nil || overview.KPIs.TeamSize != 2 || overview.KPIs.TotalCapacity != 10 {
		t.Fatalf("overview=%#v err=%v", overview, err)
	}

	if err := repo.RegisterFCMToken(ctx, adminID, "go-management-token-"+uuid.NewString()); err != nil {
		if strings.Contains(err.Error(), "fcm_tokens") {
			t.Skipf("fcm_tokens migration is not present: %v", err)
		}
		t.Fatal("register FCM token:", err)
	}

	baseRole, err := repo.GetRole(ctx, memberRoleID)
	if err != nil || baseRole == nil {
		t.Fatalf("get base role=%#v err=%v", baseRole, err)
	}
	derived, err := repo.ResolveChatScope(ctx, admin, baseRole, boolPtr(true), boolPtr(false))
	if err != nil || derived == nil || !hasPermission(derived, "view_unassigned_chats") {
		t.Fatalf("derived role=%#v err=%v", derived, err)
	}

	if err := repo.DeleteGroup(ctx, created.ID); err != nil {
		t.Fatal("delete group:", err)
	}
	if err := repo.DeleteUser(ctx, memberID); err != nil {
		t.Fatal("delete user:", err)
	}
	if derived.ID != memberRoleID {
		if err := repo.DeleteRole(ctx, derived.ID); err != nil {
			t.Fatal("delete derived role:", err)
		}
	}
	if deleted, err := repo.GetUser(ctx, memberID); err != nil || deleted != nil {
		t.Fatalf("get deleted user=%#v err=%v", deleted, err)
	}
}

func hasPermission(role *user.Role, name string) bool {
	for _, permission := range role.Permissions {
		if permission.Name == name {
			return true
		}
	}
	return false
}

func stringPtr(value string) *string { return &value }
func boolPtr(value bool) *bool       { return &value }
