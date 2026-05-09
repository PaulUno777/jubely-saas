package httpserver

import (
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

// Pagination is included in meta for list endpoints.
type Pagination struct {
	Limit  int `json:"limit"`
	Offset int `json:"offset"`
	Total  int `json:"total"`
}

func localeFromGin(c *gin.Context) i18n.Locale {
	raw, ok := c.Get(ginKeyAPILocale)
	if !ok {
		return i18n.LocaleEN
	}
	s, ok := raw.(string)
	if !ok {
		return i18n.LocaleEN
	}
	switch s {
	case string(i18n.LocaleFR):
		return i18n.LocaleFR
	default:
		return i18n.LocaleEN
	}
}

func requestIDFromGin(c *gin.Context) string {
	raw, ok := c.Get(ginKeyAPIRequestID)
	if !ok {
		return ""
	}
	s, ok := raw.(string)
	if !ok {
		return ""
	}
	return s
}

func metaBlock(c *gin.Context) gin.H {
	return gin.H{
		"request_id": requestIDFromGin(c),
		"locale":     string(localeFromGin(c)),
	}
}

func metaBlockWithPagination(c *gin.Context, p Pagination) gin.H {
	m := metaBlock(c)
	m["pagination"] = p
	return m
}

func respondOK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, gin.H{"data": data, "meta": metaBlock(c)})
}

func respondCreated(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, gin.H{"data": data, "meta": metaBlock(c)})
}

func respondPage(c *gin.Context, data any, p Pagination) {
	c.JSON(http.StatusOK, gin.H{"data": data, "meta": metaBlockWithPagination(c, p)})
}

// respondError returns a standardized error envelope with optional machine-safe details.
func respondError(c *gin.Context, httpStatus int, code string, details any) {
	loc := localeFromGin(c)
	msg := i18n.Translate(loc, code)
	errObj := gin.H{"code": code, "message": msg}
	if details != nil {
		errObj["details"] = details
	}
	c.JSON(httpStatus, gin.H{"error": errObj, "meta": metaBlock(c)})
}

func respondMapped(c *gin.Context, m MappedError) {
	respondError(c, m.HTTPStatus, m.Code, m.Details)
}
