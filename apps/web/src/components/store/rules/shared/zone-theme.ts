import type { EditorZone } from "@/components/store/rules/shared/constants";

export const ZONE_THEME: Record<
  EditorZone,
  {
    ring: string;
    border: string;
    bg: string;
    headerBg: string;
    headerText: string;
    accent: string;
  }
> = {
  triggers: {
    ring: "ring-emerald-500/40",
    border: "border-emerald-200",
    bg: "bg-emerald-50/50",
    headerBg: "bg-emerald-50",
    headerText: "text-emerald-800",
    accent: "bg-emerald-100 text-emerald-700",
  },
  conditions: {
    ring: "ring-violet-500/40",
    border: "border-violet-200",
    bg: "bg-violet-50/30",
    headerBg: "bg-violet-50",
    headerText: "text-violet-800",
    accent: "bg-violet-100 text-violet-700",
  },
  actions: {
    ring: "ring-teal-500/40",
    border: "border-teal-200",
    bg: "bg-teal-50/40",
    headerBg: "bg-teal-50",
    headerText: "text-teal-800",
    accent: "bg-teal-100 text-teal-700",
  },
};

export function zoneLabelClass(zone: EditorZone): string {
  return `text-[10px] font-bold uppercase tracking-wider ${ZONE_THEME[zone].headerText}`;
}

export function zoneSectionHeadingClass(zone: EditorZone): string {
  return `mb-2 text-xs font-bold uppercase tracking-wide ${ZONE_THEME[zone].headerText}`;
}

export function zoneFocusClass(zone: EditorZone, focused: boolean): string {
  const theme = ZONE_THEME[zone];
  if (!focused) {
    return `rounded-xl border ${theme.border} transition-all duration-200`;
  }
  return `rounded-xl border ${theme.border} ${theme.bg} ring-2 ${theme.ring} ring-offset-2 ring-offset-background shadow-sm transition-all duration-200`;
}
