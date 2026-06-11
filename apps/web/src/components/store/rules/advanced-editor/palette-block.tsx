"use client";

import { cn } from "@jubely/ui";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { PaletteBlockIcon } from "@/components/store/rules/advanced-editor/icons";
import type { PaletteBlockDef } from "@/components/store/rules/shared/constants";

type PaletteBlockProps = {
  block: PaletteBlockDef;
  isActive?: boolean;
  onAdd: () => void;
};

export function PaletteBlock({ block, isActive, onAdd }: PaletteBlockProps) {
  const t = useTranslations("store.pointsRules");

  return (
    <div
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60",
        isActive && "bg-muted/80 ring-1 ring-border",
      )}
      onClick={onAdd}
      onKeyDown={(e) => e.key === "Enter" && onAdd()}
      role="button"
      tabIndex={0}
    >
      <PaletteBlockIcon type={block.type} kind={block.kind} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold">{t(block.labelKey as "palette.transaction.label")}</p>
        <p className="text-[10px] text-muted-foreground">{t(block.subKey as "palette.transaction.sub")}</p>
      </div>
      <Plus className="size-3.5 text-muted-foreground" />
    </div>
  );
}
