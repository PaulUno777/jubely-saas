"use client";

import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { clearCustomerQr, loadCustomerQr, subscribeCustomerQr } from "@/lib/customerSession";

export default function CustomerQrPage() {
  const t = useTranslations("customer.qr");
  const qr = useSyncExternalStore(subscribeCustomerQr, loadCustomerQr, () => null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("hint")}</p>
      </div>

      {!qr ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/customer/enroll">{t("enrollCta")}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="inline-block rounded-lg border border-border bg-background p-3">
            <QRCodeCanvas value={qr} size={240} />
          </div>
          <p className="font-mono text-xs break-all text-muted-foreground">{qr}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(qr);
                toast.success(t("copied"));
              }}
            >
              {t("copy")}
            </Button>
            <Button asChild variant="secondary">
              <Link href="/customer/wallet">{t("walletLink")}</Link>
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                clearCustomerQr();
                toast.message(t("clear"));
              }}
            >
              {t("clear")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
