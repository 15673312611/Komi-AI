package httpapi

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/mail"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/komi/komi/backend-go/internal/auth"
	"github.com/komi/komi/backend-go/internal/user"
)

const (
	maxProfilePictureSize = 5 * 1024 * 1024
	defaultAgentCapacity  = 5
)

type userCreateRequest struct {
	Email          string `json:"email"`
	FullName       string `json:"full_name"`
	Password       string `json:"password"`
	RoleID         *int64 `json:"role_id"`
	IsActive       *bool  `json:"is_active"`
	SeeAllAIChats  *bool  `json:"see_all_ai_chats"`
	SeeAllOrgChats *bool  `json:"see_all_org_chats"`
}

type userUpdateRequest struct {
	Email           *string `json:"email"`
	FullName        *string `json:"full_name"`
	Password        *string `json:"password"`
	CurrentPassword *string `json:"current_password"`
	IsActive        *bool   `json:"is_active"`
	RoleID          *int64  `json:"role_id"`
	ProfilePic      *string `json:"profile_pic"`
	IsOnline        *bool   `json:"is_online"`
	SeeAllAIChats   *bool   `json:"see_all_ai_chats"`
	SeeAllOrgChats  *bool   `json:"see_all_org_chats"`
}

type userStatusRequest struct {
	IsOnline bool `json:"is_online"`
}

type adminPasswordResetRequest struct {
	NewPassword string `json:"new_password"`
}

type fcmTokenRequest struct {
	Token string `json:"token"`
}

type permissionRequest struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type roleCreateRequest struct {
	Name        string              `json:"name"`
	Description *string             `json:"description"`
	IsDefault   *bool               `json:"is_default"`
	Permissions []permissionRequest `json:"permissions"`
}

type roleUpdateRequest struct {
	Name        *string              `json:"name"`
	Description *string              `json:"description"`
	IsDefault   *bool                `json:"is_default"`
	Permissions *[]permissionRequest `json:"permissions"`
}

type groupCreateRequest struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
}

type groupUpdateRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
}

type managementUserView struct {
	ID             uuid.UUID       `json:"id"`
	Email          string          `json:"email"`
	FullName       string          `json:"full_name"`
	IsActive       bool            `json:"is_active"`
	ProfilePic     *string         `json:"profile_pic"`
	IsOnline       bool            `json:"is_online"`
	LastSeen       interface{}     `json:"last_seen"`
	OrganizationID *uuid.UUID      `json:"organization_id"`
	CreatedAt      interface{}     `json:"created_at"`
	UpdatedAt      interface{}     `json:"updated_at"`
	Groups         []groupView     `json:"groups"`
	Role           *managementRole `json:"role"`
}

type managementRole struct {
	ID             int64             `json:"id"`
	Name           string            `json:"name"`
	Description    string            `json:"description"`
	IsDefault      bool              `json:"is_default"`
	OrganizationID *uuid.UUID        `json:"organization_id"`
	CreatedAt      interface{}       `json:"created_at"`
	UpdatedAt      interface{}       `json:"updated_at"`
	Permissions    []user.Permission `json:"permissions"`
}

type groupView struct {
	ID             uuid.UUID            `json:"id"`
	Name           string               `json:"name"`
	Description    *string              `json:"description"`
	OrganizationID uuid.UUID            `json:"organization_id"`
	Users          []managementUserView `json:"users,omitempty"`
}

func registerUserManagementRoutes(r chi.Router, deps Dependencies) {
	// Static paths must be registered before /users/{user_id}; FastAPI's route
	// declaration order gives these paths the same precedence.
	r.With(requireAllPermissions(deps, "manage_users")).Post("/users", createUser(deps))
	r.With(requireAllPermissions(deps, "manage_users")).Get("/users", listUsers(deps))
	r.With(requireAllPermissions(deps, "manage_users")).Get("/users/team-overview", teamOverview(deps))
	r.With(requireAnyPermissions(deps, "view_all_chats", "view_assigned_chats", "view_unassigned_chats", "manage_all_chats", "manage_assigned_chats")).Get("/users/teammates", listUsersTeammates(deps))
	r.With(requireAuthenticated(deps)).Get("/users/me/avatar", getMyAvatar(deps))
	r.With(requireAuthenticated(deps)).Patch("/users/me", updateMyProfile(deps))
	r.With(requireAuthenticated(deps)).Post("/users/token/fcm-token", registerFCMToken(deps))
	r.With(requireAuthenticated(deps)).Delete("/users/token/fcm-token", unregisterFCMToken(deps))
	r.With(requireAuthenticated(deps)).Post("/users/me/profile-pic", uploadProfilePicture(deps))
	r.With(requireAuthenticated(deps)).Delete("/users/me/profile-pic", deleteProfilePicture(deps))
	r.With(requireAllPermissions(deps, "manage_users")).Get("/users/{user_id}", getManagedUser(deps))
	r.With(requireAllPermissions(deps, "manage_users")).Put("/users/{user_id}", updateManagedUser(deps))
	r.With(requireAllPermissions(deps, "manage_users")).Delete("/users/{user_id}", deleteManagedUser(deps))
	r.With(requireAllPermissions(deps, "manage_users")).Post("/users/{user_id}/reset-password", resetManagedPassword(deps))
	r.With(requireAuthenticated(deps)).Post("/users/{user_id}/status", updateOwnStatus(deps))

	r.With(requireAllPermissions(deps, "manage_roles")).Post("/roles", createRole(deps))
	r.With(requireAnyPermissions(deps, "manage_roles", "manage_users")).Get("/roles", listRoles(deps))
	r.With(requireAnyPermissions(deps, "manage_roles", "manage_users")).Get("/roles/permissions/all", listPermissions(deps))
	r.With(requireAnyPermissions(deps, "manage_roles", "manage_users")).Get("/roles/{role_id}", getRole(deps))
	r.With(requireAllPermissions(deps, "manage_roles")).Put("/roles/{role_id}", updateRole(deps))
	r.With(requireAllPermissions(deps, "manage_roles")).Delete("/roles/{role_id}", deleteRole(deps))
	r.With(requireAllPermissions(deps, "manage_roles")).Post("/roles/{role_id}/permissions/{permission}", addRolePermission(deps))
	r.With(requireAllPermissions(deps, "manage_roles")).Delete("/roles/{role_id}/permissions/{permission}", removeRolePermission(deps))

	r.With(requireAllPermissions(deps, "manage_users")).Get("/groups", listGroups(deps))
	r.With(requireAllPermissions(deps, "manage_users")).Post("/groups", createGroup(deps))
	r.With(requireAllPermissions(deps, "manage_users")).Get("/groups/{group_id}", getGroup(deps))
	r.With(requireAllPermissions(deps, "manage_users")).Put("/groups/{group_id}", updateGroup(deps))
	r.With(requireAllPermissions(deps, "manage_users")).Delete("/groups/{group_id}", deleteGroup(deps))
	r.With(requireAllPermissions(deps, "manage_users")).Post("/groups/{group_id}/users/{user_id}", addGroupUser(deps))
	r.With(requireAllPermissions(deps, "manage_users")).Delete("/groups/{group_id}/users/{user_id}", removeGroupUser(deps))
	// Alias for frontend compatibility with /user-groups/{group_id}
	r.With(requireAllPermissions(deps, "manage_users")).Get("/user-groups/{group_id}", getGroup(deps))
}

func userManagementStore(deps Dependencies) (user.UserManagementStore, bool) {
	store, ok := deps.Users.(user.UserManagementStore)
	return store, ok && store != nil
}

func roleStore(deps Dependencies) (user.RoleStore, bool) {
	store, ok := deps.Users.(user.RoleStore)
	return store, ok && store != nil
}

func groupStore(deps Dependencies) (user.GroupStore, bool) {
	store, ok := deps.Users.(user.GroupStore)
	return store, ok && store != nil
}

func requireUserOrganization(w http.ResponseWriter, r *http.Request) (*user.User, uuid.UUID, bool) {
	found, ok := currentUserFromContext(r)
	if !ok || found.OrganizationID == nil {
		Error(w, http.StatusForbidden, "User is not associated with any organization")
		return nil, uuid.Nil, false
	}
	return found, *found.OrganizationID, true
}

func createUser(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := userManagementStore(deps)
		roles, rolesOK := roleStore(deps)
		if !ok || !rolesOK {
			Error(w, http.StatusInternalServerError, "User service is not configured")
			return
		}
		var body userCreateRequest
		if err := decodeJSON(r, &body); err != nil || body.RoleID == nil || body.Email == "" || body.FullName == "" || body.Password == "" {
			Error(w, http.StatusUnprocessableEntity, "Invalid user data")
			return
		}
		if !validEmail(body.Email) {
			Error(w, http.StatusUnprocessableEntity, "value is not a valid email address")
			return
		}
		if err := auth.ValidatePasswordStrength(body.Password); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		existing, err := store.GetUserByEmail(r.Context(), body.Email)
		if err != nil {
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if existing != nil {
			Error(w, http.StatusBadRequest, "Email already registered")
			return
		}
		role, err := roles.GetRole(r.Context(), *body.RoleID)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if role == nil || role.OrganizationID == nil || *role.OrganizationID != organizationID {
			Error(w, http.StatusNotFound, "Role not found")
			return
		}
		role, err = roles.ResolveChatScope(r.Context(), current, role, body.SeeAllAIChats, body.SeeAllOrgChats)
		if err != nil {
			writeManagementError(w, err)
			return
		}
		hashed, err := auth.HashPassword(body.Password)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to create user")
			return
		}
		created, err := store.CreateUser(r.Context(), user.UserCreateInput{
			Email: body.Email, FullName: body.FullName, HashedPassword: hashed,
			OrganizationID: organizationID, RoleID: role.ID, IsActive: boolDefault(body.IsActive, true),
		})
		if err != nil {
			if isUniqueViolation(err) {
				Error(w, http.StatusBadRequest, "Email already registered")
			} else {
				Error(w, http.StatusBadRequest, err.Error())
			}
			return
		}
		JSON(w, http.StatusOK, toManagementUserView(created))
	}
}

func listUsers(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := userManagementStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "User service is not configured")
			return
		}
		users, err := store.ListUsers(r.Context(), organizationID)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		views := make([]managementUserView, 0, len(users))
		for _, found := range users {
			views = append(views, toManagementUserView(found))
		}
		JSON(w, http.StatusOK, views)
	}
}

func teamOverview(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := userManagementStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "User service is not configured")
			return
		}
		overview, err := store.TeamOverview(r.Context(), organizationID)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, overview)
	}
}

func listUsersTeammates(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := userManagementStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "User service is not configured")
			return
		}
		users, err := store.ListUsersWithAnyPermission(r.Context(), organizationID, []string{"manage_all_chats", "manage_assigned_chats", "super_admin"})
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		result := make([]teammateView, 0, len(users))
		for _, found := range users {
			fullName := found.FullName
			profilePic := (*string)(nil)
			if found.ProfilePic != "" {
				value := found.ProfilePic
				profilePic = &value
			}
			result = append(result, teammateView{ID: found.ID, FullName: &fullName, Email: found.Email, ProfilePic: profilePic, IsOnline: found.IsOnline})
		}
		JSON(w, http.StatusOK, result)
	}
}

func getManagedUser(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := userManagementStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "User service is not configured")
			return
		}
		id, err := uuid.Parse(chi.URLParam(r, "user_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid user ID")
			return
		}
		found, err := store.GetUser(r.Context(), id)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if found == nil || found.OrganizationID == nil || *found.OrganizationID != organizationID {
			Error(w, http.StatusNotFound, "User not found")
			return
		}
		JSON(w, http.StatusOK, toManagementUserView(found))
	}
}

func deleteManagedUser(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := userManagementStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "User service is not configured")
			return
		}
		id, err := uuid.Parse(chi.URLParam(r, "user_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid user ID")
			return
		}
		found, err := store.GetUser(r.Context(), id)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if found == nil || found.OrganizationID == nil || *found.OrganizationID != organizationID {
			Error(w, http.StatusNotFound, "User not found")
			return
		}
		if err := store.DeleteUser(r.Context(), id); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				Error(w, http.StatusNotFound, "User not found")
			} else {
				Error(w, http.StatusInternalServerError, "Failed to delete user")
			}
			return
		}
		NoContent(w)
	}
}

func updateMyProfile(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		store, ok := userManagementStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "User service is not configured")
			return
		}
		var body userUpdateRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if body.Email != nil && *body.Email != current.Email {
			if !validEmail(*body.Email) {
				Error(w, http.StatusUnprocessableEntity, "value is not a valid email address")
				return
			}
			existing, err := store.GetUserByEmail(r.Context(), *body.Email)
			if err != nil {
				Error(w, http.StatusInternalServerError, "Failed to update profile")
				return
			}
			if existing != nil && existing.ID != current.ID {
				Error(w, http.StatusBadRequest, "Email already registered")
				return
			}
		}
		var hashed *string
		if body.Password != nil && *body.Password != "" {
			if body.CurrentPassword == nil || *body.CurrentPassword == "" {
				Error(w, http.StatusBadRequest, "Current password is required")
				return
			}
			if !auth.VerifyPassword(*body.CurrentPassword, current.HashedPassword) {
				Error(w, http.StatusBadRequest, "Incorrect current password")
				return
			}
			if err := auth.ValidatePasswordStrength(*body.Password); err != nil {
				Error(w, http.StatusBadRequest, err.Error())
				return
			}
			value, err := auth.HashPassword(*body.Password)
			if err != nil {
				Error(w, http.StatusInternalServerError, "Failed to update profile")
				return
			}
			hashed = &value
		}
		updated, err := store.UpdateUser(r.Context(), current.ID, user.UserUpdateInput{
			Email: body.Email, FullName: body.FullName, HashedPassword: hashed,
			IsActive: body.IsActive, ProfilePic: body.ProfilePic, IsOnline: body.IsOnline,
			SetLastSeen: body.IsOnline != nil,
		})
		if err != nil || updated == nil {
			Error(w, http.StatusInternalServerError, "Failed to update profile")
			return
		}
		JSON(w, http.StatusOK, toManagementUserView(updated))
	}
}

func updateManagedUser(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, storeOK := userManagementStore(deps)
		roles, rolesOK := roleStore(deps)
		if !storeOK || !rolesOK {
			Error(w, http.StatusInternalServerError, "User service is not configured")
			return
		}
		id, err := uuid.Parse(chi.URLParam(r, "user_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid user ID")
			return
		}
		found, err := store.GetUser(r.Context(), id)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if found == nil || found.OrganizationID == nil || *found.OrganizationID != organizationID {
			Error(w, http.StatusNotFound, "User not found")
			return
		}
		if body := new(userUpdateRequest); decodeJSON(r, body) != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid user data")
			return
		} else {
			// The body is decoded once above. Keeping this branch local makes the
			// early organization checks easy to audit.
			if body.Email != nil && *body.Email != found.Email {
				if !validEmail(*body.Email) {
					Error(w, http.StatusUnprocessableEntity, "value is not a valid email address")
					return
				}
				existing, err := store.GetUserByEmail(r.Context(), *body.Email)
				if err != nil {
					Error(w, http.StatusInternalServerError, "Failed to update user")
					return
				}
				if existing != nil && existing.ID != found.ID {
					Error(w, http.StatusBadRequest, "Email already registered")
					return
				}
			}
			var targetRole *user.Role
			if body.RoleID != nil {
				targetRole, err = roles.GetRole(r.Context(), *body.RoleID)
				if err != nil {
					Error(w, http.StatusInternalServerError, err.Error())
					return
				}
				if targetRole == nil || targetRole.OrganizationID == nil || *targetRole.OrganizationID != organizationID {
					Error(w, http.StatusNotFound, "Role not found")
					return
				}
			} else {
				targetRole = found.Role
			}
			if targetRole != nil {
				targetRole, err = roles.ResolveChatScope(r.Context(), current, targetRole, body.SeeAllAIChats, body.SeeAllOrgChats)
				if err != nil {
					writeManagementError(w, err)
					return
				}
			}
			input := user.UserUpdateInput{Email: body.Email, FullName: body.FullName, IsActive: body.IsActive, IsOnline: body.IsOnline, ProfilePic: body.ProfilePic}
			if targetRole != nil {
				input.RoleID = &targetRole.ID
			}
			updated, err := store.UpdateUser(r.Context(), id, input)
			if err != nil || updated == nil {
				Error(w, http.StatusInternalServerError, "Failed to update user")
				return
			}
			JSON(w, http.StatusOK, toManagementUserView(updated))
		}
	}
}

func resetManagedPassword(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := userManagementStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "User service is not configured")
			return
		}
		id, err := uuid.Parse(chi.URLParam(r, "user_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid user ID")
			return
		}
		var body adminPasswordResetRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if err := auth.ValidatePasswordStrength(body.NewPassword); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		found, err := store.GetUser(r.Context(), id)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if found == nil || found.OrganizationID == nil || *found.OrganizationID != organizationID {
			Error(w, http.StatusNotFound, "User not found")
			return
		}
		if found.ID == current.ID {
			Error(w, http.StatusBadRequest, "Use your profile settings to change your own password")
			return
		}
		hashed, err := auth.HashPassword(body.NewPassword)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to reset password")
			return
		}
		if _, err := store.UpdateUser(r.Context(), id, user.UserUpdateInput{HashedPassword: &hashed}); err != nil {
			Error(w, http.StatusInternalServerError, "Failed to reset password")
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Password reset successfully"})
	}
}

func updateOwnStatus(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		id, err := uuid.Parse(chi.URLParam(r, "user_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid user ID")
			return
		}
		if id != current.ID {
			Error(w, http.StatusForbidden, "Can only update own status")
			return
		}
		store, ok := userManagementStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "User service is not configured")
			return
		}
		var body userStatusRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		updated, err := store.UpdateUser(r.Context(), id, user.UserUpdateInput{IsOnline: &body.IsOnline, SetLastSeen: true})
		if err != nil || updated == nil {
			Error(w, http.StatusInternalServerError, "Failed to update status")
			return
		}
		JSON(w, http.StatusOK, map[string]any{"message": "Status updated successfully", "is_online": updated.IsOnline, "last_seen": updated.LastSeen})
	}
}

func registerFCMToken(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		store, ok := userManagementStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "User service is not configured")
			return
		}
		var body fcmTokenRequest
		if err := decodeJSON(r, &body); err != nil || body.Token == "" {
			Error(w, http.StatusUnprocessableEntity, "Invalid token data")
			return
		}
		if err := store.RegisterFCMToken(r.Context(), current.ID, body.Token); err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "FCM token registered successfully"})
	}
}

func unregisterFCMToken(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		store, ok := userManagementStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "User service is not configured")
			return
		}
		var body fcmTokenRequest
		if err := decodeJSON(r, &body); err != nil || body.Token == "" {
			Error(w, http.StatusUnprocessableEntity, "Invalid token data")
			return
		}
		if err := store.RemoveFCMToken(r.Context(), current.ID, body.Token); err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "FCM token cleared successfully"})
	}
}

func getMyAvatar(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		if current.ProfilePic == "" {
			Error(w, http.StatusNotFound, "No profile picture")
			return
		}
		location := current.ProfilePic
		if !strings.HasPrefix(location, "http://") && !strings.HasPrefix(location, "https://") {
			if strings.HasPrefix(location, "/uploads/") {
				location = deps.Config.APIBasePath + location
			} else if strings.HasPrefix(location, "uploads/") {
				location = deps.Config.APIBasePath + "/" + location
			} else if !strings.HasPrefix(location, "/") {
				location = "/" + location
			}
		}
		w.Header().Set("Cache-Control", "no-store")
		http.Redirect(w, r, location, http.StatusTemporaryRedirect)
	}
}

func uploadProfilePicture(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := userManagementStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "User service is not configured")
			return
		}
		file, header, err := r.FormFile("file")
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Field required")
			return
		}
		defer file.Close()
		extension := strings.ToLower(filepath.Ext(header.Filename))
		if extension != ".jpg" && extension != ".jpeg" && extension != ".png" && extension != ".gif" {
			Error(w, http.StatusBadRequest, "File type not allowed. Allowed types: .gif, .jpeg, .jpg, .png")
			return
		}
		content, err := io.ReadAll(io.LimitReader(file, maxProfilePictureSize+1))
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to upload profile picture")
			return
		}
		if len(content) > maxProfilePictureSize {
			Error(w, http.StatusBadRequest, "File size too large. Maximum size: 5.0MB")
			return
		}
		if current.ProfilePic != "" {
			_ = removeLocalUpload(current.ProfilePic)
		}
		directory := filepath.Join(deps.Config.UploadsDir, "user", organizationID.String(), current.ID.String())
		if err := os.MkdirAll(directory, 0o755); err != nil {
			Error(w, http.StatusInternalServerError, "Failed to upload profile picture")
			return
		}
		path := filepath.Join(directory, "profile"+extension)
		if err := os.WriteFile(path, content, 0o644); err != nil {
			Error(w, http.StatusInternalServerError, "Failed to upload profile picture")
			return
		}
		stored := deps.Config.APIBasePath + "/uploads/user/" + organizationID.String() + "/" + current.ID.String() + "/profile" + extension
		updated, err := store.UpdateUser(r.Context(), current.ID, user.UserUpdateInput{ProfilePic: &stored})
		if err != nil || updated == nil {
			Error(w, http.StatusInternalServerError, "Failed to upload profile picture")
			return
		}
		JSON(w, http.StatusOK, toManagementUserView(updated))
	}
}

func deleteProfilePicture(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		store, ok := userManagementStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "User service is not configured")
			return
		}
		if current.ProfilePic != "" {
			_ = removeLocalUpload(current.ProfilePic)
		}
		updated, err := store.UpdateUser(r.Context(), current.ID, user.UserUpdateInput{ClearProfilePic: true})
		if err != nil || updated == nil {
			Error(w, http.StatusInternalServerError, "Failed to delete profile picture")
			return
		}
		JSON(w, http.StatusOK, toManagementUserView(updated))
	}
}

func createRole(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := roleStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Role service is not configured")
			return
		}
		var body roleCreateRequest
		if err := decodeJSON(r, &body); err != nil || body.Name == "" || body.Permissions == nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid role data")
			return
		}
		permissionIDs, permissionNames, err := validatePermissions(r, store, body.Permissions)
		if err != nil {
			writeManagementError(w, err)
			return
		}
		if err := ensureGrantable(current, permissionNames); err != nil {
			writeManagementError(w, err)
			return
		}
		isDefault := boolDefault(body.IsDefault, false)
		if isDefault {
			found, err := store.GetDefaultRole(r.Context(), organizationID)
			if err != nil {
				Error(w, http.StatusInternalServerError, err.Error())
				return
			}
			if found != nil {
				Error(w, http.StatusBadRequest, "Organization already has a default role")
				return
			}
		}
		created, err := store.CreateRole(r.Context(), user.RoleCreateInput{Name: body.Name, Description: body.Description, OrganizationID: organizationID, IsDefault: isDefault, PermissionIDs: permissionIDs})
		if err != nil {
			if isUniqueViolation(err) {
				Error(w, http.StatusBadRequest, "Role with this name already exists")
			} else {
				Error(w, http.StatusBadRequest, err.Error())
			}
			return
		}
		JSON(w, http.StatusOK, created)
	}
}

func listRoles(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := roleStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Role service is not configured")
			return
		}
		roles, err := store.ListRoles(r.Context(), organizationID)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, roles)
	}
}

func parseRoleID(r *http.Request) (int64, error) {
	return strconv.ParseInt(chi.URLParam(r, "role_id"), 10, 64)
}

func getRole(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := roleStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Role service is not configured")
			return
		}
		id, err := parseRoleID(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid role ID")
			return
		}
		role, err := store.GetRole(r.Context(), id)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if role == nil || role.OrganizationID == nil || *role.OrganizationID != organizationID {
			Error(w, http.StatusNotFound, "Role not found")
			return
		}
		JSON(w, http.StatusOK, role)
	}
}

func updateRole(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := roleStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Role service is not configured")
			return
		}
		id, err := parseRoleID(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid role ID")
			return
		}
		role, err := store.GetRole(r.Context(), id)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if role == nil || role.OrganizationID == nil || *role.OrganizationID != organizationID {
			Error(w, http.StatusNotFound, "Role not found")
			return
		}
		if role.IsDefault {
			Error(w, http.StatusBadRequest, "Cannot modify default role")
			return
		}
		var body roleUpdateRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		permissionIDs := (*[]int64)(nil)
		if body.Permissions != nil {
			ids, names, err := validatePermissions(r, store, *body.Permissions)
			if err != nil {
				writeManagementError(w, err)
				return
			}
			alreadyHeld := make(map[string]struct{}, len(role.Permissions))
			for _, permission := range role.Permissions {
				alreadyHeld[permission.Name] = struct{}{}
			}
			missing := make([]string, 0)
			for _, name := range names {
				if _, exists := alreadyHeld[name]; !exists {
					missing = append(missing, name)
				}
			}
			if err := ensureGrantable(current, missing); err != nil {
				writeManagementError(w, err)
				return
			}
			permissionIDs = &ids
		}
		if body.IsDefault != nil && *body.IsDefault {
			found, err := store.GetDefaultRole(r.Context(), organizationID)
			if err != nil {
				Error(w, http.StatusInternalServerError, err.Error())
				return
			}
			if found != nil && found.ID != id {
				Error(w, http.StatusBadRequest, "Organization already has a default role")
				return
			}
		}
		updated, err := store.UpdateRole(r.Context(), id, user.RoleUpdateInput{Name: body.Name, Description: body.Description, IsDefault: body.IsDefault, PermissionIDs: permissionIDs})
		if err != nil {
			if isUniqueViolation(err) {
				Error(w, http.StatusBadRequest, "Role with this name already exists")
			} else {
				Error(w, http.StatusBadRequest, err.Error())
			}
			return
		}
		JSON(w, http.StatusOK, updated)
	}
}

func deleteRole(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := roleStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Role service is not configured")
			return
		}
		id, err := parseRoleID(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid role ID")
			return
		}
		role, err := store.GetRole(r.Context(), id)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if role == nil || role.OrganizationID == nil || *role.OrganizationID != organizationID {
			Error(w, http.StatusNotFound, "Role not found")
			return
		}
		if role.IsDefault {
			Error(w, http.StatusBadRequest, "Cannot delete default role")
			return
		}
		inUse, err := store.IsRoleInUse(r.Context(), id)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if inUse {
			Error(w, http.StatusBadRequest, "Cannot delete role that is assigned to users")
			return
		}
		if err := store.DeleteRole(r.Context(), id); err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		NoContent(w)
	}
}

func listPermissions(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if _, _, ok := requireUserOrganization(w, r); !ok {
			return
		}
		store, ok := roleStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Role service is not configured")
			return
		}
		permissions, err := store.ListPermissions(r.Context())
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, permissions)
	}
}

func addRolePermission(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := roleStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Role service is not configured")
			return
		}
		id, err := parseRoleID(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid role ID")
			return
		}
		role, err := store.GetRole(r.Context(), id)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if role == nil || role.OrganizationID == nil || *role.OrganizationID != organizationID {
			Error(w, http.StatusNotFound, "Role not found")
			return
		}
		permission, err := store.GetPermissionByName(r.Context(), chi.URLParam(r, "permission"))
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if permission == nil {
			Error(w, http.StatusNotFound, "Permission not found")
			return
		}
		if err := ensureGrantable(current, []string{permission.Name}); err != nil {
			writeManagementError(w, err)
			return
		}
		if err := store.AddRolePermission(r.Context(), id, permission.ID); err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Permission added to role"})
	}
}

func removeRolePermission(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := roleStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Role service is not configured")
			return
		}
		id, err := parseRoleID(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid role ID")
			return
		}
		role, err := store.GetRole(r.Context(), id)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if role == nil || role.OrganizationID == nil || *role.OrganizationID != organizationID {
			Error(w, http.StatusNotFound, "Role not found")
			return
		}
		permission, err := store.GetPermissionByName(r.Context(), chi.URLParam(r, "permission"))
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if permission == nil {
			Error(w, http.StatusNotFound, "Permission not found")
			return
		}
		if err := store.RemoveRolePermission(r.Context(), id, permission.ID); err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Permission removed from role"})
	}
}

func validatePermissions(r *http.Request, store user.RoleStore, requested []permissionRequest) ([]int64, []string, error) {
	ids := make([]int64, 0, len(requested))
	for _, permission := range requested {
		ids = append(ids, permission.ID)
	}
	found, err := store.GetPermissionsByIDs(r.Context(), ids)
	if err != nil {
		return nil, nil, err
	}
	if len(found) != len(ids) {
		return nil, nil, fmt.Errorf("invalid permission")
	}
	names := make([]string, 0, len(found))
	for _, permission := range found {
		names = append(names, permission.Name)
	}
	return ids, names, nil
}

func ensureGrantable(current *user.User, names []string) error {
	missing := make([]string, 0, len(names))
	for _, name := range names {
		if !hasAllPermissions(current, name) {
			missing = append(missing, name)
		}
	}
	if len(missing) == 0 {
		return nil
	}
	sort.Strings(missing)
	return &user.UngrantablePermissionsError{Names: missing}
}

func writeManagementError(w http.ResponseWriter, err error) {
	var ungrantable *user.UngrantablePermissionsError
	if errors.As(err, &ungrantable) {
		Error(w, http.StatusForbidden, ungrantable.Error())
		return
	}
	if errors.Is(err, user.ErrPermissionNotFound) || strings.EqualFold(err.Error(), "invalid permission") {
		Error(w, http.StatusBadRequest, "Invalid permission")
		return
	}
	if errors.Is(err, user.ErrDefaultRoleExists) {
		Error(w, http.StatusBadRequest, "Organization already has a default role")
		return
	}
	Error(w, http.StatusInternalServerError, err.Error())
}

func listGroups(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := groupStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Group service is not configured")
			return
		}
		groups, err := store.ListGroups(r.Context(), organizationID)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, groupsToViews(groups))
	}
}

func createGroup(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := groupStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Group service is not configured")
			return
		}
		var body groupCreateRequest
		if err := decodeJSON(r, &body); err != nil || body.Name == "" {
			Error(w, http.StatusUnprocessableEntity, "Invalid group data")
			return
		}
		created, err := store.CreateGroup(r.Context(), user.GroupCreateInput{Name: body.Name, Description: body.Description, OrganizationID: organizationID})
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, groupToView(created, false))
	}
}

func groupID(r *http.Request) (uuid.UUID, error)     { return uuid.Parse(chi.URLParam(r, "group_id")) }
func groupUserID(r *http.Request) (uuid.UUID, error) { return uuid.Parse(chi.URLParam(r, "user_id")) }

func getGroup(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := groupStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Group service is not configured")
			return
		}
		id, err := groupID(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid group ID")
			return
		}
		group, err := store.GetGroup(r.Context(), id)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if group == nil || group.OrganizationID != organizationID {
			Error(w, http.StatusNotFound, "Group not found")
			return
		}
		JSON(w, http.StatusOK, groupToView(group, true))
	}
}

func updateGroup(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := groupStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Group service is not configured")
			return
		}
		id, err := groupID(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid group ID")
			return
		}
		group, err := store.GetGroup(r.Context(), id)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if group == nil || group.OrganizationID != organizationID {
			Error(w, http.StatusNotFound, "Group not found")
			return
		}
		var body groupUpdateRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		updated, err := store.UpdateGroup(r.Context(), id, user.GroupUpdateInput{Name: body.Name, Description: body.Description})
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, groupToView(updated, false))
	}
}

func deleteGroup(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := groupStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Group service is not configured")
			return
		}
		id, err := groupID(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid group ID")
			return
		}
		group, err := store.GetGroup(r.Context(), id)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if group == nil || group.OrganizationID != organizationID {
			Error(w, http.StatusNotFound, "Group not found")
			return
		}
		if err := store.DeleteGroup(r.Context(), id); err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		NoContent(w)
	}
}

func addGroupUser(deps Dependencies) http.HandlerFunc {
	return groupUserMutation(deps, true)
}

func removeGroupUser(deps Dependencies) http.HandlerFunc {
	return groupUserMutation(deps, false)
}

func groupUserMutation(deps Dependencies, add bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, organizationID, ok := requireUserOrganization(w, r)
		if !ok {
			return
		}
		store, ok := groupStore(deps)
		if !ok {
			Error(w, http.StatusInternalServerError, "Group service is not configured")
			return
		}
		gid, err := groupID(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid group ID")
			return
		}
		uid, err := groupUserID(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid user ID")
			return
		}
		group, err := store.GetGroup(r.Context(), gid)
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if group == nil || group.OrganizationID != organizationID {
			Error(w, http.StatusNotFound, "Group not found")
			return
		}
		var success bool
		if add {
			success, err = store.AddUserToGroup(r.Context(), gid, uid)
		} else {
			success, err = store.RemoveUserFromGroup(r.Context(), gid, uid)
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		if !success {
			if add {
				Error(w, http.StatusBadRequest, "Failed to add user to group")
			} else {
				Error(w, http.StatusBadRequest, "Failed to remove user from group")
			}
			return
		}
		message := "User removed from group"
		if add {
			message = "User added to group"
		}
		JSON(w, http.StatusOK, map[string]string{"message": message})
	}
}

func toManagementUserView(found *user.User) managementUserView {
	view := managementUserView{ID: found.ID, Email: found.Email, FullName: found.FullName, IsActive: found.IsActive, IsOnline: found.IsOnline, LastSeen: found.LastSeen, OrganizationID: found.OrganizationID, CreatedAt: found.CreatedAt, UpdatedAt: found.UpdatedAt, Groups: make([]groupView, 0, len(found.Groups)), Role: toManagementRoleView(found.Role)}
	if found.ProfilePic != "" {
		value := found.ProfilePic
		view.ProfilePic = &value
	}
	for _, group := range found.Groups {
		view.Groups = append(view.Groups, groupView{ID: group.ID, Name: group.Name, Description: group.Description, OrganizationID: group.OrganizationID})
	}
	return view
}

func toManagementRoleView(role *user.Role) *managementRole {
	if role == nil {
		return nil
	}
	return &managementRole{ID: role.ID, Name: role.Name, Description: role.Description, IsDefault: role.IsDefault, OrganizationID: role.OrganizationID, CreatedAt: role.CreatedAt, UpdatedAt: role.UpdatedAt, Permissions: role.Permissions}
}

func groupToView(group *user.Group, includeUsers bool) groupView {
	view := groupView{ID: group.ID, Name: group.Name, Description: group.Description, OrganizationID: group.OrganizationID}
	if includeUsers {
		view.Users = make([]managementUserView, 0, len(group.Users))
		for index := range group.Users {
			view.Users = append(view.Users, toManagementUserView(&group.Users[index]))
		}
	}
	return view
}

func groupsToViews(groups []*user.Group) []groupView {
	result := make([]groupView, 0, len(groups))
	for _, group := range groups {
		result = append(result, groupToView(group, true))
	}
	return result
}

func validEmail(value string) bool {
	parsed, err := mail.ParseAddress(value)
	return err == nil && parsed.Address == value && strings.Contains(value, "@")
}

func isUniqueViolation(err error) bool {
	return err != nil && (strings.Contains(strings.ToLower(err.Error()), "duplicate key") || strings.Contains(strings.ToLower(err.Error()), "unique constraint"))
}

func removeLocalUpload(stored string) error {
	clean := strings.TrimPrefix(stored, "/")
	clean = strings.TrimPrefix(clean, "/api/v1/")
	clean = strings.TrimPrefix(clean, "api/v1/")
	if !strings.HasPrefix(clean, "uploads/") {
		return nil
	}
	return os.Remove(filepath.FromSlash(clean))
}
