package usecase

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
	"github.com/google/uuid"
)

type Login struct {
	Users           ports.UserRepository
	Memberships     ports.TenantMembershipRepository
	Customers       ports.CustomerIdentityRepository
	Catalog         *postgres.StoreCatalog
	Hasher          ports.PasswordHasher
	Signer          ports.TokenSigner
	RefreshTokens   ports.RefreshTokenRepository
	Factors         ports.MFAFactorRepository
	Clock           ports.Clock
	RefreshTTL      time.Duration
	MFAChallengeTTL time.Duration
	MFASigner       *authtoken.JWTSigner
}

type LoginInput struct {
	Email              string
	Password           string
	PreferredTenantSlug string
	UserAgent          string
	IP                 *string
}

type LoginOutput struct {
	Step               string
	AccessToken        string
	RefreshToken       string
	ChallengeToken     string
	Methods            []string
	UserID             uuid.UUID
	MembershipID       *uuid.UUID
	TenantID           *uuid.UUID
	Role               *domain.Role
	Email              string
	MustChangePassword bool
	// MFAEnrolledCount is enabled MFA factors for this user (TOTP + passkeys).
	MFAEnrolledCount int
	Workspaces       []domain.WorkspaceSummary
	CustomerID       *uuid.UUID
	ActiveEnrollmentID *uuid.UUID
	Enrollments      []domain.CustomerEnrollmentSummary
}

func (uc *Login) Execute(ctx context.Context, in LoginInput) (*LoginOutput, error) {
	email := strings.TrimSpace(strings.ToLower(in.Email))
	if email == "" || in.Password == "" {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}

	user, err := uc.Users.FindByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if err := uc.Hasher.Compare(user.PasswordHash, in.Password); err != nil {
		return nil, fmt.Errorf("%w", domain.ErrUnauthorized)
	}

	mfaCount := 0
	if uc.Factors != nil {
		if n, err := uc.Factors.CountEnabledByUser(ctx, user.ID); err != nil {
			return nil, err
		} else {
			mfaCount = int(n)
		}
	}

	if uc.Factors != nil && uc.MFASigner != nil && mfaCount > 0 {
		ttl := uc.MFAChallengeTTL
		if ttl <= 0 {
			ttl = 5 * time.Minute
		}
		tok, err := uc.MFASigner.SignMFAChallengeToken(ctx, authtoken.MFAChallengeClaims{
			UserID:  user.ID,
			Methods: []string{"totp", "passkey"},
		}, ttl)
		if err != nil {
			return nil, err
		}
		return &LoginOutput{
			Step:               "mfa_required",
			ChallengeToken:     tok,
			Methods:            []string{"totp", "passkey"},
			UserID:             user.ID,
			Email:              user.Email,
			MustChangePassword: user.MustChangePassword,
			MFAEnrolledCount:   mfaCount,
		}, nil
	}

	state, err := loadAuthSessionState(ctx, user, uc.Memberships, uc.Customers, uc.Catalog)
	if err != nil {
		return nil, err
	}
	state.MFAEnrolledCount = mfaCount
	preferredSlug := strings.TrimSpace(strings.ToLower(in.PreferredTenantSlug))
	var preferredMembershipID *uuid.UUID
	if ws := pickActiveWorkspace(state.Workspaces, nil, preferredSlug); ws != nil {
		preferredMembershipID = &ws.MembershipID
	}
	tok, refresh, claims, err := issueAuthSession(ctx, authSessionDependencies{
		Signer:        uc.Signer,
		RefreshTokens: uc.RefreshTokens,
		Memberships:   uc.Memberships,
		Customers:     uc.Customers,
		Catalog:       uc.Catalog,
		Clock:         uc.Clock,
		RefreshTTL:    uc.RefreshTTL,
	}, state, preferredMembershipID, nil, nil, false, in.UserAgent, in.IP)
	if err != nil {
		return nil, err
	}
	step := "ok"
	if claims.MembershipID == nil && !user.IsSuperadmin() && len(state.Workspaces) > 1 {
		step = "workspace_selection_required"
	}
	return &LoginOutput{
		Step:               step,
		AccessToken:        tok,
		RefreshToken:       refresh,
		UserID:             user.ID,
		MembershipID:       claims.MembershipID,
		TenantID:           claims.TenantID,
		Role:               claims.Role,
		Email:              user.Email,
		MustChangePassword: user.MustChangePassword,
		MFAEnrolledCount:   mfaCount,
		Workspaces:         claims.Workspaces,
		CustomerID:         claims.CustomerID,
		ActiveEnrollmentID: claims.ActiveEnrollmentID,
		Enrollments:        claims.Enrollments,
	}, nil
}
