package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/presenter"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (s *Server) TenantUploadRewardImage(c *gin.Context) {
	if s.UploadRewardImageUC == nil {
		respondError(c, http.StatusServiceUnavailable, i18n.CodeInternal, gin.H{"reason": "upload_not_configured"})
		return
	}
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	rewardID, err := uuid.Parse(c.Param("rewardId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_reward_id"})
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
	out, err := s.UploadRewardImageUC.Execute(c.Request.Context(), loyalty.UploadRewardImageInput{
		TenantID:    tenantID,
		RewardID:    rewardID,
		Filename:    fh.Filename,
		ContentType: fh.Header.Get("Content-Type"),
		Body:        src,
		Size:        fh.Size,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, gin.H{"image_url": out.ImageURL, "reward": presenter.Reward(*out.Reward)})
}

func (s *Server) TenantRenderQR(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	var locationID *uuid.UUID
	if raw := strings.TrimSpace(c.Query("location_id")); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_location_id"})
			return
		}
		locationID = &id
	}
	token, err := s.GetEnrollmentQRUC.Execute(c.Request.Context(), loyalty.GetEnrollmentQRInput{
		TenantID:   tenantID,
		LocationID: locationID,
	})
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	accent := strings.TrimSpace(c.DefaultQuery("accent", "#C89B3C"))
	size := strings.TrimSpace(c.DefaultQuery("size", "256"))
	svg := `<?xml version="1.0" encoding="UTF-8"?>` +
		`<svg xmlns="http://www.w3.org/2000/svg" width="` + size + `" height="` + size + `" viewBox="0 0 256 256">` +
		`<rect width="256" height="256" fill="white"/>` +
		`<rect x="16" y="16" width="224" height="224" fill="none" stroke="` + accent + `" stroke-width="8"/>` +
		`<text x="128" y="128" text-anchor="middle" font-family="monospace" font-size="10" fill="` + accent + `">` + token + `</text>` +
		`</svg>`
	c.Data(http.StatusOK, "image/svg+xml; charset=utf-8", []byte(svg))
}
