"use client";

import { useTranslations } from "next-intl";
import { StorePlaceholderPage } from "@/components/store/store-placeholder-page";

export default function StorePointsRulesPage() {
  const t = useTranslations("store.pointsRules");

  return <StorePlaceholderPage title={t("title")} subtitle={t("subtitle")} />;
}
