package logger

import (
	"os"
	"strings"

	"github.com/rs/zerolog"
)

func New(level string) zerolog.Logger {
	parsed, err := zerolog.ParseLevel(strings.ToLower(level))
	if err != nil {
		parsed = zerolog.InfoLevel
	}
	return zerolog.New(os.Stdout).Level(parsed).With().Timestamp().Caller().Logger()
}
