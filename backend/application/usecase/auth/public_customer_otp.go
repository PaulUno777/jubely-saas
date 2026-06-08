package auth

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

type PublicCustomerOTPSendOutput struct {
	ID string
}

type PublicCustomerOTPVerifyInput struct {
	VerificationID string
	PhoneE164      string
	Code           string
}

type PublicCustomerOTPVerifyOutput struct {
	PhoneVerifyToken string
}

func (uc *PublicCustomerOTP) Send(ctx context.Context, in PublicCustomerOTPSendInput) (*PublicCustomerOTPSendOutput, error) {
	if uc == nil || uc.Store == nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	phone := strings.TrimSpace(in.PhoneE164)
	if !isE164PhoneEnroll(phone) {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	code := strings.TrimSpace(os.Getenv("PUBLIC_OTP_DEV_CODE"))
	if code == "" {
		var err error
		code, err = memory.Random6Digit()
		if err != nil {
			return nil, err
		}
	}
	ttl := uc.CodeTTL
	if ttl <= 0 {
		ttl = 10 * time.Minute
	}
	id := uc.Store.SetCode(phone, code, ttl)
	if os.Getenv("PUBLIC_OTP_LOG_CODE") == "true" {
		log.Printf("[PUBLIC_OTP] phone=%s code=%s id=%s", phone, code, id)
	}
	_ = ctx
	return &PublicCustomerOTPSendOutput{ID: id}, nil
}

func (uc *PublicCustomerOTP) Verify(ctx context.Context, in PublicCustomerOTPVerifyInput) (*PublicCustomerOTPVerifyOutput, error) {
	if uc == nil || uc.Store == nil || uc.ProofSigner == nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	code := strings.TrimSpace(in.Code)
	if len(code) < 4 || len(code) > 10 {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	var phone string
	if id := strings.TrimSpace(in.VerificationID); id != "" {
		var ok bool
		phone, ok = uc.Store.TakeCodeByID(id, code)
		if !ok {
			return nil, fmt.Errorf("%w", domain.ErrUnauthorized)
		}
	} else {
		phone = strings.TrimSpace(in.PhoneE164)
		if !isE164PhoneEnroll(phone) {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		if !uc.Store.TakeCode(phone, code) {
			return nil, fmt.Errorf("%w", domain.ErrUnauthorized)
		}
	}
	tok, err := uc.ProofSigner.SignPhoneEnrollmentProof(ctx, phone)
	if err != nil {
		return nil, err
	}
	return &PublicCustomerOTPVerifyOutput{PhoneVerifyToken: tok}, nil
}

func isE164PhoneEnroll(phone string) bool {
	if len(phone) < 10 || len(phone) > 32 {
		return false
	}
	if phone[0] != '+' {
		return false
	}
	digits := 0
	for i := 1; i < len(phone); i++ {
		c := phone[i]
		if c < '0' || c > '9' {
			return false
		}
		digits++
	}
	return digits >= 8
}
