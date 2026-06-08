package loyalty

import (
	"context"
	"io"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type UploadRewardImage struct {
	Storage  ports.ObjectStorage
	Rewards  ports.RewardRepository
	Clock    ports.Clock
	MaxBytes int64
}

type UploadRewardImageInput struct {
	TenantID    uuid.UUID
	RewardID    uuid.UUID
	Filename    string
	ContentType string
	Body        io.Reader
	Size        int64
}

type UploadRewardImageOutput struct {
	ImageURL string
	Reward   *domain.Reward
}

func (uc *UploadRewardImage) Execute(ctx context.Context, in UploadRewardImageInput) (*UploadRewardImageOutput, error) {
	if uc.Storage == nil {
		return nil, tenant.ErrUploadNotConfigured
	}
	rw, err := uc.Rewards.FindByID(ctx, in.TenantID, in.RewardID)
	if err != nil {
		return nil, err
	}
	logo := &tenant.UploadTenantLogo{Storage: uc.Storage, MaxBytes: uc.MaxBytes}
	out, err := logo.Execute(ctx, tenant.UploadTenantLogoInput{
		Filename:    in.Filename,
		ContentType: in.ContentType,
		Body:        in.Body,
		Size:        in.Size,
	})
	if err != nil {
		return nil, err
	}
	rw.ImageURL = &out.PublicURL
	rw.UpdatedAt = uc.Clock.Now().UTC()
	if err := uc.Rewards.Update(ctx, rw); err != nil {
		return nil, err
	}
	return &UploadRewardImageOutput{ImageURL: out.PublicURL, Reward: rw}, nil
}
