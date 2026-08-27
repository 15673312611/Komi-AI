package redis

import (
	"context"
	"errors"

	goRedis "github.com/redis/go-redis/v9"

	"github.com/chattermate/chattermate/backend-go/internal/config"
)

var ErrNotConfigured = errors.New("redis is not configured")

func Open(cfg config.Config) (*goRedis.Client, error) {
	if !cfg.RedisEnabled {
		return nil, ErrNotConfigured
	}
	options, err := goRedis.ParseURL(cfg.RedisURL)
	if err != nil {
		return nil, err
	}
	return goRedis.NewClient(options), nil
}

func Ping(ctx context.Context, client *goRedis.Client) error {
	if client == nil {
		return ErrNotConfigured
	}
	return client.Ping(ctx).Err()
}
