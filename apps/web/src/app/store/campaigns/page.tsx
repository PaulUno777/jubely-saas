"use client";

import { useTranslations } from "next-intl";
import { StorePlaceholderPage } from "@/components/store/store-placeholder-page";

export default function StoreCampaignsPage() {
  const t = useTranslations("store.campaigns");

  return <StorePlaceholderPage title={t("title")} subtitle={t("subtitle")} />;
}
