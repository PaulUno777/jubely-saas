"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@jubely/ui";
import { Lock, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { getSubscription } from "@/lib/tenant-admin";
import { useTenantId } from "@/hooks/useTenantId";

export function RulesPlanBanner() {
  const t = useTranslations("store.pointsRules");
  const tenantId = useTenantId();
  const subQ = useQuery({
    queryKey: ["tenant-admin", "subscription", tenantId],
    enabled: Boolean(tenantId),
    queryFn: () => getSubscription(tenantId!),
  });

  const advanced = Boolean(
    (subQ.data?.plan?.features as { advanced_rules?: boolean } | undefined)?.advanced_rules,
  );

  if (subQ.isLoading) return null;

  return advanced ? (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <Zap className="size-5 text-amber-700" />
      <p className="flex-1 text-sm text-amber-950">{t("planBannerAdvanced")}</p>
      <Button size="sm" variant="secondary" asChild>
        <Link href="/store/points-rules/editor">{t("openEditor")}</Link>
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-4">
      <Lock className="size-5 text-muted-foreground" />
      <p className="flex-1 text-sm text-muted-foreground">{t("planBannerBasic")}</p>
      <Button size="sm" variant="outline" asChild>
        <Link href="/store/subscription">{t("comparePlans")}</Link>
      </Button>
    </div>
  );
}
