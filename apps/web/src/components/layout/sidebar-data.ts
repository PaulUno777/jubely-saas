import { Building2, ImageIcon, LayoutDashboard, Shield, Users } from "lucide-react";
import type { NavGroup } from "./types";

export type SidebarRole = "superadmin" | "merchant_admin" | "staff" | "customer";

export function navGroupsForRole(role: SidebarRole | string | undefined): NavGroup[] {
  if (role === "merchant_admin") {
    return [
      {
        title: "Magasin",
        items: [
          { title: "Tableau de bord", url: "/store", icon: LayoutDashboard },
          { title: "Marque (logo)", url: "/store/branding", icon: ImageIcon },
          { title: "Agents", url: "/store/agents", icon: Users },
        ],
      },
      {
        title: "Compte",
        items: [{ title: "Sécurité (2FA)", url: "/account/security", icon: Shield }],
      },
    ];
  }

  if (role === "superadmin") {
    return [
      {
        title: "Système",
        items: [
          { title: "Vue globale", url: "/root", icon: LayoutDashboard },
          { title: "Tenants", url: "/root/tenants", icon: Building2 },
        ],
      },
      {
        title: "Opérations",
        items: [{ title: "Sécurité (2FA)", url: "/account/security", icon: Shield }],
      },
    ];
  }

  if (role === "staff") {
    return [
      {
        title: "Équipe",
        items: [
          { title: "Accueil", url: "/agent", icon: LayoutDashboard },
          { title: "Clients", url: "/agent/customers", icon: Users },
        ],
      },
    ];
  }

  return [
    {
      title: "Client",
      items: [{ title: "Accueil", url: "/customer", icon: LayoutDashboard }],
    },
  ];
}
