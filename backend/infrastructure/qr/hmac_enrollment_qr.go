package qr

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

type HMACQRCodec struct {
	Secret []byte
}

type qrPayload struct {
	V  int    `json:"v"`
	K  string `json:"k"` // "store" | "customer" | "claim"
	Ti string `json:"ti"` // organization id
	Si string `json:"si,omitempty"` // store id
	Ci string `json:"ci,omitempty"`
	Ri string `json:"ri,omitempty"`
}

func (s *HMACQRCodec) SignStoreQR(_ context.Context, organizationID, storeID uuid.UUID) (string, error) {
	if len(s.Secret) < 32 {
		return "", fmt.Errorf("qr secret too short")
	}
	p := qrPayload{V: 1, K: "store", Ti: organizationID.String()}
	if storeID != uuid.Nil {
		p.Si = storeID.String()
	}
	return s.sign(p)
}

func (s *HMACQRCodec) ParseStoreQR(_ context.Context, token string) (uuid.UUID, uuid.UUID, error) {
	p, err := s.verify(token)
	if err != nil {
		return uuid.UUID{}, uuid.UUID{}, err
	}
	if p.K != "store" {
		return uuid.UUID{}, uuid.UUID{}, fmt.Errorf("invalid store qr kind")
	}
	orgID, err := uuid.Parse(p.Ti)
	if err != nil {
		return uuid.UUID{}, uuid.UUID{}, err
	}
	if p.Si == "" {
		return orgID, uuid.Nil, nil
	}
	storeID, err := uuid.Parse(p.Si)
	if err != nil {
		return uuid.UUID{}, uuid.UUID{}, err
	}
	return orgID, storeID, nil
}

func (s *HMACQRCodec) SignCustomerQR(_ context.Context, tenantID, customerID uuid.UUID) (string, error) {
	if len(s.Secret) < 32 {
		return "", fmt.Errorf("qr secret too short")
	}
	return s.sign(qrPayload{V: 1, K: "customer", Ti: tenantID.String(), Ci: customerID.String()})
}

func (s *HMACQRCodec) ParseCustomerQR(_ context.Context, token string) (uuid.UUID, uuid.UUID, error) {
	p, err := s.verify(token)
	if err != nil {
		return uuid.UUID{}, uuid.UUID{}, err
	}
	if p.K != "customer" || p.Ci == "" {
		return uuid.UUID{}, uuid.UUID{}, fmt.Errorf("invalid customer qr kind")
	}
	tid, err := uuid.Parse(p.Ti)
	if err != nil {
		return uuid.UUID{}, uuid.UUID{}, err
	}
	cid, err := uuid.Parse(p.Ci)
	if err != nil {
		return uuid.UUID{}, uuid.UUID{}, err
	}
	return tid, cid, nil
}

func (s *HMACQRCodec) SignClaimQR(_ context.Context, redemptionID uuid.UUID) (string, error) {
	if len(s.Secret) < 32 {
		return "", fmt.Errorf("qr secret too short")
	}
	return s.sign(qrPayload{V: 1, K: "claim", Ri: redemptionID.String()})
}

func (s *HMACQRCodec) ParseClaimQR(_ context.Context, token string) (uuid.UUID, error) {
	p, err := s.verify(token)
	if err != nil {
		return uuid.UUID{}, err
	}
	if p.K != "claim" || p.Ri == "" {
		return uuid.UUID{}, fmt.Errorf("invalid claim qr kind")
	}
	return uuid.Parse(p.Ri)
}

func (s *HMACQRCodec) sign(p qrPayload) (string, error) {
	body, err := json.Marshal(p)
	if err != nil {
		return "", err
	}
	mac := hmac.New(sha256.New, s.Secret)
	_, _ = mac.Write(body)
	sig := mac.Sum(nil)

	encBody := base64.RawURLEncoding.EncodeToString(body)
	encSig := base64.RawURLEncoding.EncodeToString(sig)
	return fmt.Sprintf("jb1.%s.%s", encBody, encSig), nil
}

func (s *HMACQRCodec) verify(token string) (qrPayload, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 || parts[0] != "jb1" {
		return qrPayload{}, fmt.Errorf("invalid token format")
	}
	body, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return qrPayload{}, fmt.Errorf("invalid token encoding")
	}
	sig, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return qrPayload{}, fmt.Errorf("invalid token signature encoding")
	}

	mac := hmac.New(sha256.New, s.Secret)
	_, _ = mac.Write(body)
	expected := mac.Sum(nil)
	if subtle.ConstantTimeCompare(sig, expected) != 1 {
		return qrPayload{}, fmt.Errorf("invalid token signature")
	}

	var p qrPayload
	if err := json.Unmarshal(body, &p); err != nil {
		return qrPayload{}, fmt.Errorf("invalid token payload")
	}
	if p.V != 1 {
		return qrPayload{}, fmt.Errorf("unsupported token version")
	}
	return p, nil
}
