package httpserver

import (
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

type pwaEnrollByStoreQRBody struct {
	StoreQR   string  `json:"store_qr"`
	PhoneE164 string  `json:"phone_e164"`
	Name      string  `json:"name"`
	Email     *string `json:"email"`
}

func (s *Server) PWAEnrollByStoreQR(c *gin.Context) {
	var body pwaEnrollByStoreQRBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.EnrollByStoreQRUC.Execute(c.Request.Context(), usecase.EnrollByStoreQRInput{
		StoreQR:   body.StoreQR,
		PhoneE164: body.PhoneE164,
		Name:      body.Name,
		Email:     body.Email,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondCreated(c, gin.H{
		"tenant_id":     out.TenantID.String(),
		"customer_id":   out.CustomerID.String(),
		"enrollment_id": out.EnrollmentID.String(),
		"customer_qr":   out.CustomerQR,
	})
}
