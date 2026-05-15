"use client";

import { useQuery } from "@tanstack/react-query";
import { Button, Input } from "@jubely/ui";
import { Bell, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { AdminDashboardOverview } from "@/components/root/admin-dashboard-overview";
import { MfaEnrollBanner } from "@/components/root/mfa-enroll-banner";
import { useSession } from "@/hooks/useSession";
import { adminListTenants, adminSuperadminStats } from "@/lib/adminApi";

export default function RootHome() {
  const t = useTranslations("admin.root");
  const { session } = useSession();

  const statsQuery = useQuery({
    queryKey: ["superadminStats"],
    enabled: Boolean(session),
    queryFn: () => adminSuperadminStats(),
  });

  const tenantsQuery = useQuery({
    queryKey: ["admin", "tenants", "overview"],
    enabled: Boolean(session),
    queryFn: () => adminListTenants({ limit: 8, offset: 0 }),
  });

  return (
    <>
      <Header fixed>
        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-base font-semibold">{t("title")}</h1>
          </div>
          <div className="flex flex-1 items-center gap-2 lg:max-w-xl lg:justify-end">
            <div className="relative hidden min-w-0 flex-1 md:block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-9 bg-background/80 pl-9" placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} />
            </div>
            <Button type="button" variant="outline" size="icon" className="shrink-0" aria-label={t("notifications")}>
              <Bell className="size-4" />
            </Button>
            <Button size="sm" className="shrink-0 gap-1.5" asChild>
              <Link href="/root/tenants">
                <Plus size={14} />
                <span className="hidden sm:inline">{t("newTenant")}</span>
              </Link>
            </Button>
          </div>
        </div>
      </Header>

      <Main className="space-y-6">
        {session ? <MfaEnrollBanner /> : null}
        <AdminDashboardOverview stats={statsQuery.data} tenants={tenantsQuery.data} />
      </Main>
    </>
  );
}
