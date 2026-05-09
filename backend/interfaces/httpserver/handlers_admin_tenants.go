package httpserver

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func tenantToGin(t *domain.Tenant) gin.H {
	var settings any
	if len(t.Settings) > 0 && json.Valid(t.Settings) {
		_ = json.Unmarshal(t.Settings, &settings)
	}
	if settings == nil {
		settings = map[string]any{}
	}
	logoURL := ""
	if m, ok := settings.(map[string]any); ok {
		if v, ok := m["logo_url"].(string); ok {
			logoURL = v
		}
	}
	return gin.H{
		"tenant_id":       t.ID.String(),
		"name":            t.Name,
		"slug":            t.Slug,
		"self_serve":      t.SelfServe,
		"active":          t.Active,
		"plan":            t.Plan,
		"conflict_policy": t.ConflictPolicy,
		"settings":        settings,
		"logo_url":        logoURL,
		"created_at":      t.CreatedAt,
		"updated_at":      t.UpdatedAt,
	}
}

func parsePageQuery(c *gin.Context) (offset, limit int) {
	limit, _ = strconv.Atoi(c.Query("limit"))
	offset, _ = strconv.Atoi(c.Query("offset"))
	return offset, limit
}

func (s *Server) AdminListTenants(c *gin.Context) {
	offset, limit := parsePageQuery(c)
	out, err := s.ListTenantsUC.Execute(c.Request.Context(), usecase.ListTenantsInput{Offset: offset, Limit: limit})
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	items := make([]gin.H, 0, len(out.Tenants))
	for i := range out.Tenants {
		items = append(items, tenantToGin(&out.Tenants[i]))
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
	t, err := s.Tenants.FindByID(c.Request.Context(), id)
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, tenantToGin(t))
}

type patchTenantBody struct {
	Name           *string          `json:"name"`
	Active         *bool            `json:"active"`
	Plan           *string          `json:"plan"`
	ConflictPolicy *string          `json:"conflict_policy"`
	Settings       *json.RawMessage `json:"settings"`
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
	if body.Name == nil && body.Active == nil && body.Plan == nil && body.ConflictPolicy == nil && body.Settings == nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "no_fields"})
		return
	}
	out, err := s.UpdateTenantUC.Execute(c.Request.Context(), usecase.UpdateTenantInput{
		TenantID:       id,
		Name:           body.Name,
		Active:         body.Active,
		Plan:           body.Plan,
		ConflictPolicy: body.ConflictPolicy,
		Settings:       body.Settings,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, tenantToGin(out.Tenant))
}

func userPublicToGin(u domain.UserPublic) gin.H {
	return gin.H{
		"user_id":    u.ID.String(),
		"email":      u.Email,
		"role":       u.Role.String(),
		"created_at": u.CreatedAt,
	}
}

func (s *Server) AdminListTenantUsers(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenantId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_tenant_id"})
		return
	}
	offset, limit := parsePageQuery(c)
	out, err := s.ListTenantUsersUC.Execute(c.Request.Context(), usecase.ListTenantUsersInput{
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
		items = append(items, userPublicToGin(u))
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
	out, err := s.CreateTenantUserUC.Execute(c.Request.Context(), usecase.CreateTenantUserInput{
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
