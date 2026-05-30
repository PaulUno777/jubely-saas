package usecase

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/google/uuid"
)

type memPointsRuleRepo struct{}

func (m *memPointsRuleRepo) ListByTenant(context.Context, uuid.UUID) ([]ports.PointsRuleRecord, error) {
	return nil, nil
}

func (m *memPointsRuleRepo) FindByID(context.Context, uuid.UUID, uuid.UUID) (*ports.PointsRuleRecord, error) {
	return nil, domain.ErrNotFound
}

func (m *memPointsRuleRepo) Create(context.Context, *ports.PointsRuleRecord) error { return nil }

func (m *memPointsRuleRepo) Update(context.Context, *ports.PointsRuleRecord) error { return nil }

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
	uc := &StaffRecordPurchase{
		Customers:   cust,
		Enrollments: enr,
		Points:      points,
		Rules:       &memPointsRuleRepo{},
		Clock:       stubClock{t: time.Date(2026, 5, 29, 12, 0, 0, 0, time.UTC)},
	}

	out, err := uc.Execute(context.Background(), StaffRecordPurchaseInput{
		TenantID:   tid,
		PhoneE164:  "+237600000001",
		AmountFcfa: 1500,
	})
	if err != nil {
		t.Fatalf("err: %v", err)
	}
	if out.PointsAwarded != 15 || out.Delta != 15 {
		t.Fatalf("points: %+v", out)
	}
	if points.lastType != "earn" || points.lastDelta != 15 {
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
	uc := &StaffRecordPurchase{
		Customers:   cust,
		Enrollments: enr,
		Points:      &memPointAppend{},
		Rules:       &memPointsRuleRepo{},
		Clock:       stubClock{t: time.Unix(1, 0)},
	}

	_, err := uc.Execute(context.Background(), StaffRecordPurchaseInput{
		TenantID:   tidB,
		PhoneE164:  "+237600000002",
		AmountFcfa: 500,
	})
	if !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}
