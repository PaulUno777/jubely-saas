package httpserver

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/presenter"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func parsePageQuery(c *gin.Context) (offset, limit int) {
	limit, _ = strconv.Atoi(c.Query("limit"))
	offset, _ = strconv.Atoi(c.Query("offset"))
	return offset, limit
}

func parseTimeRangeQuery(c *gin.Context) (from, to *time.Time) {
	if s := strings.TrimSpace(c.Query("from")); s != "" {
		if t, err := time.Parse(time.RFC3339, s); err == nil {
			utc := t.UTC()
			from = &utc
		}
	}
	if s := strings.TrimSpace(c.Query("to")); s != "" {
		if t, err := time.Parse(time.RFC3339, s); err == nil {
			utc := t.UTC()
			to = &utc
		}
	}
	return from, to
}

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
	body.SelfServe = false

	out, err := s.CreateTenantUC.Execute(c.Request.Context(), tenant.CreateTenantInput{
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
	respondCreated(c, presenter.Tenant(out.Tenant))
}

func (s *Server) AdminListTenants(c *gin.Context) {
	offset, limit := parsePageQuery(c)
	out, err := s.ListTenantsUC.Execute(c.Request.Context(), tenant.ListTenantsInput{Offset: offset, Limit: limit})
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	items := make([]gin.H, 0, len(out.Tenants))
	for i := range out.Tenants {
		items = append(items, presenter.Tenant(&out.Tenants[i]))
	}
	respondPage(c, items, Pagination{
		Limit:  out.Limit,
		Offset: out.Offset,
		Total:  int(out.Total),
	})
}

func (s *Server) AdminGetTenant(c *gin.Context) {
	id, err := uuid.Parse(c.Param("tenantId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_tenant_id"})
		return
	}
	t, err := s.GetTenantUC.Execute(c.Request.Context(), tenant.GetTenantInput{TenantID: &id})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, presenter.Tenant(t))
}

type patchTenantBody struct {
	Name                     *string          `json:"name"`
	Active                   *bool            `json:"active"`
	Plan                     *string          `json:"plan"`
	ConflictPolicy           *string          `json:"conflict_policy"`
	AllowStaffSelfEnrollment *bool            `json:"allow_staff_self_enrollment"`
	Settings                 *json.RawMessage `json:"settings"`
}

func (s *Server) AdminPatchTenant(c *gin.Context) {
	id, err := uuid.Parse(c.Param("tenantId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_tenant_id"})
		return
	}
	var body patchTenantBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	if body.Name == nil && body.Active == nil && body.Plan == nil && body.ConflictPolicy == nil && body.AllowStaffSelfEnrollment == nil && body.Settings == nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "no_fields"})
		return
	}
	out, err := s.UpdateTenantUC.Execute(c.Request.Context(), tenant.UpdateTenantInput{
		TenantID:                 id,
		Name:                     body.Name,
		Active:                   body.Active,
		Plan:                     body.Plan,
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

func (s *Server) AdminListTenantUsers(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenantId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_tenant_id"})
		return
	}
	offset, limit := parsePageQuery(c)
	out, err := s.ListTenantUsersUC.Execute(c.Request.Context(), tenant.ListTenantUsersInput{
		TenantID: tenantID,
		Offset:   offset,
		Limit:    limit,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	items := make([]gin.H, 0, len(out.Users))
	for _, u := range out.Users {
		items = append(items, presenter.UserPublic(u))
	}
	respondPage(c, items, Pagination{
		Limit:  out.Limit,
		Offset: out.Offset,
		Total:  int(out.Total),
	})
}

type createTenantUserBody struct {
	Email        string  `json:"email"`
	Role         string  `json:"role"`
	TempPassword *string `json:"temp_password"`
}

func (s *Server) AdminCreateTenantUser(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenantId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_tenant_id"})
		return
	}
	var body createTenantUserBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	role := domain.Role(strings.TrimSpace(strings.ToLower(body.Role)))
	out, err := s.CreateTenantUserUC.Execute(c.Request.Context(), tenant.CreateTenantUserInput{
		TenantID:     tenantID,
		Email:        body.Email,
		Role:         role,
		TempPassword: body.TempPassword,
	})
	if err != nil {
		respondMapped(c, mapPublicInvitationError(err))
		return
	}
	respondCreated(c, gin.H{
		"user_id":       out.UserID.String(),
		"temp_password": out.TempPassword,
	})
}
