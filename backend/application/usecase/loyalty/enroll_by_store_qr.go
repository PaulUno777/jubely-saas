package loyalty

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/rules"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/billing"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

// EnrollByStoreQR enrolls an existing or new global customer identity into a tenant by scanning the store QR.
// MVP flow: PWA scans store QR, then submits phone + name (and optional email).
type EnrollByStoreQR struct {
	Tx                       ports.TxManager
	Clock                    ports.Clock
	Tenants                  ports.TenantRepository
	Users                    ports.UserRepository
	Memberships              ports.TenantMembershipRepository
	Customers                ports.CustomerIdentityRepository
	Enrollments              ports.LoyaltyEnrollmentRepository
	Stores                   ports.StoreRepository
	Subscriptions            ports.SubscriptionRepository
	Rules                    ports.PointsRuleRepository
	Points                   ports.PointEventWriter
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
	AuthUserID       *uuid.UUID
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

	tenantID, storeID, err := uc.QRCodec.ParseStoreQR(ctx, storeQR)
	if err != nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	tenant, err := uc.Tenants.FindByID(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	if uc.Subscriptions != nil && uc.Clock != nil {
		sub, err := uc.Subscriptions.FindByOrganization(ctx, tenantID)
		if err != nil {
			return nil, err
		}
		if !billing.SubscriptionAllowsWrites(sub, uc.Clock.Now().UTC()) {
			return nil, fmt.Errorf("%w", domain.ErrSubscriptionInactive)
		}
	}
	if storeID == uuid.Nil && uc.Stores != nil {
		hq, err := uc.Stores.FindHQ(ctx, tenantID)
		if err != nil {
			return nil, err
		}
		storeID = hq.ID
	}
	if uc.Stores != nil && storeID != uuid.Nil {
		st, err := uc.Stores.FindByID(ctx, tenantID, storeID)
		if err != nil {
			return nil, err
		}
		if st.Status != domain.StoreStatusOpen {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
	}

	var out EnrollByStoreQROutput
	err = uc.Tx.WithinTx(ctx, func(ctx context.Context) error {
		ci, err := uc.Customers.FindByPhoneE164(ctx, phone)
		if err != nil && !errors.Is(err, domain.ErrNotFound) {
			return err
		}
		if in.AuthUserID != nil && ci != nil && ci.UserID != nil && *ci.UserID == *in.AuthUserID && !tenant.AllowStaffSelfEnrollment {
			if _, err := uc.Memberships.FindByUserAndTenant(ctx, *in.AuthUserID, tenantID); err == nil {
				return fmt.Errorf("%w", domain.ErrSelfEnrollmentForbidden)
			} else if !errors.Is(err, domain.ErrNotFound) {
				return err
			}
		}

		now := uc.Clock.Now()
		if ci == nil {
			ci = &domain.CustomerIdentity{
				ID:        uuid.New(),
				UserID:    in.AuthUserID,
				PhoneE164: phone,
				Name:      name,
				Email:     email,
				CreatedAt: now,
			}
			if err := uc.Customers.Create(ctx, ci); err != nil {
				return err
			}
		}
		if in.AuthUserID != nil {
			if _, err := uc.Memberships.FindByUserAndTenant(ctx, *in.AuthUserID, tenantID); err == nil && !tenant.AllowStaffSelfEnrollment {
				return fmt.Errorf("%w", domain.ErrSelfEnrollmentForbidden)
			} else if err != nil && !errors.Is(err, domain.ErrNotFound) {
				return err
			}
			if ci.UserID == nil {
				if err := uc.Customers.AssignUser(ctx, ci.ID, *in.AuthUserID); err != nil && !errors.Is(err, domain.ErrConflict) {
					return err
				}
				ci.UserID = in.AuthUserID
			}
		} else if ci.UserID == nil && email != nil && uc.Users != nil {
			if user, err := uc.Users.FindByEmail(ctx, *email); err == nil {
				if err := uc.Customers.AssignUser(ctx, ci.ID, user.ID); err != nil && !errors.Is(err, domain.ErrConflict) {
					return err
				}
				uid := user.ID
				ci.UserID = &uid
			} else if !errors.Is(err, domain.ErrNotFound) {
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

		var homeStoreID *uuid.UUID
		if storeID != uuid.Nil {
			homeStoreID = &storeID
		}
		var enrollmentLocID *uuid.UUID
		if storeID != uuid.Nil {
			enrollmentLocID = &storeID
		}
		e := &domain.LoyaltyEnrollment{
			ID:                   uuid.New(),
			TenantID:             tenantID,
			CustomerID:           ci.ID,
			Tier:                 "bronze",
			HomeStoreID:          homeStoreID,
			EnrollmentSource:     domain.EnrollmentSourceQRScan,
			EnrollmentLocationID: enrollmentLocID,
			Status:               domain.EnrollmentStatusActive.String(),
			CreatedAt:            now,
		}
		if err := uc.Enrollments.Create(ctx, e); err != nil {
			return err
		}

		if uc.Rules != nil && uc.Points != nil {
			evalOut, err := EvaluateEnrollmentPoints(ctx, uc.Rules, tenantID, e.Tier, now.UTC())
			if err == nil && evalOut.Total > 0 {
				ruleIDs := enrollRuleUUIDs(rules.AppliedRuleIDs(evalOut.Trace))
				payload, _ := json.Marshal(map[string]any{
					"event_type": "enroll_bonus",
					"rules_eval": evalOut,
				})
				_ = uc.Points.AppendAt(ctx, tenantID, enrollmentLocID, &e.ID, "earn", evalOut.Total, payload, now.UTC(), ruleIDs)
			}
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
func enrollRuleUUIDs(ids []string) []uuid.UUID {
	out := make([]uuid.UUID, 0, len(ids))
	for _, id := range ids {
		if u, err := uuid.Parse(id); err == nil {
			out = append(out, u)
		}
	}
	return out
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
