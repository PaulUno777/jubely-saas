package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
	"github.com/google/uuid"
)

type GetPWAWallet struct {
	QRCodec     ports.QRCodec
	Tenants     ports.TenantRepository
	Enrollments ports.LoyaltyEnrollmentRepository
	Catalog     *postgres.StoreCatalog
}

type GetPWAWalletInput struct {
	CustomerQR string
}

type PWAWalletEventView struct {
	EventID   uuid.UUID
	EventType string
	Delta     int
	Payload   json.RawMessage
	CreatedAt time.Time
}

type GetPWAWalletOutput struct {
	TenantID       uuid.UUID
	TenantName     string
	TenantSlug     string
	CustomerID     uuid.UUID
	EnrollmentID   uuid.UUID
	Tier           string
	PointsBalance  int64
	RecentEvents   []PWAWalletEventView
}

func (uc *GetPWAWallet) Execute(ctx context.Context, in GetPWAWalletInput) (*GetPWAWalletOutput, error) {
	qr := strings.TrimSpace(in.CustomerQR)
	if qr == "" {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	tenantID, customerID, err := uc.QRCodec.ParseCustomerQR(ctx, qr)
	if err != nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	t, err := uc.Tenants.FindByID(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	if !t.Active {
		return nil, domain.ErrNotFound
	}
	enr, err := uc.Enrollments.FindByTenantAndCustomer(ctx, tenantID, customerID)
	if err != nil {
		return nil, err
	}
	balance, err := uc.Catalog.EnrollmentPointsBalance(ctx, enr.ID)
	if err != nil {
		return nil, err
	}
	rows, err := uc.Catalog.ListEventsByEnrollment(ctx, enr.ID, 30)
	if err != nil {
		return nil, err
	}
	events := make([]PWAWalletEventView, 0, len(rows))
	for _, row := range rows {
		payload := row.Payload
		if len(payload) == 0 {
			payload = json.RawMessage(`{}`)
		}
		events = append(events, PWAWalletEventView{
			EventID:   row.EventID,
			EventType: row.EventType,
			Delta:     row.Delta,
			Payload:   payload,
			CreatedAt: row.CreatedAt,
		})
	}
	return &GetPWAWalletOutput{
		TenantID:      tenantID,
		TenantName:    t.Name,
		TenantSlug:    t.Slug,
		CustomerID:    customerID,
		EnrollmentID:  enr.ID,
		Tier:          enr.Tier,
		PointsBalance: balance,
		RecentEvents:  events,
	}, nil
}
