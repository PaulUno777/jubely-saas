package httpserver

import (
	"encoding/json"

	"github.com/PaulUno777/jubely-saas/backend/application/rules"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type storeCreateRuleBody struct {
	Rule     rules.Rule `json:"rule"`
	Priority int        `json:"priority"`
	Active   bool       `json:"active"`
}

type storePatchRuleBody struct {
	Rule     *rules.Rule `json:"rule"`
	Active   *bool       `json:"active"`
	Priority *int        `json:"priority"`
}

type simulateRulesBody struct {
	AmountFcfa int64  `json:"amount_fcfa"`
	OccurredAt string `json:"occurred_at"`
	Tier       string `json:"tier"`
	IsNew      bool   `json:"is_new"`
}

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

func ruleRecordToGin(id uuid.UUID, active bool, priority int, raw json.RawMessage) gin.H {
	var rule rules.Rule
	_ = json.Unmarshal(raw, &rule)
	return gin.H{
		"id":       id.String(),
		"active":   active,
		"priority": priority,
		"rule":     rule,
	}
}
