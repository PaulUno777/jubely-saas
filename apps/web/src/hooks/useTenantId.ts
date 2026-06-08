"use client";

import { useSession } from "@/hooks/useSession";

export function useTenantId(): string | undefined {
  const { session } = useSession();
  return session?.tenantId;
}
