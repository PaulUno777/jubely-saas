"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { MfaEnrollBanner } from "@/components/root/mfa-enroll-banner";
import { useSession } from "@/hooks/useSession";

export default function StoreHome() {
  const t = useTranslations("store.home");
  const { session } = useSession();
  const token = session?.accessToken;

  return (
    <>
      <Header fixed>
        <h1 className="text-base font-semibold">{t("title")}</h1>
      </Header>
      <Main className="space-y-4">
        {token ? <MfaEnrollBanner accessToken={token} /> : null}
        <section className="rounded-2xl border border-border bg-growth-surface px-5 py-6">
          <h2 className="font-display text-2xl font-normal tracking-tight text-growth-foreground">{t("title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </section>
      </Main>
    </>
  );
}
