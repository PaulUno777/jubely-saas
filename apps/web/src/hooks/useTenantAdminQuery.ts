"use client";

import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { useTenantId } from "@/hooks/useTenantId";

type TenantAdminQueryOptions<T> = Omit<
  UseQueryOptions<T, Error, T, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

export function useTenantAdminQuery<T>(
  domain: string,
  queryKeyParts: readonly unknown[],
  queryFn: (tenantId: string) => Promise<T>,
  opts?: TenantAdminQueryOptions<T>,
): UseQueryResult<T, Error> {
  const { session } = useSession();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: ["tenant-admin", domain, tenantId, ...queryKeyParts] as const,
    enabled: Boolean(session && session.role === "merchant_admin" && tenantId && (opts?.enabled ?? true)),
    queryFn: () => queryFn(tenantId!),
    staleTime: opts?.staleTime ?? 60_000,
    ...opts,
  });
}
