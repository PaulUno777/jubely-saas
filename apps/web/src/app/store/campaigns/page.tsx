"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  KpiTile,
  KpiTileStrip,
} from "@jubely/ui";
import { ApiResponseError, type Campaign } from "@jubely/api-schemas";
import { Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CampaignFormDialog } from "@/components/store/campaign-form-dialog";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { useTenantCampaigns } from "@/hooks/tenant-admin-hooks";
import { useTenantId } from "@/hooks/useTenantId";
import { launchCampaign, pauseCampaign } from "@/lib/tenant-admin";

function formatDate(value: string | number | Date | null | undefined) {
  if (value == null) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function statusVariant(status: string) {
  if (status === "active") return "default" as const;
  if (status === "paused") return "secondary" as const;
  return "outline" as const;
}

export default function StoreCampaignsPage() {
  const t = useTranslations("store.campaigns");
  const { headerContext } = useMerchantLocationScope();
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const q = useTenantCampaigns();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);

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
  const activeCount = campaigns.filter((c) => c.status === "active").length;
  const reachTotal = campaigns.reduce((sum, c) => sum + (c.reach_count ?? 0), 0);

  return (
    <MerchantPageShell title={t("title")} context={headerContext} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus size={14} />
          {t("create")}
        </Button>
      </div>

      <KpiTileStrip>
        <KpiTile label={t("kpiTotal")} value={campaigns.length} tone="teal" />
        <KpiTile label={t("kpiActive")} value={activeCount} tone="growth" />
        <KpiTile label={t("kpiReach")} value={reachTotal.toLocaleString()} tone="gold" />
      </KpiTileStrip>

      <div className="grid gap-4 md:grid-cols-2">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{campaign.campaign_type}</Badge>
                    <Badge variant={statusVariant(campaign.status)}>{campaign.status}</Badge>
                  </div>
                  <h3 className="mt-2 font-serif text-xl font-medium italic">{campaign.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(campaign.starts_at)} – {formatDate(campaign.ends_at)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditing(campaign);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil size={14} />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-sm">
                <div>
                  <div className="font-mono font-medium">{campaign.reach_count}</div>
                  <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
                    {t("reach")}
                  </div>
                </div>
                <div>
                  <div className="font-mono font-medium">{campaign.conversion_count}</div>
                  <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
                    {t("conversions")}
                  </div>
                </div>
                <div className="ml-auto flex gap-2">
                  {campaign.status !== "active" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={lifecycleMut.isPending}
                      onClick={() => lifecycleMut.mutate({ id: campaign.id, action: "launch" })}
                    >
                      {t("launch")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={lifecycleMut.isPending}
                      onClick={() => lifecycleMut.mutate({ id: campaign.id, action: "pause" })}
                    >
                      {t("pause")}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CampaignFormDialog campaign={editing} open={dialogOpen} onOpenChange={setDialogOpen} />
    </MerchantPageShell>
  );
}
