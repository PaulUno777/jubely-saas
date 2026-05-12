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
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { CreateTenantWizard } from "@/components/root/create-tenant-wizard";
import { TenantLogo } from "@/components/root/tenant-logo";
import { useSession } from "@/hooks/useSession";
import { adminListTenants, adminPatchTenant } from "@/lib/adminApi";

type Tab = "active" | "trial" | "all";

function filterTenants(list: Tenant[], tab: Tab): Tenant[] {
  if (tab === "all") return list;
  if (tab === "active") return list.filter((t) => t.active);
  return list.filter((t) => t.active && String(t.plan).toLowerCase() === "starter");
}

export default function RootTenantsPage() {
  const t = useTranslations("admin.tenants");
  const tErrors = useTranslations("errors");
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
      toast.success(t("toastUpdated"));
    },
    onError: (e) => {
      if (!(e instanceof Error && e.message === "Unauthorized")) {
        toast.error(e instanceof Error ? e.message : tErrors("generic"));
      }
    },
  });

  return (
    <>
      <Header fixed>
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-base font-semibold">{t("title")}</h1>
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5" onClick={() => setWizardOpen(true)}>
              <Plus size={14} />
              {t("newTenant")}
            </Button>
          </div>
        </div>
      </Header>

      <Main>
        <Card>
          <CardHeader className="space-y-3">
            <div>
              <CardTitle>{t("listTitle")}</CardTitle>
              <CardDescription>{t("listDescription")}</CardDescription>
            </div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
              <TabsList>
                <TabsTrigger value="active">{t("tabs.active")}</TabsTrigger>
                <TabsTrigger value="trial">{t("tabs.trial")}</TabsTrigger>
                <TabsTrigger value="all">{t("tabs.all")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.store")}</TableHead>
                  <TableHead>{t("table.plan")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead className="text-right">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground">
                      {t("loading")}
                    </TableCell>
                  </TableRow>
                ) : q.error ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-destructive">
                      {t("loadError")}
                    </TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((tenant) => (
                    <TableRow key={tenant.tenant_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <TenantLogo tenant={tenant} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{tenant.name}</p>
                            <p className="truncate text-xs font-mono text-muted-foreground">{tenant.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {tenant.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tenant.active ? "active" : "suspended"}>
                          {tenant.active ? t("statusActive") : t("statusSuspended")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="gap-1" asChild>
                            <Link href={`/root/tenants/${tenant.tenant_id}`}>
                              <Eye size={14} />
                              {t("view")}
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={patchMut.isPending}
                            onClick={() => patchMut.mutate({ tenantId: tenant.tenant_id, active: !tenant.active })}
                          >
                            {tenant.active ? t("suspend") : t("reactivate")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground">
                      {t("empty")}
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
