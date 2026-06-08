import { z } from "zod";
import { successEnvelopeSchema } from "./envelope";
import { tenantSchema } from "./admin";
import {
  createStoreRewardWireSchema,
  patchStoreRewardWireSchema,
  storeRewardSchema,
} from "./rewards";
import {
  listStoreRulesSuccessEnvelopeSchema,
  loyaltyRuleSchema,
  simulateRulesSuccessEnvelopeSchema,
  simulateRulesWireSchema,
  storeRuleRecordSchema,
} from "./rules";
import { storePointEventSchema } from "./store";
import { userPublicSchema } from "./admin";
import { createInvitationWireSchema } from "./admin";
import { patchStoreTenantWireSchema } from "./store";

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

export const tenantCustomersListSchema = z.object({
  customers: z.array(tenantCustomerRowSchema),
});

export const tenantCustomersSuccessEnvelopeSchema = successEnvelopeSchema(tenantCustomersListSchema);

export const tenantCustomerDetailSchema = z.object({
  enrollment_id: z.string(),
  customer_id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable().optional(),
  points_balance: z.number(),
  enrollment: z.record(z.unknown()),
  profile: z.record(z.unknown()).optional(),
  tier: z.record(z.unknown()).optional(),
});

export const tenantCustomerDetailEnvelopeSchema = successEnvelopeSchema(tenantCustomerDetailSchema);

export const tenantAdjustPointsWireSchema = z.object({
  delta: z.number().int(),
  reason: z.string().min(1),
  location_id: z.string().optional(),
});

export const tenantTransactionsListSchema = z.object({
  transactions: z.array(storePointEventSchema),
  period: tenantDateRangeSchema.optional(),
});

export const tenantTransactionsSuccessEnvelopeSchema = successEnvelopeSchema(tenantTransactionsListSchema);

export const tenantAgentsListSchema = z.object({
  agents: z.array(userPublicSchema),
});

export const tenantAgentsSuccessEnvelopeSchema = successEnvelopeSchema(tenantAgentsListSchema);

export const tenantSettingsSuccessEnvelopeSchema = successEnvelopeSchema(tenantSchema);

export const tenantPatchSettingsWireSchema = patchStoreTenantWireSchema;

export const tenantCreateInvitationWireSchema = createInvitationWireSchema;

export const tenantRewardsListSchema = z.object({
  rewards: z.array(storeRewardSchema.extend({
    image_url: z.string().optional(),
    icon_key: z.string().optional(),
  })),
});

export const tenantRewardsSuccessEnvelopeSchema = successEnvelopeSchema(tenantRewardsListSchema);

export const tenantRewardSuccessEnvelopeSchema = successEnvelopeSchema(
  storeRewardSchema.extend({
    image_url: z.string().optional(),
    icon_key: z.string().optional(),
  }),
);

export const tenantCreateRewardWireSchema = createStoreRewardWireSchema;
export const tenantPatchRewardWireSchema = patchStoreRewardWireSchema;

export const tenantQrTokenSchema = z.object({
  store_qr: z.string(),
  location_id: z.string().optional(),
});

export const tenantQrTokenSuccessEnvelopeSchema = successEnvelopeSchema(tenantQrTokenSchema);

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

export const tenantUpsertTierWireSchema = z.object({
  id: z.string().optional(),
  code: z.string(),
  sort_order: z.number().optional(),
  min_points: z.number().optional(),
  color: z.string().optional(),
  icon_key: z.string().nullable().optional(),
  auto_upgrade: z.boolean().optional(),
  benefits_json: z.unknown().optional(),
  active: z.boolean().optional(),
});

export const ruleConflictSchema = z.object({
  level: z.enum(["warn", "error", "info"]),
  rules: z.array(z.string()).nullable().optional(),
  msg: z.string(),
});

export const validateRulesSuccessEnvelopeSchema = successEnvelopeSchema(
  z.object({ conflicts: z.array(ruleConflictSchema) }),
);

export {
  listStoreRulesSuccessEnvelopeSchema as tenantRulesListSuccessEnvelopeSchema,
  storeRuleRecordSchema as tenantRuleRecordSchema,
  loyaltyRuleSchema as tenantLoyaltyRuleSchema,
  simulateRulesWireSchema as tenantSimulateRulesWireSchema,
  simulateRulesSuccessEnvelopeSchema as tenantSimulateRulesSuccessEnvelopeSchema,
};

export const tenantCreateRuleWireSchema = z.object({
  rule: loyaltyRuleSchema,
  priority: z.number().optional(),
  active: z.boolean().optional(),
});

export const tenantPatchRuleWireSchema = z.object({
  rule: loyaltyRuleSchema.optional(),
  priority: z.number().optional(),
  active: z.boolean().optional(),
});

export const tenantRuleSuccessEnvelopeSchema = successEnvelopeSchema(storeRuleRecordSchema);

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

export const qrBrandingSuccessEnvelopeSchema = successEnvelopeSchema(qrBrandingSchema);

export const tenantLocaleSchema = z.object({
  locale: z.string(),
  is_primary: z.boolean(),
  enabled: z.boolean(),
});

export const tenantLocalesSuccessEnvelopeSchema = successEnvelopeSchema(
  z.object({ locales: z.array(tenantLocaleSchema) }),
);

export const tenantPutLocalesWireSchema = z.object({
  locales: z.array(
    z.object({
      locale: z.string(),
      is_primary: z.boolean(),
      enabled: z.boolean(),
    }),
  ),
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

export const tenantCampaignSuccessEnvelopeSchema = successEnvelopeSchema(campaignSchema);

export const tenantCampaignWireSchema = z.object({
  name: z.string(),
  campaign_type: z.string(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  targeting_json: z.unknown().optional(),
  action_json: z.unknown().optional(),
  budget_points: z.number().nullable().optional(),
});

export const analyticsOverviewSchema = z.object({
  VisitFrequencyPerWeek: z.number().optional(),
  AvgBasketFcfa: z.number().optional(),
  PointsPerMember: z.number().optional(),
  DormantMembers: z.number().optional(),
  TotalMembers: z.number().optional(),
  visit_frequency_per_week: z.number().optional(),
  avg_basket_fcfa: z.number().optional(),
  points_per_member: z.number().optional(),
  dormant_members: z.number().optional(),
  total_members: z.number().optional(),
}).passthrough();

export const tenantAnalyticsOverviewEnvelopeSchema = successEnvelopeSchema(
  z.object({
    overview: analyticsOverviewSchema,
    period: tenantDateRangeSchema,
  }),
);

export const memberGrowthPointSchema = z.object({
  Date: z.union([z.string(), z.date(), z.number()]).optional(),
  date: z.union([z.string(), z.date(), z.number()]).optional(),
  Label: z.string().optional(),
  label: z.string().optional(),
  NewMembers: z.number().optional(),
  new_members: z.number().optional(),
  Reactivated: z.number().optional(),
  reactivated: z.number().optional(),
}).passthrough();

export const tenantMemberGrowthEnvelopeSchema = successEnvelopeSchema(
  z.object({
    series: z.array(memberGrowthPointSchema),
    period: tenantDateRangeSchema,
  }),
);

export const tenantTierDistributionEnvelopeSchema = successEnvelopeSchema(
  z.object({
    slices: z.array(z.record(z.unknown())),
    period: tenantDateRangeSchema,
  }),
);

export const tenantHeatmapEnvelopeSchema = successEnvelopeSchema(
  z.object({
    cells: z.array(z.record(z.unknown())),
    period: tenantDateRangeSchema,
  }),
);

export const tenantTopRewardsEnvelopeSchema = successEnvelopeSchema(
  z.object({
    rewards: z.array(z.record(z.unknown())),
    period: tenantDateRangeSchema,
  }),
);

export const tenantRetentionEnvelopeSchema = successEnvelopeSchema(
  z.object({
    cohorts: z.array(z.record(z.unknown())),
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
export type TenantLocale = z.infer<typeof tenantLocaleSchema>;
export type QrBranding = z.infer<typeof qrBrandingSchema>;
