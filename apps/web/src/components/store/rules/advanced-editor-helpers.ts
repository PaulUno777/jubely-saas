import type { AdvancedRuleDraft } from "@/stores/rule-editor-store";

export const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export type PaletteBlock = {
  type: string;
  label: string;
  sub: string;
  kind: "em" | "tl" | "gd" | "tr";
};

export const PALETTE = {
  triggers: [
    { type: "transaction", label: "Transaction", sub: "À chaque achat", kind: "em" as const },
    { type: "enroll", label: "Enrôlement", sub: "1ère inscription", kind: "tl" as const },
    { type: "birthday", label: "Anniversaire", sub: "Jour J du client", kind: "gd" as const },
  ],
  conditions: [
    { type: "amount", label: "Montant", sub: "Valeur achat", kind: "em" as const },
    { type: "weekday", label: "Jour semaine", sub: "Lun → Dim", kind: "tl" as const },
    { type: "hours", label: "Plage horaire", sub: "Heure du jour", kind: "gd" as const },
    { type: "tier", label: "Palier client", sub: "Bronze → Platine", kind: "tr" as const },
    { type: "visits", label: "Nb. visites", sub: "Total ce mois", kind: "em" as const },
    { type: "store", label: "Boutique", sub: "Emplacement", kind: "tl" as const },
  ],
  actions: [
    { type: "mult", label: "Multiplier pts", sub: "×2, ×3…", kind: "gd" as const },
    { type: "flat", label: "Bonus fixe", sub: "+ N points", kind: "em" as const },
    { type: "reward", label: "Débloquer prime", sub: "Activer récompense", kind: "tl" as const },
    { type: "notify", label: "Notifier client", sub: "SMS / Push", kind: "tr" as const },
    { type: "tierup", label: "Monter palier", sub: "Upgrade immédiat", kind: "em" as const },
  ],
};

export function defaultCondition(type: string) {
  switch (type) {
    case "amount":
      return { type, op: ">=", value: 2000 };
    case "weekday":
      return { type, days: [5, 6] };
    case "hours":
      return { type, from: 17, to: 19 };
    case "tier":
      return { type, tiers: ["or"] };
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
      return { type, reward: "Boisson offerte" };
    case "notify":
      return { type, via: "SMS" };
    case "tierup":
      return { type };
    default:
      return { type };
  }
}

export function formatNaturalLanguage(draft: AdvancedRuleDraft): string {
  const trigger = PALETTE.triggers.find((t) => t.type === draft.trigger);
  const triggerLabel = trigger?.label.toLowerCase() ?? draft.trigger;
  const logic = draft.logic === "AND" ? " ET " : " OU ";

  const condParts = draft.conditions.map((c) => {
    if (c.type === "amount") return `le montant est ${c.op ?? ">="} ${(c.value ?? 0).toLocaleString("fr-FR")} FCFA`;
    if (c.type === "weekday") return `le jour est ${(c.days ?? []).map((d) => DAYS_FR[d]).join(", ")}`;
    if (c.type === "hours") return `l'heure est entre ${c.from ?? 0}h et ${c.to ?? 0}h`;
    if (c.type === "tier") return `le palier est ${(c.tiers ?? []).join(" ou ")}`;
    if (c.type === "visits") return `le client a ≥ ${c.value ?? 0} visites`;
    if (c.type === "store") return `la boutique est ${c.store ?? "—"}`;
    return c.type;
  });

  const actParts = draft.actions.map((a) => {
    if (a.type === "mult") return `multiplier les points × ${a.factor ?? 2}`;
    if (a.type === "flat") return `ajouter ${a.pts ?? 0} points`;
    if (a.type === "notify") return `notifier par ${a.via ?? "SMS"}`;
    if (a.type === "reward") return `débloquer « ${a.reward ?? "—"} »`;
    if (a.type === "tierup") return "faire monter de palier";
    return a.type;
  });

  const condText = condParts.join(logic) || "—";
  const actText = actParts.join(" et ") || "—";
  return `Lorsqu'une ${triggerLabel} est enregistrée, si ${condText}, alors ${actText}.`;
}

/** Build occurred_at for simulator from sim day (Mon=0) and hour. */
export function simDateFromDayHour(day: number, hour: number): string {
  const ref = new Date(Date.UTC(2026, 5, 2, hour, 0, 0));
  const current = (ref.getUTCDay() + 6) % 7;
  const delta = day - current;
  ref.setUTCDate(ref.getUTCDate() + delta);
  ref.setUTCHours(hour);
  return ref.toISOString();
}
