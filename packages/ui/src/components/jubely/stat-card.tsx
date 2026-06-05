import { cn } from "../../cn";

type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
};

export function StatCard({ label, value, sub, trend, className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <p className="jb-label tracking-wider">{label}</p>
      <p className="jb-stat-value mt-2 text-4xl">{value}</p>
      {sub && (
        <p
          className={cn(
            "mt-1 text-xs",
            trend === "up" ? "text-[var(--status-active)]" : trend === "down" ? "text-[var(--status-suspended)]" : "text-muted-foreground",
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
