"use client";

import { useTranslations } from "next-intl";

export default function CustomerHome() {
  const t = useTranslations("customer.home");

  return (
    <div className="flex flex-col gap-4">
      <section className="surface-human rounded-2xl border border-human/30 px-5 py-6">
        <h1 className="font-display text-3xl font-normal tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-sm text-human-foreground/80">{t("welcome")}</p>
      </section>
      <div className="flex flex-wrap gap-3 px-1">
        <a className="text-sm font-medium text-primary underline underline-offset-4" href="/customer/enroll">
          {t("enroll")}
        </a>
        <a className="text-sm font-medium text-primary underline underline-offset-4" href="/customer/qr">
          {t("myQr")}
        </a>
        <a className="text-sm font-medium text-primary underline underline-offset-4" href="/customer/wallet">
          {t("wallet")}
        </a>
      </div>
    </div>
  );
}
