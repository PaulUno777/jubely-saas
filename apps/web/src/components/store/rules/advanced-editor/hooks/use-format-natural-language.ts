"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { AdvancedRuleDraft } from "@/stores/rule-editor-store";
import { useWeekdayLabels } from "@/components/store/rules/advanced-editor/hooks/use-weekday-labels";
import { useTierLabels } from "@/components/store/rules/advanced-editor/hooks/use-tier-labels";

export function useFormatNaturalLanguage(draft: AdvancedRuleDraft): string {
  const t = useTranslations("store.pointsRules.naturalLanguage");
  const weekdays = useWeekdayLabels();
  const { tierLabel } = useTierLabels();

  return useMemo(() => {
    const triggerKey = `trigger.${draft.trigger}` as "trigger.transaction";
    const triggerLabel = t(triggerKey);
    const logicSep = draft.logic === "AND" ? t("logicAnd") : t("logicOr");

    const condParts = draft.conditions.map((c) => {
      if (c.type === "amount") {
        const opKey = c.op === "<=" ? "opLte" : c.op === "=" ? "opEq" : "opGte";
        return t("condAmount", { op: t(opKey), value: String((c.value ?? 0).toLocaleString()) });
      }
      if (c.type === "weekday") {
        const days = (c.days ?? []).map((d) => weekdays[d] ?? String(d)).join(", ");
        return t("condWeekday", { days });
      }
      if (c.type === "hours") {
        return t("condHours", { from: String(c.from ?? 0), to: String(c.to ?? 0) });
      }
      if (c.type === "tier") {
        const tiers = (c.tiers ?? []).map(tierLabel).join(t("tierOr"));
        return t("condTier", { tiers });
      }
      if (c.type === "visits") {
        return t("condVisits", { value: String(c.value ?? 0) });
      }
      if (c.type === "store") {
        const storeKey = c.store === "hq" ? "storeHq" : "storeAll";
        return t("condStore", { store: t(storeKey) });
      }
      return c.type;
    });

    const actParts = draft.actions.map((a) => {
      if (a.type === "mult") return t("actMult", { factor: String(a.factor ?? 2) });
      if (a.type === "flat") return t("actFlat", { pts: String(a.pts ?? 0) });
      if (a.type === "notify") {
        const viaKey =
          a.via === "Push" ? "notifyPush" : a.via === "Les deux" || a.via === "Both" ? "notifyBoth" : "notifySms";
        return t("actNotify", { via: t(viaKey) });
      }
      if (a.type === "reward") return t("actReward", { reward: a.reward ?? "—" });
      if (a.type === "tierup") return t("actTierup");
      return a.type;
    });

    const condText = condParts.join(logicSep) || "—";
    const actText = actParts.join(t("actionAnd")) || "—";
    return t("sentence", { trigger: triggerLabel, conditions: condText, actions: actText });
  }, [draft, t, weekdays, tierLabel]);
}
