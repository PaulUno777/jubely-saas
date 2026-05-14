"use client";

import { useQuery } from "@tanstack/react-query";
import { JubelyLogo, Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, SidebarSeparator, cn, useSidebar } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { AdminSidebarFooter } from "@/components/root/admin-sidebar-footer";
import { AdminSidebarHeader } from "@/components/root/admin-sidebar-header";
import { StoreSidebarFooter } from "@/components/store/store-sidebar-footer";
import { StoreSidebarHeader } from "@/components/store/store-sidebar-header";
import { useSession } from "@/hooks/useSession";
import { adminSuperadminStats } from "@/lib/adminApi";
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
  const token = session?.accessToken;

  const statsQuery = useQuery({
    queryKey: ["superadminStats", "sidebar"],
    enabled: Boolean(isSuperadmin && token),
    queryFn: () => adminSuperadminStats(token!),
    staleTime: 60_000,
  });

  const superadminStats =
    isSuperadmin && statsQuery.data
      ? { tenantsTotal: statsQuery.data.tenants_total, alertsCount: statsQuery.data.alerts }
      : null;

  return (
    <Sidebar collapsible="icon" className={isMerchant ? "border-sidebar-border bg-sidebar" : undefined}>
      <SidebarHeader className="px-3 py-4">
        {isMerchant ? <StoreSidebarHeader /> : isSuperadmin ? <AdminSidebarHeader /> : <SidebarBrand />}
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {navGroupsForRole(session?.role, { superadminStats }).map((group) => (
          <NavGroup key={group.title} {...group} />
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-3">
        {isMerchant ? <StoreSidebarFooter /> : null}
        {isSuperadmin ? <AdminSidebarFooter /> : null}
        <NavUser
          name={session?.role === "superadmin" ? t("superadmin") : t("user")}
          email={session?.email ?? ""}
          role={session?.role ?? ""}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
