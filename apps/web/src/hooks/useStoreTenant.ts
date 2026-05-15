"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { storeGetTenant } from "@/lib/storeApi";

export function useStoreTenant() {
  const { session } = useSession();

  return useQuery({
    queryKey: ["store", "tenant", session?.tenantId],
    enabled: Boolean(session && session?.role === "merchant_admin"),
    queryFn: () => storeGetTenant(),
    staleTime: 60_000,
  });
}
