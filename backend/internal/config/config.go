package config

import (
	"encoding/base64"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	HTTPPort              string
	DatabaseURL           string
	JWTSecret             string
	JWTAccessTTL          time.Duration
	RefreshTokenTTL       time.Duration
	MFAEncryptionKey      []byte
	WebAuthnRPID          string
	WebAuthnRPOrigin      string
	WebAuthnRPName        string
	BootstrapSecret       string
	BootstrapAutoSeed     bool
	BootstrapSeedEmail    string
	BootstrapSeedPassword string
	QRTokenSecret         string
	CORSAllowAll          bool
	// FileStorageDriver: "" (infer), "local", or "r2".
	FileStorageDriver string
	// R2 (Cloudflare) when FileStorageDriver=r2.
	R2AccountID       string
	R2AccessKeyID     string
	R2SecretAccessKey string
	R2Bucket          string
	// AssetUploadDir is the root directory for local uploads (tenant logos).
	AssetUploadDir string
	// PublicFileBaseURL is the public URL prefix for uploaded assets (local API path or R2 custom domain).
	PublicFileBaseURL string
	// PublicEnrollRequirePhoneVerify when true requires a valid phone_verify_token on PWA enrollment (after OTP verify).
	PublicEnrollRequirePhoneVerify bool

	StripeSecretKey       string
	StripeWebhookSecret   string
	StripePriceStarter    string
	StripePriceGrowth     string
	StripePriceBusiness   string
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

	// Shared secret for QR display tokens. Defaults to JWT_SECRET in dev, but can be pinned separately in prod.
	cfg.QRTokenSecret = os.Getenv("QR_TOKEN_SECRET")
	if cfg.QRTokenSecret == "" {
		cfg.QRTokenSecret = cfg.JWTSecret
	}
	if len(cfg.QRTokenSecret) < 32 {
		return Config{}, fmt.Errorf("QR_TOKEN_SECRET is required (min 32 chars) or omit to inherit JWT_SECRET")
	}

	ttl := getenv("JWT_ACCESS_TTL_MINUTES", "60")
	minutes, err := strconv.Atoi(ttl)
	if err != nil || minutes <= 0 {
		return Config{}, fmt.Errorf("JWT_ACCESS_TTL_MINUTES must be a positive integer")
	}
	cfg.JWTAccessTTL = time.Duration(minutes) * time.Minute

	refreshDays := getenv("REFRESH_TOKEN_TTL_DAYS", "30")
	days, err := strconv.Atoi(refreshDays)
	if err != nil || days <= 0 {
		return Config{}, fmt.Errorf("REFRESH_TOKEN_TTL_DAYS must be a positive integer")
	}
	cfg.RefreshTokenTTL = time.Duration(days) * 24 * time.Hour

	// MFA encryption key must be 32 bytes. If not provided, default to JWT_SECRET (dev convenience).
	mfaKey := os.Getenv("MFA_ENCRYPTION_KEY")
	if mfaKey != "" {
		decoded, err := base64.StdEncoding.DecodeString(mfaKey)
		if err != nil {
			return Config{}, fmt.Errorf("MFA_ENCRYPTION_KEY must be base64: %w", err)
		}
		if len(decoded) != 32 {
			return Config{}, fmt.Errorf("MFA_ENCRYPTION_KEY must decode to 32 bytes")
		}
		cfg.MFAEncryptionKey = decoded
	} else {
		cfg.MFAEncryptionKey = []byte(cfg.JWTSecret)
	}

	cfg.WebAuthnRPID = getenv("WEBAUTHN_RP_ID", "localhost")
	cfg.WebAuthnRPOrigin = getenv("WEBAUTHN_RP_ORIGIN", "http://localhost:3000")
	cfg.WebAuthnRPName = getenv("WEBAUTHN_RP_NAME", "Jubely")

	cfg.BootstrapAutoSeed = getenv("BOOTSTRAP_AUTO_SEED", "") == "true"
	cfg.BootstrapSeedEmail = os.Getenv("BOOTSTRAP_SUPERADMIN_EMAIL")
	cfg.BootstrapSeedPassword = os.Getenv("BOOTSTRAP_SUPERADMIN_PASSWORD")

	cfg.CORSAllowAll = getenv("CORS_ALLOW_ALL", "") == "true"

	cfg.FileStorageDriver = strings.ToLower(strings.TrimSpace(os.Getenv("FILE_STORAGE_DRIVER")))
	cfg.AssetUploadDir = strings.TrimSpace(os.Getenv("ASSET_UPLOAD_DIR"))
	cfg.PublicFileBaseURL = strings.TrimSpace(os.Getenv("PUBLIC_FILE_BASE_URL"))
	cfg.PublicFileBaseURL = strings.TrimRight(cfg.PublicFileBaseURL, "/")

	cfg.R2AccountID = strings.TrimSpace(os.Getenv("R2_ACCOUNT_ID"))
	cfg.R2AccessKeyID = strings.TrimSpace(os.Getenv("R2_ACCESS_KEY_ID"))
	cfg.R2SecretAccessKey = strings.TrimSpace(os.Getenv("R2_SECRET_ACCESS_KEY"))
	cfg.R2Bucket = strings.TrimSpace(os.Getenv("R2_BUCKET"))

	cfg.PublicEnrollRequirePhoneVerify = strings.TrimSpace(os.Getenv("PUBLIC_ENROLL_REQUIRE_PHONE_VERIFY")) == "true"

	cfg.StripeSecretKey = strings.TrimSpace(os.Getenv("STRIPE_SECRET_KEY"))
	cfg.StripeWebhookSecret = strings.TrimSpace(os.Getenv("STRIPE_WEBHOOK_SECRET"))
	cfg.StripePriceStarter = strings.TrimSpace(os.Getenv("STRIPE_PRICE_STARTER"))
	cfg.StripePriceGrowth = strings.TrimSpace(os.Getenv("STRIPE_PRICE_GROWTH"))
	cfg.StripePriceBusiness = strings.TrimSpace(os.Getenv("STRIPE_PRICE_BUSINESS"))

	return cfg, nil
}

func getenv(k, def string) string {
	v := os.Getenv(k)
	if v == "" {
		return def
	}
	return v
}
