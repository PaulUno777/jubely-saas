"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button, cn } from "@jubely/ui";

type GlobalAlertVariant = "critical" | "warning" | "info";

const variantClass: Record<GlobalAlertVariant, string> = {
  critical: "border-destructive/40 bg-destructive/10 text-destructive",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  info: "border-primary/30 bg-primary/5 text-foreground",
};

export function GlobalAlert({
  variant = "info",
  icon: Icon,
  title,
  body,
  actionHref,
  actionLabel,
  className,
}: {
  variant?: GlobalAlertVariant;
  icon: LucideIcon;
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm",
        variantClass[variant],
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-[13px] opacity-90">{body}</p>
        </div>
      </div>
      {actionHref && actionLabel ? (
        <Button size="sm" variant={variant === "critical" ? "destructive" : "secondary"} asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
