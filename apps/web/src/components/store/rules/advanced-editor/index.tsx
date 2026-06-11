"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import { Card, Input } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { ActionsSection } from "@/components/store/rules/advanced-editor/actions-section";
import { ConditionsSection } from "@/components/store/rules/advanced-editor/conditions-section";
import { useEditorZoneFocus } from "@/components/store/rules/advanced-editor/hooks/use-editor-zone-focus";
import { useSortableEditor } from "@/components/store/rules/advanced-editor/hooks/use-sortable-editor";
import { NaturalLanguagePreview } from "@/components/store/rules/advanced-editor/natural-language-preview";
import { PaletteSidebar } from "@/components/store/rules/advanced-editor/palette-sidebar";
import { TriggerSection } from "@/components/store/rules/advanced-editor/trigger-section";
import { defaultAction, defaultCondition } from "@/components/store/rules/shared/rule-defaults";
import { RuleEditorCardHeader } from "@/components/store/rules/rule-editor-card-header";
import { RuleEditorFooter } from "@/components/store/rules/rule-editor-footer";
import {
  useRuleEditorStore,
  type AdvancedRuleDraft,
} from "@/stores/rule-editor-store";

export function AdvancedEditor() {
  const t = useTranslations("store.pointsRules");
  const draft = useRuleEditorStore((s) => s.draft) as AdvancedRuleDraft;
  const patchDraft = useRuleEditorStore((s) => s.patchDraft);

  const { focusedZone, focusZone, clearZoneFocus } = useEditorZoneFocus();
  const { condIds, actIds, sensors, handleDragEnd } = useSortableEditor(draft, patchDraft);

  const addCondition = (type: string) =>
    patchDraft({ conditions: [...draft.conditions, defaultCondition(type)] });

  const addAction = (type: string) =>
    patchDraft({ actions: [...draft.actions, defaultAction(type)] });

  return (
    <Card className="overflow-hidden p-0">
      <RuleEditorCardHeader />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid min-h-[560px] md:grid-cols-[auto_1fr]">
          <PaletteSidebar
            draft={draft}
            onAddTrigger={(type) => patchDraft({ trigger: type as AdvancedRuleDraft["trigger"] })}
            onAddCondition={addCondition}
            onAddAction={addAction}
            onFocusZone={focusZone}
            onClearZoneFocus={clearZoneFocus}
          />

          <div className="space-y-4 p-4 md:p-5">
            <Input
              value={draft.name}
              onChange={(e) => patchDraft({ name: e.target.value })}
              className="text-base font-semibold"
              placeholder={t("name")}
              required
            />

            <TriggerSection draft={draft} isFocused={focusedZone === "triggers"} />

            <ConditionsSection
              draft={draft}
              condIds={condIds}
              isFocused={focusedZone === "conditions"}
              onLogic={(logic) => patchDraft({ logic })}
              onUpdate={(i, patch) =>
                patchDraft({
                  conditions: draft.conditions.map((c, j) => (j === i ? { ...c, ...patch } : c)),
                })
              }
              onRemove={(i) => patchDraft({ conditions: draft.conditions.filter((_, j) => j !== i) })}
            />

            <ActionsSection
              draft={draft}
              actIds={actIds}
              isFocused={focusedZone === "actions"}
              onUpdate={(i, patch) =>
                patchDraft({
                  actions: draft.actions.map((a, j) => (j === i ? { ...a, ...patch } : a)),
                })
              }
              onRemove={(i) => patchDraft({ actions: draft.actions.filter((_, j) => j !== i) })}
            />

            <NaturalLanguagePreview draft={draft} />
          </div>
        </div>
      </DndContext>

      <RuleEditorFooter conditionsCount={draft.conditions.length} actionsCount={draft.actions.length} />
    </Card>
  );
}
