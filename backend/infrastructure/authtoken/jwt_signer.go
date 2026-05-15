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
		"sub":    c.UserID.String(),
		"email":  c.Email,
		"role":   c.Role.String(),
		"exp":    exp.Unix(),
		"iat":    now.Unix(),
		"mcp":    c.MustChangePassword,
		"mfa_ec": c.MFAEnrolledCount,
	}
	if c.TenantID != nil {
		claims["tenant_id"] = c.TenantID.String()
	}
	if len(c.Permissions) > 0 {
		arr := make([]any, len(c.Permissions))
		for i, p := range c.Permissions {
			arr[i] = p
		}
		claims["perms"] = arr
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
	mustChange := false
	switch v := mc["mcp"].(type) {
	case bool:
		mustChange = v
	case nil:
		mustChange = false
	default:
		// tolerate numeric 0/1 from some JWT libs
		if f, ok := v.(float64); ok && f != 0 {
			mustChange = true
		}
	}

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

	mfaEnrolled := 0
	switch v := mc["mfa_ec"].(type) {
	case float64:
		mfaEnrolled = int(v)
	case int:
		mfaEnrolled = v
	case int64:
		mfaEnrolled = int(v)
	case nil:
		mfaEnrolled = 0
	default:
		if f, ok := v.(float32); ok {
			mfaEnrolled = int(f)
		}
	}

	var perms []string
	if raw, ok := mc["perms"]; ok && raw != nil {
		switch arr := raw.(type) {
		case []any:
			for _, v := range arr {
				if s, ok := v.(string); ok && s != "" {
					perms = append(perms, s)
				}
			}
		}
	}

	return ports.TokenClaims{
		UserID:             uid,
		TenantID:           tenantID,
		Role:               role,
		Email:              email,
		MustChangePassword: mustChange,
		MFAEnrolledCount:   mfaEnrolled,
		Permissions:        perms,
	}, nil
}

const jwtTypPhoneEnroll = "phone_enroll"

// SignPhoneEnrollmentProof issues a short-lived JWT proving ownership of phone_e164 (after OTP verify).
func (s *JWTSigner) SignPhoneEnrollmentProof(_ context.Context, phoneE164 string) (string, error) {
	now := time.Now().UTC()
	exp := now.Add(15 * time.Minute)
	claims := jwt.MapClaims{
		"typ":        jwtTypPhoneEnroll,
		"phone_e164": phoneE164,
		"exp":        exp.Unix(),
		"iat":        now.Unix(),
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(s.Secret)
}

// ParsePhoneEnrollmentProof validates a token from SignPhoneEnrollmentProof.
func (s *JWTSigner) ParsePhoneEnrollmentProof(_ context.Context, token string) (string, error) {
	parsed, err := jwt.Parse(token, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return s.Secret, nil
	})
	if err != nil || !parsed.Valid {
		return "", domain.ErrUnauthorized
	}
	mc, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		return "", domain.ErrUnauthorized
	}
	typ, _ := mc["typ"].(string)
	if typ != jwtTypPhoneEnroll {
		return "", domain.ErrUnauthorized
	}
	phone, _ := mc["phone_e164"].(string)
	if phone == "" {
		return "", domain.ErrUnauthorized
	}
	return phone, nil
}
