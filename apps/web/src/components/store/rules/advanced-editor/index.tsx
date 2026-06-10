"use client";

import { useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { useMutation } from "@tanstack/react-query";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
} from "@jubely/ui";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ActionsSection } from "@/components/store/rules/advanced-editor/actions-section";
import { ConditionsSection } from "@/components/store/rules/advanced-editor/conditions-section";
import { EditorFooter } from "@/components/store/rules/advanced-editor/editor-footer";
import { useEditorZoneFocus } from "@/components/store/rules/advanced-editor/hooks/use-editor-zone-focus";
import { useSortableEditor } from "@/components/store/rules/advanced-editor/hooks/use-sortable-editor";
import { NaturalLanguagePreview } from "@/components/store/rules/advanced-editor/natural-language-preview";
import { PaletteSidebar } from "@/components/store/rules/advanced-editor/palette-sidebar";
import { TriggerSection } from "@/components/store/rules/advanced-editor/trigger-section";
import { defaultAction, defaultCondition } from "@/components/store/rules/shared/rule-defaults";
import { SimulatorPanel } from "@/components/store/rules/simulator-panel";
import { simulateRules } from "@/lib/tenant-admin";
import { useTenantId } from "@/hooks/useTenantId";
import {
  advancedDraftToRule,
  useRuleEditorStore,
  type AdvancedRuleDraft,
} from "@/stores/rule-editor-store";

export function AdvancedEditor() {
  const t = useTranslations("store.pointsRules");
  const tenantId = useTenantId();
  const draft = useRuleEditorStore((s) => s.draft) as AdvancedRuleDraft;
  const patchDraft = useRuleEditorStore((s) => s.patchDraft);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [showTest, setShowTest] = useState(false);

  const { focusedZone, focusZone, clearZoneFocus } = useEditorZoneFocus();
  const { condIds, actIds, sensors, handleDragEnd } = useSortableEditor(draft, patchDraft);

  const simMut = useMutation({
    mutationFn: () =>
      simulateRules(tenantId!, {
        amount_fcfa: 5000,
        tier: "gold",
        draft_rules: [advancedDraftToRule(draft)],
      }),
  });

  const addCondition = (type: string) =>
    patchDraft({ conditions: [...draft.conditions, defaultCondition(type)] });

  const addAction = (type: string) =>
    patchDraft({ actions: [...draft.actions, defaultAction(type)] });

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <span>{t("paletteHint")}</span>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setJsonOpen(true)}>
            {"{ }"} {t("viewJson")}
          </Button>
        </div>
      </div>

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

            {showTest ? (
              <div className="rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold">{t("testWithData")}</p>
                  <Button type="button" size="icon" variant="ghost" className="size-8" onClick={() => setShowTest(false)}>
                    <X className="size-4" />
                  </Button>
                </div>
                <SimulatorPanel fallbackDefault={false} draftRules={[advancedDraftToRule(draft)]} />
              </div>
            ) : null}
          </div>
        </div>
      </DndContext>

      <EditorFooter
        conditionsCount={draft.conditions.length}
        actionsCount={draft.actions.length}
        onToggleTest={() => setShowTest((s) => !s)}
        onQuickSimulate={() => simMut.mutate()}
        quickSimPending={simMut.isPending}
        simulateResult={
          simMut.data ? t("simulateResult", { total: String(simMut.data.total) }) : undefined
        }
      />

      <Dialog open={jsonOpen} onOpenChange={setJsonOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("viewJson")}</DialogTitle>
          </DialogHeader>
          <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">
            {JSON.stringify(advancedDraftToRule(draft), null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
