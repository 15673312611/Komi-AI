package channel

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/chattermate/chattermate/backend-go/internal/config"
)

var ErrRemoteRequest = errors.New("remote channel request failed")

var defaultHTTPClient = &http.Client{Timeout: 15 * time.Second}

func JSONRequest(ctx context.Context, method, endpoint, token string, query url.Values, body any) (map[string]any, int, error) {
	var reader io.Reader
	if body != nil {
		encoded, err := json.Marshal(body)
		if err != nil {
			return nil, 0, err
		}
		reader = bytes.NewReader(encoded)
	}
	req, err := http.NewRequestWithContext(ctx, method, endpoint, reader)
	if err != nil {
		return nil, 0, err
	}
	if query != nil {
		req.URL.RawQuery = query.Encode()
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	response, err := defaultHTTPClient.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer response.Body.Close()
	data, readErr := io.ReadAll(io.LimitReader(response.Body, 4<<20))
	if readErr != nil {
		return nil, response.StatusCode, readErr
	}
	var value map[string]any
	if len(bytes.TrimSpace(data)) != 0 {
		if err := json.Unmarshal(data, &value); err != nil {
			return nil, response.StatusCode, fmt.Errorf("decode remote response: %w", err)
		}
	}
	if value == nil {
		value = map[string]any{}
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return value, response.StatusCode, remoteError(value, response.StatusCode)
	}
	return value, response.StatusCode, nil
}

func FormRequest(ctx context.Context, method, endpoint string, values url.Values, token string) (map[string]any, int, error) {
	req, err := http.NewRequestWithContext(ctx, method, endpoint, strings.NewReader(values.Encode()))
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	response, err := defaultHTTPClient.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer response.Body.Close()
	data, readErr := io.ReadAll(io.LimitReader(response.Body, 4<<20))
	if readErr != nil {
		return nil, response.StatusCode, readErr
	}
	var value map[string]any
	if len(bytes.TrimSpace(data)) > 0 {
		if err := json.Unmarshal(data, &value); err != nil {
			return nil, response.StatusCode, fmt.Errorf("decode remote response: %w", err)
		}
	}
	if value == nil {
		value = map[string]any{}
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return value, response.StatusCode, remoteError(value, response.StatusCode)
	}
	return value, response.StatusCode, nil
}

func GraphURL(cfg config.Config, path string, instagram bool) string {
	base := "https://graph.facebook.com"
	if instagram {
		base = "https://graph.instagram.com"
	}
	version := cfg.MetaGraphVersion
	if version == "" {
		version = "v21.0"
	}
	return strings.TrimRight(base, "/") + "/" + strings.Trim(version, "/") + "/" + strings.TrimLeft(path, "/")
}

func Graph(ctx context.Context, cfg config.Config, method, path, token string, query url.Values, body any, instagram bool) (map[string]any, int, error) {
	return JSONRequest(ctx, method, GraphURL(cfg, path, instagram), token, query, body)
}

func Telegram(ctx context.Context, token, method string, values url.Values) (map[string]any, int, error) {
	endpoint := "https://api.telegram.org/bot" + strings.TrimSpace(token) + "/" + strings.TrimLeft(method, "/")
	return FormRequest(ctx, http.MethodPost, endpoint, values, "")
}

func Line(ctx context.Context, method, endpoint, token string, body any) (map[string]any, int, error) {
	return JSONRequest(ctx, method, "https://api.line.me"+endpoint, token, nil, body)
}

func Slack(ctx context.Context, httpMethod, path string, body any, token string) (map[string]any, int, error) {
	return JSONRequest(ctx, httpMethod, "https://slack.com/api/"+strings.TrimLeft(path, "/"), token, nil, body)
}

func VerifyMetaSignature(body []byte, header, metaSecret, instagramSecret string) bool {
	if !strings.HasPrefix(header, "sha256=") {
		return false
	}
	provided := strings.TrimPrefix(header, "sha256=")
	for _, secret := range []string{metaSecret, instagramSecret} {
		if secret == "" {
			continue
		}
		mac := hmac.New(sha256.New, []byte(secret))
		_, _ = mac.Write(body)
		if hmac.Equal([]byte(hex.EncodeToString(mac.Sum(nil))), []byte(provided)) {
			return true
		}
	}
	return false
}

func VerifySlackSignature(body []byte, headers http.Header, signingSecret string) bool {
	if signingSecret == "" {
		return false
	}
	timestamp := headers.Get("X-Slack-Request-Timestamp")
	signature := headers.Get("X-Slack-Signature")
	seconds, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil || signature == "" || time.Since(time.Unix(seconds, 0)) > 5*time.Minute || time.Since(time.Unix(seconds, 0)) < -5*time.Minute {
		return false
	}
	mac := hmac.New(sha256.New, []byte(signingSecret))
	_, _ = mac.Write([]byte("v0:" + timestamp + ":"))
	_, _ = mac.Write(body)
	return hmac.Equal([]byte("v0="+hex.EncodeToString(mac.Sum(nil))), []byte(signature))
}

func VerifyChallenge(mode, token, challenge, expected string) (string, bool) {
	return challenge, mode == "subscribe" && token != "" && token == expected
}

func remoteError(value map[string]any, status int) error {
	message := "remote request failed"
	if errorValue, ok := value["error"].(map[string]any); ok {
		if text, ok := errorValue["message"].(string); ok && text != "" {
			message = text
		}
	}
	if text, ok := value["error"].(string); ok && text != "" {
		message = text
	}
	if text, ok := value["message"].(string); ok && text != "" {
		message = text
	}
	return fmt.Errorf("%w: %d %s", ErrRemoteRequest, status, message)
}
