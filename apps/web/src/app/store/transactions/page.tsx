"use client";

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { MerchantDataTable } from "@/components/store/merchant-data-table";
import { MerchantFilterBar } from "@/components/store/merchant-filter-bar";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { useTenantDateRange } from "@/hooks/useTenantDateRange";
import { useTenantTransactions } from "@/hooks/tenant-admin-hooks";

function formatDate(value: string | number | Date) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function amountFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const amount = (payload as { amount_fcfa?: unknown }).amount_fcfa;
  if (typeof amount === "number") return `${amount.toLocaleString()} FCFA`;
  return null;
}

export default function StoreTransactionsPage() {
  const t = useTranslations("store.transactions");
  const { headerContext, activeStoreId } = useMerchantLocationScope();
  const { dateRange, setDateRange, isoRange } = useTenantDateRange("last_30_days");

  const q = useTenantTransactions({
    limit: 100,
    offset: 0,
    from: isoRange.from,
    to: isoRange.to,
    locationId: activeStoreId,
  });

  const transactions = q.data?.transactions ?? [];

  return (
    <MerchantPageShell
      title={t("title")}
      context={headerContext}
      filters={
        <MerchantFilterBar dateRange={dateRange} onDateRangeChange={setDateRange} />
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>{t("listTitle")}</CardTitle>
          <CardDescription>{t("listDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <MerchantDataTable
            columns={[
              {
                key: "date",
                header: t("date"),
                cell: (row) => (
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(row.created_at)}
                  </span>
                ),
              },
              {
                key: "customer",
                header: t("customer"),
                cell: (row) => (
                  <div>
                    <div className="text-sm font-medium">{row.customer_name ?? "—"}</div>
                    {row.customer_phone ? (
                      <div className="font-mono text-xs text-muted-foreground">
                        {row.customer_phone}
                      </div>
                    ) : null}
                  </div>
                ),
              },
              {
                key: "type",
                header: t("type"),
                cell: (row) => <Badge variant="outline">{row.event_type}</Badge>,
              },
              {
                key: "amount",
                header: t("amount"),
                cell: (row) => <span className="text-sm">{amountFromPayload(row.payload) ?? "—"}</span>,
              },
              {
                key: "points",
                header: t("points"),
                className: "text-right",
                cell: (row) => (
                  <span className="font-mono tabular-nums">
                    {row.delta > 0 ? `+${row.delta}` : row.delta}
                  </span>
                ),
              },
            ]}
            rows={transactions}
            rowKey={(row) => row.event_id}
            loading={q.isLoading}
            error={q.error}
            loadingLabel={t("loading")}
            errorLabel={t("loadError")}
            emptyLabel={t("empty")}
          />
        </CardContent>
      </Card>
    </MerchantPageShell>
  );
}
