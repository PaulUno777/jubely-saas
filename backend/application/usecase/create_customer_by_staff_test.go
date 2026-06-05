package usecase

import (
	"context"
	"errors"
	"testing"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type memCustomerRepo struct {
	customers []*domain.CustomerIdentity
}

func (m *memCustomerRepo) Create(ctx context.Context, c *domain.CustomerIdentity) error {
	for _, ex := range m.customers {
		if ex.PhoneE164 == c.PhoneE164 {
			return domain.ErrConflict
		}
	}
	cp := *c
	m.customers = append(m.customers, &cp)
	return nil
}

func (m *memCustomerRepo) FindByID(ctx context.Context, id uuid.UUID) (*domain.CustomerIdentity, error) {
	for _, c := range m.customers {
		if c.ID == id {
			return c, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *memCustomerRepo) FindByPhoneE164(ctx context.Context, phoneE164 string) (*domain.CustomerIdentity, error) {
	for _, c := range m.customers {
		if c.PhoneE164 == phoneE164 {
			return c, nil
		}
	}
	return nil, domain.ErrNotFound
}

type memEnrollmentRepo struct {
	enrollments []*domain.LoyaltyEnrollment
}

func (m *memEnrollmentRepo) Create(ctx context.Context, e *domain.LoyaltyEnrollment) error {
	for _, ex := range m.enrollments {
		if ex.TenantID == e.TenantID && ex.CustomerID == e.CustomerID {
			return domain.ErrConflict
		}
	}
	cp := *e
	m.enrollments = append(m.enrollments, &cp)
	return nil
}

func (m *memEnrollmentRepo) FindByTenantAndCustomer(ctx context.Context, tenantID uuid.UUID, customerID uuid.UUID) (*domain.LoyaltyEnrollment, error) {
	for _, e := range m.enrollments {
		if e.TenantID == tenantID && e.CustomerID == customerID {
			return e, nil
		}
	}
	return nil, domain.ErrNotFound
}

type stubQRCodec struct{}

func (stubQRCodec) SignStoreQR(ctx context.Context, organizationID, storeID uuid.UUID) (string, error) {
	return "store:" + organizationID.String(), nil
}

func (stubQRCodec) ParseStoreQR(ctx context.Context, token string) (uuid.UUID, uuid.UUID, error) {
	return uuid.New(), uuid.Nil, nil
}

func (stubQRCodec) SignCustomerQR(ctx context.Context, tenantID, customerID uuid.UUID) (string, error) {
	return "customer:" + tenantID.String() + ":" + customerID.String(), nil
}

func (stubQRCodec) ParseCustomerQR(ctx context.Context, token string) (uuid.UUID, uuid.UUID, error) {
	return uuid.New(), uuid.New(), nil
}

func (stubQRCodec) SignClaimQR(ctx context.Context, redemptionID uuid.UUID) (string, error) {
	return redemptionID.String(), nil
}

func (stubQRCodec) ParseClaimQR(ctx context.Context, token string) (uuid.UUID, error) {
	return uuid.Parse(token)
}

func TestCreateCustomerByStaff_happy_path(t *testing.T) {
	t.Parallel()
	tid := uuid.New()
	cust := &memCustomerRepo{}
	enr := &memEnrollmentRepo{}
	uc := &CreateCustomerByStaff{
		Tx:          noopTx{},
		Tenants:     &stubTenantRepoForUsers{t: &domain.Tenant{ID: tid, Name: "Chez Mama", Slug: "chez-mama"}},
		Users:       &stubUserRepo{},
		Memberships: &stubMembershipRepo{},
		Customers:   cust,
		Enrollments: enr,
		QRCodec:     stubQRCodec{},
	}

	out, err := uc.Execute(context.Background(), CreateCustomerByStaffInput{
		TenantID:  tid,
		PhoneE164: "+33999999999",
		Name:      "Ada Lovelace",
	})
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if out.CustomerID == uuid.Nil || out.EnrollmentID == uuid.Nil {
		t.Fatalf("ids: %+v", out)
	}
	if out.CustomerQR == "" {
		t.Fatalf("expected qr")
	}
}

func TestCreateCustomerByStaff_rejects_non_e164(t *testing.T) {
	t.Parallel()
	tid := uuid.New()
	uc := &CreateCustomerByStaff{
		Tx:          noopTx{},
		Tenants:     &stubTenantRepoForUsers{t: &domain.Tenant{ID: tid, Name: "Chez Mama", Slug: "chez-mama"}},
		Users:       &stubUserRepo{},
		Memberships: &stubMembershipRepo{},
		Customers:   &memCustomerRepo{},
		Enrollments: &memEnrollmentRepo{},
		QRCodec:     stubQRCodec{},
	}
	_, err := uc.Execute(context.Background(), CreateCustomerByStaffInput{
		TenantID:  tid,
		Name:      "A B",
		PhoneE164: "339",
	})
	if !errors.Is(err, domain.ErrInvalid) {
		t.Fatalf("expected ErrInvalid, got %v", err)
	}
}
