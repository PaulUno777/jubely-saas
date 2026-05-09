package usecase

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

var ErrUploadNotConfigured = errors.New("upload_not_configured")

// UploadTenantLogo validates and stores a tenant logo; returns a public URL to store in tenant settings.logo_url.
type UploadTenantLogo struct {
	Storage  ports.ObjectStorage
	MaxBytes int64
}

type UploadTenantLogoInput struct {
	Filename    string
	ContentType string
	Body        io.Reader
	Size        int64
}

type UploadTenantLogoOutput struct {
	PublicURL string
}

var allowedLogoTypes = map[string]string{
	"image/png":     ".png",
	"image/jpeg":    ".jpg",
	"image/webp":    ".webp",
	"image/svg+xml": ".svg",
}

func sniffImageContentType(head []byte) string {
	s := strings.TrimSpace(string(head))
	if strings.HasPrefix(s, "<svg") || strings.HasPrefix(s, "<?xml") {
		return "image/svg+xml"
	}
	ct := http.DetectContentType(head)
	return ct
}

func (uc *UploadTenantLogo) Execute(ctx context.Context, in UploadTenantLogoInput) (*UploadTenantLogoOutput, error) {
	if uc.Storage == nil {
		return nil, ErrUploadNotConfigured
	}
	max := uc.MaxBytes
	if max <= 0 {
		max = 2 << 20
	}
	if in.Size > max {
		return nil, fmt.Errorf("%w: file too large", domain.ErrInvalid)
	}

	preview := make([]byte, 512)
	n, err := io.ReadFull(in.Body, preview)
	if err != nil && err != io.ErrUnexpectedEOF && err != io.EOF {
		return nil, err
	}
	head := preview[:n]
	body := io.MultiReader(bytes.NewReader(head), in.Body)

	detected := sniffImageContentType(head)
	ext, ok := allowedLogoTypes[detected]
	if !ok {
		return nil, fmt.Errorf("%w: unsupported image type", domain.ErrInvalid)
	}

	key := fmt.Sprintf("tenants/logos/%s%s", uuid.New().String(), ext)
	out, err := uc.Storage.Put(ctx, ports.ObjectPutInput{
		Key:         key,
		Body:        io.LimitReader(body, max),
		Size:        0,
		ContentType: detected,
	})
	if err != nil {
		return nil, err
	}
	return &UploadTenantLogoOutput{PublicURL: out.PublicURL}, nil
}
