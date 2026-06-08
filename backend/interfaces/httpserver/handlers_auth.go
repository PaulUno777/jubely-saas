package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/auth"
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type bootstrapBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (s *Server) BootstrapSuperadmin(c *gin.Context) {
	var body bootstrapBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	err := s.BootstrapUC.Execute(c.Request.Context(), auth.BootstrapSuperadminInput{
		HeaderSecret: c.GetHeader("X-Bootstrap-Secret"),
		Email:        body.Email,
		Password:     body.Password,
	})
	if err != nil {
		respondMapped(c, mapBootstrapError(err))
		return
	}
	respondCreated(c, gin.H{"code": i18n.CodeBootstrapSuperadminCreated})
}

type loginBody struct {
	Email              string `json:"email"`
	Password           string `json:"password"`
	TenantSlug         string `json:"tenant_slug"`
}

func authDataFromResult(
	step string,
	accessToken string,
	refreshToken string,
	userID uuid.UUID,
	membershipID *uuid.UUID,
	tenantID *uuid.UUID,
	role *domain.Role,
	email string,
	mustChangePassword bool,
	workspaces []domain.WorkspaceSummary,
	customerID *uuid.UUID,
	activeEnrollmentID *uuid.UUID,
	enrollments []domain.CustomerEnrollmentSummary,
	mfa gin.H,
) gin.H {
	roleValue := any(nil)
	if role != nil {
		roleValue = role.String()
	}
	var membershipValue any
	if membershipID != nil {
		membershipValue = membershipID.String()
	}
	var customerValue any
	if customerID != nil {
		customerValue = customerID.String()
	}
	var enrollmentValue any
	if activeEnrollmentID != nil {
		enrollmentValue = activeEnrollmentID.String()
	}
	workspaceItems := make([]gin.H, 0, len(workspaces))
	for _, ws := range workspaces {
		workspaceItems = append(workspaceItems, gin.H{
			"membership_id": ws.MembershipID.String(),
			"tenant_id":     ws.TenantID.String(),
			"tenant_name":   ws.TenantName,
			"tenant_slug":   ws.TenantSlug,
			"role":          ws.Role.String(),
			"permissions":   ws.Permissions,
		})
	}
	enrollmentItems := make([]gin.H, 0, len(enrollments))
	for _, enrollment := range enrollments {
		enrollmentItems = append(enrollmentItems, gin.H{
			"enrollment_id":  enrollment.EnrollmentID.String(),
			"tenant_id":      enrollment.TenantID.String(),
			"tenant_name":    enrollment.TenantName,
			"tenant_slug":    enrollment.TenantSlug,
			"tier":           enrollment.Tier,
			"points_balance": enrollment.PointsBalance,
		})
	}
	out := gin.H{
		"step":                  step,
		"user_id":               userID.String(),
		"membership_id":         membershipValue,
		"tenant_id":             tenantID,
		"role":                  roleValue,
		"email":                 email,
		"must_change_password":  mustChangePassword,
		"workspaces":            workspaceItems,
		"customer_id":           customerValue,
		"active_enrollment_id":  enrollmentValue,
		"customer_enrollments":  enrollmentItems,
	}
	if accessToken != "" {
		out["access_token"] = accessToken
	}
	if refreshToken != "" {
		out["refresh_token"] = refreshToken
	}
	if mfa != nil {
		out["mfa"] = mfa
	}
	return out
}

func (s *Server) AuthLogin(c *gin.Context) {
	var body loginBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.LoginUC.Execute(c.Request.Context(), auth.LoginInput{
		Email:               body.Email,
		Password:            body.Password,
		PreferredTenantSlug: body.TenantSlug,
		UserAgent:           c.GetHeader("User-Agent"),
	})
	if err != nil {
		respondMapped(c, mapLoginError(err))
		return
	}
	if out.Step == "mfa_required" {
		respondOK(c, gin.H{
			"step":                 out.Step,
			"challenge_token":      out.ChallengeToken,
			"methods":              out.Methods,
			"user_id":              out.UserID.String(),
			"email":                out.Email,
			"must_change_password": out.MustChangePassword,
			"mfa": gin.H{
				"required":          true,
				"methods":           out.Methods,
				"enrolled_factors":  out.MFAEnrolledCount,
				"setup_recommended": false,
			},
		})
		return
	}
	respondOK(c, authDataFromResult(
		out.Step,
		out.AccessToken,
		out.RefreshToken,
		out.UserID,
		out.MembershipID,
		out.TenantID,
		out.Role,
		out.Email,
		out.MustChangePassword,
		out.Workspaces,
		out.CustomerID,
		out.ActiveEnrollmentID,
		out.Enrollments,
		gin.H{
			"required":          false,
			"methods":           []string{},
			"enrolled_factors":  out.MFAEnrolledCount,
			"setup_recommended": out.MFAEnrolledCount == 0,
		},
	))
}

type refreshBody struct {
	RefreshToken string `json:"refresh_token"`
}

type mfaTOTPVerifyBody struct {
	ChallengeToken string `json:"challenge_token"`
	Code           string `json:"code"`
}

func (s *Server) AuthMFATOTPVerify(c *gin.Context) {
	var body mfaTOTPVerifyBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.VerifyTOTPLoginUC.Execute(c.Request.Context(), auth.VerifyLoginTOTPInput{
		ChallengeToken: body.ChallengeToken,
		Code:           body.Code,
		UserAgent:      c.GetHeader("User-Agent"),
	})
	if err != nil {
		respondMapped(c, mapLoginError(err))
		return
	}
	respondOK(c, authDataFromResult(
		out.Step,
		out.AccessToken,
		out.RefreshToken,
		out.UserID,
		out.MembershipID,
		out.TenantID,
		out.Role,
		out.Email,
		out.MustChangePassword,
		out.Workspaces,
		out.CustomerID,
		out.ActiveEnrollmentID,
		out.Enrollments,
		gin.H{
			"required":          false,
			"methods":           []string{},
			"enrolled_factors":  1,
			"setup_recommended": false,
		},
	))
}

func (s *Server) AuthRefresh(c *gin.Context) {
	var body refreshBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.RefreshUC.Execute(c.Request.Context(), auth.RefreshAuthInput{
		RefreshToken: body.RefreshToken,
		UserAgent:    c.GetHeader("User-Agent"),
	})
	if err != nil {
		respondMapped(c, mapLoginError(err))
		return
	}
	respondOK(c, authDataFromResult(
		"ok",
		out.AccessToken,
		out.RefreshToken,
		out.UserID,
		out.MembershipID,
		out.TenantID,
		out.Role,
		out.Email,
		out.MustChangePassword,
		out.Workspaces,
		out.CustomerID,
		out.ActiveEnrollmentID,
		out.Enrollments,
		nil,
	))
}

func (s *Server) AuthLogout(c *gin.Context) {
	var body refreshBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	if err := s.LogoutUC.Execute(c.Request.Context(), auth.LogoutInput{RefreshToken: body.RefreshToken}); err != nil {
		respondMapped(c, mapLoginError(err))
		return
	}
	respondOK(c, gin.H{"ok": true})
}

type selectWorkspaceBody struct {
	MembershipID  string `json:"membership_id"`
	ActiveStoreID string `json:"active_store_id"`
}

func (s *Server) AuthSelectWorkspace(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	var body selectWorkspaceBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	membershipID, err := uuid.Parse(body.MembershipID)
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_membership_id"})
		return
	}
	var activeStoreID *uuid.UUID
	if body.ActiveStoreID != "" {
		id, err := uuid.Parse(body.ActiveStoreID)
		if err != nil {
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_store_id"})
			return
		}
		activeStoreID = &id
	}
	out, err := s.SelectWorkspaceUC.Execute(c.Request.Context(), auth.SelectWorkspaceInput{
		UserID:             claims.UserID,
		MembershipID:       membershipID,
		ActiveEnrollmentID: claims.ActiveEnrollmentID,
		ActiveStoreID:      activeStoreID,
		UserAgent:          c.GetHeader("User-Agent"),
	})
	if err != nil {
		respondMapped(c, mapLoginError(err))
		return
	}
	respondOK(c, authDataFromResult("ok", out.AccessToken, out.RefreshToken, out.UserID, out.MembershipID, out.TenantID, out.Role, out.Email, out.MustChangePassword, out.Workspaces, out.CustomerID, out.ActiveEnrollmentID, out.Enrollments, nil))
}
