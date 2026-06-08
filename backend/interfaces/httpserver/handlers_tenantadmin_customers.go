package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/presenter"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (s *Server) TenantListCustomers(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	offset, limit := parsePageQuery(c)
	out, err := s.ListStoreCustomersUC.Execute(c.Request.Context(), loyalty.ListStoreCustomersInput{
		TenantID: tenantID,
		Offset:   offset,
		Limit:    limit,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	items := make([]gin.H, 0, len(out.Customers))
	for _, row := range out.Customers {
		items = append(items, gin.H{
			"enrollment_id":  row.EnrollmentID.String(),
			"customer_id":    row.CustomerID.String(),
			"name":           row.Name,
			"phone":          row.PhoneE164,
			"email":          row.Email,
			"tier":           gin.H{"code": row.Tier},
			"points_balance": row.PointsBalance,
			"enrolled_at":    row.EnrolledAt,
		})
	}
	respondPage(c, gin.H{"customers": items}, Pagination{Limit: out.Limit, Offset: out.Offset, Total: int(out.Total)})
}

func (s *Server) TenantGetCustomer(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	enrollmentID, err := uuid.Parse(c.Param("enrollmentId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_enrollment_id"})
		return
	}
	out, err := s.GetTenantCustomerUC.Execute(c.Request.Context(), loyalty.GetTenantCustomerInput{
		TenantID:     tenantID,
		EnrollmentID: enrollmentID,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, presenter.TenantCustomerDetail(out))
}

type tenantAdjustPointsBody struct {
	Delta      int    `json:"delta"`
	Reason     string `json:"reason"`
	LocationID string `json:"location_id"`
}

func (s *Server) TenantAdjustCustomerPoints(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	enrollmentID, err := uuid.Parse(c.Param("enrollmentId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_enrollment_id"})
		return
	}
	var body tenantAdjustPointsBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	claims, _ := Claims(c)
	var actorID *uuid.UUID
	if claims.UserID != uuid.Nil {
		actorID = &claims.UserID
	}
	out, err := s.AdjustCustomerPointsUC.Execute(c.Request.Context(), loyalty.AdjustCustomerPointsInput{
		TenantID:     tenantID,
		EnrollmentID: enrollmentID,
		ActorUserID:  actorID,
		Delta:        body.Delta,
		Reason:       body.Reason,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, gin.H{
		"enrollment_id":  out.EnrollmentID.String(),
		"delta":          out.Delta,
		"balance_before": out.BalanceBefore,
		"balance_after":  out.BalanceAfter,
	})
}
