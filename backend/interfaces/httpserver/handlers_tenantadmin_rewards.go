package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/presenter"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type storeCreateRewardBody struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	PointCost   int    `json:"point_cost"`
	MinTier     string `json:"min_tier"`
	Active      bool   `json:"active"`
	StockLimit  *int   `json:"stock_limit"`
}

type storePatchRewardBody struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	PointCost   *int    `json:"point_cost"`
	MinTier     *string `json:"min_tier"`
	Active      *bool   `json:"active"`
	StockLimit  *int    `json:"stock_limit"`
}

func (s *Server) TenantCreateReward(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	var body storeCreateRewardBody
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, i18n.CodeValidationInvalid, gin.H{"reason": "invalid_body"})
		return
	}
	rec, err := s.CreateStoreRewardUC.Execute(c.Request.Context(), loyalty.CreateStoreRewardInput{
		TenantID:    tenantID,
		Name:        body.Name,
		Description: body.Description,
		PointCost:   body.PointCost,
		MinTier:     body.MinTier,
		Active:      body.Active,
		StockLimit:  body.StockLimit,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondCreated(c, presenter.Reward(*rec))
}

func (s *Server) TenantPatchReward(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
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
	rec, err := s.PatchStoreRewardUC.Execute(c.Request.Context(), loyalty.PatchStoreRewardInput{
		TenantID:    tenantID,
		RewardID:    rewardID,
		Name:        body.Name,
		Description: body.Description,
		PointCost:   body.PointCost,
		MinTier:     body.MinTier,
		Active:      body.Active,
		StockLimit:  body.StockLimit,
	})
	if err != nil {
		respondMapped(c, mapCustomerError(err))
		return
	}
	respondOK(c, presenter.Reward(*rec))
}

func (s *Server) TenantListRewards(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	activeOnly := strings.TrimSpace(c.Query("active_only")) != "false"
	rewards, err := s.ListStoreRewardsUC.Execute(c.Request.Context(), tenantID, activeOnly)
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	items := make([]gin.H, 0, len(rewards))
	for _, rw := range rewards {
		items = append(items, presenter.Reward(rw))
	}
	respondOK(c, gin.H{"rewards": items})
}
