"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { storeGetMetrics } from "@/lib/storeApi";

export function useStoreMetrics() {
  const { session } = useSession();

  return useQuery({
    queryKey: ["store", "metrics", session?.tenantId],
    enabled: Boolean(session?.accessToken && session?.role === "merchant_admin"),
    queryFn: () => storeGetMetrics({ accessToken: session!.accessToken }),
    staleTime: 60_000,
  });
}
