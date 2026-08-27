package auth

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	goRedis "github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"

	"github.com/chattermate/chattermate/backend-go/internal/config"
)

var (
	ErrInvalidToken   = errors.New("invalid token")
	ErrWrongTokenType = errors.New("wrong token type")
)

type Claims struct {
	TokenType     string         `json:"type,omitempty"`
	OrgID         string         `json:"org,omitempty"`
	WidgetID      string         `json:"widget_id,omitempty"`
	JTI           string         `json:"jti,omitempty"`
	Email         string         `json:"email,omitempty"`
	CustomerID    string         `json:"customer_id,omitempty"`
	CustomerEmail string         `json:"customer_email,omitempty"`
	CustomerName  string         `json:"customer_name,omitempty"`
	Source        string         `json:"source,omitempty"`
	CustomData    map[string]any `json:"custom_data,omitempty"`
	jwt.RegisteredClaims
}

// ConversationTokenStore is intentionally smaller than the Redis client API so
// token verification remains easy to test and Redis failures do not make an
// otherwise valid signed token unusable.
type ConversationTokenStore interface {
	Set(ctx context.Context, jti string, ttl time.Duration) error
	Exists(ctx context.Context, jti string) (bool, error)
	Revoke(ctx context.Context, jti string) error
}

type Service struct {
	secret             []byte
	conversationSecret []byte
	algorithm          string
	accessTTL          time.Duration
	refreshTTL         time.Duration
	conversationStore  ConversationTokenStore
}

func NewService(cfg config.Config) *Service {
	return &Service{
		secret:             []byte(cfg.JWTSecret),
		conversationSecret: []byte(cfg.ConversationSecret),
		algorithm:          cfg.JWTAlgorithm,
		accessTTL:          cfg.AccessTokenTTL,
		refreshTTL:         cfg.RefreshTokenTTL,
	}
}

// NewRedisTokenStore adapts the shared Redis client to the token store
// contract. Keys are namespaced so they cannot collide with application data.
func NewRedisTokenStore(client *goRedis.Client) ConversationTokenStore {
	if client == nil {
		return nil
	}
	return &redisConversationTokenStore{client: client}
}

type redisConversationTokenStore struct {
	client *goRedis.Client
}

func (s *redisConversationTokenStore) key(jti string) string {
	return "token:" + jti
}

func (s *redisConversationTokenStore) Set(ctx context.Context, jti string, ttl time.Duration) error {
	return s.client.Set(ctx, s.key(jti), "1", ttl).Err()
}

func (s *redisConversationTokenStore) Exists(ctx context.Context, jti string) (bool, error) {
	count, err := s.client.Exists(ctx, s.key(jti)).Result()
	return count > 0, err
}

func (s *redisConversationTokenStore) Revoke(ctx context.Context, jti string) error {
	return s.client.Del(ctx, s.key(jti)).Err()
}

func (s *Service) SetConversationTokenStore(store ConversationTokenStore) {
	s.conversationStore = store
}

func (s *Service) CreateAccessToken(subject, orgID string) (string, error) {
	return s.createToken(s.secret, subject, orgID, "access", s.accessTTL, nil)
}

func (s *Service) CreateRefreshToken(subject, orgID string) (string, error) {
	return s.createToken(s.secret, subject, orgID, "refresh", s.refreshTTL, nil)
}

func (s *Service) CreateConversationToken(widgetID, customerID, email string, extra map[string]any) (string, string, error) {
	return s.CreateConversationTokenWithTTL(widgetID, customerID, email, extra, 30*24*time.Hour)
}

func (s *Service) CreateConversationTokenWithTTL(widgetID, customerID, email string, extra map[string]any, ttl time.Duration) (string, string, error) {
	jti := uuid.NewString()
	now := time.Now()
	if ttl <= 0 {
		ttl = 30 * 24 * time.Hour
	}
	claims := jwt.MapClaims{
		"widget_id": widgetID,
		"type":      "conversation",
		"jti":       jti,
		"exp":       now.Add(ttl).Unix(),
		"iat":       now.Unix(),
	}
	if customerID != "" {
		claims["sub"] = customerID
	}
	if email != "" {
		claims["email"] = email
	}
	for key, value := range extra {
		claims[key] = value
	}
	token := jwt.NewWithClaims(s.signingMethod(), claims)
	encoded, err := token.SignedString(s.conversationSecret)
	if err == nil && s.conversationStore != nil {
		// Redis is an availability enhancement. The Python implementation also
		// allows signed tokens to continue working while Redis is unavailable.
		_ = s.conversationStore.Set(context.Background(), jti, ttl)
	}
	return encoded, jti, err
}

func (s *Service) VerifyAccessToken(tokenString string) (Claims, error) {
	claims, err := s.parse(tokenString, s.secret)
	if err != nil {
		return Claims{}, err
	}
	if claims.TokenType != "access" {
		return Claims{}, ErrWrongTokenType
	}
	return claims, nil
}

func (s *Service) VerifyRefreshToken(tokenString string) (Claims, error) {
	claims, err := s.parse(tokenString, s.secret)
	if err != nil {
		return Claims{}, err
	}
	if claims.TokenType != "refresh" {
		return Claims{}, ErrWrongTokenType
	}
	return claims, nil
}

func (s *Service) VerifyConversationToken(tokenString string) (Claims, error) {
	claims, err := s.parse(tokenString, s.conversationSecret)
	if err != nil {
		return Claims{}, err
	}
	if claims.TokenType != "conversation" {
		return Claims{}, ErrWrongTokenType
	}
	if claims.JTI != "" && s.conversationStore != nil {
		exists, storeErr := s.conversationStore.Exists(context.Background(), claims.JTI)
		if storeErr == nil && !exists {
			return Claims{}, ErrInvalidToken
		}
	}
	return claims, nil
}

// DecodeConversationTokenForRevocation verifies the signature while allowing an
// expired token to be decoded. Revocation is allowed after natural expiry so
// callers receive the same error semantics as the Python endpoint.
func (s *Service) DecodeConversationTokenForRevocation(tokenString string) (Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		if token.Method.Alg() != s.algorithm {
			return nil, fmt.Errorf("unexpected signing method %q", token.Method.Alg())
		}
		return s.conversationSecret, nil
	}, jwt.WithoutClaimsValidation())
	if err != nil || token == nil || !token.Valid {
		return Claims{}, ErrInvalidToken
	}
	claims, ok := token.Claims.(*Claims)
	if !ok {
		return Claims{}, ErrInvalidToken
	}
	return *claims, nil
}

func (s *Service) RevokeConversationToken(jti string) error {
	if strings.TrimSpace(jti) == "" {
		return errors.New("token does not contain a JTI")
	}
	if s.conversationStore == nil {
		return nil
	}
	return s.conversationStore.Revoke(context.Background(), jti)
}

// SignLocalAttachment creates the short-lived URL signature used by local
// attachment downloads. The wire format matches backend/app/utils/
// attachment_urls.py: base64url(HMAC-SHA256(key + ":" + expiry)) without
// padding.
func (s *Service) SignLocalAttachment(storageKey string, expiresAt int64) (string, error) {
	if s == nil || len(s.conversationSecret) == 0 || strings.TrimSpace(storageKey) == "" || expiresAt <= 0 {
		return "", errors.New("conversation secret is not configured")
	}
	digest := hmac.New(sha256.New, s.conversationSecret)
	_, _ = digest.Write([]byte(fmt.Sprintf("%s:%d", storageKey, expiresAt)))
	return base64.RawURLEncoding.EncodeToString(digest.Sum(nil)), nil
}

func (s *Service) createToken(secret []byte, subject, orgID, tokenType string, ttl time.Duration, extra map[string]any) (string, error) {
	claims := jwt.MapClaims{
		"sub":  subject,
		"org":  orgID,
		"type": tokenType,
		"exp":  time.Now().Add(ttl).Unix(),
		"iat":  time.Now().Unix(),
	}
	for key, value := range extra {
		claims[key] = value
	}
	return jwt.NewWithClaims(s.signingMethod(), claims).SignedString(secret)
}

func (s *Service) parse(tokenString string, secret []byte) (Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		if token.Method.Alg() != s.algorithm {
			return nil, fmt.Errorf("unexpected signing method %q", token.Method.Alg())
		}
		return secret, nil
	})
	if err != nil || token == nil || !token.Valid {
		return Claims{}, ErrInvalidToken
	}
	claims, ok := token.Claims.(*Claims)
	if !ok {
		return Claims{}, ErrInvalidToken
	}
	return *claims, nil
}

func (s *Service) signingMethod() jwt.SigningMethod {
	switch strings.ToUpper(s.algorithm) {
	case "HS256":
		return jwt.SigningMethodHS256
	case "HS384":
		return jwt.SigningMethodHS384
	case "HS512":
		return jwt.SigningMethodHS512
	default:
		return jwt.SigningMethodHS256
	}
}

func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hash), err
}

func VerifyPassword(password, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

func ValidatePasswordStrength(password string) error {
	if len(password) < 8 {
		return errors.New("Password must be at least 8 characters long")
	}
	classes := 0
	for _, predicate := range []func(rune) bool{
		func(r rune) bool { return r >= 'A' && r <= 'Z' },
		func(r rune) bool { return r >= 'a' && r <= 'z' },
		func(r rune) bool { return r >= '0' && r <= '9' },
		func(r rune) bool {
			return !((r >= 'A' && r <= 'Z') || (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9'))
		},
	} {
		for _, r := range password {
			if predicate(r) {
				classes++
				break
			}
		}
	}
	if classes < 3 {
		return errors.New("Password must include at least 3 of: uppercase letter, lowercase letter, number, special character")
	}
	return nil
}
