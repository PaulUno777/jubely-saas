"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import type { TierCode } from "@/components/store/rules/shared/constants";

export function useTierLabels() {
  const t = useTranslations("store.home.panels.tierNames");

  const tierLabel = useCallback(
    (code: string) => {
      if (code === "bronze" || code === "silver" || code === "gold" || code === "platinum") {
        return t(code as TierCode);
      }
      return code;
    },
    [t],
  );

  return { tierLabel };
}
