"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@jubely/ui";
import { Bell, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Main } from "@/components/layout/main";
import { PortalPageHeader } from "@/components/layout/portal-page-header";
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
      <PortalPageHeader
        title={t("title")}
        searchPlaceholder={t("searchPlaceholder")}
        className="admin-portal-header"
        actions={
          <>
            <Button type="button" variant="outline" size="icon" className="shrink-0" aria-label={t("notifications")}>
              <Bell className="size-4" />
            </Button>
            <Button size="sm" className="shrink-0 gap-1.5" asChild>
              <Link href="/root/tenants">
                <Plus size={14} />
                <span className="hidden sm:inline">{t("newTenant")}</span>
              </Link>
            </Button>
          </>
        }
      />

      <Main className="space-y-6">
        {session ? <MfaEnrollBanner /> : null}
        <AdminDashboardOverview stats={statsQuery.data} tenants={tenantsQuery.data} />
      </Main>
    </>
  );
}
