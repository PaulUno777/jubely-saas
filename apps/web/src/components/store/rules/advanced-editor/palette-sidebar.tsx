"use client";

import { cn } from "@jubely/ui";
import { useTranslations } from "next-intl";
import { PaletteBlock } from "@/components/store/rules/advanced-editor/palette-block";
import {
  PALETTE_ACTIONS,
  PALETTE_CONDITIONS,
  PALETTE_TRIGGERS,
  type EditorZone,
  type PaletteBlockDef,
} from "@/components/store/rules/shared/constants";
import { zoneLabelClass } from "@/components/store/rules/shared/zone-theme";
import type { AdvancedRuleDraft } from "@/stores/rule-editor-store";

const SECTIONS: { key: EditorZone; labelKey: string; blocks: PaletteBlockDef[] }[] = [
  { key: "triggers", labelKey: "paletteTriggers", blocks: PALETTE_TRIGGERS },
  { key: "conditions", labelKey: "paletteConditions", blocks: PALETTE_CONDITIONS },
  { key: "actions", labelKey: "paletteActions", blocks: PALETTE_ACTIONS },
];

type PaletteSidebarProps = {
  draft: AdvancedRuleDraft;
  onAddTrigger: (type: string) => void;
  onAddCondition: (type: string) => void;
  onAddAction: (type: string) => void;
  onFocusZone: (zone: EditorZone) => void;
  onClearZoneFocus: () => void;
};

export function PaletteSidebar({
  draft,
  onAddTrigger,
  onAddCondition,
  onAddAction,
  onFocusZone,
  onClearZoneFocus,
}: PaletteSidebarProps) {
  const t = useTranslations("store.pointsRules");

  const handleAdd = (section: EditorZone, type: string) => {
    if (section === "triggers") onAddTrigger(type);
    else if (section === "conditions") onAddCondition(type);
    else onAddAction(type);
  };

  return (
    <aside className="space-y-3 border-r bg-muted/20 p-2 md:w-[220px] md:shrink-0">
      <p className="px-1.5 text-[10px] text-muted-foreground">{t("paletteHint")}</p>
      {SECTIONS.map(({ key, labelKey, blocks }) => (
        <div
          key={key}
          onMouseEnter={() => onFocusZone(key)}
          onMouseLeave={onClearZoneFocus}
        >
          <p className={cn("px-1.5 pb-1", zoneLabelClass(key))}>{t(labelKey as "paletteTriggers")}</p>
          <div className="space-y-0.5">
            {blocks.map((block) => (
              <PaletteBlock
                key={block.type}
                block={block}
                isActive={key === "triggers" && draft.trigger === block.type}
                onAdd={() => handleAdd(key, block.type)}
              />
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
