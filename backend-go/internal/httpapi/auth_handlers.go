package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/komi/komi/backend-go/internal/auth"
	"github.com/komi/komi/backend-go/internal/user"
)

type authContextKey string

const currentUserKey authContextKey = "current_user"

type tokenResponse struct {
	AccessToken  string   `json:"access_token"`
	RefreshToken string   `json:"refresh_token"`
	TokenType    string   `json:"token_type"`
	User         userView `json:"user"`
}

type userView struct {
	ID             string      `json:"id"`
	Email          string      `json:"email"`
	FullName       string      `json:"full_name"`
	IsActive       bool        `json:"is_active"`
	ProfilePic     *string     `json:"profile_pic"`
	IsOnline       bool        `json:"is_online"`
	LastSeen       interface{} `json:"last_seen"`
	OrganizationID *uuid.UUID  `json:"organization_id"`
	CreatedAt      interface{} `json:"created_at"`
	UpdatedAt      interface{} `json:"updated_at"`
	Role           *roleView   `json:"role"`
}

type roleView struct {
	ID          int64             `json:"id"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Permissions []user.Permission `json:"permissions"`
}

type userInfoCookie struct {
	ID             string     `json:"id"`
	Email          string     `json:"email"`
	FullName       string     `json:"full_name"`
	OrganizationID *uuid.UUID `json:"organization_id"`
	Role           *roleView  `json:"role"`
}

func registerAuthRoutes(r chi.Router, deps Dependencies) {
	r.Post("/users/login", login(deps))
	r.Post("/users/refresh", refresh(deps))
	r.Post("/users/logout", logout(deps))
}

func login(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Users == nil {
			Error(w, http.StatusInternalServerError, "Login failed. Please try again later.")
			return
		}
		if err := r.ParseForm(); err != nil {
			Error(w, http.StatusUnprocessableEntity, "Input should be a valid form")
			return
		}
		username := r.FormValue("username")
		password := r.FormValue("password")
		found, err := deps.Users.FindActiveByEmail(r.Context(), username)
		if err != nil {
			deps.Logger.Error().Err(err).Msg("login lookup failed")
			Error(w, http.StatusInternalServerError, "Login failed. Please try again later.")
			return
		}
		if found == nil || !auth.VerifyPassword(password, found.HashedPassword) {
			w.Header().Set("WWW-Authenticate", "Bearer")
			Error(w, http.StatusUnauthorized, "Incorrect email or password")
			return
		}
		if err := deps.Users.SetOnline(r.Context(), found.ID, true); err != nil {
			deps.Logger.Error().Err(err).Msg("mark user online failed")
			Error(w, http.StatusInternalServerError, "Login failed. Please try again later.")
			return
		}
		response, err := makeTokenResponse(deps, found)
		if err != nil {
			deps.Logger.Error().Err(err).Msg("create login token failed")
			Error(w, http.StatusInternalServerError, "Login failed. Please try again later.")
			return
		}
		setAuthCookies(w, response, true)
		JSON(w, http.StatusOK, response)
	}
}

func refresh(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if deps.Users == nil {
			Error(w, http.StatusInternalServerError, "Token refresh failed. Please try again later.")
			return
		}
		cookie, err := r.Cookie("refresh_token")
		if err != nil || cookie.Value == "" {
			w.Header().Set("WWW-Authenticate", "Bearer")
			Error(w, http.StatusUnauthorized, "Refresh token missing")
			return
		}
		claims, err := deps.Auth.VerifyRefreshToken(cookie.Value)
		if err != nil {
			w.Header().Set("WWW-Authenticate", "Bearer")
			Error(w, http.StatusUnauthorized, "Invalid refresh token")
			return
		}
		id, err := uuid.Parse(claims.Subject)
		if err != nil || claims.OrgID == "" {
			w.Header().Set("WWW-Authenticate", "Bearer")
			Error(w, http.StatusUnauthorized, "Invalid token payload format")
			return
		}
		found, err := deps.Users.FindActiveByID(r.Context(), id)
		if err != nil {
			deps.Logger.Error().Err(err).Msg("refresh user lookup failed")
			Error(w, http.StatusInternalServerError, "Token refresh failed. Please try again later.")
			return
		}
		if found == nil {
			w.Header().Set("WWW-Authenticate", "Bearer")
			Error(w, http.StatusUnauthorized, "User not found or inactive")
			return
		}
		if err := deps.Users.SetOnline(r.Context(), found.ID, found.IsOnline); err != nil {
			deps.Logger.Error().Err(err).Msg("refresh last-seen update failed")
			Error(w, http.StatusInternalServerError, "Token refresh failed. Please try again later.")
			return
		}
		response, err := makeTokenResponse(deps, found)
		if err != nil {
			deps.Logger.Error().Err(err).Msg("create refresh token failed")
			Error(w, http.StatusInternalServerError, "Token refresh failed. Please try again later.")
			return
		}
		setAuthCookies(w, response, false)
		JSON(w, http.StatusOK, response)
	}
}

func logout(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		found, err := currentUser(r, deps)
		if err != nil {
			w.Header().Set("WWW-Authenticate", "Bearer")
			Error(w, http.StatusUnauthorized, err.Error())
			return
		}
		if deps.Users == nil || deps.Users.SetOnline(r.Context(), found.ID, false) != nil {
			Error(w, http.StatusInternalServerError, "Failed to update user status")
			return
		}
		deleteCookie(w, "access_token")
		deleteCookie(w, "refresh_token")
		deleteCookie(w, "user_info")
		JSON(w, http.StatusOK, map[string]string{"message": "Successfully logged out"})
	}
}

func currentUser(r *http.Request, deps Dependencies) (*user.User, error) {
	if found, ok := r.Context().Value(currentUserKey).(*user.User); ok && found != nil {
		return found, nil
	}
	if deps.Users == nil {
		return nil, errors.New("Not authenticated")
	}
	token := ""
	if cookie, err := r.Cookie("access_token"); err == nil {
		token = cookie.Value
	}
	if token == "" {
		parts := strings.SplitN(r.Header.Get("Authorization"), " ", 2)
		if len(parts) == 2 && parts[0] == "Bearer" {
			token = parts[1]
		}
	}
	if token == "" {
		return nil, errors.New("Not authenticated")
	}
	claims, err := deps.Auth.VerifyAccessToken(token)
	if err != nil {
		return nil, errors.New("Invalid authentication token")
	}
	id, err := uuid.Parse(claims.Subject)
	if err != nil {
		return nil, errors.New("Invalid token payload")
	}
	found, err := deps.Users.FindActiveByID(r.Context(), id)
	if err != nil || found == nil {
		return nil, errors.New("User not found")
	}
	return found, nil
}

func requireAuthenticated(deps Dependencies) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			found, err := currentUser(r, deps)
			if err != nil {
				w.Header().Set("WWW-Authenticate", "Bearer")
				Error(w, http.StatusUnauthorized, err.Error())
				return
			}
			next.ServeHTTP(w, r.WithContext(contextWithUser(r, found)))
		})
	}
}

func makeTokenResponse(deps Dependencies, found *user.User) (tokenResponse, error) {
	orgID := ""
	if found.OrganizationID != nil {
		orgID = found.OrganizationID.String()
	}
	accessToken, err := deps.Auth.CreateAccessToken(found.ID.String(), orgID)
	if err != nil {
		return tokenResponse{}, err
	}
	refreshToken, err := deps.Auth.CreateRefreshToken(found.ID.String(), orgID)
	if err != nil {
		return tokenResponse{}, err
	}
	return tokenResponse{
		AccessToken: accessToken, RefreshToken: refreshToken, TokenType: "bearer", User: toUserView(found),
	}, nil
}

func toUserView(found *user.User) userView {
	view := userView{
		ID: found.ID.String(), Email: found.Email, FullName: found.FullName,
		IsActive: found.IsActive, IsOnline: found.IsOnline, OrganizationID: found.OrganizationID,
		Role: toRoleView(found.Role),
	}
	if found.ProfilePic != "" {
		profile := found.ProfilePic
		view.ProfilePic = &profile
	}
	view.LastSeen = found.LastSeen
	view.CreatedAt = found.CreatedAt
	view.UpdatedAt = found.UpdatedAt
	return view
}

func setAuthCookies(w http.ResponseWriter, response tokenResponse, loginCookieLifetime bool) {
	accessMaxAge := 1800
	if loginCookieLifetime {
		// This is intentionally 180: the Python login handler currently emits
		// this value and clients rely on refresh behavior around that contract.
		accessMaxAge = 180
	}
	setCookie(w, "access_token", response.AccessToken, accessMaxAge, true)
	setCookie(w, "refresh_token", response.RefreshToken, 604800, true)
	info := userInfoCookie{
		ID: response.User.ID, Email: response.User.Email, FullName: response.User.FullName,
		OrganizationID: response.User.OrganizationID, Role: response.User.Role,
	}
	encoded, _ := json.Marshal(info)
	setCookie(w, "user_info", pythonQuote(string(encoded)), 604800, false)
}

func toRoleView(role *user.Role) *roleView {
	if role == nil {
		return nil
	}
	return &roleView{ID: role.ID, Name: role.Name, Description: role.Description, Permissions: role.Permissions}
}

func pythonQuote(value string) string {
	const hex = "0123456789ABCDEF"
	var builder strings.Builder
	for i := 0; i < len(value); i++ {
		b := value[i]
		if (b >= 'a' && b <= 'z') || (b >= 'A' && b <= 'Z') ||
			(b >= '0' && b <= '9') || strings.ContainsRune("_.-~/", rune(b)) {
			builder.WriteByte(b)
			continue
		}
		builder.WriteByte('%')
		builder.WriteByte(hex[b>>4])
		builder.WriteByte(hex[b&0x0f])
	}
	return builder.String()
}

func setCookie(w http.ResponseWriter, name, value string, maxAge int, httpOnly bool) {
	http.SetCookie(w, &http.Cookie{
		Name: name, Value: value, Path: "/", MaxAge: maxAge,
		HttpOnly: httpOnly, Secure: true, SameSite: http.SameSiteNoneMode,
	})
}

func deleteCookie(w http.ResponseWriter, name string) {
	http.SetCookie(w, &http.Cookie{Name: name, Value: "", Path: "/", MaxAge: -1})
}
