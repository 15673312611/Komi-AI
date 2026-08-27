package auth

import (
	"context"
	"testing"
	"time"

	"github.com/chattermate/chattermate/backend-go/internal/config"
)

type fakeConversationStore struct {
	active map[string]bool
	setTTL time.Duration
}

func (f *fakeConversationStore) Set(_ context.Context, jti string, ttl time.Duration) error {
	if f.active == nil {
		f.active = map[string]bool{}
	}
	f.active[jti] = true
	f.setTTL = ttl
	return nil
}

func (f *fakeConversationStore) Exists(_ context.Context, jti string) (bool, error) {
	return f.active[jti], nil
}

func (f *fakeConversationStore) Revoke(_ context.Context, jti string) error {
	delete(f.active, jti)
	return nil
}

func testService() *Service {
	return NewService(config.Config{
		JWTSecret:          "test-jwt-secret",
		ConversationSecret: "test-conversation-secret",
		JWTAlgorithm:       "HS256",
		AccessTokenTTL:     time.Minute,
		RefreshTokenTTL:    time.Hour,
	})
}

func TestAccessAndRefreshTokenTypes(t *testing.T) {
	s := testService()
	access, err := s.CreateAccessToken("user-1", "org-1")
	if err != nil {
		t.Fatalf("CreateAccessToken() error = %v", err)
	}
	claims, err := s.VerifyAccessToken(access)
	if err != nil || claims.Subject != "user-1" || claims.OrgID != "org-1" {
		t.Fatalf("access claims = %#v, err=%v", claims, err)
	}
	if _, err := s.VerifyRefreshToken(access); err != ErrWrongTokenType {
		t.Fatalf("VerifyRefreshToken(access) error = %v", err)
	}
	refresh, err := s.CreateRefreshToken("user-1", "org-1")
	if err != nil {
		t.Fatalf("CreateRefreshToken() error = %v", err)
	}
	if _, err := s.VerifyRefreshToken(refresh); err != nil {
		t.Fatalf("VerifyRefreshToken() error = %v", err)
	}
}

func TestConversationTokenHasJTIAndSeparateSecret(t *testing.T) {
	s := testService()
	token, jti, err := s.CreateConversationToken("widget-1", "customer-1", "a@example.com", nil)
	if err != nil || jti == "" {
		t.Fatalf("CreateConversationToken() token=%q jti=%q err=%v", token, jti, err)
	}
	claims, err := s.VerifyConversationToken(token)
	if err != nil || claims.WidgetID != "widget-1" || claims.JTI != jti || claims.Subject != "customer-1" {
		t.Fatalf("conversation claims = %#v, err=%v", claims, err)
	}
	if _, err := s.VerifyAccessToken(token); err != ErrInvalidToken {
		t.Fatalf("access verification of conversation token error = %v", err)
	}
}

func TestConversationTokenPreservesExtendedClaimsAndRevocation(t *testing.T) {
	s := testService()
	store := &fakeConversationStore{}
	s.SetConversationTokenStore(store)
	token, jti, err := s.CreateConversationToken("widget-1", "customer-1", "", map[string]any{
		"source":      "explore",
		"custom_data": map[string]any{"plan": "pro"},
	})
	if err != nil {
		t.Fatalf("CreateConversationToken() error = %v", err)
	}
	claims, err := s.VerifyConversationToken(token)
	if err != nil {
		t.Fatalf("VerifyConversationToken() error = %v", err)
	}
	if claims.Source != "explore" || claims.CustomData["plan"] != "pro" {
		t.Fatalf("extended claims = %#v", claims)
	}
	if store.setTTL != 30*24*time.Hour || !store.active[jti] {
		t.Fatalf("token store state = %#v ttl=%v", store.active, store.setTTL)
	}
	if err := s.RevokeConversationToken(jti); err != nil {
		t.Fatalf("RevokeConversationToken() error = %v", err)
	}
	if _, err := s.VerifyConversationToken(token); err != ErrInvalidToken {
		t.Fatalf("verification after revocation error = %v", err)
	}
}

func TestPasswordStrengthMatchesPythonPolicy(t *testing.T) {
	for _, password := range []string{"short", "alllowercase", "lowercase1"} {
		if err := ValidatePasswordStrength(password); err == nil {
			t.Errorf("ValidatePasswordStrength(%q) should fail", password)
		}
	}
	if err := ValidatePasswordStrength("Good-pass1"); err != nil {
		t.Fatalf("ValidatePasswordStrength() error = %v", err)
	}
	hash, err := HashPassword("Good-pass1")
	if err != nil || !VerifyPassword("Good-pass1", hash) || VerifyPassword("wrong", hash) {
		t.Fatalf("password hash verification failed: err=%v", err)
	}
}
