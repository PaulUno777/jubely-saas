"use client";

import { useCallback, useState } from "react";
import type { EditorZone } from "@/components/store/rules/shared/constants";

export function useEditorZoneFocus() {
  const [focusedZone, setFocusedZone] = useState<EditorZone | null>(null);

  const focusZone = useCallback((zone: EditorZone) => setFocusedZone(zone), []);
  const clearZoneFocus = useCallback(() => setFocusedZone(null), []);

  return { focusedZone, focusZone, clearZoneFocus };
}
