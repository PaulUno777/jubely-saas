"use client";

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from "@jubely/ui";
import { Pencil, Search } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { SuperadminStats, Tenant } from "@jubely/api-schemas";
import { AdminKpiCard } from "@/components/root/admin-kpi-card";
import { adminDashboardSample, type AdminKpiSample, type AdminTenantRow } from "@/lib/adminDashboardSample";
import { tenantInitials } from "@/lib/tenantLogo";

const tenantAccentColors = ["#c89b3c", "#1fa971", "#0f766e", "#e07070"] as const;

const statusClass = {
  active: "border-[color-mix(in_srgb,var(--status-active)_35%,transparent)] bg-[var(--status-active-bg)] text-[var(--status-active)]",
  trial: "border-[color-mix(in_srgb,var(--status-trial)_35%,transparent)] bg-[var(--status-trial-bg)] text-[var(--status-trial)]",
  suspended: "border-[color-mix(in_srgb,var(--status-suspended)_35%,transparent)] bg-[var(--status-suspended-bg)] text-[var(--status-suspended)]",
  late: "border-[color-mix(in_srgb,var(--status-suspended)_35%,transparent)] bg-[var(--status-suspended-bg)] text-[var(--status-suspended)]",
} as const;

const alertDot = {
  danger: "bg-[var(--status-suspended)]",
  gold: "bg-[var(--status-late)]",
  teal: "bg-[var(--status-trial)]",
} as const;

const auditDot = {
  emerald: "bg-[var(--status-active)]",
  gold: "bg-[var(--status-late)]",
  danger: "bg-[var(--status-suspended)]",
  teal: "bg-[var(--status-trial)]",
} as const;

const infraTone = {
  emerald: "bg-[var(--status-active)]",
  gold: "bg-[var(--status-late)]",
  teal: "bg-[var(--status-trial)]",
} as const;

export function AdminDashboardOverview({ stats, tenants }: { stats?: SuperadminStats; tenants?: Tenant[] }) {
  const t = useTranslations("admin.root.dashboard");
  const tRoot = useTranslations("admin.root");
  const ts = useTranslations("admin.sampleDashboard");
  const tPlans = useTranslations("admin.tenantDetail.plans");

  const planLabel = (plan: string) => {
    const p = plan.toLowerCase();
    if (p === "starter" || p === "growth" || p === "business") return tPlans(p as "starter" | "growth" | "business");
    return plan;
  };

  const maxMrr = Math.max(...adminDashboardSample.mrrMonths.map((month) => month.value));

  const kpis = useMemo(() => {
    return adminDashboardSample.kpis.map((kpi) => {
      const detailBase = ts(`kpis.${kpi.labelKey}.detail` as "kpis.mrrTotal.detail");
      const deltaBase = ts(`kpis.${kpi.labelKey}.delta` as "kpis.mrrTotal.delta");
      let next: AdminKpiSample = { ...kpi, detail: detailBase, delta: deltaBase };
      if (stats && kpi.labelKey === "tenantsActive") {
        const trialCount = stats.tenants_trial_active ?? 0;
        next = {
          ...next,
          value: String(stats.tenants_active),
          detail: trialCount > 0 ? t("trialCountDetail", { count: String(trialCount) }) : detailBase,
        };
      }
      if (stats && kpi.labelKey === "systemAlerts") {
        next = { ...next, value: String(stats.alerts) };
      }
      return next;
    });
  }, [stats, t, ts]);

  const tenantRows: AdminTenantRow[] = useMemo(() => {
    if (tenants && tenants.length > 0) {
      return tenants.slice(0, 4).map((tenant, index) => ({
        id: tenant.tenant_id,
        name: tenant.name,
        plan: tenant.plan,
        initials: tenantInitials(tenant.name),
        color: tenantAccentColors[index % tenantAccentColors.length]!,
        customers: "—",
        mrr: "—",
        status: !tenant.active ? "suspended" : String(tenant.plan).toLowerCase() === "starter" ? "trial" : "active",
      }));
    }
    return adminDashboardSample.tenants;
  }, [tenants]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <AdminKpiCard
            key={kpi.labelKey}
            label={t(kpi.labelKey)}
            value={kpi.value}
            delta={kpi.delta}
            detail={kpi.detail}
            tone={kpi.tone}
            sparkline={kpi.sparkline}
            live={kpi.live}
            liveLabel={tRoot("dashboard.mrrLive")}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="portal-card border-border bg-card xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("mrrEvolution")}</CardTitle>
            <CardDescription>{t("mrrEvolutionHint")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex h-48 items-end gap-3">
              {adminDashboardSample.mrrMonths.map((month) => (
                <div key={month.labelKey} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className={cn(
                      "w-full rounded-t-lg transition-colors",
                      month.current ? "bg-(--status-active)" : "bg-muted hover:bg-[color-mix(in_srgb,var(--status-active)_35%,var(--muted))]",
                    )}
                    style={{ height: `${(month.value / maxMrr) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{ts(`mrrMonths.${month.labelKey}` as "mrrMonths.nov")}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
                <p className="jb-label tracking-[0.14em]">{t("currentMrr")}</p>
                <p className="jb-numeric mt-1 text-lg font-semibold text-(--status-active)">{ts("mrrSummary.current")}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
                <p className="jb-label tracking-[0.14em]">{t("growth30d")}</p>
                <p className="jb-numeric mt-1 text-lg font-semibold text-(--status-late)">{ts("mrrSummary.growth30d")}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
                <p className="jb-label tracking-[0.14em]">{t("projectedArr")}</p>
                <p className="jb-numeric mt-1 text-lg font-semibold text-(--status-trial)">{ts("mrrSummary.projectedArr")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="portal-card border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">{t("planSplit")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminDashboardSample.planSplit.map((plan) => (
              <div key={plan.planKey} className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{ts(`planNames.${plan.planKey}` as "planNames.business")}</p>
                  <p className="text-xs text-muted-foreground">{t("planTenantCount", { count: String(plan.count) })}</p>
                </div>
                <p className="jb-numeric text-sm font-semibold text-foreground">{plan.revenue}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="portal-card border-border bg-card xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base">{t("activeStores")}</CardTitle>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/root/tenants">{tRoot("tenantsCta")}</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.store")}</TableHead>
                  <TableHead>{t("table.plan")}</TableHead>
                  <TableHead>{t("table.customers")}</TableHead>
                  <TableHead>{t("table.mrr")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead className="text-right">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantRows.map((tenant) => {
                  const displayName = tenant.sampleId ? ts(`tenants.${tenant.sampleId}.name` as "tenants.chezMama.name") : tenant.name;
                  const displayPlan =
                    tenant.sampleId && tenant.planKey
                      ? ts(`planNames.${tenant.planKey}` as "planNames.business")
                      : tenant.plan
                        ? planLabel(tenant.plan)
                        : "";
                  return (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-full text-xs font-semibold text-[#0e0c09]" style={{ backgroundColor: tenant.color }}>
                            {tenant.initials}
                          </span>
                          <span className="font-medium text-foreground">{displayName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{displayPlan}</TableCell>
                      <TableCell className="font-mono text-sm">{tenant.customers}</TableCell>
                      <TableCell className={cn("font-mono text-sm", tenant.status === "late" && "text-(--status-suspended)")}>{tenant.mrr}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusClass[tenant.status]}>
                          {t(`status.${tenant.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8" asChild>
                            <Link href={`/root/tenants/${tenant.id}`} aria-label={t("actions.view")}>
                              <Search className="size-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8" asChild>
                            <Link href={`/root/tenants/${tenant.id}`} aria-label={t("actions.edit")}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="portal-card border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">{t("alertsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminDashboardSample.alerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-border bg-background/40 px-3 py-3">
                <div className="flex items-start gap-3">
                  <span className={cn("mt-1 size-2 rounded-full", alertDot[alert.tone])} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{ts(`alerts.${alert.id}.title` as "alerts.paymentLate.title")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{ts(`alerts.${alert.id}.detail` as "alerts.paymentLate.detail")}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="portal-card border-border bg-card xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("infrastructure")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {adminDashboardSample.infrastructure.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-background/40 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{ts(`infrastructure.${item.id}.label` as "infrastructure.apiGo.label")}</p>
                  <span className={cn("size-2 rounded-full", infraTone[item.tone])} />
                </div>
                <p className="mt-2 font-mono text-sm text-muted-foreground">{ts(`infrastructure.${item.id}.value` as "infrastructure.apiGo.value")}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", infraTone[item.tone])} style={{ width: `${item.progress}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="portal-card border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">{t("auditLog")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminDashboardSample.audit.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-border bg-background/40 px-3 py-3">
                <div className="flex items-start gap-3">
                  <span className={cn("mt-1 size-2 rounded-full", auditDot[entry.tone])} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{ts(`audit.${entry.id}.title` as "audit.tenantCreated.title")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{ts(`audit.${entry.id}.target` as "audit.tenantCreated.target")}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {ts(`audit.${entry.id}.when` as "audit.tenantCreated.when")} · {ts(`audit.${entry.id}.actor` as "audit.tenantCreated.actor")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="portal-card border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">{t("mrrByPlan")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {adminDashboardSample.planMrr.map((plan) => (
            <div key={plan.planKey} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-foreground">{ts(`planNames.${plan.planKey}` as "planNames.business")}</span>
                <span className="font-mono text-muted-foreground">{plan.amount}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    plan.tone === "emerald" && "bg-(--status-active)",
                    plan.tone === "gold" && "bg-(--status-late)",
                    plan.tone === "teal" && "bg-(--status-trial)",
                    plan.tone === "danger" && "bg-(--status-suspended)",
                  )}
                  style={{ width: `${plan.progress}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
