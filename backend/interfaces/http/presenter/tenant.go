package presenter

import (
	"encoding/json"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/tenant"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/gin-gonic/gin"
)

func Tenant(t *domain.Tenant) gin.H {
	var settings any
	if len(t.Settings) > 0 && json.Valid(t.Settings) {
		_ = json.Unmarshal(t.Settings, &settings)
	}
	if settings == nil {
		settings = map[string]any{}
	}
	logoURL := ""
	if m, ok := settings.(map[string]any); ok {
		if v, ok := m["logo_url"].(string); ok {
			logoURL = v
		}
	}
	return gin.H{
		"tenant_id":                  t.ID.String(),
		"name":                       t.Name,
		"slug":                       t.Slug,
		"self_serve":                 t.SelfServe,
		"active":                     t.Active,
		"plan":                       t.Plan,
		"conflict_policy":            t.ConflictPolicy,
		"allow_staff_self_enrollment": t.AllowStaffSelfEnrollment,
		"settings":                   settings,
		"logo_url":                   logoURL,
		"created_at":                 t.CreatedAt,
		"updated_at":                 t.UpdatedAt,
	}
}

func UserPublic(u domain.UserPublic) gin.H {
	return gin.H{
		"user_id":    u.ID.String(),
		"email":      u.Email,
		"role":       u.Role.String(),
		"created_at": u.CreatedAt,
	}
}

func TenantCustomerDetail(out *loyalty.TenantCustomerDetail) gin.H {
	item := gin.H{
		"enrollment_id":  out.Enrollment.ID.String(),
		"customer_id":    out.Customer.ID.String(),
		"name":           out.Customer.Name,
		"phone":          out.Customer.PhoneE164,
		"email":          out.Customer.Email,
		"points_balance": out.PointsBalance,
		"enrollment": gin.H{
			"tier":                out.Enrollment.Tier,
			"status":              out.Enrollment.Status,
			"visit_count":         out.Enrollment.VisitCount,
			"lifetime_spend_fcfa": out.Enrollment.LifetimeSpendFcfa,
			"enrollment_source":   out.Enrollment.EnrollmentSource,
			"enrolled_at":         out.Enrollment.CreatedAt,
			"last_interaction_at": out.Enrollment.LastInteractionAt,
		},
		"profile": gin.H{
			"gender":               out.Customer.Gender,
			"date_of_birth":        out.Customer.DateOfBirth,
			"neighborhood":         out.Customer.Neighborhood,
			"job_title":            out.Customer.JobTitle,
			"preferred_locale":     out.Customer.PreferredLocale,
			"interests":            out.Customer.Interests,
			"profile_completed_at": out.Customer.ProfileCompletedAt,
		},
	}
	if out.Tier != nil {
		item["tier"] = Tier(*out.Tier)
	}
	return item
}

func Tier(t domain.LoyaltyTier) gin.H {
	return gin.H{
		"id":            t.ID.String(),
		"code":          t.Code,
		"sort_order":    t.SortOrder,
		"min_points":    t.MinPoints,
		"color":         t.Color,
		"icon_key":      t.IconKey,
		"auto_upgrade":  t.AutoUpgrade,
		"benefits_json": json.RawMessage(t.BenefitsJSON),
		"active":        t.Active,
	}
}

func QRBranding(out *tenant.GetQRBrandingOutput) gin.H {
	b := out.Branding
	return gin.H{
		"branding": gin.H{
			"variant":         b.Variant,
			"theme":           b.Theme,
			"accent_color":    b.AccentColor,
			"font_family":     b.FontFamily,
			"heading_font":    b.HeadingFont,
			"qr_foreground":   b.QRForeground,
			"qr_background":   b.QRBackground,
			"layout_json":     json.RawMessage(b.LayoutJSON),
			"section_toggles": json.RawMessage(b.SectionToggles),
			"updated_at":      b.UpdatedAt,
		},
		"copy": out.Copy,
	}
}

func Campaign(c domain.Campaign) gin.H {
	return gin.H{
		"id":               c.ID.String(),
		"name":             c.Name,
		"campaign_type":    c.CampaignType,
		"status":           c.Status,
		"starts_at":        c.StartsAt,
		"ends_at":          c.EndsAt,
		"targeting_json":   json.RawMessage(c.TargetingJSON),
		"action_json":      json.RawMessage(c.ActionJSON),
		"budget_points":    c.BudgetPoints,
		"reach_count":      c.ReachCount,
		"conversion_count": c.ConversionCount,
		"created_at":       c.CreatedAt,
		"updated_at":       c.UpdatedAt,
	}
}

func Reward(rw domain.Reward) gin.H {
	item := gin.H{
		"id":          rw.ID.String(),
		"name":        rw.Name,
		"description": rw.Description,
		"point_cost":  rw.PointCost,
		"min_tier":    rw.MinTier,
		"active":      rw.Active,
		"stock_limit": rw.StockLimit,
		"icon_key":    rw.IconKey,
	}
	if rw.ImageURL != nil {
		item["image_url"] = *rw.ImageURL
	}
	return item
}

func PeriodMeta(from, to time.Time, label string) gin.H {
	return gin.H{
		"from":  from.Format(time.RFC3339),
		"to":    to.Format(time.RFC3339),
		"label": label,
	}
}
