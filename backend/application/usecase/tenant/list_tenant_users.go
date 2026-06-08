package tenant

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type ListTenantUsers struct {
	Tenants     ports.TenantRepository
	Memberships ports.TenantMembershipRepository
}

type ListTenantUsersInput struct {
	TenantID uuid.UUID
	Offset   int
	Limit    int
}

type ListTenantUsersOutput struct {
	Users  []domain.UserPublic
	Total  int64
	Offset int
	Limit  int
}

func (uc *ListTenantUsers) Execute(ctx context.Context, in ListTenantUsersInput) (*ListTenantUsersOutput, error) {
	if _, err := uc.Tenants.FindByID(ctx, in.TenantID); err != nil {
		return nil, err
	}
	offset, limit := ClampTenantPage(in.Offset, in.Limit)
	total, err := uc.Memberships.CountByTenant(ctx, in.TenantID)
	if err != nil {
		return nil, err
	}
	rows, err := uc.Memberships.ListPublicByTenant(ctx, in.TenantID, offset, limit)
	if err != nil {
		return nil, err
	}
	return &ListTenantUsersOutput{Users: rows, Total: total, Offset: offset, Limit: limit}, nil
}
