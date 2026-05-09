package httpserver

import (
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

func (s *Server) SuperadminStats(c *gin.Context) {
	out, err := s.SuperadminStatsUC.Execute(c.Request.Context())
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	respondOK(c, gin.H{
		"tenants_total":        out.TenantsTotal,
		"tenants_active":       out.TenantsActive,
		"tenants_trial_active": out.TenantsTrialActive,
		"alerts":               out.Alerts,
	})
}
