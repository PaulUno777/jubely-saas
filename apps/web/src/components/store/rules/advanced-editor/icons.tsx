import {
  Activity,
  Award,
  Bell,
  Calendar,
  Clock,
  CreditCard,
  Gift,
  Plus,
  RefreshCw,
  Store,
  Zap,
} from "lucide-react";
import type { PaletteKind } from "@/components/store/rules/shared/constants";
import { ZONE_THEME } from "@/components/store/rules/shared/zone-theme";
import { cn } from "@jubely/ui";

export const COND_ICON: Record<string, React.ReactNode> = {
  amount: <CreditCard className="size-4" />,
  weekday: <Calendar className="size-4" />,
  hours: <Clock className="size-4" />,
  tier: <Award className="size-4" />,
  visits: <RefreshCw className="size-4" />,
  store: <Store className="size-4" />,
};

export const TRIGGER_ICON: Record<string, React.ReactNode> = {
  transaction: <Activity className="size-4" />,
  enroll: <Gift className="size-4" />,
  birthday: <Gift className="size-4" />,
};

const KIND_CLASS: Record<PaletteKind, string> = {
  em: "bg-emerald-100 text-emerald-700",
  tl: "bg-teal-100 text-teal-700",
  gd: "bg-amber-100 text-amber-800",
  tr: "bg-violet-100 text-violet-700",
};

export function PaletteBlockIcon({ type, kind }: { type: string; kind: PaletteKind }) {
  const icon =
    type === "mult" || type === "notify" ? (
      type === "mult" ? (
        <Zap className="size-4" />
      ) : (
        <Bell className="size-4" />
      )
    ) : type === "flat" ? (
      <Plus className="size-4" />
    ) : type === "reward" ? (
      <Gift className="size-4" />
    ) : type === "tierup" ? (
      <Award className="size-4" />
    ) : (
      COND_ICON[type] ?? TRIGGER_ICON[type] ?? <Activity className="size-4" />
    );

  return (
    <div className={cn("flex size-8 items-center justify-center rounded-lg", KIND_CLASS[kind])}>
      {icon}
    </div>
  );
}

export function ZoneIcon({ zone, children }: { zone: keyof typeof ZONE_THEME; children: React.ReactNode }) {
  return (
    <div className={cn("flex size-9 items-center justify-center rounded-lg", ZONE_THEME[zone].accent)}>
      {children}
    </div>
  );
}
