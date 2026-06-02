package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type StoreStatus string

const (
	StoreStatusOpen   StoreStatus = "open"
	StoreStatusSoon   StoreStatus = "soon"
	StoreStatusClosed StoreStatus = "closed"
)

type Store struct {
	ID             uuid.UUID
	OrganizationID uuid.UUID
	Slug           string
	Name           string
	CountryCode    string
	City           string
	AddressLine    string
	Lat            *float64
	Lng            *float64
	Status         StoreStatus
	IsHQ           bool
	Timezone       string
	Settings       json.RawMessage
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

type FulfillmentStore struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Short       string    `json:"short,omitempty"`
	AddressLine string    `json:"address_line,omitempty"`
	City        string    `json:"city,omitempty"`
	CountryCode string    `json:"country_code,omitempty"`
}
