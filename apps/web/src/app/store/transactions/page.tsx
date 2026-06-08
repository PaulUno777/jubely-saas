"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DataTable,
  KpiTile,
  KpiTileStrip,
  ListCard,
  Pagination,
} from "@jubely/ui";
import { ApiResponseError } from "@jubely/api-schemas";
import { useTranslations } from "next-intl";
import { EventTypePill } from "@/components/store/event-type-pill";
import { InitialsAvatar } from "@/components/store/initials-avatar";
import { ListPageTabs } from "@/components/store/list-page-tabs";
import { MerchantFilterBar } from "@/components/store/merchant-filter-bar";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { usePagination } from "@/hooks/usePagination";
import { useStorePaginationLabels } from "@/hooks/useStorePaginationLabels";
import { useTenantDateRange } from "@/hooks/useTenantDateRange";
import { useTenantTransactions } from "@/hooks/tenant-admin-hooks";
import { useRegisterPortalSearch } from "@/components/layout/portal-search-provider";

type TxTab = "all" | "earn" | "redeem" | "bonus";

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

function detailFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  if (typeof obj.reward_name === "string") return obj.reward_name;
  if (typeof obj.reason === "string") return obj.reason;
  if (typeof obj.note === "string") return obj.note;
  return null;
}

export default function StoreTransactionsPage() {
  const t = useTranslations("store.transactions");
  const paginationLabels = useStorePaginationLabels();
  const { headerContext, activeStoreId } = useMerchantLocationScope();
  const { dateRange, setDateRange, isoRange } = useTenantDateRange("last_30_days");
  const [tab, setTab] = useState<TxTab>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const { offset, limit, setOffset, setLimit, reset } = usePagination({ defaultLimit: 25 });

  useRegisterPortalSearch({
    enabled: true,
    placeholder: t("searchPlaceholder"),
    value: search,
    onChange: setSearch,
  });

  useEffect(() => {
    reset();
  }, [debouncedSearch, tab, activeStoreId, isoRange.from, isoRange.to, reset]);

  const q = useTenantTransactions({
    limit,
    offset,
    from: isoRange.from,
    to: isoRange.to,
    locationId: activeStoreId,
    event_type: tab === "all" ? undefined : tab,
  });

  const total = q.data?.pagination?.total ?? 0;
  const transactions = useMemo(() => {
    const rows = q.data?.transactions ?? [];
    if (!debouncedSearch.trim()) return rows;
    const needle = debouncedSearch.toLowerCase();
    return rows.filter(
      (row) =>
        row.customer_name?.toLowerCase().includes(needle) ||
        row.customer_phone?.includes(needle),
    );
  }, [q.data?.transactions, debouncedSearch]);

  const earned = transactions.filter((row) => row.delta > 0).reduce((s, r) => s + r.delta, 0);
  const spent = transactions.filter((row) => row.delta < 0).reduce((s, r) => s + Math.abs(r.delta), 0);

  const eventLabels = {
    earn: t("typeEarn"),
    redeem: t("typeRedeem"),
    bonus: t("typeBonus"),
    adjustment: t("typeAdjustment"),
  };

  return (
    <MerchantPageShell
      title={t("title")}
      context={headerContext}
      className="space-y-6"
      filters={<MerchantFilterBar dateRange={dateRange} onDateRangeChange={setDateRange} />}
    >
      <KpiTileStrip>
        <KpiTile label={t("kpiTotal")} value={total} tone="emerald" />
        <KpiTile label={t("kpiEarned")} value={earned.toLocaleString()} tone="gold" />
        <KpiTile label={t("kpiSpent")} value={spent.toLocaleString()} tone="teal" />
        <KpiTile label={t("kpiShown")} value={transactions.length} tone="terra" />
      </KpiTileStrip>

      <ListCard
        title={t("listTitle")}
        description={t("listDescription")}
        toolbar={
          <ListPageTabs
            tabs={[
              { id: "all", label: t("tabAll"), count: total },
              { id: "earn", label: t("tabEarn") },
              { id: "redeem", label: t("tabRedeem") },
              { id: "bonus", label: t("tabBonus") },
            ]}
            active={tab}
            onChange={(id) => setTab(id as TxTab)}
          />
        }
      >
        <DataTable
          columns={[
            {
              key: "customer",
              header: t("customer"),
              cell: (row) => (
                <div className="flex items-center gap-2.5">
                  <InitialsAvatar name={row.customer_name ?? "?"} size="sm" />
                  <div>
                    <div className="text-sm font-medium">{row.customer_name ?? "—"}</div>
                    {row.customer_phone ? (
                      <div className="font-mono text-xs text-muted-foreground">{row.customer_phone}</div>
                    ) : null}
                  </div>
                </div>
              ),
            },
            {
              key: "type",
              header: t("type"),
              cell: (row) => <EventTypePill type={row.event_type} labels={eventLabels} />,
            },
            {
              key: "detail",
              header: t("detail"),
              cell: (row) => (
                <span className="max-w-[12rem] truncate text-xs text-muted-foreground">
                  {detailFromPayload(row.payload) ?? "—"}
                </span>
              ),
            },
            {
              key: "amount",
              header: t("amount"),
              cell: (row) => <span className="text-sm">{amountFromPayload(row.payload) ?? "—"}</span>,
            },
            {
              key: "points",
              header: t("points"),
              className: "text-right font-semibold",
              headerClassName: "text-right",
              cell: (row) => (
                <span
                  className={
                    row.delta > 0
                      ? "font-mono tabular-nums text-[var(--status-active)]"
                      : row.delta < 0
                        ? "font-mono tabular-nums text-[var(--status-suspended)]"
                        : "font-mono tabular-nums"
                  }
                >
                  {row.delta > 0 ? `+${row.delta}` : row.delta}
                </span>
              ),
            },
            {
              key: "date",
              header: t("date"),
              cell: (row) => (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(row.created_at)}
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
          getErrorMessage={(error) =>
            error instanceof ApiResponseError ? error.message : t("loadError")
          }
          footer={
            <Pagination
              offset={offset}
              limit={limit}
              total={total}
              onOffsetChange={setOffset}
              onLimitChange={setLimit}
              labels={paginationLabels}
            />
          }
        />
      </ListCard>
    </MerchantPageShell>
  );
}
