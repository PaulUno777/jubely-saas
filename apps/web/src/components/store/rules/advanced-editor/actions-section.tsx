"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import { SortableAction } from "@/components/store/rules/advanced-editor/sortable-action";
import { zoneFocusClass, zoneSectionHeadingClass } from "@/components/store/rules/shared/zone-theme";
import type { AdvancedRuleDraft } from "@/stores/rule-editor-store";

export function ActionsSection({
  draft,
  actIds,
  isFocused,
  onUpdate,
  onRemove,
}: {
  draft: AdvancedRuleDraft;
  actIds: string[];
  isFocused: boolean;
  onUpdate: (index: number, patch: Partial<AdvancedRuleDraft["actions"][number]>) => void;
  onRemove: (index: number) => void;
}) {
  const t = useTranslations("store.pointsRules");

  return (
    <div>
      <p className={zoneSectionHeadingClass("actions")}>{t("sectionThen")}</p>
      <div className={zoneFocusClass("actions", isFocused)}>
        <div className="space-y-2 p-3">
          <SortableContext items={actIds} strategy={verticalListSortingStrategy}>
            {draft.actions.map((act, i) => (
              <SortableAction
                key={actIds[i]}
                id={actIds[i]!}
                act={act}
                onUpdate={(patch) => onUpdate(i, patch)}
                onRemove={() => onRemove(i)}
              />
            ))}
          </SortableContext>
          {draft.actions.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">{t("addActionHint")}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
