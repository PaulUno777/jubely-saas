import { z } from "zod";
import { successEnvelopeSchema } from "./envelope";

export const tenantMetricsPeriodSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string(),
});

export const tenantMetricKpiSchema = z.object({
  key: z.enum([
    "points_distributed",
    "active_customers",
    "rewards_validated",
    "retention_rate",
  ]),
  value: z.number(),
  unit: z.string().optional(),
  delta_pct: z.number(),
  trend_up: z.boolean(),
  sparkline: z.array(z.number()),
});

export const tenantMetricsSchema = z.object({
  period: tenantMetricsPeriodSchema,
  location_scope: z.enum(["all", "location"]),
  kpis: z.array(tenantMetricKpiSchema),
});

export const tenantMetricsSuccessEnvelopeSchema = successEnvelopeSchema(tenantMetricsSchema);

export type TenantMetrics = z.infer<typeof tenantMetricsSchema>;
export type TenantMetricKpi = z.infer<typeof tenantMetricKpiSchema>;

export const tenantLoyaltyActivityPointSchema = z.object({
  date: z.string(),
  label: z.string(),
  points_distributed: z.number().nonnegative(),
  points_rewarded: z.number().nonnegative(),
});

export const tenantLoyaltyActivitySchema = z.object({
  period: tenantMetricsPeriodSchema.pick({ from: true, to: true }).extend({
    label: z.string().optional(),
  }),
  series: z.array(tenantLoyaltyActivityPointSchema),
});

export const tenantLoyaltyActivitySuccessEnvelopeSchema = successEnvelopeSchema(
  tenantLoyaltyActivitySchema,
);

export type TenantLoyaltyActivity = z.infer<typeof tenantLoyaltyActivitySchema>;

export const tenantNavStatsSchema = z.object({
  customers: z.number().nonnegative(),
  locations: z.number().nonnegative(),
  team_members: z.number().nonnegative(),
  rules_active: z.number().nonnegative(),
  rewards_active: z.number().nonnegative(),
  campaigns: z.number().nonnegative(),
});

export const tenantNavStatsSuccessEnvelopeSchema = successEnvelopeSchema(tenantNavStatsSchema);

export type TenantNavStats = z.infer<typeof tenantNavStatsSchema>;

export const tenantLocationSchema = z.object({
  id: z.string(),
  tenant_id: z.string().optional(),
  slug: z.string(),
  name: z.string(),
  country_code: z.string(),
  state_code: z.string().optional(),
  city: z.string(),
  address_line: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  status: z.string(),
  is_hq: z.boolean(),
  timezone: z.string().optional(),
});

export const tenantLocationsListSchema = z.object({
  locations: z.array(tenantLocationSchema),
});

export const tenantLocationsListSuccessEnvelopeSchema = successEnvelopeSchema(tenantLocationsListSchema);

export type TenantLocation = z.infer<typeof tenantLocationSchema>;

export const nearbyLocationSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  tenant_name: z.string(),
  tenant_slug: z.string(),
  name: z.string(),
  slug: z.string(),
  city: z.string(),
  country_code: z.string(),
  state_code: z.string().optional(),
  address_line: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  distance_km: z.number().optional(),
  status: z.string(),
});

export const nearbyLocationsSchema = z.object({
  mode: z.enum(["precise", "coarse"]),
  origin: z.record(z.unknown()),
  locations: z.array(nearbyLocationSchema),
});

export const nearbyLocationsSuccessEnvelopeSchema = successEnvelopeSchema(nearbyLocationsSchema);

export type NearbyLocations = z.infer<typeof nearbyLocationsSchema>;

export const createTenantLocationWireSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  country_code: z.string().length(2),
  state_code: z.string().optional(),
  city: z.string().min(1),
  address_line: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  status: z.string().optional(),
  timezone: z.string().optional(),
});
