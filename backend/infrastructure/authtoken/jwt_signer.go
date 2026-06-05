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
		"exp":    exp.Unix(),
		"iat":    now.Unix(),
		"mcp":    c.MustChangePassword,
		"mfa_ec": c.MFAEnrolledCount,
	}
	if c.Role != nil {
		claims["role"] = c.Role.String()
	}
	if c.MembershipID != nil {
		claims["membership_id"] = c.MembershipID.String()
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
	if c.CustomerID != nil {
		claims["customer_id"] = c.CustomerID.String()
	}
	if c.ActiveEnrollmentID != nil {
		claims["active_enrollment_id"] = c.ActiveEnrollmentID.String()
	}
	if c.ActiveStoreID != nil {
		claims["active_store_id"] = c.ActiveStoreID.String()
	}
	if c.SubscriptionStatus != "" {
		claims["subscription_status"] = c.SubscriptionStatus
	}
	if len(c.Workspaces) > 0 {
		items := make([]any, 0, len(c.Workspaces))
		for _, ws := range c.Workspaces {
			perms := make([]any, 0, len(ws.Permissions))
			for _, p := range ws.Permissions {
				perms = append(perms, p)
			}
			items = append(items, map[string]any{
				"membership_id": ws.MembershipID.String(),
				"tenant_id":     ws.TenantID.String(),
				"tenant_name":   ws.TenantName,
				"tenant_slug":   ws.TenantSlug,
				"role":          ws.Role.String(),
				"permissions":   perms,
			})
		}
		claims["workspaces"] = items
	}
	if len(c.Enrollments) > 0 {
		items := make([]any, 0, len(c.Enrollments))
		for _, enrollment := range c.Enrollments {
			items = append(items, map[string]any{
				"enrollment_id": enrollment.EnrollmentID.String(),
				"tenant_id":     enrollment.TenantID.String(),
				"tenant_name":   enrollment.TenantName,
				"tenant_slug":   enrollment.TenantSlug,
				"tier":          enrollment.Tier,
				"points_balance": enrollment.PointsBalance,
			})
		}
		claims["enrollments"] = items
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
	var role *domain.Role
	if roleStr != "" {
		r := domain.Role(roleStr)
		role = &r
	}
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

	var membershipID *uuid.UUID
	switch v := mc["membership_id"].(type) {
	case string:
		id, err := uuid.Parse(v)
		if err != nil {
			return ports.TokenClaims{}, domain.ErrUnauthorized
		}
		membershipID = &id
	case nil:
	default:
		return ports.TokenClaims{}, domain.ErrUnauthorized
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

	var customerID *uuid.UUID
	switch v := mc["customer_id"].(type) {
	case string:
		id, err := uuid.Parse(v)
		if err != nil {
			return ports.TokenClaims{}, domain.ErrUnauthorized
		}
		customerID = &id
	case nil:
	default:
		return ports.TokenClaims{}, domain.ErrUnauthorized
	}

	var activeEnrollmentID *uuid.UUID
	switch v := mc["active_enrollment_id"].(type) {
	case string:
		id, err := uuid.Parse(v)
		if err != nil {
			return ports.TokenClaims{}, domain.ErrUnauthorized
		}
		activeEnrollmentID = &id
	case nil:
	default:
		return ports.TokenClaims{}, domain.ErrUnauthorized
	}

	var workspaces []domain.WorkspaceSummary
	if raw, ok := mc["workspaces"].([]any); ok {
		for _, item := range raw {
			m, ok := item.(map[string]any)
			if !ok {
				continue
			}
			membershipStr, _ := m["membership_id"].(string)
			tenantStr, _ := m["tenant_id"].(string)
			roleStr, _ := m["role"].(string)
			membershipUUID, err := uuid.Parse(membershipStr)
			if err != nil {
				continue
			}
			tenantUUID, err := uuid.Parse(tenantStr)
			if err != nil {
				continue
			}
			role := domain.Role(roleStr)
			ws := domain.WorkspaceSummary{
				MembershipID: membershipUUID,
				TenantID:     tenantUUID,
				TenantName:   stringValue(m["tenant_name"]),
				TenantSlug:   stringValue(m["tenant_slug"]),
				Role:         role,
			}
			if rawPerms, ok := m["permissions"].([]any); ok {
				for _, perm := range rawPerms {
					if s, ok := perm.(string); ok && s != "" {
						ws.Permissions = append(ws.Permissions, s)
					}
				}
			}
			workspaces = append(workspaces, ws)
		}
	}

	var enrollments []domain.CustomerEnrollmentSummary
	if raw, ok := mc["enrollments"].([]any); ok {
		for _, item := range raw {
			m, ok := item.(map[string]any)
			if !ok {
				continue
			}
			enrollmentStr, _ := m["enrollment_id"].(string)
			tenantStr, _ := m["tenant_id"].(string)
			enrollmentUUID, err := uuid.Parse(enrollmentStr)
			if err != nil {
				continue
			}
			tenantUUID, err := uuid.Parse(tenantStr)
			if err != nil {
				continue
			}
			summary := domain.CustomerEnrollmentSummary{
				EnrollmentID: enrollmentUUID,
				TenantID:     tenantUUID,
				TenantName:   stringValue(m["tenant_name"]),
				TenantSlug:   stringValue(m["tenant_slug"]),
				Tier:         stringValue(m["tier"]),
			}
			if v, ok := m["points_balance"].(float64); ok {
				summary.PointsBalance = int64(v)
			}
			enrollments = append(enrollments, summary)
		}
	}

	var activeStoreID *uuid.UUID
	switch v := mc["active_store_id"].(type) {
	case string:
		id, err := uuid.Parse(v)
		if err != nil {
			return ports.TokenClaims{}, domain.ErrUnauthorized
		}
		activeStoreID = &id
	case nil:
	default:
		return ports.TokenClaims{}, domain.ErrUnauthorized
	}

	subscriptionStatus, _ := mc["subscription_status"].(string)

	return ports.TokenClaims{
		UserID:             uid,
		MembershipID:       membershipID,
		TenantID:           tenantID,
		Role:               role,
		Email:              email,
		MustChangePassword: mustChange,
		MFAEnrolledCount:   mfaEnrolled,
		Permissions:        perms,
		Workspaces:         workspaces,
		CustomerID:         customerID,
		ActiveEnrollmentID: activeEnrollmentID,
		Enrollments:        enrollments,
		ActiveStoreID:      activeStoreID,
		SubscriptionStatus: subscriptionStatus,
	}, nil
}

func stringValue(v any) string {
	if s, ok := v.(string); ok {
		return s
	}
	return ""
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
