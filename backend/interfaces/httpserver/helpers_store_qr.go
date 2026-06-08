package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (s *Server) signEnrollmentStoreQR(c *gin.Context, organizationID uuid.UUID) (string, error) {
	return s.GetEnrollmentQRUC.Execute(c.Request.Context(), loyalty.GetEnrollmentQRInput{
		TenantID: organizationID,
	})
}
