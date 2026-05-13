import { cn } from "@jubely/ui";
import type { AdminKpiTone } from "@/lib/adminDashboardSample";

const toneStyles: Record<AdminKpiTone, { stroke: string; fill: string; badge: string }> = {
  emerald: {
    stroke: "var(--status-active)",
    fill: "color-mix(in srgb, var(--status-active) 18%, transparent)",
    badge: "text-[var(--status-active)]",
  },
  teal: {
    stroke: "var(--status-trial)",
    fill: "color-mix(in srgb, var(--status-trial) 18%, transparent)",
    badge: "text-[var(--status-trial)]",
  },
  gold: {
    stroke: "var(--status-late)",
    fill: "color-mix(in srgb, var(--status-late) 18%, transparent)",
    badge: "text-[var(--status-late)]",
  },
  danger: {
    stroke: "var(--status-suspended)",
    fill: "color-mix(in srgb, var(--status-suspended) 18%, transparent)",
    badge: "text-[var(--status-suspended)]",
  },
};

function Sparkline({ values, tone }: { values: number[]; tone: AdminKpiTone }) {
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
      <polyline fill="none" stroke={style.stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <polygon fill={style.fill} points={`0,100 ${points} 100,100`} />
    </svg>
  );
}

type AdminKpiCardProps = {
  label: string;
  value: string;
  delta: string;
  detail: string;
  tone: AdminKpiTone;
  sparkline: number[];
  live?: boolean;
  liveLabel?: string;
};

export function AdminKpiCard({ label, value, delta, detail, tone, sparkline, live, liveLabel }: AdminKpiCardProps) {
  const style = toneStyles[tone];

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{value}</p>
        </div>
        {live ? (
          <span className={cn("inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]", style.badge)}>
            <span className="admin-production-dot size-1.5 rounded-full bg-current" />
            {liveLabel}
          </span>
        ) : null}
      </div>
      <p className={cn("mt-1 text-xs font-medium", style.badge)}>{delta}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      <div className="mt-4">
        <Sparkline values={sparkline} tone={tone} />
      </div>
    </div>
  );
}
