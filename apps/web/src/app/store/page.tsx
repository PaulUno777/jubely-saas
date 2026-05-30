"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, StatCard } from "@jubely/ui";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Main } from "@/components/layout/main";
import { MfaEnrollBanner } from "@/components/root/mfa-enroll-banner";
import { StorePageHeader } from "@/components/store/store-page-header";
import { useSession } from "@/hooks/useSession";
import { useStoreMetrics } from "@/hooks/useStoreMetrics";

export default function StoreHome() {
  const t = useTranslations("store.home");
  const locale = useLocale();
  const { session } = useSession();
  const metricsQuery = useStoreMetrics();
  const nf = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const m = metricsQuery.data;
  const pointsValue = m?.points_distributed === undefined ? "—" : nf.format(m.points_distributed);
  const eventsValue = m?.point_events_this_month === undefined ? "—" : nf.format(m.point_events_this_month);
  const clientsToday = m?.clients_served_today === undefined ? "—" : nf.format(m.clients_served_today);
  const redemptionsToday = m?.redemptions_today === undefined ? "—" : nf.format(m.redemptions_today);

  return (
    <>
      <StorePageHeader title={t("title")} actionLabel={t("newTransaction")} />
      <Main className="space-y-6">
        {session ? <MfaEnrollBanner /> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t("kpis.activeCustomers")} value={clientsToday} trend="neutral" />
          <StatCard label={t("kpis.pointsDistributed")} value={pointsValue} trend="neutral" />
          <StatCard label={t("kpis.pointEventsMonth")} value={eventsValue} trend="neutral" />
          <StatCard label={t("kpis.rewardsClaimed")} value={redemptionsToday} trend="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">{t("panels.pointsChart")}</CardTitle>
              <CardDescription>{t("panels.pointsChartHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 rounded-xl border border-dashed border-border bg-growth-surface/30" />
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">{t("panels.tiers")}</CardTitle>
              <CardDescription>{t("panels.tiersHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 rounded-xl border border-dashed border-border bg-secondary/40" />
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  );
}
