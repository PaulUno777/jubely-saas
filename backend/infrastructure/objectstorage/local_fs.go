package objectstorage

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
)

// LocalFS stores objects under RootDir and reports URLs under PublicBaseURL (no trailing slash).
type LocalFS struct {
	RootDir         string
	PublicBaseURL   string
}

func NewLocalFS(rootDir, publicBaseURL string) *LocalFS {
	return &LocalFS{
		RootDir:       rootDir,
		PublicBaseURL: strings.TrimRight(strings.TrimSpace(publicBaseURL), "/"),
	}
}

func (l *LocalFS) Put(ctx context.Context, in ports.ObjectPutInput) (ports.ObjectPutResult, error) {
	_ = ctx
	if l.RootDir == "" || l.PublicBaseURL == "" {
		return ports.ObjectPutResult{}, fmt.Errorf("local object storage: root or public base not configured")
	}
	key := sanitizeObjectKey(in.Key)
	if key == "" {
		return ports.ObjectPutResult{}, fmt.Errorf("invalid object key")
	}
	full := filepath.Join(l.RootDir, filepath.FromSlash(key))
	parent := filepath.Dir(full)
	if err := os.MkdirAll(parent, 0o755); err != nil {
		return ports.ObjectPutResult{}, err
	}
	f, err := os.OpenFile(full, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if err != nil {
		return ports.ObjectPutResult{}, err
	}
	defer func() { _ = f.Close() }()
	if in.Size > 0 {
		_, err = io.CopyN(f, in.Body, in.Size)
	} else {
		_, err = io.Copy(f, in.Body)
	}
	if err != nil {
		_ = os.Remove(full)
		return ports.ObjectPutResult{}, err
	}
	if err := f.Sync(); err != nil {
		return ports.ObjectPutResult{}, err
	}
	url := l.PublicBaseURL + "/" + strings.ReplaceAll(key, "\\", "/")
	return ports.ObjectPutResult{PublicURL: url}, nil
}

func sanitizeObjectKey(key string) string {
	key = strings.TrimSpace(key)
	key = strings.Trim(key, "/")
	if key == "" || strings.Contains(key, "..") {
		return ""
	}
	for _, r := range key {
		if r == '/' || r == '-' || r == '_' || r == '.' {
			continue
		}
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') {
			continue
		}
		return ""
	}
	return key
}
