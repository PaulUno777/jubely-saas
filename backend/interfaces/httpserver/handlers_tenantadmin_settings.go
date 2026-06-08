package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/presenter"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

func (s *Server) TenantGetSettings(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	t, err := s.GetTenantUC.Execute(c.Request.Context(), tenant.GetTenantInput{TenantID: &tenantID})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, presenter.Tenant(t))
}

type tenantPatchSettingsBody struct {
	Name                     *string          `json:"name"`
	ConflictPolicy           *string          `json:"conflict_policy"`
	AllowStaffSelfEnrollment *bool            `json:"allow_staff_self_enrollment"`
	Settings                 *json.RawMessage `json:"settings"`
}

func (s *Server) TenantPatchSettings(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	var body tenantPatchSettingsBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	if body.Name == nil && body.ConflictPolicy == nil && body.AllowStaffSelfEnrollment == nil && body.Settings == nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "no_fields"})
		return
	}
	out, err := s.UpdateTenantUC.Execute(c.Request.Context(), tenant.UpdateTenantInput{
		TenantID:                 tenantID,
		Name:                     body.Name,
		ConflictPolicy:           body.ConflictPolicy,
		AllowStaffSelfEnrollment: body.AllowStaffSelfEnrollment,
		Settings:                 body.Settings,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, presenter.Tenant(out.Tenant))
}

type tenantCreateInvitationBody struct {
	Email string `json:"email"`
	Role  string `json:"role"`
}

func (s *Server) TenantCreateInvitation(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	var body tenantCreateInvitationBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	role := domain.Role(body.Role)
	if role == "" {
		role = domain.RoleStaff
	}
	out, err := s.CreateInvitationUC.Execute(c.Request.Context(), tenant.CreateMerchantInvitationInput{
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
