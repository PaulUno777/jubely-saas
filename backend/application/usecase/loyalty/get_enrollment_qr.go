package loyalty

import (
	"context"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/google/uuid"
)

type GetEnrollmentQR struct {
	Stores  ports.StoreRepository
	QRCodec ports.QRCodec
}

type GetEnrollmentQRInput struct {
	TenantID   uuid.UUID
	LocationID *uuid.UUID
}

func (uc *GetEnrollmentQR) Execute(ctx context.Context, in GetEnrollmentQRInput) (string, error) {
	storeID := uuid.Nil
	if in.LocationID != nil {
		storeID = *in.LocationID
	} else if uc.Stores != nil {
		hq, err := uc.Stores.FindHQ(ctx, in.TenantID)
		if err != nil {
			return "", err
		}
		storeID = hq.ID
	}
	return uc.QRCodec.SignStoreQR(ctx, in.TenantID, storeID)
}
