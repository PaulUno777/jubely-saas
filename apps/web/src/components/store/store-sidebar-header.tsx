"use client";

import { Badge, JubelyLogo, cn, useSidebar } from "@jubely/ui";
import { Star } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { StoreLocationScope } from "@/components/store/store-location-scope";
import { TenantLogo } from "@/components/root/tenant-logo";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { useStoreTenant } from "@/hooks/useStoreTenant";

const SIDEBAR_PANEL_TRANSITION =
  "transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none";

export function StoreSidebarHeader() {
  const t = useTranslations("store.shell");
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { data: tenant, isLoading } = useStoreTenant();
  const { tenantName } = useMerchantLocationScope();
  const storeName = tenant?.name ?? (isLoading ? "…" : tenantName);
  const planLabel = tenant?.plan
    ? t("planLabel", { plan: tenant.plan })
    : t("planUnknown");

  const tenantLogo = {
    name: storeName,
    logo_url: tenant?.logo_url,
    settings: tenant?.settings,
  };

  return (
    <div
      className={cn(
        "jb-merchant-sidebar-header flex w-full min-w-0 flex-col",
        collapsed ? "items-center gap-2.5 overflow-visible" : "gap-3 px-1",
      )}
    >
      <div
        className={cn(
          "flex w-full shrink-0",
          collapsed ? "justify-center" : "px-0.5",
        )}
      >
        <JubelyLogo
          size={collapsed ? "xs" : "sm"}
          iconOnly={collapsed}
          className="shrink-0 text-sidebar-foreground"
        />
      </div>

      {collapsed ? (
        <Link
          href="/store/locations"
          title={storeName}
          className="flex w-full justify-center overflow-visible"
        >
          <TenantLogo
            tenant={tenantLogo}
            size="xs"
            className="jb-sidebar-store-mark size-8 rounded-lg"
          />
        </Link>
      ) : (
        <div
          className={cn(
            SIDEBAR_PANEL_TRANSITION,
            "grid w-full grid-rows-[1fr] opacity-100",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            {/* shortcuts to subscription */}
            <Link
              href="/store/subscription"
              className="jb-sidebar-store-card block rounded-xl border border-sidebar-border bg-background/30 p-3 transition-colors hover:bg-background/50"
            >
              <div className="flex items-start gap-3">
                <TenantLogo
                  tenant={tenantLogo}
                  size="sm"
                  className="jb-sidebar-store-mark rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display truncate text-lg leading-tight italic text-sidebar-foreground">
                    {storeName}
                  </p>
                  <StoreLocationScope className="mt-1" />
                  <Badge
                    variant="outline"
                    className="surface-growth border-growth mt-2 gap-1 text-[10px] font-semibold uppercase tracking-wide"
                  >
                    <Star className="size-3 fill-current" />
                    {planLabel}
                  </Badge>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
