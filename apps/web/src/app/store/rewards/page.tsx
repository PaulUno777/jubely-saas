"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@jubely/ui";
import { ApiResponseError } from "@jubely/api-schemas";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MerchantDataTable } from "@/components/store/merchant-data-table";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { useTenantRewards } from "@/hooks/tenant-admin-hooks";
import { useTenantId } from "@/hooks/useTenantId";
import type { z } from "zod";
import { storeRewardSchema } from "@jubely/api-schemas";
import { createReward } from "@/lib/tenant-admin";

type RewardRow = z.infer<typeof storeRewardSchema> & {
  image_url?: string;
  icon_key?: string;
};

export default function StoreRewardsPage() {
  const t = useTranslations("store.rewards");
  const { headerContext } = useMerchantLocationScope();
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [pointCost, setPointCost] = useState("100");
  const [description, setDescription] = useState("");

  const q = useTenantRewards(false);

  const createMut = useMutation({
    mutationFn: () =>
      createReward(tenantId!, {
        name: name.trim(),
        description: description.trim(),
        point_cost: parseInt(pointCost, 10) || 0,
        active: true,
      }),
    onSuccess: () => {
      setName("");
      setDescription("");
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "rewards"] });
      toast.success(t("created"));
    },
    onError: (e) => toast.error(e instanceof ApiResponseError ? e.message : t("createError")),
  });

  const rewards = (q.data ?? []) as RewardRow[];

  return (
    <MerchantPageShell title={t("title")} context={headerContext} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("addTitle")}</CardTitle>
          <CardDescription>{t("addDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 max-w-md">
          <div className="grid gap-2">
            <Label htmlFor="reward-name">{t("name")}</Label>
            <Input id="reward-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reward-cost">{t("pointCost")}</Label>
            <Input
              id="reward-cost"
              type="number"
              min={1}
              value={pointCost}
              onChange={(e) => setPointCost(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reward-desc">{t("description")}</Label>
            <Input
              id="reward-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button
            type="button"
            disabled={!name.trim() || createMut.isPending}
            onClick={() => createMut.mutate()}
          >
            {t("create")}
          </Button>
        </CardContent>
      </Card>

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
                cell: (row) => (
                  <div className="flex items-center gap-2">
                    {row.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.image_url}
                        alt=""
                        className="size-8 rounded object-cover"
                      />
                    ) : null}
                    <span className="font-medium">{row.name}</span>
                  </div>
                ),
              },
              {
                key: "pointCost",
                header: t("pointCost"),
                cell: (row) => <span className="font-mono tabular-nums">{row.point_cost}</span>,
              },
              {
                key: "tier",
                header: t("tier"),
                cell: (row) => <Badge variant="outline">{row.min_tier}</Badge>,
              },
              {
                key: "status",
                header: t("status"),
                cell: (row) => (
                  <Badge variant={row.active ? "default" : "secondary"}>
                    {row.active ? t("active") : t("inactive")}
                  </Badge>
                ),
              },
            ]}
            rows={rewards}
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
