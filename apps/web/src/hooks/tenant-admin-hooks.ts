"use client";

import type { Campaign, TenantLocale } from "@jubely/api-schemas";
import { useTenantAdminQuery } from "@/hooks/useTenantAdminQuery";
import type { TenantQueryBase } from "@/lib/tenant-admin/core";
import {
  getLocales,
  getMemberGrowth,
  getOverview,
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

export function useQRBranding() {
  return useTenantAdminQuery("qr-branding", [], (tenantId) => getQRBranding(tenantId));
}

export function useTenantQRToken() {
  return useTenantAdminQuery("qr-token", [], (tenantId) => getQRToken(tenantId));
}

export function useTenantLocales() {
  return useTenantAdminQuery("locales", [], (tenantId) => getLocales(tenantId));
}
