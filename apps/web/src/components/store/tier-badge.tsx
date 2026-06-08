"use client";

import { Badge, cn } from "@jubely/ui";

const tierStyles: Record<string, string> = {
  bronze: "bg-[#B07A4A]",
  silver: "bg-[#9AA0A6]",
  gold: "bg-[var(--reward,#C89B3C)]",
  or: "bg-[var(--reward,#C89B3C)]",
  platinum: "bg-[var(--status-trial,#0F766E)]",
  platine: "bg-[var(--status-trial,#0F766E)]",
};

type TierBadgeProps = {
  code: string;
  className?: string;
};

export function TierBadge({ code, className }: TierBadgeProps) {
  const key = code.toLowerCase();
  const dotClass = tierStyles[key] ?? "bg-muted-foreground";

  return (
    <Badge variant="outline" className={cn("gap-1.5 font-normal", className)}>
      <span className={cn("size-1.5 rounded-full", dotClass)} aria-hidden />
      {code}
    </Badge>
  );
}
