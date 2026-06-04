"use client";

import type { DateRangeValue } from "@jubely/ui";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@jubely/ui";
import type {
  TenantLoyaltyActivity,
  TenantMetricKpi,
  TenantMetrics,
} from "@jubely/api-schemas";
import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo } from "react";
import { DateRangeSelectorI18n } from "@/components/shared/date-range-selector-i18n";
import { LoyaltyActivityChart } from "@/components/store/loyalty-activity-chart";
import {
  MerchantDashboardQrPanel,
  MerchantDashboardRulesPanel,
} from "@/components/store/merchant-dashboard-side-panels";
import { MerchantDashboardWelcome } from "@/components/store/merchant-dashboard-welcome";
import {
  MerchantCardContent,
  MerchantCardDescription,
  MerchantCardHeader,
  MerchantCardTitle,
} from "@/components/store/merchant-card";
import {
  MerchantKpiCard,
  type MerchantKpiTone,
} from "@/components/store/merchant-kpi-card";

const kpiToneByKey: Record<TenantMetricKpi["key"], MerchantKpiTone> = {
  points_distributed: "growth",
  active_customers: "teal",
  rewards_validated: "reward",
  retention_rate: "growth",
};

const kpiOrder: TenantMetricKpi["key"][] = [
  "points_distributed",
  "active_customers",
  "rewards_validated",
  "retention_rate",
];

const kpiLabelKey: Record<
  TenantMetricKpi["key"],
  "pointsDistributed" | "activeCustomers" | "rewardsValidated" | "retentionRate"
> = {
  points_distributed: "pointsDistributed",
  active_customers: "activeCustomers",
  rewards_validated: "rewardsValidated",
  retention_rate: "retentionRate",
};

function findKpi(
  kpis: TenantMetricKpi[] | undefined,
  key: TenantMetricKpi["key"],
) {
  return kpis?.find((k) => k.key === key);
}

function formatKpiValue(
  kpi: TenantMetricKpi | undefined,
  nf: Intl.NumberFormat,
) {
  if (!kpi) return "—";
  if (kpi.unit === "%") return `${nf.format(Math.round(kpi.value))}%`;
  return nf.format(Math.round(kpi.value));
}

type DashboardDataProps = {
  metrics?: TenantMetrics;
  activity?: TenantLoyaltyActivity;
  metricsLoading?: boolean;
  activityLoading?: boolean;
};

export function MerchantDashboardWelcomeRow({
  metrics,
  periodLabel,
}: Pick<DashboardDataProps, "metrics"> & { periodLabel?: string }) {
  const fallback = metrics?.period?.label;
  return <MerchantDashboardWelcome periodLabel={periodLabel ?? fallback} />;
}

export function MerchantDashboardKpiSection({
  metrics,
  metricsLoading,
  periodLabel,
}: DashboardDataProps & { periodLabel?: string }) {
  const t = useTranslations("store.home");
  const locale = useLocale();
  const nf = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const kpis = metrics?.kpis;
  const resolvedPeriodLabel = periodLabel ?? metrics?.period?.label;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpiOrder.map((key) => {
        const kpi = findKpi(kpis, key);
        const delta =
          kpi?.delta_pct === undefined
            ? metricsLoading
              ? "…"
              : undefined
            : t("kpis.vsPrior", {
                delta: `${kpi.delta_pct > 0 ? "+" : ""}${kpi.delta_pct}`,
              });
        return (
          <MerchantKpiCard
            key={key}
            label={t(`kpis.${kpiLabelKey[key]}`)}
            value={metricsLoading && !kpi ? "…" : formatKpiValue(kpi, nf)}
            delta={delta}
            detail={
              resolvedPeriodLabel
                ? t("panels.periodLabel", { period: resolvedPeriodLabel })
                : undefined
            }
            tone={kpiToneByKey[key]}
            sparkline={kpi?.sparkline}
            trendUp={kpi?.trend_up}
          />
        );
      })}
    </div>
  );
}

type ChartSectionProps = DashboardDataProps & {
  dateRange: DateRangeValue;
  onDateRangeChange: (value: DateRangeValue) => void;
};

export function MerchantDashboardChartSection({
  activity,
  activityLoading,
  dateRange,
  onDateRangeChange,
}: ChartSectionProps) {
  const t = useTranslations("store.home");
  const series = activity?.series ?? [];

  return (
    <>
      <MerchantCardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1">
          <MerchantCardTitle className="text-base">
            {t("panels.pointsChart")}
          </MerchantCardTitle>
          <MerchantCardDescription>
            {t("panels.pointsChartHint")}
          </MerchantCardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-sm bg-growth" />
            {t("panels.distributed")}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-sm bg-reward" />
            {t("panels.rewarded")}
          </span>
          <DateRangeSelectorI18n
            value={dateRange}
            onChange={onDateRangeChange}
            className="w-auto min-w-44"
          />
        </div>
      </MerchantCardHeader>
      <MerchantCardContent>
        <LoyaltyActivityChart
          series={series}
          distributedLabel={t("panels.distributed")}
          rewardedLabel={t("panels.rewarded")}
          loading={activityLoading}
          hideLegend
        />
      </MerchantCardContent>
    </>
  );
}

export function MerchantDashboardTeamSection() {
  const t = useTranslations("store.home");

  return (
    <>
      <MerchantCardHeader className="flex flex-row items-start gap-2 space-y-0 pb-3">
        <div className="min-w-0 flex-1 space-y-1">
          <MerchantCardTitle className="text-base">
            {t("team.title")}
          </MerchantCardTitle>
          <MerchantCardDescription>
            {t("team.subtitle")}
          </MerchantCardDescription>
        </div>
        <Button
          asChild
          variant="secondary"
          size="sm"
          className="shrink-0 gap-1"
        >
          <Link href="/store/agents">
            <Plus className="size-3.5" />
            {t("team.addAgent")}
          </Link>
        </Button>
      </MerchantCardHeader>
      <MerchantCardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">{t("team.rank")}</TableHead>
              <TableHead>{t("team.agent")}</TableHead>
              <TableHead className="text-right">
                {t("team.pointsIssued")}
              </TableHead>
              <TableHead className="hidden text-right sm:table-cell">
                {t("team.transactions")}
              </TableHead>
              <TableHead className="hidden md:table-cell">
                {t("team.trend7d")}
              </TableHead>
              <TableHead className="hidden text-right lg:table-cell">
                {t("team.change")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-8 text-center text-sm text-muted-foreground"
              >
                {t("team.empty")}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </MerchantCardContent>
    </>
  );
}

export function MerchantDashboardSidebar() {
  return (
    <div className="flex w-full flex-col gap-5 xl:max-w-[380px]">
      <MerchantDashboardQrPanel />
      <MerchantDashboardRulesPanel />
    </div>
  );
}
