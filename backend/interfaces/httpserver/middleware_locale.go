package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

// LocaleMiddleware parses Accept-Language and stores a normalized locale in Gin context.
func LocaleMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		loc := i18n.ParseAcceptLanguage(c.GetHeader("Accept-Language"))
		c.Set(ginKeyAPILocale, string(loc))
		c.Next()
	}
}
