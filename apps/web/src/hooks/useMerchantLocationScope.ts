"use client";

import { useMemo } from "react";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { useSession } from "@/hooks/useSession";
import { useTenantLocations } from "@/hooks/useTenantMetrics";
import {
  merchantHeaderContextLabel,
  merchantSidebarLocationLabel,
  resolveActiveLocation,
} from "@/lib/storeLocationScope";
import { useTranslations } from "next-intl";

export function useMerchantLocationScope() {
  const { session } = useSession();
  const { data: tenant } = useTenantSettings();
  const locationsQuery = useTenantLocations();
  const t = useTranslations("store.shell");

  const locations = locationsQuery.data;
  const activeLocation = useMemo(
    () => resolveActiveLocation(locations, session?.activeStoreId),
    [locations, session?.activeStoreId],
  );

  const tenantName = tenant?.name ?? t("tenantFallback");

  const sidebarLocationLabel = useMemo(() => {
    return merchantSidebarLocationLabel(locations, activeLocation, {
      locationsCount: (count) => t("locationsCount", { count }),
      singleLocation: (name) => t("singleLocation", { name }),
    });
  }, [locations, activeLocation, t]);

  const headerContext = useMemo(
    () => merchantHeaderContextLabel(tenantName, activeLocation),
    [tenantName, activeLocation],
  );

  return {
    session,
    tenantName,
    locations,
    activeLocation,
    activeStoreId: session?.activeStoreId,
    sidebarLocationLabel,
    headerContext,
    locationsLoading: locationsQuery.isLoading,
  };
}
