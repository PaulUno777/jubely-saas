package authtoken

import (
	"context"
	"errors"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type MFAChallengeClaims struct {
	UserID  uuid.UUID
	Methods []string
}

func (s *JWTSigner) SignMFAChallengeToken(_ context.Context, c MFAChallengeClaims, ttl time.Duration) (string, error) {
	now := time.Now().UTC()
	exp := now.Add(ttl)
	methods := make([]any, 0, len(c.Methods))
	for _, m := range c.Methods {
		methods = append(methods, m)
	}
	claims := jwt.MapClaims{
		"sub":         c.UserID.String(),
		"scope":       "mfa",
		"mfa_methods": methods,
		"exp":         exp.Unix(),
		"iat":         now.Unix(),
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(s.Secret)
}

func (s *JWTSigner) ParseMFAChallengeToken(_ context.Context, token string) (MFAChallengeClaims, error) {
	parsed, err := jwt.Parse(token, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return s.Secret, nil
	})
	if err != nil || !parsed.Valid {
		return MFAChallengeClaims{}, domain.ErrUnauthorized
	}
	mc, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		return MFAChallengeClaims{}, domain.ErrUnauthorized
	}
	scope, _ := mc["scope"].(string)
	if scope != "mfa" {
		return MFAChallengeClaims{}, domain.ErrUnauthorized
	}
	sub, _ := mc["sub"].(string)
	uid, err := uuid.Parse(sub)
	if err != nil {
		return MFAChallengeClaims{}, domain.ErrUnauthorized
	}
	var methods []string
	if raw, ok := mc["mfa_methods"].([]any); ok {
		for _, v := range raw {
			if s, ok := v.(string); ok && s != "" {
				methods = append(methods, s)
			}
		}
	}
	return MFAChallengeClaims{UserID: uid, Methods: methods}, nil
}
