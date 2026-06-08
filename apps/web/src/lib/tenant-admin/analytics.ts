import {
  tenantAnalyticsOverviewEnvelopeSchema,
  tenantHeatmapEnvelopeSchema,
  tenantMemberGrowthEnvelopeSchema,
  tenantRetentionEnvelopeSchema,
  tenantTierDistributionEnvelopeSchema,
  tenantTopRewardsEnvelopeSchema,
} from "@jubely/api-schemas";
import { tenantFetch, tenantGetPath, type TenantQueryBase } from "./core";

type AnalyticsQuery = TenantQueryBase;

export async function getOverview(input: AnalyticsQuery) {
  return tenantFetch(
    tenantGetPath(input.tenantId, "analytics/overview", input),
    tenantAnalyticsOverviewEnvelopeSchema,
  );
}

export async function getMemberGrowth(input: AnalyticsQuery) {
  return tenantFetch(
    tenantGetPath(input.tenantId, "analytics/member-growth", input),
    tenantMemberGrowthEnvelopeSchema,
  );
}

export async function getTierDistribution(input: AnalyticsQuery) {
  return tenantFetch(
    tenantGetPath(input.tenantId, "analytics/tier-distribution", input),
    tenantTierDistributionEnvelopeSchema,
  );
}

export async function getHeatmap(input: AnalyticsQuery) {
  return tenantFetch(
    tenantGetPath(input.tenantId, "analytics/hourly-heatmap", input),
    tenantHeatmapEnvelopeSchema,
  );
}

export async function getTopRewards(input: AnalyticsQuery) {
  return tenantFetch(
    tenantGetPath(input.tenantId, "analytics/top-rewards", input),
    tenantTopRewardsEnvelopeSchema,
  );
}

export async function getRetention(input: AnalyticsQuery) {
  return tenantFetch(
    tenantGetPath(input.tenantId, "analytics/retention-cohorts", input),
    tenantRetentionEnvelopeSchema,
  );
}
