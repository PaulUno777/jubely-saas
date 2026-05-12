"use client";

import { useTranslations } from "next-intl";
import { StorePlaceholderPage } from "@/components/store/store-placeholder-page";

export default function StoreSettingsPage() {
  const t = useTranslations("store.settings");

  return <StorePlaceholderPage title={t("title")} subtitle={t("subtitle")} />;
}
