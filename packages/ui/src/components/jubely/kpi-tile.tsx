import type { ReactNode } from "react";
import { cn } from "../../cn";

export type KpiTileTone = "emerald" | "gold" | "teal" | "terra" | "growth" | "reward" | "danger";

const toneAccent: Record<KpiTileTone, string> = {
  emerald: "var(--status-active, #1FA971)",
  growth: "var(--growth, #1FA971)",
  reward: "var(--reward, #C89B3C)",
  gold: "var(--status-late, #C89B3C)",
  teal: "var(--status-trial, #0F766E)",
  terra: "var(--status-suspended, #C26D52)",
  danger: "var(--status-suspended, #C26D52)",
};

export type KpiTileProps = {
  label: string;
  value: string | number;
  hint?: string;
  delta?: string;
  trendUp?: boolean;
  tone?: KpiTileTone;
  icon?: ReactNode;
  className?: string;
};

export function KpiTile({
  label,
  value,
  hint,
  delta,
  trendUp,
  tone = "emerald",
  icon,
  className,
}: KpiTileProps) {
  const accent = toneAccent[tone];

  return (
    <div
      data-slot="kpi-tile"
      className={cn(
        "relative overflow-hidden rounded-[14px] border border-border bg-card p-4 shadow-sm",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute top-3.5 bottom-3.5 left-0 w-[3px] rounded-full"
        style={{ background: accent }}
      />
      <div className={cn("flex items-start gap-3", icon ? "pl-2" : "pl-2")}>
        {icon ? (
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--surface-2,#F5F0E8)]"
            style={{ color: accent }}
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1 pl-2">
          <p className="text-[10.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="jb-stat-value mt-2 font-serif text-[2rem] leading-none font-medium italic tracking-tight text-foreground">
            {value}
          </p>
          {delta ? (
            <p
              className={cn(
                "mt-1.5 text-xs font-medium",
                trendUp === false ? "text-[var(--status-suspended)]" : "text-[var(--status-active)]",
              )}
            >
              {delta}
            </p>
          ) : null}
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}

export type KpiTileStripProps = {
  children: ReactNode;
  className?: string;
};

export function KpiTileStrip({ children, className }: KpiTileStripProps) {
  return (
    <div
      data-slot="kpi-tile-strip"
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}
    >
      {children}
    </div>
  );
}
