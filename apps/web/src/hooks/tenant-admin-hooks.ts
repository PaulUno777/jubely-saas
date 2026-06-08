"use client";

import { useTenantAdminQuery } from "@/hooks/useTenantAdminQuery";
import type { TenantQueryBase } from "@/lib/tenant-admin/core";
import {
  getHeatmap,
  getLocales,
  getMemberGrowth,
  getOverview,
  getRetention,
  getTierDistribution,
  getTopRewards,
  getQRBranding,
  getQRToken,
  listAgents,
  listCampaigns,
  listCustomers,
  listRewards,
  listRules,
  listTiers,
  listTransactions,
} from "@/lib/tenant-admin";

export function useTenantCustomers(
  params: Omit<TenantQueryBase, "tenantId"> & { q?: string } = {},
) {
  return useTenantAdminQuery(
    "customers",
    [params.offset, params.limit, params.q, params.locationId],
    (tenantId) => listCustomers({ tenantId, ...params }),
  );
}

export function useTenantTransactions(
  params: Omit<TenantQueryBase, "tenantId"> & { event_type?: string } = {},
) {
  return useTenantAdminQuery(
    "transactions",
    [params.from, params.to, params.locationId, params.event_type, params.offset, params.limit],
    (tenantId) => listTransactions({ tenantId, ...params }),
  );
}

export function useTenantAgents(params: Omit<TenantQueryBase, "tenantId"> = {}) {
  return useTenantAdminQuery(
    "agents",
    [params.offset, params.limit],
    (tenantId) => listAgents({ tenantId, ...params }),
  );
}

export function useTenantRules() {
  return useTenantAdminQuery("rules", [], (tenantId) => listRules(tenantId));
}

export function useTenantTiers() {
  return useTenantAdminQuery("tiers", [], (tenantId) => listTiers(tenantId));
}

export function useTenantRewards(activeOnly = true) {
  return useTenantAdminQuery(
    "rewards",
    [activeOnly],
    (tenantId) => listRewards(tenantId, activeOnly),
    { staleTime: 60_000 },
  );
}

export type TenantRewardsQuery = ReturnType<typeof useTenantRewards>;
export type TenantCampaignsQuery = ReturnType<typeof useTenantCampaigns>;

export function useTenantCampaigns() {
  return useTenantAdminQuery("campaigns", [], (tenantId) => listCampaigns(tenantId));
}

export function useTenantAnalyticsOverview(
  params: Omit<TenantQueryBase, "tenantId"> = {},
) {
  return useTenantAdminQuery(
    "analytics-overview",
    [params.from, params.to, params.locationId],
    (tenantId) => getOverview({ tenantId, ...params }),
  );
}

export function useTenantMemberGrowth(params: Omit<TenantQueryBase, "tenantId"> = {}) {
  return useTenantAdminQuery(
    "analytics-member-growth",
    [params.from, params.to, params.locationId],
    (tenantId) => getMemberGrowth({ tenantId, ...params }),
  );
}

export function useTenantTierDistribution(params: Omit<TenantQueryBase, "tenantId"> = {}) {
  return useTenantAdminQuery(
    "analytics-tier-distribution",
    [params.from, params.to, params.locationId],
    (tenantId) => getTierDistribution({ tenantId, ...params }),
  );
}

export function useTenantHeatmap(params: Omit<TenantQueryBase, "tenantId"> = {}) {
  return useTenantAdminQuery(
    "analytics-heatmap",
    [params.from, params.to, params.locationId],
    (tenantId) => getHeatmap({ tenantId, ...params }),
  );
}

export function useTenantTopRewards(params: Omit<TenantQueryBase, "tenantId"> = {}) {
  return useTenantAdminQuery(
    "analytics-top-rewards",
    [params.from, params.to, params.locationId],
    (tenantId) => getTopRewards({ tenantId, ...params }),
  );
}

export function useTenantRetention(params: Omit<TenantQueryBase, "tenantId"> = {}) {
  return useTenantAdminQuery(
    "analytics-retention",
    [params.from, params.to, params.locationId],
    (tenantId) => getRetention({ tenantId, ...params }),
  );
}

export function useQRBranding() {
  return useTenantAdminQuery("qr-branding", [], (tenantId) => getQRBranding(tenantId));
}

export function useTenantQRToken() {
  return useTenantAdminQuery("qr-token", [], (tenantId) => getQRToken(tenantId));
}

export function useTenantLocales() {
  return useTenantAdminQuery("locales", [], (tenantId) => getLocales(tenantId));
}
