"use client";

import { cn } from "@jubely/ui";

export type KpiTone = "emerald" | "growth" | "reward" | "teal" | "gold" | "danger";

/** @deprecated Use `KpiTone` — kept for admin sample data. */
export type AdminKpiTone = KpiTone;

const toneStyles: Record<KpiTone, { stroke: string; fill: string; badge: string; dot: string }> = {
  emerald: {
    stroke: "var(--status-active)",
    fill: "color-mix(in srgb, var(--status-active) 18%, transparent)",
    badge: "text-[var(--status-active)]",
    dot: "bg-[var(--status-active)]",
  },
  growth: {
    stroke: "var(--growth)",
    fill: "color-mix(in srgb, var(--growth) 18%, transparent)",
    badge: "text-growth",
    dot: "bg-growth",
  },
  reward: {
    stroke: "var(--reward)",
    fill: "color-mix(in srgb, var(--reward) 18%, transparent)",
    badge: "text-reward",
    dot: "bg-reward",
  },
  teal: {
    stroke: "var(--status-trial)",
    fill: "color-mix(in srgb, var(--status-trial) 18%, transparent)",
    badge: "text-[var(--status-trial)]",
    dot: "bg-[var(--status-trial)]",
  },
  gold: {
    stroke: "var(--status-late)",
    fill: "color-mix(in srgb, var(--status-late) 18%, transparent)",
    badge: "text-[var(--status-late)]",
    dot: "bg-[var(--status-late)]",
  },
  danger: {
    stroke: "var(--status-suspended)",
    fill: "color-mix(in srgb, var(--status-suspended) 18%, transparent)",
    badge: "text-[var(--status-suspended)]",
    dot: "bg-[var(--status-suspended)]",
  },
};

function Sparkline({ values, tone }: { values: number[]; tone: KpiTone }) {
  if (values.length < 2) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const style = toneStyles[tone];

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-12 w-full">
      <polyline
        fill="none"
        stroke={style.stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <polygon fill={style.fill} points={`0,100 ${points} 100,100`} />
    </svg>
  );
}

export type AdminKpiCardProps = {
  label: string;
  value: string;
  delta?: string;
  detail?: string;
  tone: KpiTone;
  sparkline?: number[];
  trendUp?: boolean;
  live?: boolean;
  liveLabel?: string;
  portal?: "admin" | "merchant";
};

export function AdminKpiCard({
  label,
  value,
  delta,
  detail,
  tone,
  sparkline,
  trendUp,
  live,
  liveLabel,
  portal: _portal = "admin",
}: AdminKpiCardProps) {
  const style = toneStyles[tone];
  const deltaClass =
    trendUp === undefined
      ? style.badge
      : trendUp
        ? style.badge
        : "text-[var(--status-suspended)]";

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="jb-label tracking-[0.16em]">{label}</p>
          <p className="jb-stat-value mt-2 text-4xl">{value}</p>
        </div>
        {live && liveLabel ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
              style.badge,
            )}
          >
            <span className="admin-production-dot size-1.5 rounded-full bg-current" />
            {liveLabel}
          </span>
        ) : (
          <span className={cn("inline-flex size-2 shrink-0 rounded-full", style.dot)} aria-hidden />
        )}
      </div>
      {delta ? <p className={cn("mt-1 text-xs font-medium", deltaClass)}>{delta}</p> : null}
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
      {sparkline && sparkline.length > 1 ? (
        <div className="mt-4">
          <Sparkline values={sparkline} tone={tone} />
        </div>
      ) : null}
    </>
  );

  return (
    <div
      className={cn(
        "portal-card portal-kpi-card rounded-2xl bg-card p-4 text-card-foreground shadow-sm",
      )}
    >
      {body}
    </div>
  );
}
