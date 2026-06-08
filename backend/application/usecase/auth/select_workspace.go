package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
	"github.com/google/uuid"
)

type SelectWorkspace struct {
	Users         ports.UserRepository
	Memberships   ports.TenantMembershipRepository
	Customers     ports.CustomerIdentityRepository
	Catalog       *postgres.StoreCatalog
	Stores        ports.StoreRepository
	StoreMembers  ports.StoreMembershipRepository
	Subscriptions ports.SubscriptionRepository
	RefreshTokens ports.RefreshTokenRepository
	Signer        ports.TokenSigner
	Clock         ports.Clock
	RefreshTTL    time.Duration
}

type SelectWorkspaceInput struct {
	UserID             uuid.UUID
	MembershipID       uuid.UUID
	ActiveEnrollmentID *uuid.UUID
	ActiveStoreID      *uuid.UUID
	UserAgent          string
	IP                 *string
}

type SelectWorkspaceOutput struct {
	AccessToken        string
	RefreshToken       string
	UserID             uuid.UUID
	MembershipID       *uuid.UUID
	TenantID           *uuid.UUID
	Role               *domain.Role
	Email              string
	MustChangePassword bool
	Workspaces         []domain.WorkspaceSummary
	CustomerID         *uuid.UUID
	ActiveEnrollmentID *uuid.UUID
	Enrollments        []domain.CustomerEnrollmentSummary
}

func (uc *SelectWorkspace) Execute(ctx context.Context, in SelectWorkspaceInput) (*SelectWorkspaceOutput, error) {
	if in.UserID == uuid.Nil || in.MembershipID == uuid.Nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	user, err := uc.Users.FindByID(ctx, in.UserID)
	if err != nil {
		return nil, err
	}
	membership, err := uc.Memberships.FindByID(ctx, in.MembershipID)
	if err != nil {
		return nil, err
	}
	if membership.UserID != in.UserID || membership.Status != domain.MembershipStatusActive {
		return nil, fmt.Errorf("%w", domain.ErrForbidden)
	}
	state, err := loadAuthSessionState(ctx, user, uc.Memberships, uc.Customers, uc.Catalog)
	if err != nil {
		return nil, err
	}
	deps := authSessionDependencies{
		Signer:        uc.Signer,
		RefreshTokens: uc.RefreshTokens,
		Memberships:   uc.Memberships,
		Customers:     uc.Customers,
		Catalog:       uc.Catalog,
		Stores:        uc.Stores,
		StoreMembers:  uc.StoreMembers,
		Subscriptions: uc.Subscriptions,
		Clock:         uc.Clock,
		RefreshTTL:    uc.RefreshTTL,
	}
	access, refresh, claims, err := issueAuthSession(ctx, deps, state, &membership.ID, in.ActiveEnrollmentID, in.ActiveStoreID, false, in.UserAgent, in.IP)
	if err != nil {
		return nil, err
	}
	return &SelectWorkspaceOutput{
		AccessToken:        access,
		RefreshToken:       refresh,
		UserID:             user.ID,
		MembershipID:       claims.MembershipID,
		TenantID:           claims.TenantID,
		Role:               claims.Role,
		Email:              user.Email,
		MustChangePassword: user.MustChangePassword,
		Workspaces:         claims.Workspaces,
		CustomerID:         claims.CustomerID,
		ActiveEnrollmentID: claims.ActiveEnrollmentID,
		Enrollments:        claims.Enrollments,
	}, nil
}
