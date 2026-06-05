import { z } from "zod";
import { successEnvelopeSchema } from "./envelope";

export const tenantDateRangeSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
});

export const tenantCustomerRowSchema = z.object({
  enrollment_id: z.string(),
  customer_id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable().optional(),
  tier: z.object({ code: z.string() }),
  points_balance: z.number(),
  enrolled_at: z.union([z.string(), z.date(), z.number()]),
});

export const tenantCustomersSuccessEnvelopeSchema = successEnvelopeSchema(
  z.object({ customers: z.array(tenantCustomerRowSchema) }),
);

export const loyaltyTierSchema = z.object({
  id: z.string(),
  code: z.string(),
  sort_order: z.number(),
  min_points: z.number(),
  color: z.string(),
  icon_key: z.string().nullable().optional(),
  auto_upgrade: z.boolean(),
  benefits_json: z.unknown(),
  active: z.boolean(),
});

export const tenantTiersSuccessEnvelopeSchema = successEnvelopeSchema(
  z.object({ tiers: z.array(loyaltyTierSchema) }),
);

export const ruleConflictSchema = z.object({
  level: z.enum(["warn", "error", "info"]),
  rules: z.array(z.string()).nullable().optional(),
  msg: z.string(),
});

export const validateRulesSuccessEnvelopeSchema = successEnvelopeSchema(
  z.object({ conflicts: z.array(ruleConflictSchema) }),
);

export const qrBrandingSchema = z.object({
  branding: z.object({
    variant: z.string(),
    theme: z.string(),
    accent_color: z.string(),
    font_family: z.string(),
    heading_font: z.string().nullable().optional(),
    qr_foreground: z.string().nullable().optional(),
    qr_background: z.string().nullable().optional(),
    layout_json: z.unknown(),
    section_toggles: z.unknown(),
    updated_at: z.union([z.string(), z.date(), z.number()]),
  }),
  copy: z.record(z.string(), z.record(z.string(), z.string())),
});

export const campaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  campaign_type: z.string(),
  status: z.string(),
  starts_at: z.union([z.string(), z.date(), z.number()]).nullable().optional(),
  ends_at: z.union([z.string(), z.date(), z.number()]).nullable().optional(),
  targeting_json: z.unknown(),
  action_json: z.unknown(),
  budget_points: z.number().nullable().optional(),
  reach_count: z.number(),
  conversion_count: z.number(),
  created_at: z.union([z.string(), z.date(), z.number()]),
  updated_at: z.union([z.string(), z.date(), z.number()]),
});

export const tenantCampaignsSuccessEnvelopeSchema = successEnvelopeSchema(
  z.object({ campaigns: z.array(campaignSchema) }),
);

export const analyticsOverviewSchema = z.object({
  visit_frequency_per_week: z.number(),
  avg_basket_fcfa: z.number(),
  points_per_member: z.number(),
  dormant_members: z.number(),
  total_members: z.number(),
});

export const tenantAnalyticsOverviewEnvelopeSchema = successEnvelopeSchema(
  z.object({
    overview: analyticsOverviewSchema,
    period: tenantDateRangeSchema,
  }),
);

export const customerProfilePatchWireSchema = z.object({
  name: z.string().optional(),
  gender: z.enum(["f", "h", "nb", "na"]).optional(),
  date_of_birth: z.string().optional(),
  neighborhood: z.string().optional(),
  job_title: z.string().optional(),
  preferred_locale: z.string().optional(),
  interests: z.array(z.string()).optional(),
  notification_prefs: z.unknown().optional(),
});

export type TenantCustomerRow = z.infer<typeof tenantCustomerRowSchema>;
export type LoyaltyTier = z.infer<typeof loyaltyTierSchema>;
export type Campaign = z.infer<typeof campaignSchema>;
