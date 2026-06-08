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
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { CustomerDetailSheet } from "@/components/store/customer-detail-sheet";
import { InitialsAvatar } from "@/components/store/initials-avatar";
import { ListPageTabs } from "@/components/store/list-page-tabs";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { TierBadge } from "@/components/store/tier-badge";
import { useRegisterPortalSearch } from "@/components/layout/portal-search-provider";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { usePagination } from "@/hooks/usePagination";
import { useStorePaginationLabels } from "@/hooks/useStorePaginationLabels";
import {
  useTenantAnalyticsOverview,
  useTenantCustomers,
} from "@/hooks/tenant-admin-hooks";

type CustomerTab = "all" | "top";

const TOP_TIERS = new Set(["gold", "or", "platinum", "platine"]);

function formatDate(value: string | number | Date) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function pickOverviewNum(obj: Record<string, unknown> | undefined, ...keys: string[]) {
  if (!obj) return 0;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number") return value;
  }
  return 0;
}

export default function StoreCustomersPage() {
  const t = useTranslations("store.customers");
  const paginationLabels = useStorePaginationLabels();
  const { headerContext, activeStoreId } = useMerchantLocationScope();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<CustomerTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
  }, [debouncedSearch, tab, activeStoreId, reset]);

  const q = useTenantCustomers({
    limit,
    offset,
    q: debouncedSearch || undefined,
    locationId: activeStoreId,
  });

  const overviewQ = useTenantAnalyticsOverview({ locationId: activeStoreId });

  const total = q.data?.pagination?.total ?? 0;
  const customers = useMemo(() => {
    const rows = q.data?.customers ?? [];
    if (tab === "top") {
      return rows.filter((row) => TOP_TIERS.has(row.tier.code.toLowerCase()));
    }
    return rows;
  }, [q.data?.customers, tab]);

  const overview = overviewQ.data?.overview as Record<string, unknown> | undefined;

  return (
    <MerchantPageShell title={t("title")} context={headerContext} className="space-y-6">
      <KpiTileStrip>
        <KpiTile label={t("kpiTotal")} value={total} tone="emerald" />
        <KpiTile
          label={t("kpiActive")}
          value={pickOverviewNum(overview, "ActiveMembers", "active_members")}
          tone="gold"
        />
        <KpiTile
          label={t("kpiPointsPerMember")}
          value={pickOverviewNum(overview, "PointsPerMember", "points_per_member")}
          tone="teal"
        />
        <KpiTile
          label={t("kpiDormant")}
          value={pickOverviewNum(overview, "DormantMembers", "dormant_members")}
          tone="terra"
        />
      </KpiTileStrip>

      <ListCard
        title={t("listTitle")}
        description={t("listDescription")}
        toolbar={
          <ListPageTabs
            tabs={[
              { id: "all", label: t("tabAll"), count: total },
              { id: "top", label: t("tabTop"), count: customers.length },
            ]}
            active={tab}
            onChange={(id) => setTab(id as CustomerTab)}
          />
        }
      >
        <DataTable
          columns={[
            {
              key: "customer",
              header: t("name"),
              cell: (row) => (
                <div className="flex items-center gap-3">
                  <InitialsAvatar name={row.name} />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-foreground">{row.name}</div>
                    <div className="truncate font-mono text-xs text-muted-foreground">{row.phone}</div>
                  </div>
                </div>
              ),
            },
            {
              key: "tier",
              header: t("tier"),
              cell: (row) => <TierBadge code={row.tier.code} />,
            },
            {
              key: "points",
              header: t("points"),
              className: "text-right font-medium",
              headerClassName: "text-right",
              cell: (row) => (
                <span className="font-mono tabular-nums">{row.points_balance.toLocaleString()}</span>
              ),
            },
            {
              key: "enrolledAt",
              header: t("enrolledAt"),
              cell: (row) => (
                <span className="text-xs text-muted-foreground">{formatDate(row.enrolled_at)}</span>
              ),
            },
            {
              key: "chevron",
              header: "",
              className: "w-10 text-right",
              cell: () => <ChevronRight className="ml-auto size-4 text-muted-foreground/70" />,
            },
          ]}
          rows={customers}
          rowKey={(row) => row.enrollment_id}
          loading={q.isLoading}
          error={q.error}
          loadingLabel={t("loading")}
          errorLabel={t("loadError")}
          emptyLabel={t("empty")}
          getErrorMessage={(error) =>
            error instanceof ApiResponseError ? error.message : t("loadError")
          }
          onRowClick={(row) => setSelectedId(row.enrollment_id)}
          footer={
            tab === "all" ? (
              <Pagination
                offset={offset}
                limit={limit}
                total={total}
                onOffsetChange={setOffset}
                onLimitChange={setLimit}
                labels={paginationLabels}
              />
            ) : null
          }
        />
      </ListCard>

      <CustomerDetailSheet
        enrollmentId={selectedId}
        open={Boolean(selectedId)}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </MerchantPageShell>
  );
}
