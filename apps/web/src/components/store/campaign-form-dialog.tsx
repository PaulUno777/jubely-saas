"use client";

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
import { ApiResponseError, type Campaign } from "@jubely/api-schemas";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useTenantId } from "@/hooks/useTenantId";
import { createCampaign, updateCampaign } from "@/lib/tenant-admin";

type CampaignFormDialogProps = {
  campaign?: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CampaignFormDialog({ campaign, open, onOpenChange }: CampaignFormDialogProps) {
  const t = useTranslations("store.campaigns");
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const isEdit = Boolean(campaign);

  const [name, setName] = useState(campaign?.name ?? "");
  const [campaignType, setCampaignType] = useState(campaign?.campaign_type ?? "multiplier");
  const [startsAt, setStartsAt] = useState(
    campaign?.starts_at ? String(campaign.starts_at).slice(0, 10) : "",
  );
  const [endsAt, setEndsAt] = useState(
    campaign?.ends_at ? String(campaign.ends_at).slice(0, 10) : "",
  );

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        campaign_type: campaignType,
        starts_at: startsAt || undefined,
        ends_at: endsAt || undefined,
        targeting_json: campaign?.targeting_json ?? {},
        action_json: campaign?.action_json ?? {},
      };
      if (isEdit && campaign) {
        return updateCampaign(tenantId!, campaign.id, payload);
      }
      return createCampaign(tenantId!, payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "campaigns"] });
      toast.success(isEdit ? t("updated") : t("created"));
      onOpenChange(false);
    },
    onError: (e) =>
      toast.error(e instanceof ApiResponseError ? e.message : t("saveError")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={campaign?.id ?? "new"}>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("createTitle")}</DialogTitle>
          <DialogDescription>{t("createDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="campaign-name">{t("name")}</Label>
            <Input id="campaign-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="campaign-type">{t("type")}</Label>
            <Input
              id="campaign-type"
              value={campaignType}
              onChange={(e) => setCampaignType(e.target.value)}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="campaign-start">{t("startsAt")}</Label>
              <Input
                id="campaign-start"
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="campaign-end">{t("endsAt")}</Label>
              <Input
                id="campaign-end"
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>
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
