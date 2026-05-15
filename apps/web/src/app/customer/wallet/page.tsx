"use client";

import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { clearCustomerQr, loadCustomerQr, subscribeCustomerQr } from "@/lib/customerSession";

export default function CustomerWalletPage() {
  const t = useTranslations("customer.wallet");
  const token = useSyncExternalStore(subscribeCustomerQr, loadCustomerQr, () => null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("hint")}</p>
      </div>
      {!token ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="inline-block rounded-lg border border-border bg-background p-3">
            <QRCodeCanvas value={token} size={200} />
          </div>
          <Button type="button" variant="outline" onClick={() => clearCustomerQr()}>
            {t("clear")}
          </Button>
        </div>
      )}
    </div>
  );
}
