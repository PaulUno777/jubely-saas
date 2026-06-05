package usecase

import (
	"context"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
	"github.com/google/uuid"
)

type ListStoreCustomers struct {
	Catalog *postgres.StoreCatalog
}

type ListStoreCustomersInput struct {
	TenantID uuid.UUID
	Offset   int
	Limit    int
}

type StoreCustomerView struct {
	EnrollmentID  uuid.UUID
	CustomerID    uuid.UUID
	Name          string
	PhoneE164     string
	Email         *string
	Tier          string
	PointsBalance int64
	EnrolledAt    time.Time
}

type ListStoreCustomersOutput struct {
	Customers []StoreCustomerView
	Total     int64
	Offset    int
	Limit     int
}

func (uc *ListStoreCustomers) Execute(ctx context.Context, in ListStoreCustomersInput) (*ListStoreCustomersOutput, error) {
	offset, limit := clampTenantPage(in.Offset, in.Limit)
	total, err := uc.Catalog.CountCustomers(ctx, in.TenantID)
	if err != nil {
		return nil, err
	}
	rows, err := uc.Catalog.ListCustomers(ctx, in.TenantID, offset, limit)
	if err != nil {
		return nil, err
	}
	items := make([]StoreCustomerView, 0, len(rows))
	for _, row := range rows {
		items = append(items, StoreCustomerView{
			EnrollmentID:  row.EnrollmentID,
			CustomerID:    row.CustomerID,
			Name:          row.Name,
			PhoneE164:     row.PhoneE164,
			Email:         row.Email,
			Tier:          row.Tier,
			PointsBalance: row.PointsBalance,
			EnrolledAt:    row.EnrolledAt,
		})
	}
	return &ListStoreCustomersOutput{
		Customers: items,
		Total:     total,
		Offset:    offset,
		Limit:     limit,
	}, nil
}
