"use client";

import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

type QRPreviewPanelProps = {
  token: string;
  joinUrl: string;
  renderSvgUrl?: string;
  tenantName?: string;
};

export function QRPreviewPanel({ token, joinUrl, renderSvgUrl, tenantName }: QRPreviewPanelProps) {
  const t = useTranslations("store.enrollmentQr");
  const [copied, setCopied] = useState(false);

  const onCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="space-y-3">
        <div className="rounded-xl border border-border bg-background p-4 inline-block">
          {token ? <QRCodeCanvas value={token} size={200} /> : null}
        </div>
        {renderSvgUrl ? (
          <div className="rounded-xl border border-border bg-background p-2 max-w-[220px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={renderSvgUrl} alt={t("brandedPreview")} className="w-full" />
          </div>
        ) : null}
      </div>
      <div className="flex-1 space-y-4 min-w-0">
        {tenantName ? (
          <p className="text-lg font-semibold text-foreground">{tenantName}</p>
        ) : null}
        <div>
          <p className="text-sm font-medium mb-1">{t("joinLink")}</p>
          <p className="text-xs text-muted-foreground break-all">{joinUrl || "—"}</p>
          {joinUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => void onCopy(joinUrl)}
            >
              {copied ? t("copied") : t("copyJoin")}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
