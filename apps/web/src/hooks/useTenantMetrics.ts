"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import {
  tenantGetLoyaltyActivity,
  tenantGetMetrics,
  tenantGetStats,
  tenantListLocations,
  type TenantMetricsQuery,
} from "@/lib/tenantApi";

export function useTenantMetrics(opts?: Pick<TenantMetricsQuery, "period" | "locationId">) {
  const { session } = useSession();
  const tenantId = session?.tenantId;

  return useQuery({
    queryKey: ["tenant", "metrics", tenantId, opts?.period ?? "7d", opts?.locationId],
    enabled: Boolean(session && session.role === "merchant_admin" && tenantId),
    queryFn: () =>
      tenantGetMetrics({
        tenantId: tenantId!,
        period: opts?.period,
        locationId: opts?.locationId,
      }),
    staleTime: 60_000,
  });
}

export function useTenantLoyaltyActivity(opts?: Pick<TenantMetricsQuery, "period" | "locationId">) {
  const { session } = useSession();
  const tenantId = session?.tenantId;

  return useQuery({
    queryKey: ["tenant", "loyalty-activity", tenantId, opts?.period ?? "7d", opts?.locationId],
    enabled: Boolean(session && session.role === "merchant_admin" && tenantId),
    queryFn: () =>
      tenantGetLoyaltyActivity({
        tenantId: tenantId!,
        period: opts?.period,
        locationId: opts?.locationId,
      }),
    staleTime: 60_000,
  });
}

export function useTenantNavStats() {
  const { session } = useSession();
  const tenantId = session?.tenantId;

  return useQuery({
    queryKey: ["tenant", "stats", tenantId],
    enabled: Boolean(session && session.role === "merchant_admin" && tenantId),
    queryFn: () => tenantGetStats(tenantId!),
    staleTime: 120_000,
  });
}

export function useTenantLocations() {
  const { session } = useSession();
  const tenantId = session?.tenantId;

  return useQuery({
    queryKey: ["tenant", "locations", tenantId],
    enabled: Boolean(session && session.role === "merchant_admin" && tenantId),
    queryFn: () => tenantListLocations(tenantId!),
    staleTime: 120_000,
  });
}
