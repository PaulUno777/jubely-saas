package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

type storeCreateInvitationBody struct {
	Email string `json:"email"`
	Role  string `json:"role"` // optional; defaults to staff for store admins
}

func (s *Server) StoreGetMetrics(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	points, events, err := s.StoreMetrics.TenantSummary(c.Request.Context(), *claims.TenantID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	respondOK(c, gin.H{
		"points_distributed":      points,
		"point_events_this_month": events,
	})
}

func (s *Server) StoreGetTenant(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	t, err := s.Tenants.FindByID(c.Request.Context(), *claims.TenantID)
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, tenantToGin(t))
}

type storePatchTenantBody struct {
	Name           *string          `json:"name"`
	ConflictPolicy *string          `json:"conflict_policy"`
	AllowStaffSelfEnrollment *bool  `json:"allow_staff_self_enrollment"`
	Settings       *json.RawMessage `json:"settings"`
}

func (s *Server) StorePatchTenant(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	var body storePatchTenantBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	if body.Name == nil && body.ConflictPolicy == nil && body.AllowStaffSelfEnrollment == nil && body.Settings == nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "no_fields"})
		return
	}
	out, err := s.UpdateTenantUC.Execute(c.Request.Context(), usecase.UpdateTenantInput{
		TenantID:       *claims.TenantID,
		Name:           body.Name,
		ConflictPolicy: body.ConflictPolicy,
		AllowStaffSelfEnrollment: body.AllowStaffSelfEnrollment,
		Settings:       body.Settings,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	respondOK(c, tenantToGin(out.Tenant))
}

func (s *Server) StoreGetStoreQR(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	if _, err := s.Tenants.FindByID(c.Request.Context(), *claims.TenantID); err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	token, err := s.QRCodec.SignStoreQR(c.Request.Context(), *claims.TenantID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	respondOK(c, gin.H{"store_qr": token})
}

func (s *Server) StoreListUsers(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	offset, limit := parsePageQuery(c)
	out, err := s.ListTenantUsersUC.Execute(c.Request.Context(), usecase.ListTenantUsersInput{
		TenantID: *claims.TenantID,
		Offset:   offset,
		Limit:    limit,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	items := make([]gin.H, 0, len(out.Users))
	for _, u := range out.Users {
		items = append(items, userPublicToGin(u))
	}
	respondPage(c, items, Pagination{
		Limit:  out.Limit,
		Offset: out.Offset,
		Total:  int(out.Total),
	})
}

func (s *Server) StoreCreateInvitation(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}

	var body storeCreateInvitationBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}

	role := domain.Role(body.Role)
	if role == "" {
		role = domain.RoleStaff
	}

	out, err := s.CreateInvitationUC.Execute(c.Request.Context(), usecase.CreateMerchantInvitationInput{
		TenantID: *claims.TenantID,
		Email:    body.Email,
		Role:     role,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}

	respondCreated(c, gin.H{
		"invitation_id": out.InvitationID.String(),
		"token":         out.Token,
		"expires_at":    out.ExpiresAt,
	})
}

func (s *Server) StoreListCustomers(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	offset, limit := parsePageQuery(c)
	out, err := s.ListStoreCustomersUC.Execute(c.Request.Context(), usecase.ListStoreCustomersInput{
		TenantID: *claims.TenantID,
		Offset:   offset,
		Limit:    limit,
	})
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	items := make([]gin.H, 0, len(out.Customers))
	for _, row := range out.Customers {
		item := gin.H{
			"enrollment_id":  row.EnrollmentID.String(),
			"customer_id":    row.CustomerID.String(),
			"name":           row.Name,
			"phone":          row.PhoneE164,
			"tier":           row.Tier,
			"points_balance": row.PointsBalance,
			"enrolled_at":    row.EnrolledAt,
		}
		if row.Email != nil {
			item["email"] = *row.Email
		}
		items = append(items, item)
	}
	respondPage(c, items, Pagination{
		Limit:  out.Limit,
		Offset: out.Offset,
		Total:  int(out.Total),
	})
}

func (s *Server) StoreListPointEvents(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	offset, limit := parsePageQuery(c)
	out, err := s.ListStorePointEventsUC.Execute(c.Request.Context(), usecase.ListStorePointEventsInput{
		TenantID: *claims.TenantID,
		Offset:   offset,
		Limit:    limit,
	})
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	items := make([]gin.H, 0, len(out.Events))
	for _, row := range out.Events {
		item := gin.H{
			"event_id":   row.EventID.String(),
			"event_type": row.EventType,
			"delta":      row.Delta,
			"payload":    row.Payload,
			"created_at": row.CreatedAt,
		}
		if row.CustomerName != nil {
			item["customer_name"] = *row.CustomerName
		}
		if row.CustomerPhone != nil {
			item["customer_phone"] = *row.CustomerPhone
		}
		items = append(items, item)
	}
	respondPage(c, items, Pagination{
		Limit:  out.Limit,
		Offset: out.Offset,
		Total:  int(out.Total),
	})
}
