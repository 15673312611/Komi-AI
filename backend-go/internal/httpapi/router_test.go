package httpapi

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/komi/komi/backend-go/internal/auth"
	"github.com/komi/komi/backend-go/internal/config"
	"github.com/komi/komi/backend-go/internal/user"
)

type fakeUserStore struct {
	byEmail *user.User
	byID    *user.User
	err     error
	online  []bool
}

func (f *fakeUserStore) FindActiveByEmail(_ context.Context, _ string) (*user.User, error) {
	return f.byEmail, f.err
}

func (f *fakeUserStore) FindActiveByID(_ context.Context, _ uuid.UUID) (*user.User, error) {
	return f.byID, f.err
}

func (f *fakeUserStore) SetOnline(_ context.Context, _ uuid.UUID, online bool) error {
	f.online = append(f.online, online)
	return f.err
}

func testConfig() config.Config {
	return config.Config{
		ProjectName:        "Komi AI",
		Version:            "0.1.0",
		APIBasePath:        "/api/v1",
		CORSOrigins:        []string{"http://localhost:5173"},
		JWTSecret:          "jwt",
		ConversationSecret: "conversation",
		JWTAlgorithm:       "HS256",
		AccessTokenTTL:     time.Minute,
		RefreshTokenTTL:    time.Hour,
	}
}

func testRouter() http.Handler {
	return testRouterWithStore(nil)
}

func testRouterWithStore(store user.Store) http.Handler {
	cfg := testConfig()
	return NewRouter(Dependencies{Config: cfg, Logger: zerolog.Nop(), Auth: auth.NewService(cfg), Users: store})
}

func TestRootAndHealthContract(t *testing.T) {
	handler := testRouter()
	cases := []struct {
		method string
		path   string
		status int
		body   string
	}{
		{http.MethodGet, "/", http.StatusOK, `"name":"Komi AI"`},
		{http.MethodGet, "/health", http.StatusOK, `"status":"healthy"`},
		{http.MethodHead, "/health", http.StatusOK, ""},
		{http.MethodGet, "/health/help-center-domain?domain=unknown.example", http.StatusNotFound, ""},
	}
	for _, tc := range cases {
		t.Run(tc.method+" "+tc.path, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, tc.path, nil)
			res := httptest.NewRecorder()
			handler.ServeHTTP(res, req)
			if res.Code != tc.status {
				t.Fatalf("status = %d, want %d", res.Code, tc.status)
			}
			body, _ := io.ReadAll(res.Result().Body)
			if tc.body != "" && !strings.Contains(string(body), tc.body) {
				t.Fatalf("body = %q, want substring %q", body, tc.body)
			}
		})
	}
}

func TestCORSAllowsConfiguredOrigin(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	res := httptest.NewRecorder()
	testRouter().ServeHTTP(res, req)
	if got := res.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:5173" {
		t.Fatalf("allow origin = %q", got)
	}
}

func testUser(t *testing.T) *user.User {
	t.Helper()
	hash, err := auth.HashPassword("Good-pass1")
	if err != nil {
		t.Fatalf("HashPassword() error = %v", err)
	}
	organizationID := uuid.New()
	return &user.User{
		ID:             uuid.New(),
		Email:          "agent@example.com",
		FullName:       "Test Agent",
		HashedPassword: hash,
		IsActive:       true,
		OrganizationID: &organizationID,
	}
}

func cookieByName(response *http.Response, name string) *http.Cookie {
	for _, cookie := range response.Cookies() {
		if cookie.Name == name {
			return cookie
		}
	}
	return nil
}

func TestLoginSetsPythonCompatibleTokenResponseAndCookies(t *testing.T) {
	found := testUser(t)
	store := &fakeUserStore{byEmail: found}
	req := httptest.NewRequest(http.MethodPost, "/api/v1/users/login", strings.NewReader("username=agent%40example.com&password=Good-pass1"))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	res := httptest.NewRecorder()
	testRouterWithStore(store).ServeHTTP(res, req)
	if res.Code != http.StatusOK {
		t.Fatalf("login status = %d, body=%s", res.Code, res.Body.String())
	}
	if len(store.online) != 1 || !store.online[0] {
		t.Fatalf("online updates = %#v", store.online)
	}
	response := res.Result()
	access := cookieByName(response, "access_token")
	refresh := cookieByName(response, "refresh_token")
	info := cookieByName(response, "user_info")
	if access == nil || refresh == nil || info == nil {
		t.Fatalf("expected auth cookies, got %#v", response.Cookies())
	}
	if access.MaxAge != 180 || !access.HttpOnly || !access.Secure || access.SameSite != http.SameSiteNoneMode {
		t.Fatalf("access cookie = %#v", access)
	}
	if refresh.MaxAge != 604800 || !refresh.HttpOnly || !refresh.Secure {
		t.Fatalf("refresh cookie = %#v", refresh)
	}
	if !strings.Contains(res.Body.String(), `"token_type":"bearer"`) || !strings.Contains(res.Body.String(), found.ID.String()) {
		t.Fatalf("unexpected login body = %s", res.Body.String())
	}
}

func TestLoginRejectsIncorrectPassword(t *testing.T) {
	store := &fakeUserStore{byEmail: testUser(t)}
	req := httptest.NewRequest(http.MethodPost, "/api/v1/users/login", strings.NewReader("username=agent%40example.com&password=wrong"))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	res := httptest.NewRecorder()
	testRouterWithStore(store).ServeHTTP(res, req)
	if res.Code != http.StatusUnauthorized || res.Header().Get("WWW-Authenticate") != "Bearer" {
		t.Fatalf("status=%d authenticate=%q body=%s", res.Code, res.Header().Get("WWW-Authenticate"), res.Body.String())
	}
	if len(store.online) != 0 {
		t.Fatalf("wrong password changed online status: %#v", store.online)
	}
}

func TestRefreshUsesCookieAndRotatesTokens(t *testing.T) {
	found := testUser(t)
	store := &fakeUserStore{byEmail: found, byID: found}
	loginRequest := httptest.NewRequest(http.MethodPost, "/api/v1/users/login", strings.NewReader("username=agent%40example.com&password=Good-pass1"))
	loginRequest.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	loginResponse := httptest.NewRecorder()
	testRouterWithStore(store).ServeHTTP(loginResponse, loginRequest)
	refreshCookie := cookieByName(loginResponse.Result(), "refresh_token")
	if refreshCookie == nil {
		t.Fatal("login did not set refresh token")
	}
	refreshRequest := httptest.NewRequest(http.MethodPost, "/api/v1/users/refresh", nil)
	refreshRequest.AddCookie(refreshCookie)
	refreshResponse := httptest.NewRecorder()
	testRouterWithStore(store).ServeHTTP(refreshResponse, refreshRequest)
	if refreshResponse.Code != http.StatusOK {
		t.Fatalf("refresh status=%d body=%s", refreshResponse.Code, refreshResponse.Body.String())
	}
	accessCookie := cookieByName(refreshResponse.Result(), "access_token")
	if accessCookie == nil || accessCookie.MaxAge != 1800 {
		t.Fatalf("refresh access cookie = %#v", accessCookie)
	}
}

func TestLogoutClearsCookies(t *testing.T) {
	found := testUser(t)
	store := &fakeUserStore{byID: found}
	cfg := testConfig()
	access, err := auth.NewService(cfg).CreateAccessToken(found.ID.String(), found.OrganizationID.String())
	if err != nil {
		t.Fatalf("CreateAccessToken() error = %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, "/api/v1/users/logout", nil)
	req.AddCookie(&http.Cookie{Name: "access_token", Value: access})
	res := httptest.NewRecorder()
	testRouterWithStore(store).ServeHTTP(res, req)
	if res.Code != http.StatusOK || len(store.online) != 1 || store.online[0] {
		t.Fatalf("logout status=%d online=%#v body=%s", res.Code, store.online, res.Body.String())
	}
	if cookieByName(res.Result(), "access_token") == nil || cookieByName(res.Result(), "access_token").MaxAge >= 0 {
		t.Fatalf("access token was not deleted: %#v", res.Result().Cookies())
	}
}

func TestUserRoleGroupStaticRoutesAreRegisteredBeforeIDRoutes(t *testing.T) {
	cases := []struct {
		method string
		path   string
	}{
		{http.MethodGet, "/api/v1/users/team-overview"},
		{http.MethodGet, "/api/v1/users/teammates"},
		{http.MethodGet, "/api/v1/users/me/avatar"},
		{http.MethodPatch, "/api/v1/users/me"},
		{http.MethodPost, "/api/v1/users/token/fcm-token"},
		{http.MethodDelete, "/api/v1/users/me/profile-pic"},
		{http.MethodGet, "/api/v1/roles/permissions/all"},
		{http.MethodGet, "/api/v1/groups"},
		{http.MethodPost, "/api/v1/groups/00000000-0000-0000-0000-000000000000/users/00000000-0000-0000-0000-000000000000"},
	}
	for _, tc := range cases {
		t.Run(tc.method+" "+tc.path, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, tc.path, strings.NewReader(`{}`))
			res := httptest.NewRecorder()
			testRouter().ServeHTTP(res, req)
			if res.Code == http.StatusNotFound {
				t.Fatalf("route was not registered: status=%d body=%s", res.Code, res.Body.String())
			}
			if res.Code != http.StatusUnauthorized {
				t.Fatalf("unauthenticated status=%d body=%s", res.Code, res.Body.String())
			}
		})
	}
}
