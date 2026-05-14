"use client";

import { useSidebar } from "@jubely/ui";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { useStoreMetrics } from "@/hooks/useStoreMetrics";

export function StoreSidebarFooter() {
  const t = useTranslations("store.shell");
  const locale = useLocale();
  const { state } = useSidebar();
  const metricsQuery = useStoreMetrics();
  const nf = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  if (state === "collapsed") {
    return null;
  }

  const points = metricsQuery.data?.points_distributed;
  const events = metricsQuery.data?.point_events_this_month;
  const pointsLabel = points === undefined ? "—" : nf.format(points);
  const eventsLabel = events === undefined ? "—" : nf.format(events);

  return (
    <div className="grid grid-cols-2 gap-2 px-1 pb-2">
      <div className="rounded-lg border border-sidebar-border bg-background/70 px-2.5 py-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t("pointsDistributed")}</p>
        <p className="mt-1 font-mono text-sm font-semibold text-foreground">{pointsLabel}</p>
      </div>
      <div className="rounded-lg border border-sidebar-border bg-background/70 px-2.5 py-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t("transactionsMonth")}</p>
        <p className="mt-1 font-mono text-sm font-semibold text-foreground">{eventsLabel}</p>
      </div>
    </div>
  );
}
