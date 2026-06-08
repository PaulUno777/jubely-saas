"use client";

import { useQuery } from "@tanstack/react-query";
import {
  JubelyLogo,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  cn,
  useSidebar,
} from "@jubely/ui";
import { useTranslations } from "next-intl";
import { AdminSidebarFooter } from "@/components/root/admin-sidebar-footer";
import { AdminSidebarHeader } from "@/components/root/admin-sidebar-header";
import { StoreSidebarHeader } from "@/components/store/store-sidebar-header";
import { useSession } from "@/hooks/useSession";
import { adminSuperadminStats } from "@/lib/adminApi";
import { useTenantNavStats } from "@/hooks/useTenantMetrics";
import { NavGroup } from "./nav-group";
import { NavUser } from "./nav-user";
import { navGroupsForRole } from "./sidebar-data";

function SidebarBrand() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <JubelyLogo
      size={collapsed ? "xs" : "sm"}
      iconOnly={collapsed}
      className={cn("text-sidebar-foreground", collapsed && "justify-center")}
    />
  );
}

export function AppSidebar() {
  const { session } = useSession();
  const t = useTranslations("navigation.roles");
  const isMerchant = session?.role === "merchant_admin";
  const isSuperadmin = session?.role === "superadmin";
  const statsQuery = useQuery({
    queryKey: ["superadminStats", "sidebar"],
    enabled: Boolean(isSuperadmin && session),
    queryFn: () => adminSuperadminStats(),
    staleTime: 60_000,
  });
  const merchantStatsQuery = useTenantNavStats();

  const superadminStats =
    isSuperadmin && statsQuery.data
      ? {
          tenantsTotal: statsQuery.data.tenants_total,
          alertsCount: statsQuery.data.alerts,
        }
      : null;

  const merchantStats =
    isMerchant && merchantStatsQuery.data
      ? {
          customers: merchantStatsQuery.data.customers,
          locations: merchantStatsQuery.data.locations,
          teamMembers: merchantStatsQuery.data.team_members,
          rulesActive: merchantStatsQuery.data.rules_active,
          rewardsActive: merchantStatsQuery.data.rewards_active,
        }
      : null;

  const merchantUserName = (() => {
    const raw = session?.email?.split("@")[0]?.replace(/[._]/g, " ") ?? "";
    if (!raw.length) return t("user");
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  })();

  return (
    <Sidebar
      collapsible="icon"
      className={isMerchant ? "border-sidebar-border bg-sidebar" : undefined}
    >
      <SidebarHeader
        className={cn(
          "px-3 py-4",
          isMerchant &&
            "group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:overflow-visible group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-3",
        )}
      >
        {isMerchant ? (
          <StoreSidebarHeader />
        ) : isSuperadmin ? (
          <AdminSidebarHeader />
        ) : (
          <SidebarBrand />
        )}
      </SidebarHeader>

      <SidebarContent>
        {navGroupsForRole(session?.role, {
          superadminStats,
          merchantStats,
        }).map((group) => (
          <NavGroup key={group.title} {...group} />
        ))}
      </SidebarContent>

      <SidebarFooter
        className={cn(
          "gap-3",
          "group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:overflow-visible group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:pb-3",
        )}
      >
        {isSuperadmin ? <AdminSidebarFooter /> : null}
        <NavUser
          name={
            session?.role === "superadmin"
              ? t("superadmin")
              : isMerchant
                ? merchantUserName
                : t("user")
          }
          email={session?.email ?? ""}
          role={session?.role ?? ""}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
