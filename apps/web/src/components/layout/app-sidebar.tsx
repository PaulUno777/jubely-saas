"use client";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, SidebarSeparator } from "@jubely/ui";
import { JubelyLogo } from "@jubely/ui";
import { navGroupsForRole } from "./sidebar-data";
import { NavGroup } from "./nav-group";
import { NavUser } from "./nav-user";
import { useSession } from "@/hooks/useSession";

export function AppSidebar() {
  const { session } = useSession();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-4 px-3">
        <JubelyLogo size="sm" />
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {navGroupsForRole(session?.role).map((group) => (
          <NavGroup key={group.title} {...group} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          name={session?.role === "superadmin" ? "Superadmin" : "Utilisateur"}
          email={session?.email ?? ""}
          role={session?.role ?? ""}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

