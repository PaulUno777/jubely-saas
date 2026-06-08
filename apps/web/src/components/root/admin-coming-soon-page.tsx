"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";

export type AdminComingSoonSlug =
  | "revenue"
  | "users"
  | "subscriptions"
  | "plans"
  | "integrations"
  | "system"
  | "audit";

export function AdminComingSoonPage({ slug }: { slug: AdminComingSoonSlug }) {
  const t = useTranslations("admin.comingSoonPages");
  const title = t(`${slug}.title` as never);
  const subtitle = t(`${slug}.subtitle` as never);

  return (
    <>
      <Header fixed>
        <div className="flex min-w-0 flex-1 items-center">
          <h1 className="truncate text-base font-semibold">{title}</h1>
        </div>
      </Header>
      <Main>
        <section className="rounded-2xl border border-border bg-card px-5 py-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("badge")}</p>
          <h2 className="mt-2 font-display text-2xl font-normal tracking-tight text-foreground">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </section>
      </Main>
    </>
  );
}
