"use client";

import { createContext, useContext, type ReactNode } from "react";

export type RuleEditorActions = {
  onCancel: () => void;
  onSave: () => void;
  savePending: boolean;
  mode: "create" | "edit";
  isDirty: boolean;
  excludeRuleId?: string;
};

const RuleEditorActionsContext = createContext<RuleEditorActions | null>(null);

export function RuleEditorActionsProvider({
  value,
  children,
}: {
  value: RuleEditorActions;
  children: ReactNode;
}) {
  return <RuleEditorActionsContext.Provider value={value}>{children}</RuleEditorActionsContext.Provider>;
}

export function useRuleEditorActions() {
  const ctx = useContext(RuleEditorActionsContext);
  if (!ctx) {
    throw new Error("useRuleEditorActions must be used within RuleEditorActionsProvider");
  }
  return ctx;
}
