package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// CORSAllowAll is for local development only.
func CORSAllowAll() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization,Content-Type,Accept,Accept-Language,Origin,X-Requested-With,X-Bootstrap-Secret,X-Request-Id")
		c.Header("Access-Control-Expose-Headers", "Content-Length,Content-Type,X-Request-Id")
		c.Header("Access-Control-Max-Age", "600")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
