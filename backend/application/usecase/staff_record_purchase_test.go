package usecase

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type memPointAppend struct {
	lastDelta int
	lastType  string
}

func (m *memPointAppend) Append(ctx context.Context, tenantID uuid.UUID, enrollmentID *uuid.UUID, eventType string, delta int, payload json.RawMessage) error {
	m.lastDelta = delta
	m.lastType = eventType
	_ = tenantID
	_ = enrollmentID
	_ = payload
	return nil
}

func TestStaffRecordPurchase_happy_path(t *testing.T) {
	t.Parallel()
	tid := uuid.New()
	cid := uuid.New()
	eid := uuid.New()
	cust := &memCustomerRepo{
		customers: []*domain.CustomerIdentity{
			{ID: cid, PhoneE164: "+237600000001", Name: "Pat"},
		},
	}
	enr := &memEnrollmentRepo{
		enrollments: []*domain.LoyaltyEnrollment{
			{ID: eid, TenantID: tid, CustomerID: cid, Tier: "bronze"},
		},
	}
	points := &memPointAppend{}
	uc := &StaffRecordPurchase{Customers: cust, Enrollments: enr, Points: points}

	out, err := uc.Execute(context.Background(), StaffRecordPurchaseInput{
		TenantID:   tid,
		PhoneE164:  "+237600000001",
		AmountFcfa: 1500,
	})
	if err != nil {
		t.Fatalf("err: %v", err)
	}
	if out.PointsAwarded != 3 || out.Delta != 3 {
		t.Fatalf("points: %+v", out)
	}
	if points.lastType != "purchase_award" || points.lastDelta != 3 {
		t.Fatalf("append: type=%s delta=%d", points.lastType, points.lastDelta)
	}
}

func TestStaffRecordPurchase_cross_tenant_requires_enrollment(t *testing.T) {
	t.Parallel()
	tidA := uuid.New()
	tidB := uuid.New()
	cid := uuid.New()
	cust := &memCustomerRepo{
		customers: []*domain.CustomerIdentity{{ID: cid, PhoneE164: "+237600000002", Name: "Lee"}},
	}
	enr := &memEnrollmentRepo{
		enrollments: []*domain.LoyaltyEnrollment{
			{ID: uuid.New(), TenantID: tidA, CustomerID: cid, Tier: "bronze"},
		},
	}
	uc := &StaffRecordPurchase{Customers: cust, Enrollments: enr, Points: &memPointAppend{}}

	_, err := uc.Execute(context.Background(), StaffRecordPurchaseInput{
		TenantID:   tidB,
		PhoneE164:  "+237600000002",
		AmountFcfa: 500,
	})
	if !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}
