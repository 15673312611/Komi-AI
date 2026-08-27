package storage

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
)

type S3Config struct {
	Bucket       string
	Region       string
	AccessKeyID  string
	SecretKey    string
	SessionToken string
	Endpoint     string
}

type credentials struct {
	accessKeyID     string
	secretAccessKey string
	sessionToken    string
}

type credentialProvider interface {
	Retrieve(context.Context) (credentials, error)
}

type staticCredentialProvider struct {
	credentials credentials
}

func (p staticCredentialProvider) Retrieve(context.Context) (credentials, error) {
	return p.credentials, nil
}

// defaultCredentialProvider delegates to the AWS SDK's default chain, which
// covers environment variables, shared credentials/config files, web identity,
// ECS task credentials, and EC2 instance roles.
type defaultCredentialProvider struct {
	region   string
	mu       sync.Mutex
	provider aws.CredentialsProvider
}

func (p *defaultCredentialProvider) Retrieve(ctx context.Context) (credentials, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.provider == nil {
		cfg, err := awsconfig.LoadDefaultConfig(ctx, awsconfig.WithRegion(p.region))
		if err != nil {
			return credentials{}, err
		}
		p.provider = cfg.Credentials
	}
	found, err := p.provider.Retrieve(ctx)
	if err != nil {
		return credentials{}, err
	}
	return credentials{
		accessKeyID:     found.AccessKeyID,
		secretAccessKey: found.SecretAccessKey,
		sessionToken:    found.SessionToken,
	}, nil
}

type Client struct {
	config      S3Config
	http        *http.Client
	credentials credentialProvider
}

func NewClient(config S3Config) (*Client, error) {
	if strings.TrimSpace(config.Bucket) == "" || strings.TrimSpace(config.Region) == "" {
		return nil, errors.New("S3 bucket and region are required")
	}
	accessKeyID := strings.TrimSpace(config.AccessKeyID)
	secretKey := strings.TrimSpace(config.SecretKey)
	if (accessKeyID == "") != (secretKey == "") {
		return nil, errors.New("AWS credentials are incomplete")
	}
	var provider credentialProvider
	if accessKeyID != "" {
		provider = staticCredentialProvider{credentials: credentials{
			accessKeyID: accessKeyID, secretAccessKey: secretKey, sessionToken: config.SessionToken,
		}}
	} else {
		provider = &defaultCredentialProvider{region: config.Region}
	}
	return &Client{config: config, http: &http.Client{Timeout: 60 * time.Second}, credentials: provider}, nil
}

func (c *Client) Get(ctx context.Context, key string) (*http.Response, error) {
	return c.do(ctx, http.MethodGet, key, nil, "")
}

func (c *Client) Put(ctx context.Context, key string, body []byte, contentType string) error {
	response, err := c.do(ctx, http.MethodPut, key, body, contentType)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		message, _ := io.ReadAll(io.LimitReader(response.Body, 4096))
		return fmt.Errorf("S3 PUT returned HTTP %d: %s", response.StatusCode, strings.TrimSpace(string(message)))
	}
	return nil
}

func (c *Client) Delete(ctx context.Context, key string) error {
	response, err := c.do(ctx, http.MethodDelete, key, nil, "")
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		message, _ := io.ReadAll(io.LimitReader(response.Body, 4096))
		return fmt.Errorf("S3 DELETE returned HTTP %d: %s", response.StatusCode, strings.TrimSpace(string(message)))
	}
	return nil
}

func (c *Client) PresignGet(key string, expires time.Duration) (string, error) {
	return c.PresignGetContext(context.Background(), key, expires)
}

func (c *Client) PresignGetContext(ctx context.Context, key string, expires time.Duration) (string, error) {
	if c == nil {
		return "", errors.New("S3 client is not configured")
	}
	found, err := c.credentialsFor(ctx)
	if err != nil {
		return "", err
	}
	if expires <= 0 {
		expires = time.Hour
	}
	if expires > 7*24*time.Hour {
		expires = 7 * 24 * time.Hour
	}
	now := time.Now().UTC()
	date := now.Format("20060102")
	amzDate := now.Format("20060102T150405Z")
	credential := found.accessKeyID + "/" + date + "/" + c.config.Region + "/s3/aws4_request"
	query := url.Values{}
	query.Set("X-Amz-Algorithm", "AWS4-HMAC-SHA256")
	query.Set("X-Amz-Credential", credential)
	query.Set("X-Amz-Date", amzDate)
	query.Set("X-Amz-Expires", fmt.Sprintf("%d", int(expires/time.Second)))
	query.Set("X-Amz-SignedHeaders", "host")
	if found.sessionToken != "" {
		query.Set("X-Amz-Security-Token", found.sessionToken)
	}
	canonicalQuery := canonicalQueryString(query)
	uri, endpoint, err := c.objectURL(key)
	if err != nil {
		return "", err
	}
	host := endpoint.Host
	canonicalRequest := strings.Join([]string{
		http.MethodGet, uri, canonicalQuery,
		"host:" + host + "\n", "host", "UNSIGNED-PAYLOAD",
	}, "\n")
	stringToSign := strings.Join([]string{
		"AWS4-HMAC-SHA256", amzDate,
		date + "/" + c.config.Region + "/s3/aws4_request",
		hexSHA256([]byte(canonicalRequest)),
	}, "\n")
	signature := c.signature(date, found.secretAccessKey, stringToSign)
	query.Set("X-Amz-Signature", signature)
	endpoint.RawQuery = query.Encode()
	return endpoint.String(), nil
}

func (c *Client) do(ctx context.Context, method, key string, body []byte, contentType string) (*http.Response, error) {
	if c == nil {
		return nil, errors.New("S3 client is not configured")
	}
	found, err := c.credentialsFor(ctx)
	if err != nil {
		return nil, err
	}
	uri, endpoint, err := c.objectURL(key)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	date := now.Format("20060102")
	amzDate := now.Format("20060102T150405Z")
	payloadHash := hexSHA256(body)
	if body == nil {
		payloadHash = hexSHA256(nil)
	}
	canonicalHeaders := map[string]string{
		"host":                 endpoint.Host,
		"x-amz-content-sha256": payloadHash,
		"x-amz-date":           amzDate,
	}
	if found.sessionToken != "" {
		canonicalHeaders["x-amz-security-token"] = found.sessionToken
	}
	if contentType != "" {
		canonicalHeaders["content-type"] = contentType
	}
	canonicalHeaderText, signedHeaders := canonicalHeadersText(canonicalHeaders)
	canonicalRequest := strings.Join([]string{method, uri, "", canonicalHeaderText, signedHeaders, payloadHash}, "\n")
	stringToSign := strings.Join([]string{
		"AWS4-HMAC-SHA256", amzDate,
		date + "/" + c.config.Region + "/s3/aws4_request",
		hexSHA256([]byte(canonicalRequest)),
	}, "\n")
	reqBody := io.Reader(nil)
	if body != nil {
		reqBody = bytes.NewReader(body)
	}
	req, err := http.NewRequestWithContext(ctx, method, endpoint.String(), reqBody)
	if err != nil {
		return nil, err
	}
	for name, value := range canonicalHeaders {
		req.Header.Set(name, value)
	}
	req.Header.Set("Authorization", "AWS4-HMAC-SHA256 Credential="+found.accessKeyID+"/"+date+"/"+c.config.Region+"/s3/aws4_request, SignedHeaders="+signedHeaders+", Signature="+c.signature(date, found.secretAccessKey, stringToSign))
	return c.http.Do(req)
}

func (c *Client) credentialsFor(ctx context.Context) (credentials, error) {
	if c == nil || c.credentials == nil {
		return credentials{}, errors.New("AWS credentials are not configured")
	}
	found, err := c.credentials.Retrieve(ctx)
	if err != nil {
		return credentials{}, fmt.Errorf("retrieve AWS credentials: %w", err)
	}
	if strings.TrimSpace(found.accessKeyID) == "" || strings.TrimSpace(found.secretAccessKey) == "" {
		return credentials{}, errors.New("AWS credentials are not configured")
	}
	return found, nil
}

func (c *Client) objectURL(key string) (string, *url.URL, error) {
	key = strings.TrimLeft(strings.TrimSpace(key), "/")
	if key == "" || strings.Contains(key, "..") {
		return "", nil, errors.New("invalid S3 object key")
	}
	base := strings.TrimRight(c.config.Endpoint, "/")
	if base == "" {
		base = "https://s3." + c.config.Region + ".amazonaws.com"
	}
	endpoint, err := url.Parse(base + "/" + url.PathEscape(c.config.Bucket) + "/" + escapedKey(key))
	if err != nil {
		return "", nil, err
	}
	return endpoint.EscapedPath(), endpoint, nil
}

func escapedKey(key string) string {
	parts := strings.Split(key, "/")
	for index, part := range parts {
		parts[index] = url.PathEscape(part)
	}
	return strings.Join(parts, "/")
}

func canonicalHeadersText(values map[string]string) (string, string) {
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, strings.ToLower(key))
	}
	sort.Strings(keys)
	var builder strings.Builder
	for _, key := range keys {
		builder.WriteString(key)
		builder.WriteByte(':')
		builder.WriteString(strings.TrimSpace(values[key]))
		builder.WriteByte('\n')
	}
	return builder.String(), strings.Join(keys, ";")
}

func canonicalQueryString(values url.Values) string {
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	parts := make([]string, 0)
	for _, key := range keys {
		items := append([]string(nil), values[key]...)
		sort.Strings(items)
		for _, item := range items {
			parts = append(parts, awsEscape(key)+"="+awsEscape(item))
		}
	}
	return strings.Join(parts, "&")
}

func awsEscape(value string) string {
	return strings.ReplaceAll(url.QueryEscape(value), "+", "%20")
}

func (c *Client) signature(date, secretKey, stringToSign string) string {
	kDate := hmacSHA256([]byte("AWS4"+secretKey), []byte(date))
	kRegion := hmacSHA256(kDate, []byte(c.config.Region))
	kService := hmacSHA256(kRegion, []byte("s3"))
	kSigning := hmacSHA256(kService, []byte("aws4_request"))
	return hex.EncodeToString(hmacSHA256(kSigning, []byte(stringToSign)))
}

func hmacSHA256(key, value []byte) []byte {
	hash := hmac.New(sha256.New, key)
	_, _ = hash.Write(value)
	return hash.Sum(nil)
}

func hexSHA256(value []byte) string {
	digest := sha256.Sum256(value)
	return hex.EncodeToString(digest[:])
}
