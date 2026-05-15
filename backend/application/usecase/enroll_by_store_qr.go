package usecase

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

// EnrollByStoreQR enrolls an existing or new global customer identity into a tenant by scanning the store QR.
// MVP flow: PWA scans store QR, then submits phone + name (and optional email).
type EnrollByStoreQR struct {
	Tx                       ports.TxManager
	Clock                    ports.Clock
	Tenants                  ports.TenantRepository
	Customers                ports.CustomerIdentityRepository
	Enrollments              ports.LoyaltyEnrollmentRepository
	QRCodec                  ports.QRCodec
	PhoneProofParser         ports.PhoneEnrollmentProofParser
	RequirePhoneVerification bool
}

type EnrollByStoreQRInput struct {
	StoreQR          string
	PhoneE164        string
	Name             string
	Email            *string
	PhoneVerifyToken string
}

type EnrollByStoreQROutput struct {
	TenantID     uuid.UUID
	CustomerID   uuid.UUID
	EnrollmentID uuid.UUID
	CustomerQR   string
}

func (uc *EnrollByStoreQR) Execute(ctx context.Context, in EnrollByStoreQRInput) (*EnrollByStoreQROutput, error) {
	storeQR := strings.TrimSpace(in.StoreQR)
	phone := strings.TrimSpace(in.PhoneE164)
	name := strings.TrimSpace(in.Name)
	if storeQR == "" || phone == "" || name == "" || !isE164PhoneEnroll(phone) {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}

	if uc.RequirePhoneVerification {
		if strings.TrimSpace(in.PhoneVerifyToken) == "" {
			return nil, fmt.Errorf("%w", domain.ErrUnauthorized)
		}
	}
	if tok := strings.TrimSpace(in.PhoneVerifyToken); tok != "" {
		if uc.PhoneProofParser == nil {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		proved, err := uc.PhoneProofParser.ParsePhoneEnrollmentProof(ctx, tok)
		if err != nil || proved != phone {
			return nil, fmt.Errorf("%w", domain.ErrUnauthorized)
		}
	}

	var email *string
	if in.Email != nil {
		e := strings.TrimSpace(strings.ToLower(*in.Email))
		if e != "" {
			email = &e
		}
	}

	tenantID, err := uc.QRCodec.ParseStoreQR(ctx, storeQR)
	if err != nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	if _, err := uc.Tenants.FindByID(ctx, tenantID); err != nil {
		return nil, err
	}

	var out EnrollByStoreQROutput
	err = uc.Tx.WithinTx(ctx, func(ctx context.Context) error {
		ci, err := uc.Customers.FindByPhoneE164(ctx, phone)
		if err != nil && !errors.Is(err, domain.ErrNotFound) {
			return err
		}

		now := uc.Clock.Now()
		if ci == nil {
			ci = &domain.CustomerIdentity{
				ID:        uuid.New(),
				PhoneE164: phone,
				Name:      name,
				Email:     email,
				CreatedAt: now,
			}
			if err := uc.Customers.Create(ctx, ci); err != nil {
				return err
			}
		}

		existing, err := uc.Enrollments.FindByTenantAndCustomer(ctx, tenantID, ci.ID)
		if err != nil && !errors.Is(err, domain.ErrNotFound) {
			return err
		}
		if existing != nil {
			return fmt.Errorf("%w", domain.ErrConflict)
		}

		e := &domain.LoyaltyEnrollment{
			ID:         uuid.New(),
			TenantID:   tenantID,
			CustomerID: ci.ID,
			Tier:       "bronze",
			CreatedAt:  now,
		}
		if err := uc.Enrollments.Create(ctx, e); err != nil {
			return err
		}

		qr, err := uc.QRCodec.SignCustomerQR(ctx, tenantID, ci.ID)
		if err != nil {
			return err
		}

		out = EnrollByStoreQROutput{
			TenantID:     tenantID,
			CustomerID:   ci.ID,
			EnrollmentID: e.ID,
			CustomerQR:   qr,
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &out, nil
}

// Keep util local (KISS) until it needs sharing.
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
