package httpserver

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

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
