"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  KpiTile,
  KpiTileStrip,
  ListCard,
} from "@jubely/ui";
import { useTranslations } from "next-intl";
import {
  DonutChart,
  HeatmapGrid,
  SimpleBarChart,
} from "@/components/store/charts/analytics-charts";
import { MerchantFilterBar } from "@/components/store/merchant-filter-bar";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { useTenantDateRange } from "@/hooks/useTenantDateRange";
import {
  useTenantAnalyticsOverview,
  useTenantHeatmap,
  useTenantMemberGrowth,
  useTenantRetention,
  useTenantTierDistribution,
  useTenantTopRewards,
} from "@/hooks/tenant-admin-hooks";

function pickNum(obj: Record<string, unknown> | undefined, ...keys: string[]) {
  if (!obj) return 0;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number") return value;
  }
  return 0;
}

const tierColors: Record<string, string> = {
  bronze: "#B07A4A",
  silver: "#9AA0A6",
  gold: "#C89B3C",
  platinum: "#0F766E",
};

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
  const tierQ = useTenantTierDistribution(queryBase);
  const heatmapQ = useTenantHeatmap(queryBase);
  const topRewardsQ = useTenantTopRewards(queryBase);
  const retentionQ = useTenantRetention(queryBase);

  const overview = overviewQ.data?.overview as Record<string, unknown> | undefined;
  const series = growthQ.data?.series ?? [];
  const tierSlices = (tierQ.data?.slices ?? []) as Record<string, unknown>[];
  const heatmapCells = (heatmapQ.data?.cells ?? []) as { day: number; hour: number; value: number }[];
  const topRewards = (topRewardsQ.data?.rewards ?? []) as Record<string, unknown>[];
  const cohorts = (retentionQ.data?.cohorts ?? []) as Record<string, unknown>[];

  const growthLabels = series.slice(0, 12).map((point, i) => {
    const label = (point.Label as string) ?? (point.label as string) ?? `P${i + 1}`;
    return label;
  });
  const growthValues = series.slice(0, 12).map((point) => {
    const count = point.Count ?? point.count ?? point.value;
    return typeof count === "number" ? count : 0;
  });

  const donutSlices = tierSlices.map((slice) => {
    const label = String(slice.Label ?? slice.label ?? slice.code ?? "?");
    const value = Number(slice.Count ?? slice.count ?? slice.value ?? 0);
    const color = tierColors[label.toLowerCase()] ?? "#9AA0A6";
    return { label, value, color };
  });
  const donutTotal = donutSlices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <MerchantPageShell
      title={t("title")}
      context={headerContext}
      className="space-y-6"
      filters={<MerchantFilterBar dateRange={dateRange} onDateRangeChange={setDateRange} />}
    >
      <KpiTileStrip>
        <KpiTile
          label={t("totalMembers")}
          value={pickNum(overview, "TotalMembers", "total_members")}
          tone="emerald"
        />
        <KpiTile
          label={t("visitFrequency")}
          value={pickNum(overview, "VisitFrequencyPerWeek", "visit_frequency_per_week")}
          tone="gold"
        />
        <KpiTile
          label={t("pointsPerMember")}
          value={pickNum(overview, "PointsPerMember", "points_per_member")}
          tone="teal"
        />
        <KpiTile
          label={t("dormantMembers")}
          value={pickNum(overview, "DormantMembers", "dormant_members")}
          tone="terra"
        />
      </KpiTileStrip>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>{t("memberGrowthTitle")}</CardTitle>
            <CardDescription>{t("memberGrowthDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {growthQ.isLoading ? (
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            ) : growthValues.length ? (
              <SimpleBarChart labels={growthLabels} values={growthValues} />
            ) : (
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("tierDistributionTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tierQ.isLoading ? (
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            ) : donutSlices.length ? (
              <>
                <DonutChart
                  slices={donutSlices}
                  centerLabel={donutTotal.toLocaleString()}
                  centerSub={t("members")}
                />
                <div className="space-y-2">
                  {donutSlices.map((slice) => (
                    <div key={slice.label} className="flex items-center gap-2 text-sm">
                      <span
                        className="size-2 rounded-sm"
                        style={{ background: slice.color }}
                      />
                      <span className="flex-1">{slice.label}</span>
                      <span className="font-mono tabular-nums">{slice.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("heatmapTitle")}</CardTitle>
            <CardDescription>{t("heatmapDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {heatmapQ.isLoading ? (
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            ) : heatmapCells.length ? (
              <HeatmapGrid cells={heatmapCells} />
            ) : (
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            )}
          </CardContent>
        </Card>

        <ListCard title={t("topRewardsTitle")} description={t("topRewardsDescription")}>
          <DataTable
            columns={[
              {
                key: "name",
                header: t("rewardName"),
                cell: (row) => String(row.name ?? row.Name ?? "—"),
              },
              {
                key: "count",
                header: t("redemptions"),
                className: "text-right",
                headerClassName: "text-right",
                cell: (row) => (
                  <span className="font-mono tabular-nums">
                    {String(row.count ?? row.Count ?? row.redemptions ?? 0)}
                  </span>
                ),
              },
            ]}
            rows={topRewards}
            rowKey={(row) => String(row.id ?? row.reward_id ?? row.name ?? "row")}
            loading={topRewardsQ.isLoading}
            error={topRewardsQ.error}
            loadingLabel={t("loading")}
            errorLabel={t("loadError")}
            emptyLabel={t("empty")}
          />
        </ListCard>
      </div>

      <ListCard title={t("retentionTitle")} description={t("retentionDescription")}>
        <DataTable
          columns={[
            {
              key: "cohort",
              header: t("cohort"),
              cell: (row) => String(row.label ?? row.cohort ?? row.period ?? "—"),
            },
            {
              key: "size",
              header: t("cohortSize"),
              cell: (row) => String(row.size ?? row.count ?? "—"),
            },
            {
              key: "retained",
              header: t("retained"),
              className: "text-right",
              headerClassName: "text-right",
              cell: (row) => String(row.retained ?? row.retention_rate ?? "—"),
            },
          ]}
          rows={cohorts}
          rowKey={(row) => String(row.label ?? row.cohort ?? row.period ?? "cohort")}
          loading={retentionQ.isLoading}
          error={retentionQ.error}
          loadingLabel={t("loading")}
          errorLabel={t("loadError")}
          emptyLabel={t("empty")}
        />
      </ListCard>
    </MerchantPageShell>
  );
}
