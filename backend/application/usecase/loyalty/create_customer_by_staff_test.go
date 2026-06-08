package loyalty

import (
	"context"
	"errors"
	"testing"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase/testutil"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

func TestCreateCustomerByStaff_happy_path(t *testing.T) {
	t.Parallel()
	tid := uuid.New()
	cust := &testutil.MemCustomerRepo{}
	enr := &testutil.MemEnrollmentRepo{}
	uc := &CreateCustomerByStaff{
		Tx:          testutil.NoopTx{},
		Tenants:     &testutil.StubTenantRepo{T: &domain.Tenant{ID: tid, Name: "Chez Mama", Slug: "chez-mama"}},
		Users:       &testutil.MemUserRepo{},
		Memberships: &testutil.StubMembershipRepo{},
		Customers:   cust,
		Enrollments: enr,
		QRCodec:     testutil.StubQRCodec{},
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
		Tx:          testutil.NoopTx{},
		Tenants:     &testutil.StubTenantRepo{T: &domain.Tenant{ID: tid, Name: "Chez Mama", Slug: "chez-mama"}},
		Users:       &testutil.MemUserRepo{},
		Memberships: &testutil.StubMembershipRepo{},
		Customers:   &testutil.MemCustomerRepo{},
		Enrollments: &testutil.MemEnrollmentRepo{},
		QRCodec:     testutil.StubQRCodec{},
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
