package providers

import (
	"log"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/memory"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/objectstorage"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/qr"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/security"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/timeutil"
	"github.com/PaulUno777/jubely-saas/backend/internal/config"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/google/wire"
)

// InfraSet wires cross-cutting infrastructure adapters (clock, crypto, tokens, storage).
var InfraSet = wire.NewSet(
	ProvideClock,
	ProvideHasher,
	ProvideJWTSigner,
	ProvideQRCodec,
	ProvideWebAuthn,
	ProvidePhoneOTPStore,
	ProvideObjectStorage,
	wire.Bind(new(ports.Clock), new(timeutil.SystemClock)),
	wire.Bind(new(ports.PasswordHasher), new(security.BcryptHasher)),
	wire.Bind(new(ports.TokenSigner), new(*authtoken.JWTSigner)),
	wire.Bind(new(ports.PhoneEnrollmentProofParser), new(*authtoken.JWTSigner)),
	wire.Bind(new(ports.PhoneEnrollmentProofSigner), new(*authtoken.JWTSigner)),
	wire.Bind(new(ports.QRCodec), new(*qr.HMACQRCodec)),
)

func ProvideClock() timeutil.SystemClock {
	return timeutil.SystemClock{}
}

func ProvideHasher() security.BcryptHasher {
	return security.BcryptHasher{}
}

func ProvideJWTSigner(cfg config.Config) *authtoken.JWTSigner {
	return &authtoken.JWTSigner{
		Secret: []byte(cfg.JWTSecret),
		TTL:    cfg.JWTAccessTTL,
	}
}

func ProvideQRCodec(cfg config.Config) *qr.HMACQRCodec {
	return &qr.HMACQRCodec{Secret: []byte(cfg.QRTokenSecret)}
}

func ProvideWebAuthn(cfg config.Config) (*webauthn.WebAuthn, error) {
	return webauthn.New(&webauthn.Config{
		RPDisplayName: cfg.WebAuthnRPName,
		RPID:          cfg.WebAuthnRPID,
		RPOrigins:     []string{cfg.WebAuthnRPOrigin},
	})
}

func ProvidePhoneOTPStore() *memory.PhoneOTPStore {
	return memory.NewPhoneOTPStore()
}

// ProvideObjectStorage selects R2, local disk, or none based on config.
func ProvideObjectStorage(cfg config.Config) (ports.ObjectStorage, error) {
	switch cfg.FileStorageDriver {
	case "r2":
		return objectstorage.NewR2(objectstorage.R2Config{
			AccountID:       cfg.R2AccountID,
			AccessKeyID:     cfg.R2AccessKeyID,
			SecretAccessKey: cfg.R2SecretAccessKey,
			Bucket:          cfg.R2Bucket,
			PublicBaseURL:   cfg.PublicFileBaseURL,
		})
	case "local":
		if cfg.AssetUploadDir == "" {
			log.Fatal("FILE_STORAGE_DRIVER=local requires ASSET_UPLOAD_DIR")
		}
		pub := cfg.PublicFileBaseURL
		if pub == "" {
			pub = "http://localhost:8080/v1/public/files"
			log.Printf("PUBLIC_FILE_BASE_URL not set; using %s for uploaded file URLs", pub)
		}
		return objectstorage.NewLocalFS(cfg.AssetUploadDir, pub), nil
	default:
		if cfg.AssetUploadDir == "" {
			return nil, nil
		}
		pub := cfg.PublicFileBaseURL
		if pub == "" {
			pub = "http://localhost:8080/v1/public/files"
			log.Printf("PUBLIC_FILE_BASE_URL not set; using %s for uploaded file URLs", pub)
		}
		return objectstorage.NewLocalFS(cfg.AssetUploadDir, pub), nil
	}
}
