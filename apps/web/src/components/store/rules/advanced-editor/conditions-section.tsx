"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import { SortableCondition } from "@/components/store/rules/advanced-editor/sortable-condition";
import { zoneFocusClass } from "@/components/store/rules/shared/zone-theme";
import type { AdvancedRuleDraft } from "@/stores/rule-editor-store";

export function ConditionsSection({
  draft,
  condIds,
  isFocused,
  onLogic,
  onUpdate,
  onRemove,
}: {
  draft: AdvancedRuleDraft;
  condIds: string[];
  isFocused: boolean;
  onLogic: (l: "AND" | "OR") => void;
  onUpdate: (index: number, patch: Partial<AdvancedRuleDraft["conditions"][number]>) => void;
  onRemove: (index: number) => void;
}) {
  const t = useTranslations("store.pointsRules");

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-violet-700/80">{t("sectionIf")}</p>
      <div className={zoneFocusClass("conditions", isFocused)}>
        <div className="p-3">
          <SortableContext items={condIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {draft.conditions.map((cond, i) => (
                <SortableCondition
                  key={condIds[i]}
                  id={condIds[i]!}
                  index={i}
                  cond={cond}
                  logic={draft.logic}
                  onLogic={onLogic}
                  onUpdate={(patch) => onUpdate(i, patch)}
                  onRemove={() => onRemove(i)}
                />
              ))}
            </div>
          </SortableContext>
          {draft.conditions.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">{t("addConditionHint")}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
