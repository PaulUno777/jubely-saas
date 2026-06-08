package httpserver

import (
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/presenter"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

func (s *Server) TenantListAgents(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
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
	respondPage(c, gin.H{"agents": items}, Pagination{Limit: out.Limit, Offset: out.Offset, Total: int(out.Total)})
}
