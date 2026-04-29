package authtoken

import (
	"context"
	"errors"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type JWTSigner struct {
	Secret []byte
	TTL    time.Duration
}

func (s *JWTSigner) SignAccessToken(_ context.Context, c ports.TokenClaims) (string, error) {
	now := time.Now().UTC()
	exp := now.Add(s.TTL)
	claims := jwt.MapClaims{
		"sub":   c.UserID.String(),
		"email": c.Email,
		"role":  c.Role.String(),
		"exp":   exp.Unix(),
		"iat":   now.Unix(),
	}
	if c.TenantID != nil {
		claims["tenant_id"] = c.TenantID.String()
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(s.Secret)
}

func (s *JWTSigner) ParseAccessToken(_ context.Context, token string) (ports.TokenClaims, error) {
	parsed, err := jwt.Parse(token, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return s.Secret, nil
	})
	if err != nil || !parsed.Valid {
		return ports.TokenClaims{}, domain.ErrUnauthorized
	}
	mc, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		return ports.TokenClaims{}, domain.ErrUnauthorized
	}
	sub, _ := mc["sub"].(string)
	uid, err := uuid.Parse(sub)
	if err != nil {
		return ports.TokenClaims{}, domain.ErrUnauthorized
	}
	email, _ := mc["email"].(string)
	roleStr, _ := mc["role"].(string)
	role := domain.Role(roleStr)

	var tenantID *uuid.UUID
	switch v := mc["tenant_id"].(type) {
	case string:
		id, err := uuid.Parse(v)
		if err != nil {
			return ports.TokenClaims{}, domain.ErrUnauthorized
		}
		tenantID = &id
	case nil:
		tenantID = nil
	default:
		return ports.TokenClaims{}, domain.ErrUnauthorized
	}

	return ports.TokenClaims{
		UserID:   uid,
		TenantID: tenantID,
		Role:     role,
		Email:    email,
	}, nil
}
