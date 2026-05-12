"use client";

import { useTranslations } from "next-intl";
import { StorePlaceholderPage } from "@/components/store/store-placeholder-page";

export default function StoreRewardsPage() {
  const t = useTranslations("store.rewards");

  return <StorePlaceholderPage title={t("title")} subtitle={t("subtitle")} />;
}
