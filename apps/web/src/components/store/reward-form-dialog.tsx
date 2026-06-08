"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@jubely/ui";
import { ApiResponseError } from "@jubely/api-schemas";
import type { z } from "zod";
import { storeRewardSchema } from "@jubely/api-schemas";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useTenantId } from "@/hooks/useTenantId";
import { createReward, patchReward, uploadRewardImage } from "@/lib/tenant-admin";

type RewardRow = z.infer<typeof storeRewardSchema> & {
  image_url?: string;
};

type RewardFormDialogProps = {
  reward?: RewardRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RewardFormDialog({ reward, open, onOpenChange }: RewardFormDialogProps) {
  const t = useTranslations("store.rewards");
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(reward);

  const [name, setName] = useState(reward?.name ?? "");
  const [description, setDescription] = useState(reward?.description ?? "");
  const [pointCost, setPointCost] = useState(String(reward?.point_cost ?? 100));
  const [minTier, setMinTier] = useState(reward?.min_tier ?? "bronze");
  const [active, setActive] = useState(reward?.active ?? true);

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        point_cost: parseInt(pointCost, 10) || 0,
        min_tier: minTier,
        active,
      };
      if (isEdit && reward) {
        return patchReward(tenantId!, reward.id, payload);
      }
      return createReward(tenantId!, payload);
    },
    onSuccess: async (saved) => {
      const file = fileRef.current?.files?.[0];
      if (file && saved?.id) {
        await uploadRewardImage(tenantId!, saved.id, file);
      }
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "rewards"] });
      toast.success(isEdit ? t("updated") : t("created"));
      onOpenChange(false);
    },
    onError: (e) =>
      toast.error(e instanceof ApiResponseError ? e.message : t("saveError")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("addTitle")}</DialogTitle>
          <DialogDescription>{t("addDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
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
            <Label htmlFor="reward-tier">{t("tier")}</Label>
            <Input id="reward-tier" value={minTier} onChange={(e) => setMinTier(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reward-desc">{t("description")}</Label>
            <Input id="reward-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reward-image">{t("image")}</Label>
            <Input id="reward-image" ref={fileRef} type="file" accept="image/*" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            {t("active")}
          </label>
        </div>
        <DialogFooter>
          <Button
            type="button"
            disabled={!name.trim() || saveMut.isPending}
            onClick={() => saveMut.mutate()}
          >
            {isEdit ? t("save") : t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
