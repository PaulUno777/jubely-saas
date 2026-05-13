"use client";

import { Badge, JubelyLogo, cn, useSidebar } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { useSession } from "@/hooks/useSession";

export function AdminSidebarHeader() {
  const t = useTranslations("admin.root");
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { session } = useSession();
  const email = session?.email ?? "root@jubelee.app";

  return (
    <div className="flex flex-col gap-3 px-1">
      <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
        <JubelyLogo size={collapsed ? "xs" : "sm"} iconOnly={collapsed} className="text-sidebar-foreground" />
        {!collapsed ? (
          <Badge variant="outline" className="border-sidebar-border bg-background/40 text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/80">
            {t("rootTag")}
          </Badge>
        ) : null}
      </div>
      {!collapsed ? (
        <div className="space-y-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("superAdminLabel")}</p>
            <p className="truncate text-sm font-medium text-sidebar-foreground">{email}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-destructive">
            <span className="admin-production-dot size-2 rounded-full bg-destructive" />
            {t("productionBadge")}
          </div>
        </div>
      ) : null}
    </div>
  );
}
