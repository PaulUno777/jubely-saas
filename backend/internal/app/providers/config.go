package providers

import (
	"time"

	"github.com/PaulUno777/jubely-saas/backend/internal/config"
)

// ProvideConfig loads environment configuration for the API process.
func ProvideConfig() (config.Config, error) {
	return config.Load()
}

// Timing groups duration settings shared by auth-related use cases.
// Named fields avoid Wire ambiguity when multiple time.Duration values are injected.
type Timing struct {
	RefreshTTL          time.Duration
	MFAChallengeTTL     time.Duration
	PasskeyChallengeTTL time.Duration
	InviteTokenTTL      time.Duration
}

// ProvideTiming returns standard auth timing derived from config.
func ProvideTiming(cfg config.Config) Timing {
	return Timing{
		RefreshTTL:          cfg.RefreshTokenTTL,
		MFAChallengeTTL:     5 * time.Minute,
		PasskeyChallengeTTL: 5 * time.Minute,
		InviteTokenTTL:      7 * 24 * time.Hour,
	}
}

// ProvideMFAEncryptionKey exposes the MFA encryption key from config.
func ProvideMFAEncryptionKey(cfg config.Config) []byte {
	return cfg.MFAEncryptionKey
}

// ProvideBootstrapSecret exposes the bootstrap shared secret from config.
func ProvideBootstrapSecret(cfg config.Config) string {
	return cfg.BootstrapSecret
}

// ProvidePublicEnrollRequirePhoneVerify mirrors config for enrollment gating.
func ProvidePublicEnrollRequirePhoneVerify(cfg config.Config) bool {
	return cfg.PublicEnrollRequirePhoneVerify
}
