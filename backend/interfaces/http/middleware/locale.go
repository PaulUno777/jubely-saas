package middleware

import (
	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/contextkeys"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

func Locale() gin.HandlerFunc {
	return func(c *gin.Context) {
		loc := i18n.ParseAcceptLanguage(c.GetHeader("Accept-Language"))
		c.Set(contextkeys.APILocale, string(loc))
		c.Next()
	}
}
