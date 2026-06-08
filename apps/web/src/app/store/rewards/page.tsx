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
import { ApiResponseError } from "@jubely/api-schemas";
import { Gift, Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { z } from "zod";
import { storeRewardSchema } from "@jubely/api-schemas";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { RewardFormDialog } from "@/components/store/reward-form-dialog";
import { TierBadge } from "@/components/store/tier-badge";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { useTenantRewards } from "@/hooks/tenant-admin-hooks";
import { useTenantId } from "@/hooks/useTenantId";
import { patchReward } from "@/lib/tenant-admin";

type RewardRow = z.infer<typeof storeRewardSchema> & {
  image_url?: string;
};

export default function StoreRewardsPage() {
  const t = useTranslations("store.rewards");
  const { headerContext } = useMerchantLocationScope();
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RewardRow | null>(null);

  const q = useTenantRewards(false);
  const rewards = (q.data ?? []) as RewardRow[];
  const activeCount = rewards.filter((r) => r.active).length;

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      patchReward(tenantId!, id, { active }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "rewards"] });
    },
    onError: (e) =>
      toast.error(e instanceof ApiResponseError ? e.message : t("saveError")),
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (reward: RewardRow) => {
    setEditing(reward);
    setDialogOpen(true);
  };

  return (
    <MerchantPageShell title={t("title")} context={headerContext} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        <Button type="button" size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus size={14} />
          {t("create")}
        </Button>
      </div>

      <KpiTileStrip>
        <KpiTile label={t("kpiTotal")} value={rewards.length} tone="emerald" />
        <KpiTile label={t("kpiActive")} value={activeCount} tone="gold" />
      </KpiTileStrip>

      <div className="grid gap-4 md:grid-cols-2">
        {rewards.map((reward) => (
          <Card
            key={reward.id}
            className={reward.active ? "" : "opacity-60"}
          >
            <CardContent className="flex gap-4 p-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-[var(--g0,#FBF0D4)] text-[var(--g4,#6B4510)]">
                {reward.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={reward.image_url} alt="" className="size-12 rounded-[14px] object-cover" />
                ) : (
                  <Gift size={22} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-xl font-medium italic">{reward.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {reward.description || "—"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(reward)}>
                      <Pencil size={14} />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div>
                    <div className="font-mono text-base font-semibold text-[var(--reward,#C89B3C)]">
                      {reward.point_cost.toLocaleString()}
                    </div>
                    <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
                      {t("pointCost")}
                    </div>
                  </div>
                  <TierBadge code={reward.min_tier} />
                  <Badge variant={reward.active ? "default" : "secondary"}>
                    {reward.active ? t("active") : t("inactive")}
                  </Badge>
                  <label className="ml-auto flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={reward.active}
                      disabled={toggleMut.isPending}
                      onChange={(e) =>
                        toggleMut.mutate({ id: reward.id, active: e.target.checked })
                      }
                    />
                    {t("toggleActive")}
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <button
          type="button"
          onClick={openCreate}
          className="flex min-h-29 items-center justify-center rounded-2xl border border-dashed border-border bg-[var(--surface-2,#F5F0E8)] p-6 text-center transition-colors hover:bg-muted/50"
        >
          <div>
            <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-xl bg-background">
              <Plus size={20} />
            </div>
            <p className="text-sm font-semibold">{t("addCardTitle")}</p>
          </div>
        </button>
      </div>

      <RewardFormDialog
        reward={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </MerchantPageShell>
  );
}
