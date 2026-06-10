"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Input, cn } from "@jubely/ui";
import { GripVertical, X, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AdvancedRuleDraft } from "@/stores/rule-editor-store";

export function SortableAction({
  id,
  act,
  onUpdate,
  onRemove,
}: {
  id: string;
  act: AdvancedRuleDraft["actions"][number];
  onUpdate: (patch: Partial<AdvancedRuleDraft["actions"][number]>) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("store.pointsRules");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const titleKey = `act.${act.type}.title` as "act.mult.title";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50/50 p-2",
        isDragging && "opacity-50",
      )}
    >
      <button
        type="button"
        className="touch-none text-muted-foreground"
        aria-label={t("reorder")}
        {...listeners}
        {...attributes}
      >
        <GripVertical className="size-4" />
      </button>
      <Zap className="size-4 text-teal-600" />
      <span className="flex-1 text-sm font-medium">{t(titleKey)}</span>
      {act.type === "mult" ? (
        <Input
          type="number"
          className="h-8 w-16"
          value={act.factor ?? 2}
          onChange={(e) => onUpdate({ factor: Number(e.target.value) || 1 })}
        />
      ) : null}
      {act.type === "flat" ? (
        <Input
          type="number"
          className="h-8 w-20"
          value={act.pts ?? 0}
          onChange={(e) => onUpdate({ pts: Number(e.target.value) || 0 })}
        />
      ) : null}
      {act.type === "notify" ? (
        <select
          className="h-8 rounded-md border bg-background px-2 text-sm"
          value={act.via ?? "SMS"}
          onChange={(e) => onUpdate({ via: e.target.value })}
        >
          <option value="SMS">{t("notifySms")}</option>
          <option value="Push">{t("notifyPush")}</option>
          <option value="Both">{t("notifyBoth")}</option>
        </select>
      ) : null}
      {act.type === "reward" ? (
        <Input
          className="h-8 w-36"
          placeholder={t("rewardPlaceholder")}
          value={act.reward ?? ""}
          onChange={(e) => onUpdate({ reward: e.target.value })}
        />
      ) : null}
      <Button type="button" size="icon" variant="ghost" className="size-7" onClick={onRemove}>
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
