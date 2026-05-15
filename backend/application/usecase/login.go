package usecase

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/google/uuid"
)

type Login struct {
	Tenants         ports.TenantRepository
	Users           ports.UserRepository
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
	Email      string
	Password   string
	TenantSlug string // empty => superadmin login
}

type LoginOutput struct {
	Step               string
	AccessToken        string
	RefreshToken       string
	ChallengeToken     string
	Methods            []string
	UserID             uuid.UUID
	TenantID           *uuid.UUID
	Role               domain.Role
	Email              string
	MustChangePassword bool
	// MFAEnrolledCount is enabled MFA factors for this user (TOTP + passkeys).
	MFAEnrolledCount int
}

func (uc *Login) Execute(ctx context.Context, in LoginInput) (*LoginOutput, error) {
	email := strings.TrimSpace(strings.ToLower(in.Email))
	if email == "" || in.Password == "" {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}

	var user *domain.User
	var err error
	if strings.TrimSpace(in.TenantSlug) == "" {
		user, err = uc.Users.FindSuperadminByEmail(ctx, email)
	} else {
		t, terr := uc.Tenants.FindBySlug(ctx, strings.TrimSpace(strings.ToLower(in.TenantSlug)))
		if terr != nil {
			return nil, terr
		}
		user, err = uc.Users.FindByTenantAndEmail(ctx, t.ID, email)
	}
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
			TenantID:           user.TenantID,
			Role:               user.Role,
			Email:              user.Email,
			MustChangePassword: user.MustChangePassword,
			MFAEnrolledCount:   mfaCount,
		}, nil
	}

	tok, err := uc.Signer.SignAccessToken(ctx, ports.TokenClaims{
		UserID:             user.ID,
		TenantID:           user.TenantID,
		Role:               user.Role,
		Email:              user.Email,
		MustChangePassword: user.MustChangePassword,
		MFAEnrolledCount:   mfaCount,
		Permissions:        domain.DefaultPermissionsForRole(user.Role),
	})
	if err != nil {
		return nil, err
	}

	var refresh string
	if uc.RefreshTokens != nil && uc.Clock != nil && uc.RefreshTTL > 0 {
		plain, hash, err := newRefreshToken()
		if err != nil {
			return nil, err
		}
		now := uc.Clock.Now()
		if err := uc.RefreshTokens.Create(ctx, ports.RefreshTokenCreateInput{
			ID:        uuid.New(),
			UserID:    user.ID,
			TokenHash: hash,
			UserAgent: "",
			IP:        nil,
			ExpiresAt: now.Add(uc.RefreshTTL),
		}); err != nil {
			return nil, err
		}
		refresh = plain
	}
	return &LoginOutput{
		Step:               "ok",
		AccessToken:        tok,
		RefreshToken:       refresh,
		UserID:             user.ID,
		TenantID:           user.TenantID,
		Role:               user.Role,
		Email:              user.Email,
		MustChangePassword: user.MustChangePassword,
		MFAEnrolledCount:   mfaCount,
	}, nil
}
