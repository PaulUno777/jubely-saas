"use client";

import { useTenantAdminQuery } from "@/hooks/useTenantAdminQuery";
import { getSettings } from "@/lib/tenant-admin";

export function useTenantSettings() {
  return useTenantAdminQuery("settings", [], (tenantId) => getSettings(tenantId), {
    staleTime: 60_000,
  });
}
