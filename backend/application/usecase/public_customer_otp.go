package usecase

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/memory"
)

// PublicCustomerOTP issues and checks SMS-style OTP codes for public enrollment (in-memory MVP; replace with SMS provider).
type PublicCustomerOTP struct {
	Store       *memory.PhoneOTPStore
	ProofSigner ports.PhoneEnrollmentProofSigner
	Clock       ports.Clock
	// CodeTTL is how long a sent code remains valid.
	CodeTTL time.Duration
}

type PublicCustomerOTPSendInput struct {
	PhoneE164 string
}

type PublicCustomerOTPVerifyInput struct {
	PhoneE164 string
	Code      string
}

type PublicCustomerOTPVerifyOutput struct {
	PhoneVerifyToken string
}

func (uc *PublicCustomerOTP) Send(ctx context.Context, in PublicCustomerOTPSendInput) error {
	if uc == nil || uc.Store == nil {
		return fmt.Errorf("%w", domain.ErrInvalid)
	}
	phone := strings.TrimSpace(in.PhoneE164)
	if !isE164PhoneEnroll(phone) {
		return fmt.Errorf("%w", domain.ErrInvalid)
	}
	code := strings.TrimSpace(os.Getenv("PUBLIC_OTP_DEV_CODE"))
	if code == "" {
		var err error
		code, err = memory.Random6Digit()
		if err != nil {
			return err
		}
	}
	ttl := uc.CodeTTL
	if ttl <= 0 {
		ttl = 10 * time.Minute
	}
	uc.Store.SetCode(phone, code, ttl)
	if os.Getenv("PUBLIC_OTP_LOG_CODE") == "true" {
		log.Printf("[PUBLIC_OTP] phone=%s code=%s", phone, code)
	}
	_ = ctx
	return nil
}

func (uc *PublicCustomerOTP) Verify(ctx context.Context, in PublicCustomerOTPVerifyInput) (*PublicCustomerOTPVerifyOutput, error) {
	if uc == nil || uc.Store == nil || uc.ProofSigner == nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	phone := strings.TrimSpace(in.PhoneE164)
	code := strings.TrimSpace(in.Code)
	if !isE164PhoneEnroll(phone) || len(code) < 4 || len(code) > 10 {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	if !uc.Store.TakeCode(phone, code) {
		return nil, fmt.Errorf("%w", domain.ErrUnauthorized)
	}
	tok, err := uc.ProofSigner.SignPhoneEnrollmentProof(ctx, phone)
	if err != nil {
		return nil, err
	}
	return &PublicCustomerOTPVerifyOutput{PhoneVerifyToken: tok}, nil
}
