package testutil

import (
	"context"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type StubClock struct{ T time.Time }

func (s StubClock) Now() time.Time { return s.T }

type StubHasher struct{}

func (StubHasher) Hash(password string) (string, error) { return "h(" + password + ")", nil }
func (StubHasher) Compare(hash, password string) error  { return nil }

type NoopTx struct{}

func (NoopTx) WithinTx(ctx context.Context, fn func(ctx context.Context) error) error {
	return fn(ctx)
}

type StubMembershipRepo struct {
	Items []*domain.TenantMembership
}

func (s *StubMembershipRepo) Create(ctx context.Context, m *domain.TenantMembership) error {
	cp := *m
	s.Items = append(s.Items, &cp)
	return nil
}

func (s *StubMembershipRepo) FindByUserAndTenant(ctx context.Context, userID, tenantID uuid.UUID) (*domain.TenantMembership, error) {
	for _, item := range s.Items {
		if item.UserID == userID && item.TenantID == tenantID {
			return item, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (s *StubMembershipRepo) FindByID(ctx context.Context, id uuid.UUID) (*domain.TenantMembership, error) {
	for _, item := range s.Items {
		if item.ID == id {
			return item, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (s *StubMembershipRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.TenantMembership, error) {
	var out []domain.TenantMembership
	for _, item := range s.Items {
		if item.UserID == userID {
			out = append(out, *item)
		}
	}
	return out, nil
}

func (s *StubMembershipRepo) ListWorkspaceSummariesByUser(ctx context.Context, userID uuid.UUID) ([]domain.WorkspaceSummary, error) {
	var out []domain.WorkspaceSummary
	for _, item := range s.Items {
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

func (s *StubMembershipRepo) CountByTenant(ctx context.Context, tenantID uuid.UUID) (int64, error) {
	var n int64
	for _, item := range s.Items {
		if item.TenantID == tenantID {
			n++
		}
	}
	return n, nil
}

func (s *StubMembershipRepo) ListPublicByTenant(ctx context.Context, tenantID uuid.UUID, offset, limit int) ([]domain.UserPublic, error) {
	return nil, nil
}

type MemUserRepo struct {
	Users []*domain.User
	Count int64
}

func (m *MemUserRepo) Create(ctx context.Context, u *domain.User) error {
	cp := *u
	m.Users = append(m.Users, &cp)
	return nil
}

func (m *MemUserRepo) CountSuperadmins(ctx context.Context) (int64, error) { return m.Count, nil }

func (m *MemUserRepo) FindSuperadminByEmail(ctx context.Context, email string) (*domain.User, error) {
	return nil, domain.ErrNotFound
}

func (m *MemUserRepo) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	for _, u := range m.Users {
		if u.Email == email {
			return u, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *MemUserRepo) FindByTenantAndEmail(ctx context.Context, tenantID uuid.UUID, email string) (*domain.User, error) {
	for _, u := range m.Users {
		if u.Email == email {
			return u, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *MemUserRepo) FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	for _, u := range m.Users {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *MemUserRepo) UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string, mustChangePassword bool) error {
	return nil
}

func (m *MemUserRepo) CountByTenant(ctx context.Context, tenantID uuid.UUID) (int64, error) {
	return 0, nil
}

func (m *MemUserRepo) ListPublicByTenant(ctx context.Context, tenantID uuid.UUID, offset, limit int) ([]domain.UserPublic, error) {
	return nil, nil
}

type MemCustomerRepo struct {
	Customers []*domain.CustomerIdentity
}

func (m *MemCustomerRepo) Create(ctx context.Context, c *domain.CustomerIdentity) error {
	for _, ex := range m.Customers {
		if ex.PhoneE164 == c.PhoneE164 {
			return domain.ErrConflict
		}
	}
	cp := *c
	m.Customers = append(m.Customers, &cp)
	return nil
}

func (m *MemCustomerRepo) FindByID(ctx context.Context, id uuid.UUID) (*domain.CustomerIdentity, error) {
	for _, c := range m.Customers {
		if c.ID == id {
			return c, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *MemCustomerRepo) FindByPhoneE164(ctx context.Context, phoneE164 string) (*domain.CustomerIdentity, error) {
	for _, c := range m.Customers {
		if c.PhoneE164 == phoneE164 {
			return c, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *MemCustomerRepo) FindByEmail(ctx context.Context, email string) (*domain.CustomerIdentity, error) {
	for _, c := range m.Customers {
		if c.Email != nil && *c.Email == email {
			return c, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *MemCustomerRepo) FindByUserID(ctx context.Context, userID uuid.UUID) (*domain.CustomerIdentity, error) {
	for _, c := range m.Customers {
		if c.UserID != nil && *c.UserID == userID {
			return c, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *MemCustomerRepo) AssignUser(ctx context.Context, customerID, userID uuid.UUID) error {
	for _, c := range m.Customers {
		if c.ID == customerID {
			c.UserID = &userID
			return nil
		}
	}
	return domain.ErrNotFound
}

func (m *MemCustomerRepo) UpdateProfile(ctx context.Context, c *domain.CustomerIdentity) error {
	for i, existing := range m.Customers {
		if existing.ID == c.ID {
			cp := *c
			m.Customers[i] = &cp
			return nil
		}
	}
	return domain.ErrNotFound
}

type MemEnrollmentRepo struct {
	Enrollments []*domain.LoyaltyEnrollment
}

func (m *MemEnrollmentRepo) Create(ctx context.Context, e *domain.LoyaltyEnrollment) error {
	for _, ex := range m.Enrollments {
		if ex.TenantID == e.TenantID && ex.CustomerID == e.CustomerID {
			return domain.ErrConflict
		}
	}
	cp := *e
	m.Enrollments = append(m.Enrollments, &cp)
	return nil
}

func (m *MemEnrollmentRepo) FindByTenantAndCustomer(ctx context.Context, tenantID uuid.UUID, customerID uuid.UUID) (*domain.LoyaltyEnrollment, error) {
	for _, e := range m.Enrollments {
		if e.TenantID == tenantID && e.CustomerID == customerID {
			return e, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *MemEnrollmentRepo) FindByID(ctx context.Context, enrollmentID uuid.UUID) (*domain.LoyaltyEnrollment, error) {
	for _, e := range m.Enrollments {
		if e.ID == enrollmentID {
			return e, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *MemEnrollmentRepo) ListByCustomer(ctx context.Context, customerID uuid.UUID) ([]domain.LoyaltyEnrollment, error) {
	var out []domain.LoyaltyEnrollment
	for _, e := range m.Enrollments {
		if e.CustomerID == customerID {
			out = append(out, *e)
		}
	}
	return out, nil
}

func (m *MemEnrollmentRepo) Update(ctx context.Context, e *domain.LoyaltyEnrollment) error {
	for i, existing := range m.Enrollments {
		if existing.ID == e.ID {
			cp := *e
			m.Enrollments[i] = &cp
			return nil
		}
	}
	return domain.ErrNotFound
}

func (m *MemEnrollmentRepo) ListByTenant(ctx context.Context, tenantID uuid.UUID, filter ports.EnrollmentListFilter) ([]domain.LoyaltyEnrollment, error) {
	var out []domain.LoyaltyEnrollment
	for _, e := range m.Enrollments {
		if e.TenantID == tenantID {
			out = append(out, *e)
		}
	}
	return out, nil
}

func (m *MemEnrollmentRepo) UpdateInteraction(ctx context.Context, enrollmentID uuid.UUID, at time.Time, locationID *uuid.UUID) error {
	for _, e := range m.Enrollments {
		if e.ID == enrollmentID {
			e.LastInteractionAt = &at
			e.LastInteractionLocationID = locationID
			e.VisitCount++
			return nil
		}
	}
	return domain.ErrNotFound
}

type StubTenantRepo struct {
	T *domain.Tenant
}

func (s *StubTenantRepo) Create(ctx context.Context, t *domain.Tenant) error { return nil }
func (s *StubTenantRepo) FindBySlug(ctx context.Context, slug string) (*domain.Tenant, error) {
	return nil, domain.ErrNotFound
}
func (s *StubTenantRepo) FindByID(ctx context.Context, id uuid.UUID) (*domain.Tenant, error) {
	if s.T != nil && s.T.ID == id {
		return s.T, nil
	}
	return nil, domain.ErrNotFound
}
func (s *StubTenantRepo) Update(ctx context.Context, t *domain.Tenant) error { return nil }
func (s *StubTenantRepo) ListAll(ctx context.Context, offset, limit int) ([]domain.Tenant, error) {
	return nil, nil
}
func (s *StubTenantRepo) CountAll(ctx context.Context) (int64, error)    { return 0, nil }
func (s *StubTenantRepo) CountActive(ctx context.Context) (int64, error) { return 0, nil }
func (s *StubTenantRepo) CountActiveByPlan(ctx context.Context, plan string) (int64, error) {
	return 0, nil
}

type StubQRCodec struct{}

func (StubQRCodec) SignStoreQR(ctx context.Context, organizationID, storeID uuid.UUID) (string, error) {
	return "store:" + organizationID.String(), nil
}
func (StubQRCodec) ParseStoreQR(ctx context.Context, token string) (uuid.UUID, uuid.UUID, error) {
	return uuid.New(), uuid.Nil, nil
}
func (StubQRCodec) SignCustomerQR(ctx context.Context, tenantID, customerID uuid.UUID) (string, error) {
	return "customer:" + tenantID.String() + ":" + customerID.String(), nil
}
func (StubQRCodec) ParseCustomerQR(ctx context.Context, token string) (uuid.UUID, uuid.UUID, error) {
	return uuid.New(), uuid.New(), nil
}
func (StubQRCodec) SignClaimQR(ctx context.Context, redemptionID uuid.UUID) (string, error) {
	return redemptionID.String(), nil
}
func (StubQRCodec) ParseClaimQR(ctx context.Context, token string) (uuid.UUID, error) {
	return uuid.Parse(token)
}
