package middleware

import (
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/contextkeys"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		rid := strings.TrimSpace(c.GetHeader("X-Request-Id"))
		if rid == "" {
			rid = uuid.NewString()
		}
		c.Set(contextkeys.APIRequestID, rid)
		c.Header("X-Request-Id", rid)
		c.Next()
	}
}
