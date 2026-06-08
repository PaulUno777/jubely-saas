package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/staff"
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (s *Server) CustomerListRewards(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.ActiveEnrollmentID == nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "missing_active_enrollment"})
		return
	}
	var tenantFilter *uuid.UUID
	if tid := strings.TrimSpace(c.Query("tenant_id")); tid != "" {
		parsed, err := uuid.Parse(tid)
		if err != nil {
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_tenant_id"})
			return
		}
		tenantFilter = &parsed
	}
	items, balance, tier, err := s.ListCustomerRewardsUC.Execute(c.Request.Context(), *claims.ActiveEnrollmentID, tenantFilter)
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	rewards := make([]gin.H, 0, len(items))
	for _, it := range items {
		fs := make([]gin.H, 0, len(it.FulfillmentStores))
		for _, st := range it.FulfillmentStores {
			fs = append(fs, gin.H{"id": st.ID.String(), "name": st.Name, "short": st.Short})
		}
		rewards = append(rewards, gin.H{
			"id":                 it.Reward.ID.String(),
			"name":               it.Reward.Name,
			"description":        it.Reward.Description,
			"point_cost":         it.Reward.PointCost,
			"min_tier":           it.Reward.MinTier,
			"affordable":         it.Affordable,
			"points_needed":      it.PointsNeeded,
			"fulfillment_stores": fs,
		})
	}
	respondOK(c, gin.H{
		"rewards":        rewards,
		"points_balance": balance,
		"tier":           tier,
	})
}

type customerClaimRewardBody struct {
	RewardID string `json:"reward_id"`
}

func (s *Server) CustomerClaimReward(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.ActiveEnrollmentID == nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "missing_active_enrollment"})
		return
	}
	var body customerClaimRewardBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	rewardID, err := uuid.Parse(strings.TrimSpace(body.RewardID))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_reward_id"})
		return
	}
	out, err := s.CustomerClaimRewardUC.Execute(c.Request.Context(), loyalty.CustomerClaimRewardInput{
		EnrollmentID: *claims.ActiveEnrollmentID,
		RewardID:     rewardID,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	fs := make([]gin.H, 0, len(out.FulfillmentStores))
	for _, st := range out.FulfillmentStores {
		fs = append(fs, gin.H{
			"id":           st.ID.String(),
			"name":         st.Name,
			"short":        st.Short,
			"address_line": st.AddressLine,
			"city":         st.City,
			"country_code": st.CountryCode,
		})
	}
	respondCreated(c, gin.H{
		"redemption_id":      out.RedemptionID.String(),
		"claim_qr":             out.ClaimQR,
		"display_code":         out.DisplayCode,
		"expires_at":           out.ExpiresAt,
		"points_spent":         out.PointsSpent,
		"balance_after":        out.BalanceAfter,
		"reward_name":          out.RewardName,
		"fulfillment_stores":   fs,
	})
}

type staffValidateRedemptionBody struct {
	ClaimQR string `json:"claim_qr"`
}

func (s *Server) StaffValidateRedemption(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	var body staffValidateRedemptionBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	out, err := s.StaffValidateRedemptionUC.Execute(c.Request.Context(), staff.StaffValidateRedemptionInput{
		TenantID: *claims.TenantID,
		ClaimQR:  body.ClaimQR,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	fs := make([]gin.H, 0, len(out.FulfillmentStores))
	for _, st := range out.FulfillmentStores {
		fs = append(fs, gin.H{"id": st.ID.String(), "name": st.Name, "short": st.Short})
	}
	respondOK(c, gin.H{
		"redemption_id":      out.RedemptionID.String(),
		"reward_name":        out.RewardName,
		"points_spent":       out.PointsSpent,
		"display_code":       out.DisplayCode,
		"customer_name":      out.CustomerName,
		"customer_id":        out.CustomerID.String(),
		"fulfillment_stores": fs,
	})
}
