"use client";

import { useTranslations } from "next-intl";
import { useFormatNaturalLanguage } from "@/components/store/rules/advanced-editor/hooks/use-format-natural-language";
import type { AdvancedRuleDraft } from "@/stores/rule-editor-store";

export function NaturalLanguagePreview({ draft }: { draft: AdvancedRuleDraft }) {
  const t = useTranslations("store.pointsRules");
  const sentence = useFormatNaturalLanguage(draft);

  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {t("naturalLanguageLabel")}
      </p>
      <p className="text-sm leading-relaxed">{sentence}</p>
    </div>
  );
}
