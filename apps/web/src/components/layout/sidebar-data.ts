import {
  Activity,
  Building2,
  Gift,
  ImageIcon,
  LayoutDashboard,
  Layers,
  Megaphone,
  Network,
  QrCode,
  Receipt,
  ScrollText,
  Settings,
  Shield,
  SlidersHorizontal,
  Users,
  Wallet,
  BarChart3,
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
        title: "groups.dashboard",
        items: [
          { title: "items.globalOverview", url: "/root", icon: LayoutDashboard },
          { title: "items.revenueMrr", url: "/root", icon: BarChart3 },
        ],
      },
      {
        title: "groups.tenantManagement",
        items: [
          { title: "items.tenants", url: "/root/tenants", icon: Building2, badge: 24 },
          { title: "items.users", url: "/root/tenants", icon: Users },
          { title: "items.subscriptions", url: "/root/tenants", icon: Wallet, badge: 3 },
        ],
      },
      {
        title: "groups.configuration",
        items: [
          { title: "items.rolesPermissions", url: "/account/security", icon: Shield },
          { title: "items.plansPricing", url: "/root", icon: Layers },
          { title: "items.apiIntegrations", url: "/root", icon: Network },
        ],
      },
      {
        title: "groups.system",
        items: [
          { title: "items.systemHealth", url: "/root", icon: Activity },
          { title: "items.auditLogs", url: "/root", icon: ScrollText },
          { title: "items.security", url: "/account/security", icon: Shield },
        ],
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
