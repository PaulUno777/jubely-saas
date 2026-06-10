import type { TierCode } from "@/components/store/rules/shared/constants";

export function defaultCondition(type: string) {
  switch (type) {
    case "amount":
      return { type, op: ">=", value: 2000 };
    case "weekday":
      return { type, days: [5, 6] };
    case "hours":
      return { type, from: 17, to: 19 };
    case "tier":
      return { type, tiers: ["gold" satisfies TierCode] };
    case "visits":
      return { type, op: ">=", value: 3 };
    case "store":
      return { type, store: "all" };
    default:
      return { type };
  }
}

export function defaultAction(type: string) {
  switch (type) {
    case "mult":
      return { type, factor: 2 };
    case "flat":
      return { type, pts: 200 };
    case "reward":
      return { type, reward: "" };
    case "notify":
      return { type, via: "SMS" };
    case "tierup":
      return { type };
    default:
      return { type };
  }
}
