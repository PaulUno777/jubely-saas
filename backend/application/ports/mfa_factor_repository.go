package ports

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type MFAFactorType string

const (
	MFAFactorTOTP    MFAFactorType = "totp"
	MFAFactorPasskey MFAFactorType = "passkey"
)

type MFAFactor struct {
	ID         uuid.UUID
	UserID     uuid.UUID
	Type       MFAFactorType
	Label      *string
	EnabledAt  *time.Time
	LastUsedAt *time.Time
	CreatedAt  time.Time
}

type MFAFactorRow struct {
	MFAFactor
	SecretEnc    []byte
	CredentialID []byte
	PublicKey    []byte
	SignCount    int64
	Transports   []string
}

type MFAFactorRepository interface {
	CreateTOTP(ctx context.Context, in CreateTOTPFactorInput) error
	CreatePasskey(ctx context.Context, in CreatePasskeyFactorInput) error
	FindByID(ctx context.Context, id uuid.UUID) (*MFAFactorRow, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]MFAFactor, error)
	ListEnabledTOTPByUser(ctx context.Context, userID uuid.UUID) ([]MFAFactorRow, error)
	ListEnabledPasskeysByUser(ctx context.Context, userID uuid.UUID) ([]MFAFactorRow, error)
	FindEnabledPasskeyByCredentialID(ctx context.Context, credentialID []byte) (*MFAFactorRow, error)
	TouchPasskey(ctx context.Context, id uuid.UUID, signCount int64, usedAt time.Time) error
	Enable(ctx context.Context, id uuid.UUID, enabledAt time.Time) error
	Delete(ctx context.Context, id uuid.UUID) error
	CountEnabledByUser(ctx context.Context, userID uuid.UUID) (int64, error)
}

type CreateTOTPFactorInput struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	Label     *string
	SecretEnc []byte
	CreatedAt time.Time
}

type CreatePasskeyFactorInput struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	Label        *string
	CredentialID []byte
	PublicKey    []byte
	SignCount    int64
	Transports   []string
	EnabledAt    time.Time
	LastUsedAt   *time.Time
	CreatedAt    time.Time
}
