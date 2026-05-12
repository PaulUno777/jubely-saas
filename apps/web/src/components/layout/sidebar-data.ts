import { Building2, ImageIcon, LayoutDashboard, Shield, Users } from "lucide-react";
import type { NavGroup } from "./types";

export type SidebarRole = "superadmin" | "merchant_admin" | "staff" | "customer";

export function navGroupsForRole(role: SidebarRole | string | undefined): NavGroup[] {
  if (role === "merchant_admin") {
    return [
      {
        title: "groups.store",
        items: [
          { title: "items.dashboard", url: "/store", icon: LayoutDashboard },
          { title: "items.branding", url: "/store/branding", icon: ImageIcon },
          { title: "items.agents", url: "/store/agents", icon: Users },
        ],
      },
      {
        title: "groups.account",
        items: [{ title: "items.security", url: "/account/security", icon: Shield }],
      },
    ];
  }

  if (role === "superadmin") {
    return [
      {
        title: "groups.system",
        items: [
          { title: "items.globalOverview", url: "/root", icon: LayoutDashboard },
          { title: "items.tenants", url: "/root/tenants", icon: Building2 },
        ],
      },
      {
        title: "groups.operations",
        items: [{ title: "items.security", url: "/account/security", icon: Shield }],
      },
    ];
  }

  if (role === "staff") {
    return [
      {
        title: "groups.team",
        items: [
          { title: "items.home", url: "/agent", icon: LayoutDashboard },
          { title: "items.customers", url: "/agent/customers", icon: Users },
        ],
      },
    ];
  }

  return [
    {
      title: "groups.customer",
      items: [{ title: "items.home", url: "/customer", icon: LayoutDashboard }],
    },
  ];
}
