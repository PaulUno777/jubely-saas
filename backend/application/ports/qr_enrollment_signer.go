package ports

import (
	"context"

	"github.com/google/uuid"
)

// QRCodec creates compact, client-displayable tokens for QR flows.
// Tokens are opaque HMAC payloads (not JWT) for MVP simplicity.
type QRCodec interface {
	SignStoreQR(ctx context.Context, tenantID uuid.UUID) (token string, err error)
	ParseStoreQR(ctx context.Context, token string) (tenantID uuid.UUID, err error)

	SignCustomerQR(ctx context.Context, tenantID, customerID uuid.UUID) (token string, err error)
	ParseCustomerQR(ctx context.Context, token string) (tenantID, customerID uuid.UUID, err error)

	SignClaimQR(ctx context.Context, redemptionID uuid.UUID) (token string, err error)
	ParseClaimQR(ctx context.Context, token string) (redemptionID uuid.UUID, err error)
}
