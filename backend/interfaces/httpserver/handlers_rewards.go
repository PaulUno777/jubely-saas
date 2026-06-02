package httpserver

import (
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (s *Server) StoreListRewards(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	activeOnly := c.Query("active") != "false"
	list, err := s.ListStoreRewardsUC.Execute(c.Request.Context(), *claims.TenantID, activeOnly)
	if err != nil {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	items := make([]gin.H, 0, len(list))
	for _, rw := range list {
		items = append(items, gin.H{
			"id":          rw.ID.String(),
			"name":        rw.Name,
			"description": rw.Description,
			"point_cost":  rw.PointCost,
			"min_tier":    rw.MinTier,
			"active":      rw.Active,
			"stock_limit": rw.StockLimit,
		})
	}
	respondOK(c, gin.H{"rewards": items})
}

type storeCreateRewardBody struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	PointCost   int      `json:"point_cost"`
	MinTier     string   `json:"min_tier"`
	Active      bool     `json:"active"`
	StockLimit  *int     `json:"stock_limit"`
	StoreIDs    []string `json:"store_ids"`
}

func (s *Server) StoreCreateReward(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	var body storeCreateRewardBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	storeIDs, err := parseUUIDList(body.StoreIDs)
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_store_ids"})
		return
	}
	rw, err := s.CreateStoreRewardUC.Execute(c.Request.Context(), usecase.CreateStoreRewardInput{
		TenantID:    *claims.TenantID,
		Name:        body.Name,
		Description: body.Description,
		PointCost:   body.PointCost,
		MinTier:     body.MinTier,
		Active:      body.Active,
		StockLimit:  body.StockLimit,
		StoreIDs:    storeIDs,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondCreated(c, gin.H{
		"id":          rw.ID.String(),
		"name":        rw.Name,
		"description": rw.Description,
		"point_cost":  rw.PointCost,
		"min_tier":    rw.MinTier,
		"active":      rw.Active,
		"stock_limit": rw.StockLimit,
	})
}

type storePatchRewardBody struct {
	Name        *string  `json:"name"`
	Description *string  `json:"description"`
	PointCost   *int     `json:"point_cost"`
	MinTier     *string  `json:"min_tier"`
	Active      *bool    `json:"active"`
	StockLimit  *int     `json:"stock_limit"`
	StoreIDs    []string `json:"store_ids"`
}

func (s *Server) StorePatchReward(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.TenantID == nil {
		respondError(c, http.StatusUnauthorized, i18n.CodeAuthUnauthorized, nil)
		return
	}
	rewardID, err := uuid.Parse(c.Param("rewardId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_reward_id"})
		return
	}
	var body storePatchRewardBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	patchIn := usecase.PatchStoreRewardInput{
		TenantID:    *claims.TenantID,
		RewardID:    rewardID,
		Name:        body.Name,
		Description: body.Description,
		PointCost:   body.PointCost,
		MinTier:     body.MinTier,
		Active:      body.Active,
		StockLimit:  body.StockLimit,
	}
	if body.StoreIDs != nil {
		storeIDs, err := parseUUIDList(body.StoreIDs)
		if err != nil {
			respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_store_ids"})
			return
		}
		patchIn.StoreIDs = storeIDs
		patchIn.SetStoreIDs = true
	}
	rw, err := s.PatchStoreRewardUC.Execute(c.Request.Context(), patchIn)
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, gin.H{
		"id":          rw.ID.String(),
		"name":        rw.Name,
		"description": rw.Description,
		"point_cost":  rw.PointCost,
		"min_tier":    rw.MinTier,
		"active":      rw.Active,
		"stock_limit": rw.StockLimit,
	})
}

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
			"id":                  it.Reward.ID.String(),
			"name":                it.Reward.Name,
			"description":         it.Reward.Description,
			"point_cost":          it.Reward.PointCost,
			"min_tier":            it.Reward.MinTier,
			"affordable":          it.Affordable,
			"points_needed":       it.PointsNeeded,
			"fulfillment_stores":  fs,
		})
	}
	respondOK(c, gin.H{
		"rewards":        rewards,
		"points_balance": balance,
		"tier":           tier,
	})
}

func (s *Server) CustomerClaimReward(c *gin.Context) {
	claims, ok := Claims(c)
	if !ok || claims.ActiveEnrollmentID == nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "missing_active_enrollment"})
		return
	}
	rewardID, err := uuid.Parse(c.Param("rewardId"))
	if err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_reward_id"})
		return
	}
	out, err := s.CustomerClaimRewardUC.Execute(c.Request.Context(), usecase.CustomerClaimRewardInput{
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
		"redemption_id":        out.RedemptionID.String(),
		"claim_qr":             out.ClaimQR,
		"display_code":         out.DisplayCode,
		"expires_at":           out.ExpiresAt,
		"points_spent":         out.PointsSpent,
		"balance_after":        out.BalanceAfter,
		"reward_name":          out.RewardName,
		"fulfillment_stores":   fs,
	})
}

func parseUUIDList(ids []string) ([]uuid.UUID, error) {
	out := make([]uuid.UUID, 0, len(ids))
	for _, s := range ids {
		s = strings.TrimSpace(s)
		if s == "" {
			continue
		}
		id, err := uuid.Parse(s)
		if err != nil {
			return nil, err
		}
		out = append(out, id)
	}
	return out, nil
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
	out, err := s.StaffValidateRedemptionUC.Execute(c.Request.Context(), usecase.StaffValidateRedemptionInput{
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
