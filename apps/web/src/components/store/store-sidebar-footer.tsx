"use client";

import { useSidebar } from "@jubely/ui";
import { useTranslations } from "next-intl";

export function StoreSidebarFooter() {
  const t = useTranslations("store.shell");
  const { state } = useSidebar();

  if (state === "collapsed") {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-2 px-1 pb-2">
      <div className="rounded-lg border border-sidebar-border bg-background/70 px-2.5 py-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t("pointsDistributed")}</p>
        <p className="mt-1 font-mono text-sm font-semibold text-foreground">—</p>
      </div>
      <div className="rounded-lg border border-sidebar-border bg-background/70 px-2.5 py-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t("transactionsMonth")}</p>
        <p className="mt-1 font-mono text-sm font-semibold text-foreground">—</p>
      </div>
    </div>
  );
}
