/** Backend-aligned tier codes (see backend/domain/loyalty_extended.go DefaultTierCodes). */
export const TIER_CODES = ["bronze", "silver", "gold", "platinum"] as const;
export type TierCode = (typeof TIER_CODES)[number];

export const WEEKDAY_INDICES = [0, 1, 2, 3, 4, 5, 6] as const;

export type EditorZone = "triggers" | "conditions" | "actions";

export type PaletteKind = "em" | "tl" | "gd" | "tr";

export type PaletteBlockDef = {
  type: string;
  labelKey: string;
  subKey: string;
  kind: PaletteKind;
  zone: EditorZone;
};

export const PALETTE_TRIGGERS: PaletteBlockDef[] = [
  { type: "transaction", labelKey: "palette.transaction.label", subKey: "palette.transaction.sub", kind: "em", zone: "triggers" },
  { type: "enroll", labelKey: "palette.enroll.label", subKey: "palette.enroll.sub", kind: "tl", zone: "triggers" },
  { type: "birthday", labelKey: "palette.birthday.label", subKey: "palette.birthday.sub", kind: "gd", zone: "triggers" },
];

export const PALETTE_CONDITIONS: PaletteBlockDef[] = [
  { type: "amount", labelKey: "palette.amount.label", subKey: "palette.amount.sub", kind: "em", zone: "conditions" },
  { type: "weekday", labelKey: "palette.weekday.label", subKey: "palette.weekday.sub", kind: "tl", zone: "conditions" },
  { type: "hours", labelKey: "palette.hours.label", subKey: "palette.hours.sub", kind: "gd", zone: "conditions" },
  { type: "tier", labelKey: "palette.tier.label", subKey: "palette.tier.sub", kind: "tr", zone: "conditions" },
  { type: "visits", labelKey: "palette.visits.label", subKey: "palette.visits.sub", kind: "em", zone: "conditions" },
  { type: "store", labelKey: "palette.store.label", subKey: "palette.store.sub", kind: "tl", zone: "conditions" },
];

export const PALETTE_ACTIONS: PaletteBlockDef[] = [
  { type: "mult", labelKey: "palette.mult.label", subKey: "palette.mult.sub", kind: "gd", zone: "actions" },
  { type: "flat", labelKey: "palette.flat.label", subKey: "palette.flat.sub", kind: "em", zone: "actions" },
  { type: "reward", labelKey: "palette.reward.label", subKey: "palette.reward.sub", kind: "tl", zone: "actions" },
  { type: "notify", labelKey: "palette.notify.label", subKey: "palette.notify.sub", kind: "tr", zone: "actions" },
  { type: "tierup", labelKey: "palette.tierup.label", subKey: "palette.tierup.sub", kind: "em", zone: "actions" },
];
