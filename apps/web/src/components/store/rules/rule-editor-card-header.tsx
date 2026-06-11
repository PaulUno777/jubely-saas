"use client";

import { useState } from "react";
import { Badge, Button } from "@jubely/ui";
import { Lock, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useRuleEditorActions } from "@/components/store/rules/rule-editor-actions-context";
import { useRuleEditorStore } from "@/stores/rule-editor-store";

export function RuleEditorCardHeader() {
  const t = useTranslations("store.pointsRules");
  const draft = useRuleEditorStore((s) => s.draft);
  const { onCancel, isDirty } = useRuleEditorActions();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleCancel = () => {
    if (isDirty) {
      setConfirmOpen(true);
      return;
    }
    onCancel();
  };

  const isAdvanced = draft.editorTier === "advanced";
  const ruleTitle =
    draft.name || (isAdvanced ? t("newAdvancedRule") : t("newBasicRule"));

  return (
    <>
      <div className="flex items-center gap-3 border-b bg-muted/20 px-4 py-3">
        <Badge
          variant={isAdvanced ? "default" : "secondary"}
          className="shrink-0"
        >
          {isAdvanced ? (
            <span className="inline-flex items-center gap-1">
              <Zap className="size-3" />
              {t("advancedEditor")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3" />
              {t("basicEditor")}
            </span>
          )}
        </Badge>
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold">
          {ruleTitle}
        </h2>
        <Button
          className="shrink-0"
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCancel}
        >
          {t("editorCancel")}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("editorCancelConfirmTitle")}
        description={t("editorCancelConfirmBody")}
        confirmLabel={t("editorCancelConfirmAction")}
        cancelLabel={t("editorCancel")}
        variant="destructive"
        onConfirm={onCancel}
      />
    </>
  );
}
