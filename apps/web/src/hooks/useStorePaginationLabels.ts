"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

export function useStorePaginationLabels() {
  const t = useTranslations("store.pagination");

  return useMemo(
    () => ({
      rowsPerPage: t("rowsPerPage"),
      previous: t("previous"),
      next: t("next"),
      range: (from: number, to: number, total: number) =>
        t("range", { from: String(from), to: String(to), total: String(total) }),
    }),
    [t],
  );
}
