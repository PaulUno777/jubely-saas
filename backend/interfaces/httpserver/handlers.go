package httpserver

import (
	"crypto/sha256"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Server struct {
	BootstrapUC        *usecase.BootstrapSuperadmin
	LoginUC            *usecase.Login
	CreateTenantUC     *usecase.CreateTenant
	CreateInvitationUC *usecase.CreateMerchantInvitation
	AcceptInvitationUC *usecase.AcceptMerchantInvitation

	Tenants     *postgres.TenantRepository
	Invitations *postgres.InvitationRepository
}

func (s *Server) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"status": "ok"}})
}

type bootstrapBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (s *Server) BootstrapSuperadmin(c *gin.Context) {
	var body bootstrapBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid)
		return
	}
	err := s.BootstrapUC.Execute(c.Request.Context(), usecase.BootstrapSuperadminInput{
		HeaderSecret: c.GetHeader("X-Bootstrap-Secret"),
		Email:        body.Email,
		Password:     body.Password,
	})
	if err != nil {
		st, code := mapBootstrapError(err)
		respondError(c, st, code)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": gin.H{"code": i18n.CodeBootstrapSuperadminCreated}})
}

type loginBody struct {
	Email      string `json:"email"`
	Password   string `json:"password"`
	TenantSlug string `json:"tenant_slug"`
}

func (s *Server) AuthLogin(c *gin.Context) {
	var body loginBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid)
		return
	}
	out, err := s.LoginUC.Execute(c.Request.Context(), usecase.LoginInput{
		Email:      body.Email,
		Password:   body.Password,
		TenantSlug: body.TenantSlug,
	})
	if err != nil {
		st, code := mapLoginError(err)
		respondError(c, st, code)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"access_token": out.AccessToken,
			"user_id":      out.UserID.String(),
			"tenant_id":    out.TenantID,
			"role":         out.Role.String(),
			"email":        out.Email,
		},
	})
}

type createTenantBody struct {
	Name      string `json:"name"`
	Slug      string `json:"slug"`
	SelfServe bool   `json:"self_serve"`
}

func (s *Server) AdminCreateTenant(c *gin.Context) {
	var body createTenantBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid)
		return
	}
	// MVP Option 2: enforce self-serve off until Phase 3 explicitly enables it per tenant.
	body.SelfServe = false

	out, err := s.CreateTenantUC.Execute(c.Request.Context(), usecase.CreateTenantInput{
		Name:      body.Name,
		Slug:      body.Slug,
		SelfServe: body.SelfServe,
	})
	if err != nil {
		st, code := mapTenantError(err)
		respondError(c, st, code)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": gin.H{
		"tenant_id":  out.Tenant.ID.String(),
		"name":       out.Tenant.Name,
		"slug":       out.Tenant.Slug,
		"self_serve": out.Tenant.SelfServe,
	}})
}

type createInvitationBody struct {
	Email string `json:"email"`
	Role  string `json:"role"`
}

func (s *Server) AdminCreateMerchantInvitation(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenantId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid)
		return
	}
	var body createInvitationBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid)
		return
	}
	role := domain.Role(body.Role)
	if role == "" {
		role = domain.RoleMerchantAdmin
	}

	out, err := s.CreateInvitationUC.Execute(c.Request.Context(), usecase.CreateMerchantInvitationInput{
		TenantID: tenantID,
		Email:    body.Email,
		Role:     role,
	})
	if err != nil {
		st, code := mapTenantError(err)
		respondError(c, st, code)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": gin.H{
		"invitation_id": out.InvitationID.String(),
		"token":         out.Token,
		"expires_at":    out.ExpiresAt,
	}})
}

func (s *Server) InvitationPreview(c *gin.Context) {
	token := strings.TrimSpace(c.Param("token"))
	if token == "" {
		respondError(c, http.StatusBadRequest, i18n.CodeInvitationInvalid)
		return
	}
	sum := sha256.Sum256([]byte(token))
	inv, err := s.Invitations.FindByTokenHash(c.Request.Context(), sum[:])
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			respondError(c, http.StatusBadRequest, i18n.CodeInvitationInvalid)
			return
		}
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal)
		return
	}
	now := time.Now().UTC()
	if inv.AcceptedAt != nil {
		c.JSON(http.StatusOK, gin.H{"data": gin.H{"valid": false, "code": i18n.CodeInvitationAlreadyAccepted}})
		return
	}
	if !now.Before(inv.ExpiresAt) {
		c.JSON(http.StatusOK, gin.H{"data": gin.H{"valid": false, "code": i18n.CodeInvitationExpired}})
		return
	}
	t, err := s.Tenants.FindByID(c.Request.Context(), inv.TenantID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"valid":        true,
		"tenant_name":  t.Name,
		"email_masked": maskEmail(inv.Email),
		"expires_at":   inv.ExpiresAt,
		"role":         inv.Role.String(),
	}})
}

type acceptInvitationBody struct {
	Password string `json:"password"`
}

func (s *Server) PostAcceptInvitation(c *gin.Context) {
	token := strings.TrimSpace(c.Param("token"))
	var body acceptInvitationBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid)
		return
	}
	out, err := s.AcceptInvitationUC.Execute(c.Request.Context(), usecase.AcceptMerchantInvitationInput{
		Token:    token,
		Password: body.Password,
	})
	if err != nil {
		st, code := mapPublicInvitationError(err)
		respondError(c, st, code)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": gin.H{
		"user_id":   out.UserID.String(),
		"tenant_id": out.TenantID.String(),
	}})
}

func maskEmail(email string) string {
	email = strings.TrimSpace(strings.ToLower(email))
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return "***"
	}
	name := parts[0]
	domainPart := parts[1]
	if name == "" {
		return "***@" + domainPart
	}
	if len(name) == 1 {
		return "*" + "***@" + domainPart
	}
	return string(name[0]) + "***@" + domainPart
}

// Claims is a helper for handlers that will be added in later phases.
func Claims(c *gin.Context) (ports.TokenClaims, bool) {
	raw, ok := c.Get(ginKeyAuthClaims)
	if !ok {
		return ports.TokenClaims{}, false
	}
	claims, ok := raw.(ports.TokenClaims)
	return claims, ok
}
