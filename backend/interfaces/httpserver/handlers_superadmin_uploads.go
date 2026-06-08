package httpserver

import (
	"errors"
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

const maxTenantLogoUploadBytes = 2 << 20

func (s *Server) AdminUploadTenantLogo(c *gin.Context) {
	if s.UploadTenantLogoUC == nil {
		respondError(c, http.StatusServiceUnavailable, i18n.CodeInternal, gin.H{"reason": "upload_not_configured"})
		return
	}

	if err := c.Request.ParseMultipartForm(maxTenantLogoUploadBytes); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_multipart"})
		return
	}
	fh, err := c.FormFile("file")
	if err != nil || fh == nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "missing_file"})
		return
	}
	src, err := fh.Open()
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "open_file"})
		return
	}
	defer func() { _ = src.Close() }()

	out, err := s.UploadTenantLogoUC.Execute(c.Request.Context(), tenant.UploadTenantLogoInput{
		Filename:    fh.Filename,
		ContentType: fh.Header.Get("Content-Type"),
		Body:        src,
		Size:        fh.Size,
	})
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrUploadNotConfigured):
			respondError(c, http.StatusServiceUnavailable, i18n.CodeInternal, gin.H{"reason": "upload_not_configured"})
		case errors.Is(err, domain.ErrInvalid):
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_file"})
		default:
			respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		}
		return
	}
	respondOK(c, gin.H{"url": out.PublicURL})
}
