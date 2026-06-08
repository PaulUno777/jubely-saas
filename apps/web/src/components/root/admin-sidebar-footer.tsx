"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useSidebar } from "@jubely/ui";
import { useSession } from "@/hooks/useSession";
import { adminSuperadminStats } from "@/lib/adminApi";

export function AdminSidebarFooter() {
  const t = useTranslations("admin.root.sidebarFooter");
  const { state } = useSidebar();
  const { session } = useSession();
  const statsQuery = useQuery({
    queryKey: ["superadminStats"],
    enabled: Boolean(session),
    queryFn: () => adminSuperadminStats(),
    staleTime: 60_000,
  });

  if (state === "collapsed") {
    return null;
  }

  const tenants = statsQuery.data?.tenants_total ?? "—";
  const alerts = statsQuery.data?.alerts ?? "—";

  return (
    <div className="grid grid-cols-2 gap-2 px-1 pb-2">
      <div className="rounded-lg border border-sidebar-border bg-background/50 px-2.5 py-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t("tenants")}</p>
        <p className="mt-1 font-mono text-sm font-semibold text-foreground">{tenants}</p>
      </div>
      <div className="rounded-lg border border-sidebar-border bg-background/50 px-2.5 py-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t("alerts")}</p>
        <p className="mt-1 font-mono text-sm font-semibold text-foreground">{alerts}</p>
      </div>
    </div>
  );
}
