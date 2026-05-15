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

export type SidebarRole =
  | "superadmin"
  | "merchant_admin"
  | "staff"
  | "customer";

/** Optional live counts for superadmin sidebar badges (from `GET /v1/superadmin/stats`). */
export type SuperadminNavStats = {
  tenantsTotal: number;
  alertsCount: number;
};

export type NavGroupsOptions = {
  superadminStats?: SuperadminNavStats | null;
};

export function navGroupsForRole(
  role: SidebarRole | string | undefined,
  opts?: NavGroupsOptions,
): NavGroup[] {
  if (role === "merchant_admin") {
    return [
      {
        title: "groups.dashboard",
        items: [
          { title: "items.overview", url: "/store", icon: LayoutDashboard },
          { title: "items.customers", url: "/store/customers", icon: Users },
          {
            title: "items.transactions",
            url: "/store/transactions",
            icon: Receipt,
          },
        ],
      },
      {
        title: "groups.configuration",
        items: [
          { title: "items.teamAgents", url: "/store/agents", icon: Users },
          {
            title: "items.pointsRules",
            url: "/store/points-rules",
            icon: SlidersHorizontal,
          },
          { title: "items.rewards", url: "/store/rewards", icon: Gift },
          {
            title: "items.enrollmentQr",
            url: "/store/enrollment-qr",
            icon: QrCode,
          },
          { title: "items.branding", url: "/store/branding", icon: ImageIcon },
        ],
      },
      {
        title: "groups.marketing",
        items: [
          {
            title: "items.campaigns",
            url: "/store/campaigns",
            icon: Megaphone,
          },
          { title: "items.settings", url: "/store/settings", icon: Settings },
        ],
      },
    ];
  }

  if (role === "superadmin") {
    const st = opts?.superadminStats;
    const tenantsBadge = st ? st.tenantsTotal : undefined;
    const alertsBadge = st ? st.alertsCount : undefined;

    return [
      {
        title: "groups.dashboard",
        items: [
          {
            title: "items.globalOverview",
            url: "/root",
            icon: LayoutDashboard,
          },
          { title: "items.revenueMrr", url: "/root/revenue", icon: BarChart3 },
        ],
      },
      {
        title: "groups.tenantManagement",
        items: [
          {
            title: "items.tenants",
            url: "/root/tenants",
            icon: Building2,
            badge: tenantsBadge,
          },
          { title: "items.users", url: "/root/users", icon: Users },
          {
            title: "items.subscriptions",
            url: "/root/subscriptions",
            icon: Wallet,
            badge: alertsBadge,
          },
        ],
      },
      {
        title: "groups.configuration",
        items: [
          {
            title: "items.rolesPermissions",
            url: "/account/security",
            icon: Shield,
          },
          { title: "items.plansPricing", url: "/root/plans", icon: Layers },
          {
            title: "items.apiIntegrations",
            url: "/root/integrations",
            icon: Network,
          },
        ],
      },
      {
        title: "groups.system",
        items: [
          { title: "items.systemHealth", url: "/root/system", icon: Activity },
          { title: "items.auditLogs", url: "/root/audit", icon: ScrollText },
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
          { title: "items.recordPurchase", url: "/agent/purchase", icon: Receipt },
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
