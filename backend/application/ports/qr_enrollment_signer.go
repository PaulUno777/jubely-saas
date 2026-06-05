package ports

import (
	"context"

	"github.com/google/uuid"
)

// QRCodec creates compact, client-displayable tokens for QR flows.
type QRCodec interface {
	SignStoreQR(ctx context.Context, organizationID, storeID uuid.UUID) (token string, err error)
	// ParseStoreQR returns organization and store IDs. Legacy tokens without store resolve store as uuid.Nil.
	ParseStoreQR(ctx context.Context, token string) (organizationID, storeID uuid.UUID, err error)
	SignCustomerQR(ctx context.Context, tenantID, customerID uuid.UUID) (token string, err error)
	ParseCustomerQR(ctx context.Context, token string) (tenantID, customerID uuid.UUID, err error)
	SignClaimQR(ctx context.Context, redemptionID uuid.UUID) (token string, err error)
	ParseClaimQR(ctx context.Context, token string) (redemptionID uuid.UUID, err error)
}
