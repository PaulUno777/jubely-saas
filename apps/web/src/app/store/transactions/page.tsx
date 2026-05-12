"use client";

import { useTranslations } from "next-intl";
import { StorePlaceholderPage } from "@/components/store/store-placeholder-page";

export default function StoreTransactionsPage() {
  const t = useTranslations("store.transactions");

  return <StorePlaceholderPage title={t("title")} subtitle={t("subtitle")} />;
}
