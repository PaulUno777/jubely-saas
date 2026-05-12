"use client";

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from "@jubely/ui";
import { Pencil, Search } from "lucide-react";
import Link from "next/link";
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
  const maxMrr = Math.max(...adminDashboardSample.mrrMonths.map((month) => month.value));
  const kpis = adminDashboardSample.kpis.map((kpi) => {
    if (!stats) return kpi;
    if (kpi.labelKey === "tenantsActive") {
      const trialCount = stats.tenants_trial_active ?? 0;
      return {
        ...kpi,
        value: String(stats.tenants_active),
        detail: trialCount > 0 ? `+${trialCount} trial` : kpi.detail,
      } satisfies AdminKpiSample;
    }
    if (kpi.labelKey === "systemAlerts") {
      return { ...kpi, value: String(stats.alerts) } satisfies AdminKpiSample;
    }
    return kpi;
  });
  const tenantRows: AdminTenantRow[] =
    tenants && tenants.length > 0
      ? tenants.slice(0, 4).map((tenant, index) => ({
          id: tenant.tenant_id,
          name: tenant.name,
          initials: tenantInitials(tenant.name),
          color: tenantAccentColors[index % tenantAccentColors.length]!,
          plan: tenant.plan,
          customers: "—",
          mrr: "—",
          status: !tenant.active ? "suspended" : String(tenant.plan).toLowerCase() === "starter" ? "trial" : "active",
        }))
      : adminDashboardSample.tenants;

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
        <Card className="border-border bg-card xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("mrrEvolution")}</CardTitle>
            <CardDescription>{t("mrrEvolutionHint")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex h-48 items-end gap-3">
              {adminDashboardSample.mrrMonths.map((month) => (
                <div key={month.label} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className={cn(
                      "w-full rounded-t-lg transition-colors",
                      month.current ? "bg-[var(--status-active)]" : "bg-muted hover:bg-[color-mix(in_srgb,var(--status-active)_35%,var(--muted))]",
                    )}
                    style={{ height: `${(month.value / maxMrr) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{month.label}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("currentMrr")}</p>
                <p className="mt-1 font-mono text-lg font-semibold text-[var(--status-active)]">{adminDashboardSample.mrrSummary.current}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("growth30d")}</p>
                <p className="mt-1 font-mono text-lg font-semibold text-[var(--status-late)]">{adminDashboardSample.mrrSummary.growth30d}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("projectedArr")}</p>
                <p className="mt-1 font-mono text-lg font-semibold text-[var(--status-trial)]">{adminDashboardSample.mrrSummary.projectedArr}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">{t("planSplit")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminDashboardSample.planSplit.map((plan) => (
              <div key={plan.plan} className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{plan.plan}</p>
                  <p className="text-xs text-muted-foreground">{plan.count} tenants</p>
                </div>
                <p className="font-mono text-sm font-semibold text-foreground">{plan.revenue}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border-border bg-card xl:col-span-2">
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
                {tenantRows.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full text-xs font-semibold text-[#0e0c09]" style={{ backgroundColor: tenant.color }}>
                          {tenant.initials}
                        </span>
                        <span className="font-medium text-foreground">{tenant.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{tenant.plan}</TableCell>
                    <TableCell className="font-mono text-sm">{tenant.customers}</TableCell>
                    <TableCell className={cn("font-mono text-sm", tenant.status === "late" && "text-[var(--status-suspended)]")}>{tenant.mrr}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">{t("alertsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminDashboardSample.alerts.map((alert) => (
              <div key={alert.title} className="rounded-xl border border-border bg-background/40 px-3 py-3">
                <div className="flex items-start gap-3">
                  <span className={cn("mt-1 size-2 rounded-full", alertDot[alert.tone])} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{alert.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border-border bg-card xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("infrastructure")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {adminDashboardSample.infrastructure.map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-background/40 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <span className={cn("size-2 rounded-full", infraTone[item.tone])} />
                </div>
                <p className="mt-2 font-mono text-sm text-muted-foreground">{item.value}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", infraTone[item.tone])} style={{ width: `${item.progress}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">{t("auditLog")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminDashboardSample.audit.map((entry) => (
              <div key={`${entry.title}-${entry.when}`} className="rounded-xl border border-border bg-background/40 px-3 py-3">
                <div className="flex items-start gap-3">
                  <span className={cn("mt-1 size-2 rounded-full", auditDot[entry.tone])} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{entry.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{entry.target}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {entry.when} · {entry.actor}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">{t("mrrByPlan")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {adminDashboardSample.planMrr.map((plan) => (
            <div key={plan.plan} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-foreground">{plan.plan}</span>
                <span className="font-mono text-muted-foreground">{plan.amount}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    plan.tone === "emerald" && "bg-[var(--status-active)]",
                    plan.tone === "gold" && "bg-[var(--status-late)]",
                    plan.tone === "teal" && "bg-[var(--status-trial)]",
                    plan.tone === "danger" && "bg-[var(--status-suspended)]",
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
