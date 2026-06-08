package loyalty

import (
	"context"
	"encoding/json"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
	"github.com/google/uuid"
)

type ListStorePointEvents struct {
	Catalog *postgres.StoreCatalog
}

type ListStorePointEventsInput struct {
	TenantID  uuid.UUID
	Offset    int
	Limit     int
	EventType *string
	From      *time.Time
	To        *time.Time
}

type StorePointEventView struct {
	EventID       uuid.UUID
	EventType     string
	Delta         int
	Payload       json.RawMessage
	CreatedAt     time.Time
	CustomerName  *string
	CustomerPhone *string
}

type ListStorePointEventsOutput struct {
	Events []StorePointEventView
	Total  int64
	Offset int
	Limit  int
}

func (uc *ListStorePointEvents) Execute(ctx context.Context, in ListStorePointEventsInput) (*ListStorePointEventsOutput, error) {
	offset, limit := tenant.ClampTenantPage(in.Offset, in.Limit)
	filter := postgres.PointEventFilter{EventType: in.EventType, From: in.From, To: in.To}
	total, err := uc.Catalog.CountPointEvents(ctx, in.TenantID, filter)
	if err != nil {
		return nil, err
	}
	rows, err := uc.Catalog.ListPointEvents(ctx, in.TenantID, offset, limit, filter)
	if err != nil {
		return nil, err
	}
	items := make([]StorePointEventView, 0, len(rows))
	for _, row := range rows {
		payload := row.Payload
		if len(payload) == 0 {
			payload = json.RawMessage(`{}`)
		}
		items = append(items, StorePointEventView{
			EventID:       row.EventID,
			EventType:     row.EventType,
			Delta:         row.Delta,
			Payload:       payload,
			CreatedAt:     row.CreatedAt,
			CustomerName:  row.CustomerName,
			CustomerPhone: row.CustomerPhone,
		})
	}
	return &ListStorePointEventsOutput{
		Events: items,
		Total:  total,
		Offset: offset,
		Limit:  limit,
	}, nil
}
