"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@jubely/ui";
import { useTranslations } from "next-intl";
import type { z } from "zod";
import type { loyaltyRuleSchema } from "@jubely/api-schemas";
import { SimulatorPanel } from "@/components/store/rules/simulator-panel";

type LoyaltyRule = z.infer<typeof loyaltyRuleSchema>;

type RulesSimulatorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftRules?: LoyaltyRule[];
  fallbackDefault?: boolean;
};

export function RulesSimulatorDialog({
  open,
  onOpenChange,
  draftRules,
  fallbackDefault = true,
}: RulesSimulatorDialogProps) {
  const t = useTranslations("store.pointsRules");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("simulatorTitle")}</DialogTitle>
        </DialogHeader>
        <SimulatorPanel fallbackDefault={fallbackDefault} draftRules={draftRules} />
      </DialogContent>
    </Dialog>
  );
}
