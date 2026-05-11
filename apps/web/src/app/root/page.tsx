"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge, Button, StatCard } from "@jubely/ui";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { MfaEnrollBanner } from "@/components/root/mfa-enroll-banner";
import { useSession } from "@/hooks/useSession";
import { adminSuperadminStats } from "@/lib/adminApi";

export default function RootHome() {
  const { session } = useSession();
  const token = session?.accessToken;

  const statsQuery = useQuery({
    queryKey: ["superadminStats"],
    enabled: !!token,
    queryFn: () => adminSuperadminStats(token!),
  });

  const stats = statsQuery.data;
  const tenantsTotal = stats?.tenants_total ?? "—";
  const tenantsActive = stats?.tenants_active ?? "—";
  const tenantsTrial = stats?.tenants_trial_active ?? "—";
  const alerts = stats?.alerts ?? "—";

  return (
    <>
      <Header fixed>
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-base font-semibold">Portail root admin</h1>
          <div className="flex items-center gap-2">
            <Badge className="surface-reward rounded-md border border-reward font-mono text-xs uppercase tracking-wider">
              Production
            </Badge>
            <Button size="sm" className="gap-1.5" asChild>
              <Link href="/root/tenants">
                <Plus size={14} />
                Tenants
              </Link>
            </Button>
          </div>
        </div>
      </Header>

      <Main>
        {token ? <MfaEnrollBanner accessToken={token} /> : null}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <StatCard label="Tenants actifs" value={tenantsActive} trend="neutral" />
          <StatCard label="Tenants en trial" value={tenantsTrial} sub="Plan starter actif" trend="neutral" />
          <StatCard label="Clients enrôlés" value="—" sub="Phase 3" trend="neutral" />
          <StatCard label="Alertes" value={alerts} trend="neutral" />
          <StatCard label="Tenants total" value={tenantsTotal} trend="neutral" />
        </div>
      </Main>
    </>
  );
}
