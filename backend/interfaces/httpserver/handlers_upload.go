package httpserver

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
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

	out, err := s.UploadTenantLogoUC.Execute(c.Request.Context(), usecase.UploadTenantLogoInput{
		Filename:    fh.Filename,
		ContentType: fh.Header.Get("Content-Type"),
		Body:        src,
		Size:        fh.Size,
	})
	if err != nil {
		switch {
		case errors.Is(err, usecase.ErrUploadNotConfigured):
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

func (s *Server) PublicServeUpload(c *gin.Context) {
	root := strings.TrimSpace(s.AssetUploadDir)
	if root == "" {
		c.Status(http.StatusNotFound)
		return
	}
	raw := strings.TrimPrefix(c.Param("filepath"), "/")
	raw = strings.Trim(raw, "/")
	if raw == "" || strings.Contains(raw, "..") {
		c.Status(http.StatusNotFound)
		return
	}
	full := filepath.Join(root, filepath.FromSlash(raw))
	info, err := os.Stat(full)
	if err != nil || info.IsDir() {
		c.Status(http.StatusNotFound)
		return
	}
	rel, err := filepath.Rel(root, full)
	if err != nil || strings.HasPrefix(rel, "..") {
		c.Status(http.StatusNotFound)
		return
	}
	c.File(full)
}
