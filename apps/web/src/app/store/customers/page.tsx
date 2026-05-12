"use client";

import { useTranslations } from "next-intl";
import { StorePlaceholderPage } from "@/components/store/store-placeholder-page";

export default function StoreCustomersPage() {
  const t = useTranslations("store.customers");

  return <StorePlaceholderPage title={t("title")} subtitle={t("subtitle")} />;
}
