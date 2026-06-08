"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { useTenantId } from "@/hooks/useTenantId";
import { agentGetTenant } from "@/lib/agentApi";

export function useStoreTenant() {
  const { session } = useSession();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: ["agent", "tenant", tenantId],
    enabled: Boolean(session && tenantId && (session.role === "staff" || session.role === "merchant_admin")),
    queryFn: () => agentGetTenant(tenantId!),
    staleTime: 60_000,
  });
}
