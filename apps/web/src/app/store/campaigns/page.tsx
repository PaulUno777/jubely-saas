"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jubely/ui";
import { ApiResponseError } from "@jubely/api-schemas";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MerchantDataTable } from "@/components/store/merchant-data-table";
import { MerchantKpiStrip } from "@/components/store/merchant-kpi-strip";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { useTenantCampaigns } from "@/hooks/tenant-admin-hooks";
import { useTenantId } from "@/hooks/useTenantId";
import type { Campaign } from "@jubely/api-schemas";
import { launchCampaign, pauseCampaign } from "@/lib/tenant-admin";

function formatDate(value: string | number | Date | null | undefined) {
  if (value == null) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export default function StoreCampaignsPage() {
  const t = useTranslations("store.campaigns");
  const { headerContext } = useMerchantLocationScope();
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const q = useTenantCampaigns();

  const lifecycleMut = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "launch" | "pause" }) => {
      if (action === "launch") return launchCampaign(tenantId!, id);
      return pauseCampaign(tenantId!, id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "campaigns"] });
      toast.success(t("actionSuccess"));
    },
    onError: (e) =>
      toast.error(e instanceof ApiResponseError ? e.message : t("actionError")),
  });

  const campaigns = (q.data ?? []) as Campaign[];
  const activeCount = campaigns.filter((c: Campaign) => c.status === "active").length;

  return (
    <MerchantPageShell title={t("title")} context={headerContext} className="space-y-6">
      <MerchantKpiStrip
        items={[
          { key: "total", label: t("kpiTotal"), value: campaigns.length, tone: "teal" },
          { key: "active", label: t("kpiActive"), value: activeCount, tone: "growth" },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("listTitle")}</CardTitle>
          <CardDescription>{t("listDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <MerchantDataTable
            columns={[
              {
                key: "name",
                header: t("name"),
                cell: (row) => <span className="font-medium">{row.name}</span>,
              },
              {
                key: "type",
                header: t("type"),
                cell: (row) => <Badge variant="outline">{row.campaign_type}</Badge>,
              },
              {
                key: "status",
                header: t("status"),
                cell: (row) => <Badge>{row.status}</Badge>,
              },
              {
                key: "period",
                header: t("period"),
                cell: (row) => (
                  <span className="text-sm text-muted-foreground">
                    {formatDate(row.starts_at)} – {formatDate(row.ends_at)}
                  </span>
                ),
              },
              {
                key: "actions",
                header: t("actions"),
                cell: (row) => (
                  <div className="flex gap-2">
                    {row.status !== "active" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={lifecycleMut.isPending}
                        onClick={() =>
                          lifecycleMut.mutate({ id: row.id, action: "launch" })
                        }
                      >
                        {t("launch")}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={lifecycleMut.isPending}
                        onClick={() =>
                          lifecycleMut.mutate({ id: row.id, action: "pause" })
                        }
                      >
                        {t("pause")}
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            rows={campaigns}
            rowKey={(row) => row.id}
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
