package objectstorage

import (
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// R2Config configures Cloudflare R2 (S3-compatible API).
type R2Config struct {
	AccountID       string
	AccessKeyID     string
	SecretAccessKey string
	Bucket          string
	// PublicBaseURL is the custom domain or r2.dev URL where objects are readable (no trailing slash).
	PublicBaseURL string
}

// R2S3 implements ObjectStorage for Cloudflare R2.
type R2S3 struct {
	client        *s3.Client
	bucket        string
	publicBaseURL string
}

func NewR2(cfg R2Config) (*R2S3, error) {
	accountID := strings.TrimSpace(cfg.AccountID)
	accessKey := strings.TrimSpace(cfg.AccessKeyID)
	secret := strings.TrimSpace(cfg.SecretAccessKey)
	bucket := strings.TrimSpace(cfg.Bucket)
	base := strings.TrimRight(strings.TrimSpace(cfg.PublicBaseURL), "/")
	if accountID == "" || accessKey == "" || secret == "" || bucket == "" || base == "" {
		return nil, fmt.Errorf("r2: missing account_id, access_key, secret, bucket, or public_base_url")
	}
	awsCfg, err := config.LoadDefaultConfig(context.Background(),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secret, "")),
		config.WithRegion("auto"),
	)
	if err != nil {
		return nil, fmt.Errorf("r2: aws config: %w", err)
	}

	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID)
	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.UsePathStyle = true
	})

	return &R2S3{client: client, bucket: bucket, publicBaseURL: base}, nil
}

func (r *R2S3) Put(ctx context.Context, in ports.ObjectPutInput) (ports.ObjectPutResult, error) {
	key := sanitizeObjectKey(in.Key)
	if key == "" {
		return ports.ObjectPutResult{}, fmt.Errorf("invalid object key")
	}
	ct := strings.TrimSpace(in.ContentType)
	if ct == "" {
		ct = "application/octet-stream"
	}

	var body io.Reader = in.Body
	if in.Size > 0 {
		body = io.LimitReader(in.Body, in.Size)
	}

	_, err := r.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(r.bucket),
		Key:         aws.String(key),
		Body:        body,
		ContentType: aws.String(ct),
	})
	if err != nil {
		return ports.ObjectPutResult{}, err
	}
	url := r.publicBaseURL + "/" + key
	return ports.ObjectPutResult{PublicURL: url}, nil
}
