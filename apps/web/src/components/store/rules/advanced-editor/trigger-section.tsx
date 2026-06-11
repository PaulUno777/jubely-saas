"use client";

import { useTranslations } from "next-intl";
import { TRIGGER_ICON, ZoneIcon } from "@/components/store/rules/advanced-editor/icons";
import { PALETTE_TRIGGERS } from "@/components/store/rules/shared/constants";
import { zoneFocusClass, zoneSectionHeadingClass } from "@/components/store/rules/shared/zone-theme";
import type { AdvancedRuleDraft } from "@/stores/rule-editor-store";

export function TriggerSection({
  draft,
  isFocused,
}: {
  draft: AdvancedRuleDraft;
  isFocused: boolean;
}) {
  const t = useTranslations("store.pointsRules");
  const triggerMeta = PALETTE_TRIGGERS.find((tr) => tr.type === draft.trigger) ?? PALETTE_TRIGGERS[0]!;

  return (
    <div>
      <p className={zoneSectionHeadingClass("triggers")}>{t("paletteTriggers")}</p>
      <div className={zoneFocusClass("triggers", isFocused)}>
        <div className="flex items-center gap-3 p-4">
          <ZoneIcon zone="triggers">{TRIGGER_ICON[draft.trigger]}</ZoneIcon>
          <div>
            <p className="text-sm font-semibold">
              {t("triggerLabel")} — {t(triggerMeta.labelKey as "palette.transaction.label")}
            </p>
            <p className="text-xs text-emerald-800/80">
              {draft.trigger === "transaction"
                ? t("triggerTransactionHint")
                : t(triggerMeta.subKey as "palette.transaction.sub")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
