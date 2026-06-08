package presenter

import (
	"encoding/json"

	"github.com/PaulUno777/jubely-saas/backend/application/rules"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RuleRecord(id uuid.UUID, active bool, priority int, raw json.RawMessage) gin.H {
	var rule rules.Rule
	_ = json.Unmarshal(raw, &rule)
	return gin.H{
		"id":       id.String(),
		"active":   active,
		"priority": priority,
		"rule":     rule,
	}
}
