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
	"github.com/google/uuid"
)

type RefreshAuth struct {
	Users         ports.UserRepository
	RefreshTokens ports.RefreshTokenRepository
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
	TenantID           *uuid.UUID
	Role               domain.Role
	Email              string
	MustChangePassword bool
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

	return &RefreshAuthOutput{
		AccessToken:        access,
		RefreshToken:       plain,
		UserID:             user.ID,
		TenantID:           user.TenantID,
		Role:               user.Role,
		Email:              user.Email,
		MustChangePassword: user.MustChangePassword,
	}, nil
}
