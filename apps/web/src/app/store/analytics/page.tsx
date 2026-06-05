"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, StatCard } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { MerchantFilterBar } from "@/components/store/merchant-filter-bar";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { useTenantDateRange } from "@/hooks/useTenantDateRange";
import {
  useTenantAnalyticsOverview,
  useTenantMemberGrowth,
} from "@/hooks/tenant-admin-hooks";

function pickNum(obj: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number") return v;
  }
  return 0;
}

export default function StoreAnalyticsPage() {
  const t = useTranslations("store.analytics");
  const { headerContext, activeStoreId } = useMerchantLocationScope();
  const { dateRange, setDateRange, isoRange } = useTenantDateRange("last_30_days");

  const queryBase = {
    from: isoRange.from,
    to: isoRange.to,
    locationId: activeStoreId,
  };

  const overviewQ = useTenantAnalyticsOverview(queryBase);
  const growthQ = useTenantMemberGrowth(queryBase);

  const overview = overviewQ.data?.overview as Record<string, unknown> | undefined;
  const series = growthQ.data?.series ?? [];

  return (
    <MerchantPageShell
      title={t("title")}
      context={headerContext}
      className="space-y-6"
      filters={
        <MerchantFilterBar dateRange={dateRange} onDateRangeChange={setDateRange} />
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("totalMembers")}
          value={String(pickNum(overview ?? {}, "TotalMembers", "total_members"))}
        />
        <StatCard
          label={t("dormantMembers")}
          value={String(pickNum(overview ?? {}, "DormantMembers", "dormant_members"))}
        />
        <StatCard
          label={t("pointsPerMember")}
          value={String(pickNum(overview ?? {}, "PointsPerMember", "points_per_member"))}
        />
        <StatCard
          label={t("visitFrequency")}
          value={String(pickNum(overview ?? {}, "VisitFrequencyPerWeek", "visit_frequency_per_week"))}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("memberGrowthTitle")}</CardTitle>
          <CardDescription>{t("memberGrowthDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {growthQ.isLoading ? (
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          ) : series.length ? (
            <div className="space-y-2">
              {series.slice(0, 12).map((point, i) => {
                const label =
                  (point.Label as string) ??
                  (point.label as string) ??
                  String(point.Date ?? point.date ?? i);
                const newMembers = pickNum(point as Record<string, unknown>, "NewMembers", "new_members");
                return (
                  <div key={i} className="flex justify-between text-sm border-b border-border py-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono tabular-nums">+{newMembers}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          )}
        </CardContent>
      </Card>
    </MerchantPageShell>
  );
}
