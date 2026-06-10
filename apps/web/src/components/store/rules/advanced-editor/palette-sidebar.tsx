"use client";

import { useTranslations } from "next-intl";
import { PaletteBlock } from "@/components/store/rules/advanced-editor/palette-block";
import {
  PALETTE_ACTIONS,
  PALETTE_CONDITIONS,
  PALETTE_TRIGGERS,
  type EditorZone,
  type PaletteBlockDef,
} from "@/components/store/rules/shared/constants";
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
      {SECTIONS.map(({ key, labelKey, blocks }) => (
        <div key={key}>
          <p className="px-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t(labelKey as "paletteTriggers")}
          </p>
          <div className="space-y-0.5">
            {blocks.map((block) => (
              <PaletteBlock
                key={block.type}
                block={block}
                isActive={key === "triggers" && draft.trigger === block.type}
                onAdd={() => handleAdd(key, block.type)}
                onFocusZone={onFocusZone}
                onClearZoneFocus={onClearZoneFocus}
              />
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
