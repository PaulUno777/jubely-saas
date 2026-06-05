"use client";

import { cn } from "@jubely/ui";
import type { TenantLoyaltyActivity } from "@jubely/api-schemas";

type LoyaltyActivityChartProps = {
  series: TenantLoyaltyActivity["series"];
  distributedLabel: string;
  rewardedLabel: string;
  loading?: boolean;
  hideLegend?: boolean;
};

function ChartPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border bg-background/40 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function LoyaltyActivityChart({
  series,
  distributedLabel,
  rewardedLabel,
  loading,
  hideLegend,
}: LoyaltyActivityChartProps) {
  if (loading) {
    return <ChartPlaceholder>…</ChartPlaceholder>;
  }

  if (series.length === 0) {
    return <ChartPlaceholder>—</ChartPlaceholder>;
  }

  const maxVal = Math.max(
    1,
    ...series.flatMap((p) => [p.points_distributed, p.points_rewarded]),
  );

  return (
    <div className={hideLegend ? undefined : "space-y-4"}>
      {!hideLegend ? (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-growth" />
            {distributedLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-reward" />
            {rewardedLabel}
          </span>
        </div>
      ) : null}
      <div className="flex h-48 items-end gap-2 sm:gap-3">
        {series.map((point) => (
          <div
            key={point.date}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <div className="flex h-40 w-full items-end justify-center gap-1">
              <div
                className={cn(
                  "w-full max-w-3 rounded-t-lg transition-colors bg-growth",
                  point.points_distributed === maxVal &&
                    "ring-1 ring-growth/40",
                )}
                style={{
                  height: `${(point.points_distributed / maxVal) * 100}%`,
                }}
                title={String(point.points_distributed)}
              />
              <div
                className={cn(
                  "w-full max-w-3 rounded-t-lg transition-colors bg-reward",
                  point.points_rewarded === maxVal && "ring-1 ring-reward/40",
                )}
                style={{ height: `${(point.points_rewarded / maxVal) * 100}%` }}
                title={String(point.points_rewarded)}
              />
            </div>
            <span className="truncate text-[10px] text-muted-foreground">
              {point.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
