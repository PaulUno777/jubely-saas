package loyalty

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

type GetCustomerWallet struct {
	QRCodec     ports.QRCodec
	Tenants     ports.TenantRepository
	Enrollments ports.LoyaltyEnrollmentRepository
	Catalog     *postgres.StoreCatalog
}

type GetCustomerWalletInput struct {
	CustomerQR   string
	EnrollmentID *uuid.UUID
}

type CustomerWalletEventView struct {
	EventID   uuid.UUID
	EventType string
	Delta     int
	Payload   json.RawMessage
	CreatedAt time.Time
}

type GetCustomerWalletOutput struct {
	TenantID      uuid.UUID
	TenantName    string
	TenantSlug    string
	CustomerID    uuid.UUID
	EnrollmentID  uuid.UUID
	CustomerQR    string
	Tier          string
	PointsBalance int64
	RecentEvents  []CustomerWalletEventView
}

func (uc *GetCustomerWallet) Execute(ctx context.Context, in GetCustomerWalletInput) (*GetCustomerWalletOutput, error) {
	var tenantID, customerID uuid.UUID
	var enr *domain.LoyaltyEnrollment
	qr := strings.TrimSpace(in.CustomerQR)
	if in.EnrollmentID != nil && *in.EnrollmentID != uuid.Nil {
		var err error
		enr, err = uc.Enrollments.FindByID(ctx, *in.EnrollmentID)
		if err != nil {
			return nil, err
		}
		tenantID = enr.TenantID
		customerID = enr.CustomerID
	} else {
		if qr == "" {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		var err error
		tenantID, customerID, err = uc.QRCodec.ParseCustomerQR(ctx, qr)
		if err != nil {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		enr, err = uc.Enrollments.FindByTenantAndCustomer(ctx, tenantID, customerID)
		if err != nil {
			return nil, err
		}
	}
	t, err := uc.Tenants.FindByID(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	if !t.Active {
		return nil, domain.ErrNotFound
	}
	balance, err := uc.Catalog.EnrollmentPointsBalance(ctx, enr.ID)
	if err != nil {
		return nil, err
	}
	rows, err := uc.Catalog.ListEventsByEnrollment(ctx, enr.ID, 30)
	if err != nil {
		return nil, err
	}
	events := make([]CustomerWalletEventView, 0, len(rows))
	for _, row := range rows {
		payload := row.Payload
		if len(payload) == 0 {
			payload = json.RawMessage(`{}`)
		}
		events = append(events, CustomerWalletEventView{
			EventID:   row.EventID,
			EventType: row.EventType,
			Delta:     row.Delta,
			Payload:   payload,
			CreatedAt: row.CreatedAt,
		})
	}
	if qr == "" {
		qr, err = uc.QRCodec.SignCustomerQR(ctx, tenantID, customerID)
		if err != nil {
			return nil, err
		}
	}
	return &GetCustomerWalletOutput{
		TenantID:      tenantID,
		TenantName:    t.Name,
		TenantSlug:    t.Slug,
		CustomerID:    customerID,
		EnrollmentID:  enr.ID,
		CustomerQR:    qr,
		Tier:          enr.Tier,
		PointsBalance: balance,
		RecentEvents:  events,
	}, nil
}
