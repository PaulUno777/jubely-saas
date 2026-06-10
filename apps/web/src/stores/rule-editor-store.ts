"use client";

import { create } from "zustand";

export type BasicRuleDraft = {
  schemaVersion: 1;
  editorTier: "basic";
  id: string;
  name: string;
  on: boolean;
  trigger: "transaction" | "enroll" | "birthday";
  tag: string;
  ruleType: "base" | "mult" | "bonus";
  days: number[];
  tier: string;
  minAmount: number;
  per: number;
  pts: number;
  factor: number;
  bonusPts: number;
  bonusTrigger: string;
  hourFrom: number;
  hourTo: number;
};

export type AdvancedRuleDraft = {
  schemaVersion: 2;
  editorTier: "advanced";
  id: string;
  name: string;
  on: boolean;
  trigger: "transaction" | "enroll" | "birthday";
  tag: string;
  logic: "AND" | "OR";
  conditions: Array<{
    type: string;
    op?: string;
    value?: number;
    days?: number[];
    from?: number;
    to?: number;
    tiers?: string[];
    store?: string;
  }>;
  actions: Array<{ type: string; factor?: number; pts?: number; via?: string; reward?: string }>;
};

export type RuleDraft = BasicRuleDraft | AdvancedRuleDraft;

function defaultBasicDraft(): BasicRuleDraft {
  return {
    schemaVersion: 1,
    editorTier: "basic",
    id: crypto.randomUUID(),
    name: "",
    on: true,
    trigger: "transaction",
    tag: "Base",
    ruleType: "base",
    days: [0, 1, 2, 3, 4, 5, 6],
    tier: "all",
    minAmount: 0,
    per: 100,
    pts: 1,
    factor: 2,
    bonusPts: 200,
    bonusTrigger: "enroll",
    hourFrom: 17,
    hourTo: 19,
  };
}

function defaultAdvancedDraft(): AdvancedRuleDraft {
  return {
    schemaVersion: 2,
    editorTier: "advanced",
    id: crypto.randomUUID(),
    name: "",
    on: true,
    trigger: "transaction",
    tag: "Avancé",
    logic: "AND",
    conditions: [
      { type: "amount", op: ">=", value: 2000 },
      { type: "weekday", days: [5, 6] },
    ],
    actions: [{ type: "mult", factor: 2 }],
  };
}

type RuleEditorState = {
  mode: "create" | "edit";
  ruleId?: string;
  draft: RuleDraft;
  baseline: RuleDraft;
  isDirty: boolean;
  initCreate: (tier: "basic" | "advanced") => void;
  initFromServer: (draft: RuleDraft, ruleId: string) => void;
  patchDraft: (patch: Partial<RuleDraft>) => void;
  reset: () => void;
  markSaved: () => void;
};

export const useRuleEditorStore = create<RuleEditorState>((set, get) => ({
  mode: "create",
  draft: defaultBasicDraft(),
  baseline: defaultBasicDraft(),
  isDirty: false,
  initCreate: (tier) => {
    const draft = tier === "advanced" ? defaultAdvancedDraft() : defaultBasicDraft();
    set({ mode: "create", ruleId: undefined, draft, baseline: structuredClone(draft), isDirty: false });
  },
  initFromServer: (draft, ruleId) => {
    set({ mode: "edit", ruleId, draft, baseline: structuredClone(draft), isDirty: false });
  },
  patchDraft: (patch) => {
    const next = { ...get().draft, ...patch } as RuleDraft;
    set({ draft: next, isDirty: true });
  },
  reset: () => {
    const { baseline } = get();
    set({ draft: structuredClone(baseline), isDirty: false });
  },
  markSaved: () => {
    const { draft } = get();
    set({ baseline: structuredClone(draft), isDirty: false });
  },
}));

export function basicDraftToRule(draft: BasicRuleDraft) {
  const action =
    draft.ruleType === "mult"
      ? { type: "mult" as const, factor: draft.factor }
      : draft.ruleType === "bonus"
        ? { type: "flat" as const, pts: draft.bonusPts }
        : { type: "rate" as const, per: draft.per, pts: draft.pts };
  const trigger =
    draft.ruleType === "bonus" && draft.bonusTrigger === "enroll" ? "enroll" : draft.trigger;
  const tag =
    draft.ruleType === "mult" ? "Multiplicateur" : draft.ruleType === "bonus" ? "Bonus" : "Base";
  const hours =
    draft.ruleType === "mult" ? [draft.hourFrom, draft.hourTo] : null;
  return {
    id: draft.id,
    name: draft.name,
    tag,
    on: draft.on,
    trigger,
    schemaVersion: 1,
    editorTier: "basic" as const,
    cond: {
      days: draft.days,
      hours: hours ?? undefined,
      tier: draft.tier,
      minAmount: draft.minAmount,
    },
    action,
  };
}

export function advancedDraftToRule(draft: AdvancedRuleDraft) {
  return {
    id: draft.id,
    name: draft.name,
    tag: "Avancé",
    on: draft.on,
    trigger: draft.trigger,
    schemaVersion: 2,
    editorTier: "advanced" as const,
    logic: draft.logic,
    conditions: draft.conditions,
    actions: draft.actions,
    cond: { days: [0, 1, 2, 3, 4, 5, 6], tier: "all" },
    action: { type: "rate" as const, per: 100, pts: 0 },
  };
}

export function draftToApiRule(draft: RuleDraft) {
  return draft.editorTier === "advanced" ? advancedDraftToRule(draft) : basicDraftToRule(draft);
}
