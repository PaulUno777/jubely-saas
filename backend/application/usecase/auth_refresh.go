package usecase

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
	"github.com/google/uuid"
)

type RefreshAuth struct {
	Users         ports.UserRepository
	RefreshTokens ports.RefreshTokenRepository
	Memberships   ports.TenantMembershipRepository
	Customers     ports.CustomerIdentityRepository
	Catalog       *postgres.StoreCatalog
	Factors       ports.MFAFactorRepository
	Signer        ports.TokenSigner
	Clock         ports.Clock
	TTL           time.Duration
}

type RefreshAuthInput struct {
	RefreshToken string
	UserAgent    string
	IP           *string
}

type RefreshAuthOutput struct {
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

func newRefreshToken() (plain string, hash []byte, err error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", nil, err
	}
	plain = base64.RawURLEncoding.EncodeToString(b)
	sum := sha256.Sum256([]byte(plain))
	return plain, sum[:], nil
}

func (uc *RefreshAuth) Execute(ctx context.Context, in RefreshAuthInput) (*RefreshAuthOutput, error) {
	rt := in.RefreshToken
	if rt == "" {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	sum := sha256.Sum256([]byte(rt))
	existing, err := uc.RefreshTokens.FindActiveByHash(ctx, sum[:])
	if err != nil {
		if err == domain.ErrNotFound {
			return nil, fmt.Errorf("%w", domain.ErrUnauthorized)
		}
		return nil, err
	}

	user, err := uc.Users.FindByID(ctx, existing.UserID)
	if err != nil {
		return nil, err
	}

	now := uc.Clock.Now()
	_ = uc.RefreshTokens.RevokeByHash(ctx, sum[:], now)

	plain, hash, err := newRefreshToken()
	if err != nil {
		return nil, err
	}
	if err := uc.RefreshTokens.Create(ctx, ports.RefreshTokenCreateInput{
		ID:        uuid.New(),
		UserID:    user.ID,
		TokenHash: hash,
		UserAgent: in.UserAgent,
		IP:        in.IP,
		ExpiresAt: now.Add(uc.TTL),
	}); err != nil {
		return nil, err
	}

	mfaEnrolled := 0
	if uc.Factors != nil {
		n, err := uc.Factors.CountEnabledByUser(ctx, user.ID)
		if err != nil {
			return nil, err
		}
		mfaEnrolled = int(n)
	}

	state, err := loadAuthSessionState(ctx, user, uc.Memberships, uc.Customers, uc.Catalog)
	if err != nil {
		return nil, err
	}
	state.MFAEnrolledCount = mfaEnrolled
	access, _, claims, err := issueAuthSession(ctx, authSessionDependencies{
		Signer:        uc.Signer,
		RefreshTokens: uc.RefreshTokens,
		Memberships:   uc.Memberships,
		Customers:     uc.Customers,
		Catalog:       uc.Catalog,
		Clock:         uc.Clock,
		RefreshTTL:    uc.TTL,
	}, state, existing.ActiveMembershipID, existing.ActiveEnrollmentID, nil, true, in.UserAgent, in.IP)
	if err != nil {
		return nil, err
	}

	return &RefreshAuthOutput{
		AccessToken:        access,
		RefreshToken:       plain,
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
