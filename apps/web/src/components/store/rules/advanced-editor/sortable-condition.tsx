"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@jubely/ui";
import { GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { ConditionEditor } from "@/components/store/rules/advanced-editor/condition-editor";
import type { AdvancedRuleDraft } from "@/stores/rule-editor-store";

export function SortableCondition({
  id,
  cond,
  index,
  logic,
  onLogic,
  onUpdate,
  onRemove,
}: {
  id: string;
  cond: AdvancedRuleDraft["conditions"][number];
  index: number;
  logic: "AND" | "OR";
  onLogic: (l: "AND" | "OR") => void;
  onUpdate: (patch: Partial<AdvancedRuleDraft["conditions"][number]>) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("store.pointsRules");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50")}>
      {index > 0 ? (
        <div className="my-2 flex justify-center">
          <div className="flex gap-0.5 rounded-lg bg-muted p-0.5">
            {(["AND", "OR"] as const).map((l) => (
              <button
                key={l}
                type="button"
                className={cn(
                  "rounded-md px-3 py-0.5 text-xs font-semibold",
                  logic === l ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
                onClick={() => onLogic(l)}
              >
                {l === "AND" ? t("logicAndShort") : t("logicOrShort")}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          className="mt-3 touch-none text-muted-foreground"
          aria-label={t("reorder")}
          {...listeners}
          {...attributes}
        >
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <ConditionEditor cond={cond} onUpdate={onUpdate} onRemove={onRemove} />
        </div>
      </div>
    </div>
  );
}
