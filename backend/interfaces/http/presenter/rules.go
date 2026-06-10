package presenter

import (
	"encoding/json"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/rules"
	"github.com/gin-gonic/gin"
)

func RuleRecord(rec ports.PointsRuleRecord) gin.H {
	var rule rules.Rule
	_ = json.Unmarshal(rec.RuleJSON, &rule)
	h := gin.H{
		"id":          rec.ID.String(),
		"active":      rec.Active,
		"priority":    rec.Priority,
		"editor_tier": rec.EditorTier,
		"rule":        rule,
	}
	if rec.FrozenAt != nil {
		h["frozen_at"] = rec.FrozenAt
		h["frozen"] = true
	}
	if rec.FrozenReason != nil {
		h["frozen_reason"] = *rec.FrozenReason
	}
	if rec.CurrentVersionID != nil {
		h["current_version_id"] = rec.CurrentVersionID.String()
	}
	return h
}

func RuleVersion(v ports.RuleVersionRecord) gin.H {
	h := gin.H{
		"id":             v.ID.String(),
		"rule_id":        v.RuleID.String(),
		"version_number": v.VersionNumber,
		"editor_tier":    v.EditorTier,
		"created_at":     v.CreatedAt,
		"rule":           json.RawMessage(v.RuleJSON),
	}
	if v.CreatedBy != nil {
		h["created_by"] = v.CreatedBy.String()
	}
	if v.ChangeSummary != nil {
		h["change_summary"] = *v.ChangeSummary
	}
	return h
}
