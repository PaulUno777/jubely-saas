package usecase

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
	"github.com/google/uuid"
)

type CustomerLogin struct {
	Tx               ports.TxManager
	Users            ports.UserRepository
	Customers        ports.CustomerIdentityRepository
	Memberships      ports.TenantMembershipRepository
	RefreshTokens    ports.RefreshTokenRepository
	Signer           ports.TokenSigner
	PhoneProofParser ports.PhoneEnrollmentProofParser
	Catalog          *postgres.StoreCatalog
	Clock            ports.Clock
	RefreshTTL       time.Duration
}

type CustomerLoginInput struct {
	PhoneVerifyToken string
	UserAgent        string
	IP               *string
}

type CustomerLoginOutput struct {
	AccessToken        string
	RefreshToken       string
	UserID             uuid.UUID
	Role               *domain.Role
	Email              string
	CustomerID         *uuid.UUID
	ActiveEnrollmentID *uuid.UUID
	Enrollments        []domain.CustomerEnrollmentSummary
	Workspaces         []domain.WorkspaceSummary
}

func (uc *CustomerLogin) Execute(ctx context.Context, in CustomerLoginInput) (*CustomerLoginOutput, error) {
	if uc.PhoneProofParser == nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	phone, err := uc.PhoneProofParser.ParsePhoneEnrollmentProof(ctx, strings.TrimSpace(in.PhoneVerifyToken))
	if err != nil {
		return nil, err
	}

	var user *domain.User
	var customer *domain.CustomerIdentity
	err = uc.Tx.WithinTx(ctx, func(ctx context.Context) error {
		customer, err = uc.Customers.FindByPhoneE164(ctx, phone)
		if err != nil && !errors.Is(err, domain.ErrNotFound) {
			return err
		}
		if customer == nil {
			now := uc.Clock.Now()
			customer = &domain.CustomerIdentity{
				ID:        uuid.New(),
				PhoneE164: phone,
				Name:      phone,
				CreatedAt: now,
			}
			if err := uc.Customers.Create(ctx, customer); err != nil {
				return err
			}
		}
		if customer.UserID != nil {
			user, err = uc.Users.FindByID(ctx, *customer.UserID)
			return err
		}
		if customer.Email != nil && strings.TrimSpace(*customer.Email) != "" {
			user, err = uc.Users.FindByEmail(ctx, *customer.Email)
			if err != nil && !errors.Is(err, domain.ErrNotFound) {
				return err
			}
		}
		if user == nil {
			user = &domain.User{
				ID:           uuid.New(),
				Email:        makePlaceholderCustomerEmail(customer.ID),
				PasswordHash: "",
				Role:         domain.RoleCustomer,
			}
			if err := uc.Users.Create(ctx, user); err != nil {
				return err
			}
		}
		if err := uc.Customers.AssignUser(ctx, customer.ID, user.ID); err != nil && !errors.Is(err, domain.ErrConflict) {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	state, err := loadAuthSessionState(ctx, user, uc.Memberships, uc.Customers, uc.Catalog)
	if err != nil {
		return nil, err
	}
	access, refresh, claims, err := issueAuthSession(ctx, authSessionDependencies{
		Signer:        uc.Signer,
		RefreshTokens: uc.RefreshTokens,
		Memberships:   uc.Memberships,
		Customers:     uc.Customers,
		Catalog:       uc.Catalog,
		Clock:         uc.Clock,
		RefreshTTL:    uc.RefreshTTL,
	}, state, nil, nil, true, in.UserAgent, in.IP)
	if err != nil {
		return nil, err
	}
	return &CustomerLoginOutput{
		AccessToken:        access,
		RefreshToken:       refresh,
		UserID:             user.ID,
		Role:               claims.Role,
		Email:              user.Email,
		CustomerID:         claims.CustomerID,
		ActiveEnrollmentID: claims.ActiveEnrollmentID,
		Enrollments:        claims.Enrollments,
		Workspaces:         claims.Workspaces,
	}, nil
}

type SelectCustomerContext struct {
	Users         ports.UserRepository
	Memberships   ports.TenantMembershipRepository
	Customers     ports.CustomerIdentityRepository
	Catalog       *postgres.StoreCatalog
	RefreshTokens ports.RefreshTokenRepository
	Signer        ports.TokenSigner
	Clock         ports.Clock
	RefreshTTL    time.Duration
}

type SelectCustomerContextInput struct {
	UserID             uuid.UUID
	EnrollmentID       uuid.UUID
	ActiveMembershipID *uuid.UUID
	UserAgent          string
	IP                 *string
}

type SelectCustomerContextOutput struct {
	AccessToken        string
	RefreshToken       string
	UserID             uuid.UUID
	Role               *domain.Role
	Email              string
	CustomerID         *uuid.UUID
	ActiveEnrollmentID *uuid.UUID
	Enrollments        []domain.CustomerEnrollmentSummary
	Workspaces         []domain.WorkspaceSummary
}

func (uc *SelectCustomerContext) Execute(ctx context.Context, in SelectCustomerContextInput) (*SelectCustomerContextOutput, error) {
	if in.UserID == uuid.Nil || in.EnrollmentID == uuid.Nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	user, err := uc.Users.FindByID(ctx, in.UserID)
	if err != nil {
		return nil, err
	}
	state, err := loadAuthSessionState(ctx, user, uc.Memberships, uc.Customers, uc.Catalog)
	if err != nil {
		return nil, err
	}
	found := false
	for _, enrollment := range state.Enrollments {
		if enrollment.EnrollmentID == in.EnrollmentID {
			found = true
			break
		}
	}
	if !found {
		return nil, fmt.Errorf("%w", domain.ErrForbidden)
	}
	access, refresh, claims, err := issueAuthSession(ctx, authSessionDependencies{
		Signer:        uc.Signer,
		RefreshTokens: uc.RefreshTokens,
		Memberships:   uc.Memberships,
		Customers:     uc.Customers,
		Catalog:       uc.Catalog,
		Clock:         uc.Clock,
		RefreshTTL:    uc.RefreshTTL,
	}, state, nil, &in.EnrollmentID, true, in.UserAgent, in.IP)
	if err != nil {
		return nil, err
	}
	return &SelectCustomerContextOutput{
		AccessToken:        access,
		RefreshToken:       refresh,
		UserID:             user.ID,
		Role:               claims.Role,
		Email:              user.Email,
		CustomerID:         claims.CustomerID,
		ActiveEnrollmentID: claims.ActiveEnrollmentID,
		Enrollments:        claims.Enrollments,
		Workspaces:         claims.Workspaces,
	}, nil
}
