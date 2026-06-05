"use client";

import { useState } from "react";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@jubely/ui";
import { useTranslations } from "next-intl";
import { CustomerDetailSheet } from "@/components/store/customer-detail-sheet";
import { MerchantDataTable } from "@/components/store/merchant-data-table";
import { MerchantKpiStrip } from "@/components/store/merchant-kpi-strip";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { useTenantCustomers } from "@/hooks/tenant-admin-hooks";

function formatDate(value: string | number | Date) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function StoreCustomersPage() {
  const t = useTranslations("store.customers");
  const { headerContext } = useMerchantLocationScope();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const q = useTenantCustomers({ limit: 100, offset: 0, q: search || undefined });

  const customers = q.data?.customers ?? [];
  const total = q.data?.pagination?.total ?? customers.length;

  return (
    <MerchantPageShell title={t("title")} context={headerContext} className="space-y-6">
      <MerchantKpiStrip
        items={[
          {
            key: "total",
            label: t("kpiTotal"),
            value: total,
            tone: "teal",
          },
          {
            key: "loaded",
            label: t("kpiLoaded"),
            value: customers.length,
            tone: "growth",
          },
        ]}
      />
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("listTitle")}</CardTitle>
            <CardDescription>{t("listDescription")}</CardDescription>
          </div>
          <Input
            className="max-w-xs"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardHeader>
        <CardContent className="p-0">
          <MerchantDataTable
            columns={[
              {
                key: "name",
                header: t("name"),
                cell: (row) => (
                  <button
                    type="button"
                    className="font-medium text-left hover:underline"
                    onClick={() => setSelectedId(row.enrollment_id)}
                  >
                    {row.name}
                  </button>
                ),
              },
              {
                key: "phone",
                header: t("phone"),
                cell: (row) => <span className="font-mono text-sm">{row.phone}</span>,
              },
              {
                key: "tier",
                header: t("tier"),
                cell: (row) => <Badge variant="outline">{row.tier.code}</Badge>,
              },
              {
                key: "points",
                header: t("points"),
                className: "text-right",
                cell: (row) => (
                  <span className="font-mono tabular-nums">{row.points_balance}</span>
                ),
              },
              {
                key: "enrolledAt",
                header: t("enrolledAt"),
                cell: (row) => (
                  <span className="text-sm text-muted-foreground">
                    {formatDate(row.enrolled_at)}
                  </span>
                ),
              },
            ]}
            rows={customers}
            rowKey={(row) => row.enrollment_id}
            loading={q.isLoading}
            error={q.error}
            loadingLabel={t("loading")}
            errorLabel={t("loadError")}
            emptyLabel={t("empty")}
          />
        </CardContent>
      </Card>
      <CustomerDetailSheet
        enrollmentId={selectedId}
        open={Boolean(selectedId)}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </MerchantPageShell>
  );
}
