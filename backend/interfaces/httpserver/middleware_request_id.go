package httpserver

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RequestIDMiddleware ensures every request has a request id for tracing.
// It reads X-Request-Id if present; otherwise generates a UUID.
func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		rid := strings.TrimSpace(c.GetHeader("X-Request-Id"))
		if rid == "" {
			rid = uuid.NewString()
		}
		c.Set(ginKeyAPIRequestID, rid)
		c.Header("X-Request-Id", rid)
		c.Next()
	}
}
