package httpserver

import (
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

type storeCreateInvitationBody struct {
	Email string `json:"email"`
	Role  string `json:"role"` // optional; defaults to staff for store admins
}

func (s *Server) StoreListUsers(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	offset, limit := parsePageQuery(c)
	out, err := s.ListTenantUsersUC.Execute(c.Request.Context(), usecase.ListTenantUsersInput{
		TenantID: *claims.TenantID,
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

func (s *Server) StoreCreateInvitation(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}

	var body storeCreateInvitationBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}

	role := domain.Role(body.Role)
	if role == "" {
		role = domain.RoleStaff
	}

	out, err := s.CreateInvitationUC.Execute(c.Request.Context(), usecase.CreateMerchantInvitationInput{
		TenantID: *claims.TenantID,
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
