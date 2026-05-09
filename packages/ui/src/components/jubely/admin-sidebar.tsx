"use client";

import {
  Activity,
  BarChart3,
  Building2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import * as React from "react";
import { cn } from "../../cn";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { JubelyLogo } from "./logo";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
  active?: boolean;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

type AdminSidebarProps = {
  sections?: NavSection[];
  currentPath?: string;
  userEmail?: string;
  userRole?: string;
  className?: string;
};

const defaultSections: NavSection[] = [
  {
    title: "SYSTÈME",
    items: [
      { label: "Vue globale", href: "/", icon: <LayoutDashboard size={16} />, active: true },
      { label: "Tenants", href: "/tenants", icon: <Building2 size={16} />, badge: 6 },
      { label: "Utilisateurs", href: "/users", icon: <Users size={16} /> },
    ],
  },
  {
    title: "FINANCES",
    items: [
      { label: "Abonnements", href: "/subscriptions", icon: <BarChart3 size={16} />, badge: 3 },
      { label: "MRR", href: "/mrr", icon: <BarChart3 size={16} /> },
    ],
  },
  {
    title: "SYSTÈME",
    items: [
      { label: "Santé", href: "/health", icon: <Activity size={16} /> },
      { label: "Sécurité", href: "/security", icon: <Shield size={16} /> },
    ],
  },
];

export function AdminSidebar({
  sections = defaultSections,
  currentPath = "/",
  userEmail = "root@jubilee.app",
  userRole = "superadmin",
  className,
}: AdminSidebarProps) {
  const initials = userEmail.slice(0, 2).toUpperCase();

  return (
    <aside
      className={cn(
        "flex h-full w-56 flex-col border-r border-border bg-card",
        className,
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
        <JubelyLogo size="sm" />
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {sections.map((section, si) => (
          <div key={si}>
            {section.title && (
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = currentPath === item.href || item.active;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      {item.icon}
                      {item.label}
                    </span>
                    {item.badge !== undefined && (
                      <Badge variant="secondary" className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
                        {item.badge}
                      </Badge>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <Separator />

      {/* User footer */}
      <div className="px-3 py-3">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="text-[10px] bg-primary/20 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="truncate text-xs font-medium text-foreground">{userEmail}</p>
            <p className="text-[10px] text-muted-foreground">{userRole}</p>
          </div>
          <ChevronDown size={14} className="shrink-0" />
        </button>
      </div>
    </aside>
  );
}

export function AdminShell({
  children,
  sidebar,
  className,
}: {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex h-screen bg-background", className)}>
      {sidebar ?? <AdminSidebar />}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
