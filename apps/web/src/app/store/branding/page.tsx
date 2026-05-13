"use client";

import { useTranslations } from "next-intl";
import { StorePlaceholderPage } from "@/components/store/store-placeholder-page";

export default function StoreBrandingPage() {
  const t = useTranslations("store.branding");

  return <StorePlaceholderPage title={t("title")} subtitle={t("subtitle")} />;
}
