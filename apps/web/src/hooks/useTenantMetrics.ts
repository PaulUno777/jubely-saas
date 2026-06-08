"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import {
  getLoyaltyActivity,
  getMetrics,
  getStats,
  listLocations,
  type TenantMetricsQuery,
} from "@/lib/tenant-admin";

type MetricsOpts = Pick<TenantMetricsQuery, "period" | "locationId" | "from" | "to">;

function metricsEnabled(session: ReturnType<typeof useSession>["session"], tenantId?: string) {
  return Boolean(session && session.role === "merchant_admin" && tenantId);
}

export function useTenantMetrics(opts?: MetricsOpts) {
  const { session } = useSession();
  const tenantId = session?.tenantId;

  return useQuery({
    queryKey: [
      "tenant",
      "metrics",
      tenantId,
      opts?.from,
      opts?.to,
      opts?.period ?? "7d",
      opts?.locationId,
    ],
    enabled: metricsEnabled(session, tenantId),
    queryFn: () =>
      getMetrics({
        tenantId: tenantId!,
        period: opts?.period,
        from: opts?.from,
        to: opts?.to,
        locationId: opts?.locationId,
      }),
    staleTime: 60_000,
  });
}

export function useTenantLoyaltyActivity(opts?: MetricsOpts) {
  const { session } = useSession();
  const tenantId = session?.tenantId;

  return useQuery({
    queryKey: [
      "tenant",
      "loyalty-activity",
      tenantId,
      opts?.from,
      opts?.to,
      opts?.period ?? "7d",
      opts?.locationId,
    ],
    enabled: metricsEnabled(session, tenantId),
    queryFn: () =>
      getLoyaltyActivity({
        tenantId: tenantId!,
        period: opts?.period,
        from: opts?.from,
        to: opts?.to,
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
    enabled: metricsEnabled(session, tenantId),
    queryFn: () => getStats(tenantId!),
    staleTime: 120_000,
  });
}

export function useTenantLocations() {
  const { session } = useSession();
  const tenantId = session?.tenantId;

  return useQuery({
    queryKey: ["tenant", "locations", tenantId],
    enabled: metricsEnabled(session, tenantId),
    queryFn: () => listLocations(tenantId!),
    staleTime: 120_000,
  });
}
