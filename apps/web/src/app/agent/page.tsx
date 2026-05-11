"use client";

import { useTranslations } from "next-intl";

export default function AgentHome() {
  const t = useTranslations("agent.home");

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-border bg-growth-surface px-5 py-6">
        <h1 className="font-display text-3xl font-normal tracking-tight text-growth-foreground">{t("title")}</h1>
      </section>
      <a className="text-sm font-medium text-primary underline underline-offset-4" href="/agent/customers">
        {t("createCustomer")}
      </a>
    </div>
  );
}
