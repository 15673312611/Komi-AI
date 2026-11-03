package integration

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/komi/komi/backend-go/internal/organization"
)

func TestRegistrationCreatesAnIndependentAdminOrganization(t *testing.T) {
	pool, ctx := openIntegrationPool(t)
	repo := organization.NewRepository(pool)
	suffix := uuid.NewString()
	firstEmail := "go-saas-first-" + suffix + "@example.invalid"
	secondEmail := "go-saas-second-" + suffix + "@example.invalid"
	firstName := "Go SaaS First " + suffix
	secondName := "Go SaaS Second " + suffix
	var organizationIDs []uuid.UUID

	cleanup := func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if len(organizationIDs) == 0 {
			return
		}
		for _, statement := range []string{
			`DELETE FROM users WHERE organization_id = ANY($1)`,
			`DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE organization_id = ANY($1))`,
			`DELETE FROM roles WHERE organization_id = ANY($1)`,
			`DELETE FROM organizations WHERE id = ANY($1)`,
		} {
			if _, err := pool.Exec(cleanupCtx, statement, organizationIDs); err != nil {
				t.Logf("cleanup registration fixture: %v", err)
			}
		}
	}
	defer cleanup()

	first, err := repo.Register(ctx, firstName, firstEmail, "Good-pass1")
	if err != nil {
		t.Fatal("register first organization:", err)
	}
	organizationIDs = append(organizationIDs, first.Organization.ID)

	second, err := repo.Register(ctx, secondName, secondEmail, "Good-pass1")
	if err != nil {
		t.Fatal("register second organization:", err)
	}
	organizationIDs = append(organizationIDs, second.Organization.ID)

	if first.Organization.ID == second.Organization.ID || first.Organization.Domain == second.Organization.Domain {
		t.Fatalf("registrations share an organization or domain: first=%#v second=%#v", first.Organization, second.Organization)
	}
	if first.Organization.Name != firstName || second.Organization.Name != secondName {
		t.Fatalf("organization names = %q, %q", first.Organization.Name, second.Organization.Name)
	}
	for _, created := range []*organization.Created{first, second} {
		if created.Admin.OrganizationID == nil || *created.Admin.OrganizationID != created.Organization.ID {
			t.Fatalf("admin %s is not in their new organization", created.Admin.Email)
		}
		if created.Admin.Role == nil || created.Admin.Role.Name != "Admin" {
			t.Fatalf("new tenant owner role = %#v, want Admin", created.Admin.Role)
		}
		permissions := map[string]bool{}
		for _, permission := range created.Admin.Role.Permissions {
			permissions[permission.Name] = true
		}
		if !permissions["manage_users"] || !permissions["manage_organization"] || !permissions["super_admin"] {
			t.Fatalf("new tenant admin is missing management permissions: %v", permissions)
		}
	}

	if _, err := repo.Register(ctx, "Should Not Be Created", firstEmail, "Good-pass1"); !errors.Is(err, organization.ErrAccountAlreadyExists) {
		t.Fatalf("duplicate admin account error = %v, want ErrAccountAlreadyExists", err)
	}
	var duplicateOrganizations int
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM organizations WHERE name = $1`, "Should Not Be Created").Scan(&duplicateOrganizations); err != nil {
		t.Fatal("check duplicate registration side effects:", err)
	}
	if duplicateOrganizations != 0 {
		t.Fatalf("duplicate registration left %d organizations behind", duplicateOrganizations)
	}
}
