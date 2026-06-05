package httpserver

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (s *Server) signEnrollmentStoreQR(c *gin.Context, organizationID uuid.UUID) (string, error) {
	if s.Stores == nil {
		return s.QRCodec.SignStoreQR(c.Request.Context(), organizationID, uuid.Nil)
	}
	hq, err := s.Stores.FindHQ(c.Request.Context(), organizationID)
	if err != nil {
		return "", err
	}
	return s.QRCodec.SignStoreQR(c.Request.Context(), organizationID, hq.ID)
}
