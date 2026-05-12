"use client";

import { JubelyLogo, Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, SidebarSeparator, cn, useSidebar } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { useSession } from "@/hooks/useSession";
import { StoreSidebarFooter } from "@/components/store/store-sidebar-footer";
import { StoreSidebarHeader } from "@/components/store/store-sidebar-header";
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

  return (
    <Sidebar collapsible="icon" className={isMerchant ? "border-sidebar-border bg-sidebar" : undefined}>
      <SidebarHeader className="px-3 py-4">{isMerchant ? <StoreSidebarHeader /> : <SidebarBrand />}</SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>{navGroupsForRole(session?.role).map((group) => <NavGroup key={group.title} {...group} />)}</SidebarContent>

      <SidebarFooter className="gap-3">
        {isMerchant ? <StoreSidebarFooter /> : null}
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
