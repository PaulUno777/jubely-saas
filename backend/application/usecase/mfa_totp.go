package usecase

import (
	"context"
	"fmt"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/security"
	"github.com/google/uuid"
	"github.com/pquerna/otp/totp"
)

type SetupTOTP struct {
	Factors ports.MFAFactorRepository
	Clock   ports.Clock
	Key     []byte // 32 bytes
	Issuer  string
}

type SetupTOTPInput struct {
	UserID uuid.UUID
	Label  *string
	Email  string
}

type SetupTOTPOutput struct {
	FactorID   uuid.UUID
	SecretB32  string
	OTPAuthURL string
}

func (uc *SetupTOTP) Execute(ctx context.Context, in SetupTOTPInput) (*SetupTOTPOutput, error) {
	if in.UserID == uuid.Nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	issuer := uc.Issuer
	if strings.TrimSpace(issuer) == "" {
		issuer = "Jubely"
	}
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      issuer,
		AccountName: strings.TrimSpace(in.Email),
	})
	if err != nil {
		return nil, err
	}
	secret := key.Secret()
	enc, err := security.EncryptAESGCM(uc.Key, []byte(secret))
	if err != nil {
		return nil, err
	}
	id := uuid.New()
	now := uc.Clock.Now()
	if err := uc.Factors.CreateTOTP(ctx, ports.CreateTOTPFactorInput{
		ID:        id,
		UserID:    in.UserID,
		Label:     in.Label,
		SecretEnc: enc,
		CreatedAt: now,
	}); err != nil {
		return nil, err
	}
	return &SetupTOTPOutput{
		FactorID:   id,
		SecretB32:  secret,
		OTPAuthURL: key.URL(),
	}, nil
}

type ConfirmTOTP struct {
	Factors ports.MFAFactorRepository
	Clock   ports.Clock
	Key     []byte
}

type ConfirmTOTPInput struct {
	UserID   uuid.UUID
	FactorID uuid.UUID
	Code     string
}

func (uc *ConfirmTOTP) Execute(ctx context.Context, in ConfirmTOTPInput) error {
	code := strings.TrimSpace(in.Code)
	if in.UserID == uuid.Nil || in.FactorID == uuid.Nil || code == "" {
		return fmt.Errorf("%w", domain.ErrInvalid)
	}
	f, err := uc.Factors.FindByID(ctx, in.FactorID)
	if err != nil {
		return err
	}
	if f.UserID != in.UserID {
		return fmt.Errorf("%w", domain.ErrForbidden)
	}
	if f.Type != ports.MFAFactorTOTP {
		return fmt.Errorf("%w", domain.ErrInvalid)
	}
	plain, err := security.DecryptAESGCM(uc.Key, f.SecretEnc)
	if err != nil {
		return fmt.Errorf("%w", domain.ErrUnauthorized)
	}
	if !totp.Validate(code, string(plain)) {
		return fmt.Errorf("%w", domain.ErrUnauthorized)
	}
	return uc.Factors.Enable(ctx, in.FactorID, uc.Clock.Now())
}
