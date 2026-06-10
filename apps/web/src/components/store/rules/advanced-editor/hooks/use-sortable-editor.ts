"use client";

import { useCallback } from "react";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { AdvancedRuleDraft } from "@/stores/rule-editor-store";

export function useSortableEditor(
  draft: AdvancedRuleDraft,
  patchDraft: (patch: Partial<AdvancedRuleDraft>) => void,
) {
  const condIds = draft.conditions.map((_, i) => `cond-${i}`);
  const actIds = draft.actions.map((_, i) => `act-${i}`);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      if (String(active.id).startsWith("cond-") && String(over.id).startsWith("cond-")) {
        const oldIndex = condIds.indexOf(String(active.id));
        const newIndex = condIds.indexOf(String(over.id));
        if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
          patchDraft({ conditions: arrayMove(draft.conditions, oldIndex, newIndex) });
        }
      }

      if (String(active.id).startsWith("act-") && String(over.id).startsWith("act-")) {
        const oldIndex = actIds.indexOf(String(active.id));
        const newIndex = actIds.indexOf(String(over.id));
        if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
          patchDraft({ actions: arrayMove(draft.actions, oldIndex, newIndex) });
        }
      }
    },
    [condIds, actIds, draft.conditions, draft.actions, patchDraft],
  );

  return { condIds, actIds, sensors, handleDragEnd };
}
