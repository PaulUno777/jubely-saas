"use client";

import { Badge, cn } from "@jubely/ui";

const typeStyles: Record<string, { label: string; className: string }> = {
  earn: {
    label: "Earn",
    className: "border-transparent bg-[var(--e0,#E8F7EE)] text-[var(--e4,#0A5038)]",
  },
  redeem: {
    label: "Redeem",
    className: "border-transparent bg-[var(--t0,#FBF0EB)] text-[var(--t3,#8A3D28)]",
  },
  bonus: {
    label: "Bonus",
    className: "border-transparent bg-[var(--g0,#FBF0D4)] text-[var(--g4,#6B4510)]",
  },
  adjustment: {
    label: "Adjustment",
    className: "border-transparent bg-secondary text-secondary-foreground",
  },
};

type EventTypePillProps = {
  type: string;
  labels?: Record<string, string>;
  className?: string;
};

export function EventTypePill({ type, labels, className }: EventTypePillProps) {
  const key = type.toLowerCase();
  const style = typeStyles[key] ?? {
    label: type,
    className: "border-transparent bg-secondary text-secondary-foreground",
  };

  return (
    <Badge variant="outline" className={cn("font-semibold", style.className, className)}>
      {labels?.[key] ?? labels?.[type] ?? style.label}
    </Badge>
  );
}
