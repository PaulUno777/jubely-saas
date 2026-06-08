package loyalty

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type CreateCustomerByStaff struct {
	Tx          ports.TxManager
	Tenants     ports.TenantRepository
	Users       ports.UserRepository
	Memberships ports.TenantMembershipRepository
	Customers   ports.CustomerIdentityRepository
	Enrollments ports.LoyaltyEnrollmentRepository
	QRCodec     ports.QRCodec
}

type CreateCustomerByStaffInput struct {
	TenantID    uuid.UUID
	ActorUserID *uuid.UUID
	PhoneE164   string
	Name        string
	Email       *string
}

type CreateCustomerByStaffOutput struct {
	CustomerID   uuid.UUID
	EnrollmentID uuid.UUID
	CustomerQR   string
}

func (uc *CreateCustomerByStaff) Execute(ctx context.Context, in CreateCustomerByStaffInput) (*CreateCustomerByStaffOutput, error) {
	phone := strings.TrimSpace(in.PhoneE164)
	name := strings.TrimSpace(in.Name)
	if in.TenantID == uuid.Nil || name == "" || !isE164Phone(phone) {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}

	var email *string
	if in.Email != nil {
		e := strings.TrimSpace(strings.ToLower(*in.Email))
		if e != "" {
			email = &e
		}
	}

	var out *CreateCustomerByStaffOutput
	err := uc.Tx.WithinTx(ctx, func(ctx context.Context) error {
		tenant, err := uc.Tenants.FindByID(ctx, in.TenantID)
		if err != nil {
			return err
		}
		ci, err := uc.Customers.FindByPhoneE164(ctx, phone)
		if err != nil && !errors.Is(err, domain.ErrNotFound) {
			return err
		}
		if in.ActorUserID != nil && ci != nil && ci.UserID != nil && *ci.UserID == *in.ActorUserID && !tenant.AllowStaffSelfEnrollment {
			return fmt.Errorf("%w", domain.ErrSelfEnrollmentForbidden)
		}
		if ci == nil {
			now := time.Now().UTC()
			ci = &domain.CustomerIdentity{
				ID:        uuid.New(),
				PhoneE164: phone,
				Name:      name,
				Email:     email,
				CreatedAt: now,
			}
			if err := uc.Customers.Create(ctx, ci); err != nil {
				if errors.Is(err, domain.ErrConflict) {
					return fmt.Errorf("%w", domain.ErrConflict)
				}
				return err
			}
		}
		if in.ActorUserID != nil && email != nil && !tenant.AllowStaffSelfEnrollment {
			actor, err := uc.Users.FindByID(ctx, *in.ActorUserID)
			if err == nil && strings.EqualFold(actor.Email, *email) {
				return fmt.Errorf("%w", domain.ErrSelfEnrollmentForbidden)
			}
		}
		// Block staff from enrolling their own phone at the counter unless the store allows it.
		if in.ActorUserID != nil && !tenant.AllowStaffSelfEnrollment {
			actorCI, err := uc.Customers.FindByUserID(ctx, *in.ActorUserID)
			if err == nil && actorCI.PhoneE164 == phone {
				return fmt.Errorf("%w", domain.ErrSelfEnrollmentForbidden)
			}
			if err != nil && !errors.Is(err, domain.ErrNotFound) {
				return err
			}
		}

		existing, err := uc.Enrollments.FindByTenantAndCustomer(ctx, in.TenantID, ci.ID)
		if err != nil && !errors.Is(err, domain.ErrNotFound) {
			return err
		}
		if existing != nil {
			return fmt.Errorf("%w", domain.ErrConflict)
		}

		eid := uuid.New()
		now := time.Now().UTC()
		if err := uc.Enrollments.Create(ctx, &domain.LoyaltyEnrollment{
			ID:         eid,
			TenantID:   in.TenantID,
			CustomerID: ci.ID,
			Tier:       "bronze",
			CreatedAt:  now,
		}); err != nil {
			if errors.Is(err, domain.ErrConflict) {
				return fmt.Errorf("%w", domain.ErrConflict)
			}
			return err
		}

		qr, err := uc.QRCodec.SignCustomerQR(ctx, in.TenantID, ci.ID)
		if err != nil {
			return err
		}
		out = &CreateCustomerByStaffOutput{
			CustomerID:   ci.ID,
			EnrollmentID: eid,
			CustomerQR:   qr,
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return out, nil
}

func isE164Phone(phone string) bool {
	// Very small guardrail: must look like E.164 (+<digits>, min length).
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
