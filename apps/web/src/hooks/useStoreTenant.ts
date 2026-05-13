"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { storeGetTenant } from "@/lib/storeApi";

export function useStoreTenant() {
  const { session } = useSession();

  return useQuery({
    queryKey: ["store", "tenant", session?.tenantId],
    enabled: Boolean(session?.accessToken && session?.role === "merchant_admin"),
    queryFn: () => storeGetTenant({ accessToken: session!.accessToken }),
    staleTime: 60_000,
  });
}
