"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ApiResponseError } from "@jubely/api-schemas";
import { MerchantPageShell } from "@/components/store/merchant-page-shell";
import { AdvancedEditor } from "@/components/store/rules/advanced-editor";
import { BasicEditor } from "@/components/store/rules/basic-editor";
import { RuleEditorActionsProvider } from "@/components/store/rules/rule-editor-actions-context";
import { RuleVersionHistory } from "@/components/store/rules/rule-version-history";
import { useCollapseSidebarForEditor } from "@/hooks/useCollapseSidebarForEditor";
import { useMerchantLocationScope } from "@/hooks/useMerchantLocationScope";
import { createRule, patchRule } from "@/lib/tenant-admin";
import { useTenantId } from "@/hooks/useTenantId";
import { draftToApiRule, useRuleEditorStore } from "@/stores/rule-editor-store";

export function RuleEditorShell({
  ruleId,
  onBack,
}: {
  ruleId?: string;
  onBack: () => void;
}) {
  const t = useTranslations("store.pointsRules");
  const { headerContext } = useMerchantLocationScope();
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const mode = useRuleEditorStore((s) => s.mode);
  const draft = useRuleEditorStore((s) => s.draft);
  const isDirty = useRuleEditorStore((s) => s.isDirty);
  const markSaved = useRuleEditorStore((s) => s.markSaved);

  useCollapseSidebarForEditor();

  const saveMut = useMutation({
    mutationFn: async () => {
      const rule = draftToApiRule(draft);
      if (mode === "edit" && ruleId) {
        return patchRule(tenantId!, ruleId, { rule, summary: "Mise à jour" });
      }
      return createRule(tenantId!, { rule, active: true, summary: "Création" });
    },
    onSuccess: () => {
      markSaved();
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "rules"] });
      void qc.invalidateQueries({ queryKey: ["tenant-admin", "rules-health"] });
      toast.success(mode === "edit" ? t("ruleSaved") : t("ruleCreated"));
      onBack();
    },
    onError: (e) =>
      toast.error(e instanceof ApiResponseError ? e.message : t("ruleSaveError")),
  });

  return (
    <MerchantPageShell title={t("editorTitle")} context={headerContext} className="space-y-6">
      <RuleEditorActionsProvider
        value={{
          onCancel: onBack,
          onSave: () => saveMut.mutate(),
          savePending: saveMut.isPending,
          mode,
          isDirty,
          excludeRuleId: ruleId,
        }}
      >
        {draft.editorTier === "advanced" ? <AdvancedEditor /> : <BasicEditor />}
      </RuleEditorActionsProvider>

      {ruleId ? <RuleVersionHistory ruleId={ruleId} /> : null}
    </MerchantPageShell>
  );
}
