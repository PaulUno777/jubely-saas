package usecase

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/security"
	"github.com/google/uuid"
	"github.com/pquerna/otp/totp"
)

type VerifyLoginTOTP struct {
	Users         ports.UserRepository
	Factors       ports.MFAFactorRepository
	RefreshTokens ports.RefreshTokenRepository
	Signer        ports.TokenSigner
	MFASigner     *authtoken.JWTSigner
	Clock         ports.Clock
	RefreshTTL    time.Duration
	Key           []byte
}

type VerifyLoginTOTPInput struct {
	ChallengeToken string
	Code           string
	UserAgent      string
	IP             *string
}

type VerifyLoginTOTPOutput struct {
	AccessToken        string
	RefreshToken       string
	UserID             uuid.UUID
	TenantID           *uuid.UUID
	Role               domain.Role
	Email              string
	MustChangePassword bool
}

func (uc *VerifyLoginTOTP) Execute(ctx context.Context, in VerifyLoginTOTPInput) (*VerifyLoginTOTPOutput, error) {
	code := strings.TrimSpace(in.Code)
	ct := strings.TrimSpace(in.ChallengeToken)
	if code == "" || ct == "" || uc.MFASigner == nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	claims, err := uc.MFASigner.ParseMFAChallengeToken(ctx, ct)
	if err != nil {
		return nil, err
	}
	user, err := uc.Users.FindByID(ctx, claims.UserID)
	if err != nil {
		return nil, err
	}
	factors, err := uc.Factors.ListEnabledTOTPByUser(ctx, user.ID)
	if err != nil {
		return nil, err
	}
	ok := false
	for _, f := range factors {
		if len(f.SecretEnc) == 0 {
			continue
		}
		plain, err := security.DecryptAESGCM(uc.Key, f.SecretEnc)
		if err != nil {
			continue
		}
		if totp.Validate(code, string(plain)) {
			ok = true
			break
		}
	}
	if !ok {
		return nil, fmt.Errorf("%w", domain.ErrUnauthorized)
	}

	access, err := uc.Signer.SignAccessToken(ctx, ports.TokenClaims{
		UserID:             user.ID,
		TenantID:           user.TenantID,
		Role:               user.Role,
		Email:              user.Email,
		MustChangePassword: user.MustChangePassword,
	})
	if err != nil {
		return nil, err
	}
	refreshPlain, refreshHash, err := newRefreshToken()
	if err != nil {
		return nil, err
	}
	now := uc.Clock.Now()
	if err := uc.RefreshTokens.Create(ctx, ports.RefreshTokenCreateInput{
		ID:        uuid.New(),
		UserID:    user.ID,
		TokenHash: refreshHash,
		UserAgent: in.UserAgent,
		IP:        in.IP,
		ExpiresAt: now.Add(uc.RefreshTTL),
	}); err != nil {
		return nil, err
	}

	return &VerifyLoginTOTPOutput{
		AccessToken:        access,
		RefreshToken:       refreshPlain,
		UserID:             user.ID,
		TenantID:           user.TenantID,
		Role:               user.Role,
		Email:              user.Email,
		MustChangePassword: user.MustChangePassword,
	}, nil
}

type FinishLoginPasskey struct {
	Users         ports.UserRepository
	RefreshTokens ports.RefreshTokenRepository
	Signer        ports.TokenSigner
	MFASigner     *authtoken.JWTSigner
	Clock         ports.Clock
	RefreshTTL    time.Duration
	PasskeyAuth   *FinishPasskeyAuthentication
}

type FinishLoginPasskeyInput struct {
	ChallengeToken string
	ChallengeID    uuid.UUID
	Request        *http.Request
	UserAgent      string
	IP             *string
}

type FinishLoginPasskeyOutput struct {
	AccessToken        string
	RefreshToken       string
	UserID             uuid.UUID
	TenantID           *uuid.UUID
	Role               domain.Role
	Email              string
	MustChangePassword bool
}

func (uc *FinishLoginPasskey) Execute(ctx context.Context, in FinishLoginPasskeyInput) (*FinishLoginPasskeyOutput, error) {
	ct := strings.TrimSpace(in.ChallengeToken)
	if ct == "" || in.ChallengeID == uuid.Nil || in.Request == nil || uc.MFASigner == nil || uc.PasskeyAuth == nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	claims, err := uc.MFASigner.ParseMFAChallengeToken(ctx, ct)
	if err != nil {
		return nil, err
	}
	if _, err := uc.PasskeyAuth.Execute(ctx, FinishPasskeyAuthenticationInput{
		UserID:      claims.UserID,
		ChallengeID: in.ChallengeID,
		Request:     in.Request,
	}); err != nil {
		return nil, err
	}
	user, err := uc.Users.FindByID(ctx, claims.UserID)
	if err != nil {
		return nil, err
	}
	access, err := uc.Signer.SignAccessToken(ctx, ports.TokenClaims{
		UserID:             user.ID,
		TenantID:           user.TenantID,
		Role:               user.Role,
		Email:              user.Email,
		MustChangePassword: user.MustChangePassword,
	})
	if err != nil {
		return nil, err
	}
	refreshPlain, refreshHash, err := newRefreshToken()
	if err != nil {
		return nil, err
	}
	now := uc.Clock.Now()
	if err := uc.RefreshTokens.Create(ctx, ports.RefreshTokenCreateInput{
		ID:        uuid.New(),
		UserID:    user.ID,
		TokenHash: refreshHash,
		UserAgent: in.UserAgent,
		IP:        in.IP,
		ExpiresAt: now.Add(uc.RefreshTTL),
	}); err != nil {
		return nil, err
	}
	return &FinishLoginPasskeyOutput{
		AccessToken:        access,
		RefreshToken:       refreshPlain,
		UserID:             user.ID,
		TenantID:           user.TenantID,
		Role:               user.Role,
		Email:              user.Email,
		MustChangePassword: user.MustChangePassword,
	}, nil
}
