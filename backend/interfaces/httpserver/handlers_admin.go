package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type createTenantBody struct {
	Name      string           `json:"name"`
	Slug      string           `json:"slug"`
	SelfServe bool             `json:"self_serve"`
	Plan      string           `json:"plan"`
	Settings  *json.RawMessage `json:"settings"`
}

func (s *Server) AdminCreateTenant(c *gin.Context) {
	var body createTenantBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	// MVP Option 2: enforce self-serve off until Phase 3 explicitly enables it per tenant.
	body.SelfServe = false

	out, err := s.CreateTenantUC.Execute(c.Request.Context(), usecase.CreateTenantInput{
		Name:      body.Name,
		Slug:      body.Slug,
		SelfServe: body.SelfServe,
		Plan:      body.Plan,
		Settings:  body.Settings,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondCreated(c, tenantToGin(out.Tenant))
}

type createInvitationBody struct {
	Email string `json:"email"`
	Role  string `json:"role"`
}

func (s *Server) AdminCreateMerchantInvitation(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenantId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_tenant_id"})
		return
	}
	var body createInvitationBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
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
		respondMapped(c, mapTenantError(err))
		return
	}
	respondCreated(c, gin.H{
		"invitation_id": out.InvitationID.String(),
		"token":         out.Token,
		"expires_at":    out.ExpiresAt,
	})
}

func (s *Server) AdminGetStoreQR(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenantId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_tenant_id"})
		return
	}
	if _, err := s.Tenants.FindByID(c.Request.Context(), tenantID); err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	token, err := s.signEnrollmentStoreQR(c, tenantID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	respondOK(c, gin.H{"store_qr": token})
}
