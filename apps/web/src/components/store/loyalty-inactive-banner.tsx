"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { GlobalAlert } from "@/components/alerts/global-alert";
import { getRulesHealth } from "@/lib/tenant-admin";
import { useTenantId } from "@/hooks/useTenantId";

export function LoyaltyInactiveBanner() {
  const t = useTranslations("store.pointsRules");
  const tenantId = useTenantId();
  const q = useQuery({
    queryKey: ["tenant-admin", "rules-health", tenantId],
    enabled: Boolean(tenantId),
    queryFn: () => getRulesHealth(tenantId!),
    staleTime: 30_000,
  });

  if (q.isLoading || q.isError || q.data?.program_active) return null;

  return (
    <GlobalAlert
      variant="critical"
      icon={AlertTriangle}
      title={t("loyaltyInactiveTitle")}
      body={t("loyaltyInactiveBody")}
      actionHref="/store/points-rules/editor?new=base"
      actionLabel={t("loyaltyInactiveAction")}
    />
  );
}
