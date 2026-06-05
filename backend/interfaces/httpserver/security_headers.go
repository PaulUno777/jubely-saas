package httpserver

import "github.com/gin-gonic/gin"

// SecurityHeaders sets baseline headers for production pilots.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Permissions-Policy", "camera=(self), microphone=()")
		c.Next()
	}
}
