"use client";

import { Badge, Button } from "@jubely/ui";
import {
  MerchantCard,
  MerchantCardContent,
  MerchantCardDescription,
  MerchantCardHeader,
  MerchantCardTitle,
} from "@/components/store/merchant-card";
import { Copy, Plus } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTenantRules } from "@/hooks/tenant-admin-hooks";
import { useTenantQRToken } from "@/hooks/tenant-admin-hooks";
import { useTenantSettings } from "@/hooks/useTenantSettings";

export function MerchantDashboardQrPanel() {
  const t = useTranslations("store.home.qr");
  const [copied, setCopied] = useState(false);

  const tenantQ = useTenantSettings();
  const qrQ = useTenantQRToken();

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined" || !tenantQ.data?.slug) return "";
    return `${window.location.origin}/join/${tenantQ.data.slug}`;
  }, [tenantQ.data?.slug]);

  const token = qrQ.data?.store_qr ?? "";
  const loading = tenantQ.isLoading || qrQ.isLoading;

  const onCopy = async () => {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <MerchantCard>
      <MerchantCardHeader className="pb-3">
        <MerchantCardTitle className="text-base">{t("title")}</MerchantCardTitle>
        <MerchantCardDescription>{t("subtitle")}</MerchantCardDescription>
      </MerchantCardHeader>
      <MerchantCardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : (
          <div className="flex gap-4">
            <div className="shrink-0 rounded-xl border border-border bg-background p-2">
              {token ? <QRCodeCanvas value={token} size={88} /> : null}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="truncate text-sm font-semibold text-foreground">
                {tenantQ.data?.name ?? "—"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{joinUrl || "—"}</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => void onCopy()}>
                  <Copy className="size-3.5" />
                  {copied ? t("copied") : t("copyLink")}
                </Button>
                <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                  <Link href="/store/enrollment-qr">{t("openPage")}</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </MerchantCardContent>
    </MerchantCard>
  );
}

export function MerchantDashboardRulesPanel() {
  const t = useTranslations("store.home.rules");
  const rulesQ = useTenantRules();

  const rules = (rulesQ.data ?? []).slice(0, 3);

  return (
    <MerchantCard>
      <MerchantCardHeader className="flex flex-row items-start gap-2 space-y-0 pb-3">
        <div className="min-w-0 flex-1 space-y-1">
          <MerchantCardTitle className="text-base">{t("title")}</MerchantCardTitle>
          <MerchantCardDescription>{t("subtitle")}</MerchantCardDescription>
        </div>
        <Button asChild variant="secondary" size="sm" className="size-8 shrink-0 p-0">
          <Link href="/store/points-rules" aria-label={t("manage")}>
            <Plus className="size-4" />
          </Link>
        </Button>
      </MerchantCardHeader>
      <MerchantCardContent className="space-y-2">
        {rulesQ.isLoading ? (
          <p className="text-sm text-muted-foreground">…</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          rules.map((record, index) => (
            <div
              key={record.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2.5"
            >
              <span className="jb-numeric w-5 shrink-0 text-center text-xs text-muted-foreground">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{record.rule.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {record.rule.tag ?? record.rule.trigger}
                </p>
              </div>
              <Badge variant={record.active ? "default" : "secondary"} className="shrink-0 text-[10px]">
                {record.active ? t("active") : t("inactive")}
              </Badge>
            </div>
          ))
        )}
        {rules.length > 0 ? (
          <Button asChild variant="link" size="sm" className="h-auto px-0 text-xs">
            <Link href="/store/points-rules">{t("manage")}</Link>
          </Button>
        ) : null}
      </MerchantCardContent>
    </MerchantCard>
  );
}

export function MerchantDashboardActivityFeed() {
  const t = useTranslations("store.home.feed");

  return (
    <MerchantCard>
      <MerchantCardHeader className="flex flex-row items-start gap-2 space-y-0 pb-3">
        <div className="min-w-0 flex-1 space-y-1">
          <MerchantCardTitle className="text-base">{t("title")}</MerchantCardTitle>
          <MerchantCardDescription>{t("subtitle")}</MerchantCardDescription>
        </div>
        <Badge variant="outline" className="shrink-0 gap-1.5 border-growth/30 text-growth">
          <span className="size-1.5 rounded-full bg-growth" />
          {t("live")}
        </Badge>
      </MerchantCardHeader>
      <MerchantCardContent>
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      </MerchantCardContent>
    </MerchantCard>
  );
}
