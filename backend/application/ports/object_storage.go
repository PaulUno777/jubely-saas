package ports

import (
	"context"
	"io"
)

// ObjectPutInput is a provider-agnostic blob write (local disk, R2/S3, etc.).
type ObjectPutInput struct {
	Key         string
	Body        io.Reader
	Size        int64
	ContentType string
}

// ObjectPutResult is returned after a successful upload.
type ObjectPutResult struct {
	// PublicURL is the browser-reachable URL for the object (HTTPS R2 URL or API files route).
	PublicURL string
}

// ObjectStorage abstracts file/blob persistence (SOLID: infrastructure swappable).
type ObjectStorage interface {
	Put(ctx context.Context, in ObjectPutInput) (ObjectPutResult, error)
}
