package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	HTTPPort        string
	DatabaseURL     string
	JWTSecret       string
	JWTAccessTTL    time.Duration
	BootstrapSecret string
}

func Load() (Config, error) {
	_ = godotenv.Load()

	cfg := Config{
		HTTPPort:        getenv("HTTP_PORT", "8080"),
		DatabaseURL:     os.Getenv("DATABASE_URL"),
		JWTSecret:       os.Getenv("JWT_SECRET"),
		BootstrapSecret: os.Getenv("BOOTSTRAP_SECRET"),
	}
	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" || len(cfg.JWTSecret) < 32 {
		return Config{}, fmt.Errorf("JWT_SECRET is required (min 32 chars)")
	}

	ttl := getenv("JWT_ACCESS_TTL_MINUTES", "60")
	minutes, err := strconv.Atoi(ttl)
	if err != nil || minutes <= 0 {
		return Config{}, fmt.Errorf("JWT_ACCESS_TTL_MINUTES must be a positive integer")
	}
	cfg.JWTAccessTTL = time.Duration(minutes) * time.Minute

	return cfg, nil
}

func getenv(k, def string) string {
	v := os.Getenv(k)
	if v == "" {
		return def
	}
	return v
}
