"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, StatCard } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { Main } from "@/components/layout/main";
import { MfaEnrollBanner } from "@/components/root/mfa-enroll-banner";
import { StorePageHeader } from "@/components/store/store-page-header";
import { useSession } from "@/hooks/useSession";

export default function StoreHome() {
  const t = useTranslations("store.home");
  const { session } = useSession();
  const token = session?.accessToken;

  return (
    <>
      <StorePageHeader title={t("title")} actionLabel={t("newTransaction")} />
      <Main className="space-y-6">
        {token ? <MfaEnrollBanner accessToken={token} /> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t("kpis.activeCustomers")} value="—" trend="neutral" />
          <StatCard label={t("kpis.pointsDistributed")} value="—" trend="neutral" />
          <StatCard label={t("kpis.averageBasket")} value="—" trend="neutral" />
          <StatCard label={t("kpis.rewardsClaimed")} value="—" trend="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">{t("panels.pointsChart")}</CardTitle>
              <CardDescription>{t("panels.pointsChartHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 rounded-xl border border-dashed border-border bg-growth-surface/40" />
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">{t("panels.tiers")}</CardTitle>
              <CardDescription>{t("panels.tiersHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 rounded-xl border border-dashed border-border bg-muted/40" />
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  );
}
