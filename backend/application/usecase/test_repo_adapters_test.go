package usecase

import (
	"context"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type stubMembershipRepo struct {
	items []*domain.TenantMembership
}

func (s *stubMembershipRepo) Create(ctx context.Context, m *domain.TenantMembership) error {
	cp := *m
	s.items = append(s.items, &cp)
	return nil
}

func (s *stubMembershipRepo) FindByUserAndTenant(ctx context.Context, userID, tenantID uuid.UUID) (*domain.TenantMembership, error) {
	for _, item := range s.items {
		if item.UserID == userID && item.TenantID == tenantID {
			return item, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (s *stubMembershipRepo) FindByID(ctx context.Context, id uuid.UUID) (*domain.TenantMembership, error) {
	for _, item := range s.items {
		if item.ID == id {
			return item, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (s *stubMembershipRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.TenantMembership, error) {
	var out []domain.TenantMembership
	for _, item := range s.items {
		if item.UserID == userID {
			out = append(out, *item)
		}
	}
	return out, nil
}

func (s *stubMembershipRepo) ListWorkspaceSummariesByUser(ctx context.Context, userID uuid.UUID) ([]domain.WorkspaceSummary, error) {
	var out []domain.WorkspaceSummary
	for _, item := range s.items {
		if item.UserID == userID {
			out = append(out, domain.WorkspaceSummary{
				MembershipID: item.ID,
				TenantID:     item.TenantID,
				Role:         item.Role,
				Permissions:  domain.DefaultPermissionsForRole(item.Role),
			})
		}
	}
	return out, nil
}

func (s *stubMembershipRepo) CountByTenant(ctx context.Context, tenantID uuid.UUID) (int64, error) {
	var n int64
	for _, item := range s.items {
		if item.TenantID == tenantID {
			n++
		}
	}
	return n, nil
}

func (s *stubMembershipRepo) ListPublicByTenant(ctx context.Context, tenantID uuid.UUID, offset, limit int) ([]domain.UserPublic, error) {
	return nil, nil
}

func (s *stubUserRepo) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	return nil, domain.ErrNotFound
}

func (s *stubUserRepoByID) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	return nil, domain.ErrNotFound
}

func (s *stubUserRepoForTenantUser) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	if s.findErr != nil {
		return nil, s.findErr
	}
	return nil, domain.ErrNotFound
}

func (m *memUserRepo) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	for _, u := range m.users {
		if u.Email == email {
			return u, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *memCustomerRepo) FindByEmail(ctx context.Context, email string) (*domain.CustomerIdentity, error) {
	for _, c := range m.customers {
		if c.Email != nil && *c.Email == email {
			return c, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *memCustomerRepo) FindByUserID(ctx context.Context, userID uuid.UUID) (*domain.CustomerIdentity, error) {
	for _, c := range m.customers {
		if c.UserID != nil && *c.UserID == userID {
			return c, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *memCustomerRepo) AssignUser(ctx context.Context, customerID, userID uuid.UUID) error {
	for _, c := range m.customers {
		if c.ID == customerID {
			c.UserID = &userID
			return nil
		}
	}
	return domain.ErrNotFound
}

func (m *memCustomerRepo) UpdateProfile(ctx context.Context, c *domain.CustomerIdentity) error {
	for i, existing := range m.customers {
		if existing.ID == c.ID {
			cp := *c
			m.customers[i] = &cp
			return nil
		}
	}
	return domain.ErrNotFound
}

func (m *memEnrollmentRepo) FindByID(ctx context.Context, enrollmentID uuid.UUID) (*domain.LoyaltyEnrollment, error) {
	for _, e := range m.enrollments {
		if e.ID == enrollmentID {
			return e, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *memEnrollmentRepo) ListByCustomer(ctx context.Context, customerID uuid.UUID) ([]domain.LoyaltyEnrollment, error) {
	var out []domain.LoyaltyEnrollment
	for _, e := range m.enrollments {
		if e.CustomerID == customerID {
			out = append(out, *e)
		}
	}
	return out, nil
}

func (m *memEnrollmentRepo) Update(ctx context.Context, e *domain.LoyaltyEnrollment) error {
	for i, existing := range m.enrollments {
		if existing.ID == e.ID {
			cp := *e
			m.enrollments[i] = &cp
			return nil
		}
	}
	return domain.ErrNotFound
}

func (m *memEnrollmentRepo) ListByTenant(ctx context.Context, tenantID uuid.UUID, filter ports.EnrollmentListFilter) ([]domain.LoyaltyEnrollment, error) {
	var out []domain.LoyaltyEnrollment
	for _, e := range m.enrollments {
		if e.TenantID == tenantID {
			out = append(out, *e)
		}
	}
	return out, nil
}

func (m *memEnrollmentRepo) UpdateInteraction(ctx context.Context, enrollmentID uuid.UUID, at time.Time, locationID *uuid.UUID) error {
	for _, e := range m.enrollments {
		if e.ID == enrollmentID {
			e.LastInteractionAt = &at
			e.LastInteractionLocationID = locationID
			e.VisitCount++
			return nil
		}
	}
	return domain.ErrNotFound
}
