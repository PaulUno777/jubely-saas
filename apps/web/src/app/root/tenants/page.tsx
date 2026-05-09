"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@jubely/ui";
import type { Tenant } from "@jubely/api-schemas";
import { Eye, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { CreateTenantWizard } from "@/components/root/create-tenant-wizard";
import { useSession } from "@/hooks/useSession";
import { adminListTenants, adminPatchTenant } from "@/lib/adminApi";

type Tab = "active" | "trial" | "all";

function filterTenants(list: Tenant[], tab: Tab): Tenant[] {
  if (tab === "all") return list;
  if (tab === "active") return list.filter((t) => t.active);
  return list.filter((t) => t.active && String(t.plan).toLowerCase() === "starter");
}

export default function RootTenantsPage() {
  const { session } = useSession();
  const token = session?.accessToken;
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("all");
  const [wizardOpen, setWizardOpen] = useState(false);

  const q = useQuery({
    queryKey: ["admin", "tenants"],
    enabled: Boolean(token),
    queryFn: () => adminListTenants({ accessToken: token!, limit: 200, offset: 0 }),
  });

  const rows = useMemo(() => filterTenants(q.data ?? [], tab), [q.data, tab]);

  const patchMut = useMutation({
    mutationFn: async (input: { tenantId: string; active: boolean }) => {
      return adminPatchTenant({ accessToken: token!, tenantId: input.tenantId, body: { active: input.active } });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
      toast.success("Tenant mis à jour");
    },
    onError: (e) => {
      if (!(e instanceof Error && e.message === "Unauthorized")) toast.error(e instanceof Error ? e.message : "Erreur");
    },
  });

  return (
    <>
      <Header fixed>
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-base font-semibold">Tenants</h1>
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5" onClick={() => setWizardOpen(true)}>
              <Plus size={14} />
              Nouveau tenant
            </Button>
          </div>
        </div>
      </Header>

      <Main>
        <Card>
          <CardHeader className="space-y-3">
            <div>
              <CardTitle>Tous les tenants</CardTitle>
              <CardDescription>Liste en temps réel (`GET /v1/superadmin/tenants`).</CardDescription>
            </div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
              <TabsList>
                <TabsTrigger value="active">Actifs</TabsTrigger>
                <TabsTrigger value="trial">Trial</TabsTrigger>
                <TabsTrigger value="all">Tous</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enseigne</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground">
                      Chargement…
                    </TableCell>
                  </TableRow>
                ) : q.error ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-destructive">
                      Échec chargement tenants
                    </TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((t) => (
                    <TableRow key={t.tenant_id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {t.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.active ? "active" : "suspended"}>{t.active ? "Actif" : "Suspendu"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="gap-1" asChild>
                            <Link href={`/root/tenants/${t.tenant_id}`}>
                              <Eye size={14} />
                              Voir
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={patchMut.isPending}
                            onClick={() => patchMut.mutate({ tenantId: t.tenant_id, active: !t.active })}
                          >
                            {t.active ? "Suspendre" : "Réactiver"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground">
                      Aucun tenant dans ce filtre.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Main>

      {token ? (
        <CreateTenantWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          accessToken={token}
          onFinished={() => void qc.invalidateQueries({ queryKey: ["admin", "tenants"] })}
        />
      ) : null}
    </>
  );
}
