package loyalty

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type UpdateCustomerProfile struct {
	Customers ports.CustomerIdentityRepository
	Clock     ports.Clock
}

type UpdateCustomerProfileInput struct {
	CustomerID        uuid.UUID
	Gender            *string
	DateOfBirth       *time.Time
	Neighborhood      *string
	JobTitle          *string
	PreferredLocale   *string
	Interests         *[]string
	NotificationPrefs *json.RawMessage
	Name              *string
}

type UpdateCustomerProfileOutput struct {
	Customer *domain.CustomerIdentity
}

func (uc *UpdateCustomerProfile) Execute(ctx context.Context, in UpdateCustomerProfileInput) (*UpdateCustomerProfileOutput, error) {
	if in.CustomerID == uuid.Nil {
		return nil, fmt.Errorf("%w", domain.ErrInvalid)
	}
	c, err := uc.Customers.FindByID(ctx, in.CustomerID)
	if err != nil {
		return nil, err
	}
	if in.Name != nil {
		n := strings.TrimSpace(*in.Name)
		if n == "" {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		c.Name = n
	}
	if in.Gender != nil {
		g := strings.TrimSpace(*in.Gender)
		if g != "" && !isValidCustomerGender(g) {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		if g == "" {
			c.Gender = nil
		} else {
			c.Gender = &g
		}
	}
	if in.DateOfBirth != nil {
		c.DateOfBirth = in.DateOfBirth
	}
	if in.Neighborhood != nil {
		n := strings.TrimSpace(*in.Neighborhood)
		if n == "" {
			c.Neighborhood = nil
		} else {
			c.Neighborhood = &n
		}
	}
	if in.JobTitle != nil {
		j := strings.TrimSpace(*in.JobTitle)
		if j == "" {
			c.JobTitle = nil
		} else {
			c.JobTitle = &j
		}
	}
	if in.PreferredLocale != nil {
		loc := strings.TrimSpace(*in.PreferredLocale)
		if loc == "" {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		}
		c.PreferredLocale = loc
	}
	if in.Interests != nil {
		c.Interests = append([]string(nil), (*in.Interests)...)
	}
	if in.NotificationPrefs != nil {
		if len(*in.NotificationPrefs) == 0 {
			c.NotificationPrefs = json.RawMessage(`{}`)
		} else if !json.Valid(*in.NotificationPrefs) {
			return nil, fmt.Errorf("%w", domain.ErrInvalid)
		} else {
			c.NotificationPrefs = append(json.RawMessage(nil), (*in.NotificationPrefs)...)
		}
	}
	if profileLooksComplete(c) && c.ProfileCompletedAt == nil {
		now := uc.Clock.Now().UTC()
		c.ProfileCompletedAt = &now
	}
	if err := uc.Customers.UpdateProfile(ctx, c); err != nil {
		return nil, err
	}
	return &UpdateCustomerProfileOutput{Customer: c}, nil
}

func isValidCustomerGender(g string) bool {
	switch g {
	case domain.GenderFemale, domain.GenderMale, domain.GenderNonBinary, domain.GenderPreferNotToSay:
		return true
	default:
		return false
	}
}

func profileLooksComplete(c *domain.CustomerIdentity) bool {
	return c.Gender != nil && c.DateOfBirth != nil && strings.TrimSpace(c.Name) != ""
}
