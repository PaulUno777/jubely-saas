"use client";

import { Badge, JubelyLogo, cn, useSidebar } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { TenantLogo } from "@/components/root/tenant-logo";
import { useStoreTenant } from "@/hooks/useStoreTenant";

export function StoreSidebarHeader() {
  const t = useTranslations("store.shell");
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { data: tenant, isLoading } = useStoreTenant();
  const storeName = tenant?.name ?? (isLoading ? "…" : t("tenantFallback"));
  const planLabel = tenant?.plan ? t("planLabel", { plan: tenant.plan }) : t("planUnknown");

  return (
    <div className="flex flex-col gap-3 px-1">
      <JubelyLogo
        size={collapsed ? "xs" : "sm"}
        iconOnly={collapsed}
        className={cn("text-sidebar-foreground", collapsed && "justify-center")}
      />
      {!collapsed ? (
        <div className="flex items-start gap-2.5">
          <TenantLogo tenant={{ name: storeName, logo_url: tenant?.logo_url, settings: tenant?.settings }} size="sm" />
          <div className="min-w-0 space-y-1.5">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{storeName}</p>
            <Badge variant="outline" className="surface-reward border-reward text-[10px] font-medium uppercase tracking-wide">
              {planLabel}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <TenantLogo tenant={{ name: storeName, logo_url: tenant?.logo_url, settings: tenant?.settings }} size="sm" />
        </div>
      )}
    </div>
  );
}
