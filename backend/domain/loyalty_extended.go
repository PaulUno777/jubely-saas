package domain

import (
	"time"

	"github.com/google/uuid"
)

// CustomerGender values stored on customer_identities.gender.
const (
	GenderFemale           = "f"
	GenderMale             = "h"
	GenderNonBinary        = "nb"
	GenderPreferNotToSay   = "na"
)

// EnrollmentSource tracks how a customer joined a tenant program.
const (
	EnrollmentSourceUnknown   = "unknown"
	EnrollmentSourceQRScan    = "qr_scan"
	EnrollmentSourceMapJoin   = "map_join"
	EnrollmentSourceStaff     = "staff_enroll"
	EnrollmentSourceReferral  = "referral"
)

// LocalizedOwnerType for localized_strings.owner_type.
const (
	LocalizedOwnerTenant   = "tenant"
	LocalizedOwnerReward   = "reward"
	LocalizedOwnerCampaign = "campaign"
	LocalizedOwnerQRFiche  = "qr_fiche"
	LocalizedOwnerTier     = "tier"
)

// CampaignStatus values.
const (
	CampaignStatusDraft     = "draft"
	CampaignStatusScheduled = "scheduled"
	CampaignStatusLive      = "live"
	CampaignStatusPaused    = "paused"
	CampaignStatusEnded     = "ended"
)

// Default tier codes seeded per tenant.
var DefaultTierCodes = []string{"bronze", "silver", "gold", "platinum"}

// LoyaltyTier is a tenant-defined fidelity tier.
type LoyaltyTier struct {
	ID           uuid.UUID
	TenantID     uuid.UUID
	Code         string
	SortOrder    int
	MinPoints    int
	Color        string
	IconKey      *string
	AutoUpgrade  bool
	BenefitsJSON []byte
	Active       bool
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// LocalizedString is a single translated field value.
type LocalizedString struct {
	ID        uuid.UUID
	OwnerType string
	OwnerID   uuid.UUID
	FieldKey  string
	Locale    string
	Value     string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// TenantSupportedLocale configures which locales a tenant exposes to customers.
type TenantSupportedLocale struct {
	TenantID  uuid.UUID
	Locale    string
	IsPrimary bool
	Enabled   bool
}

// TenantQRBranding stores printable QR fiche theming.
type TenantQRBranding struct {
	TenantID        uuid.UUID
	Variant         string
	Theme           string
	AccentColor     string
	FontFamily      string
	HeadingFont     *string
	QRForeground    *string
	QRBackground    *string
	LayoutJSON      []byte
	SectionToggles  []byte
	UpdatedAt       time.Time
}

// Campaign is a time-bound marketing or incentive program.
type Campaign struct {
	ID              uuid.UUID
	TenantID        uuid.UUID
	Name            string
	CampaignType    string
	Status          string
	StartsAt        *time.Time
	EndsAt          *time.Time
	TargetingJSON   []byte
	ActionJSON      []byte
	BudgetPoints    *int
	ReachCount      int
	ConversionCount int
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// AuditEvent records admin mutations for compliance and debugging.
type AuditEvent struct {
	ID           uuid.UUID
	TenantID     *uuid.UUID
	ActorUserID  *uuid.UUID
	Action       string
	ResourceType string
	ResourceID   *uuid.UUID
	MetadataJSON []byte
	CreatedAt    time.Time
}
