import {
  Building2,
  Gift,
  ImageIcon,
  LayoutDashboard,
  Megaphone,
  QrCode,
  Receipt,
  Settings,
  Shield,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import type { NavGroup } from "./types";

export type SidebarRole = "superadmin" | "merchant_admin" | "staff" | "customer";

export function navGroupsForRole(role: SidebarRole | string | undefined): NavGroup[] {
  if (role === "merchant_admin") {
    return [
      {
        title: "groups.dashboard",
        items: [
          { title: "items.overview", url: "/store", icon: LayoutDashboard },
          { title: "items.customers", url: "/store/customers", icon: Users },
          { title: "items.transactions", url: "/store/transactions", icon: Receipt },
        ],
      },
      {
        title: "groups.configuration",
        items: [
          { title: "items.teamAgents", url: "/store/agents", icon: Users },
          { title: "items.pointsRules", url: "/store/points-rules", icon: SlidersHorizontal },
          { title: "items.rewards", url: "/store/rewards", icon: Gift },
          { title: "items.enrollmentQr", url: "/store/enrollment-qr", icon: QrCode },
          { title: "items.branding", url: "/store/branding", icon: ImageIcon },
        ],
      },
      {
        title: "groups.marketing",
        items: [
          { title: "items.campaigns", url: "/store/campaigns", icon: Megaphone },
          { title: "items.settings", url: "/store/settings", icon: Settings },
        ],
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
