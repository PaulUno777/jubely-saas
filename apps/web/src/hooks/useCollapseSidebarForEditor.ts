"use client";

import { useEffect, useRef } from "react";
import { useSidebar } from "@jubely/ui";

/** Collapse the app sidebar while editing rules to give the canvas more room. */
export function useCollapseSidebarForEditor() {
  const { open, setOpen } = useSidebar();
  const previousOpen = useRef<boolean | null>(null);

  useEffect(() => {
    previousOpen.current = open;
    setOpen(false);
    return () => {
      if (previousOpen.current !== null) {
        setOpen(previousOpen.current);
      }
    };
    // Mount/unmount only — restore sidebar when leaving the editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
