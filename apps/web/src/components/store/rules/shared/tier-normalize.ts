import type { TierCode } from "@/components/store/rules/shared/constants";

/** Map legacy French UI codes to backend-aligned tier codes. */
const LEGACY_TIER_MAP: Record<string, TierCode> = {
  argent: "silver",
  or: "gold",
  platine: "platinum",
};

export function normalizeTierCode(code: string): string {
  return LEGACY_TIER_MAP[code] ?? code;
}

export function normalizeTierList(tiers: string[] | undefined): string[] | undefined {
  if (!tiers?.length) return tiers;
  return [...new Set(tiers.map(normalizeTierCode))];
}
