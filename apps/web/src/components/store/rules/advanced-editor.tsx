"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  cn,
} from "@jubely/ui";
import {
  Activity,
  Award,
  Bell,
  Calendar,
  Clock,
  CreditCard,
  Gift,
  GripVertical,
  Plus,
  RefreshCw,
  Store,
  X,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  advancedDraftToRule,
  useRuleEditorStore,
  type AdvancedRuleDraft,
} from "@/stores/rule-editor-store";
import { simulateRules } from "@/lib/tenant-admin";
import { useTenantId } from "@/hooks/useTenantId";
import { SimulatorPanel } from "@/components/store/rules/simulator-panel";
import {
  DAYS_FR,
  PALETTE,
  defaultAction,
  defaultCondition,
  formatNaturalLanguage,
  type PaletteBlock,
} from "@/components/store/rules/advanced-editor-helpers";

const KIND_CLASS: Record<string, string> = {
  em: "bg-emerald-100 text-emerald-700",
  tl: "bg-teal-100 text-teal-700",
  gd: "bg-amber-100 text-amber-800",
  tr: "bg-violet-100 text-violet-700",
};

const COND_ICON: Record<string, React.ReactNode> = {
  amount: <CreditCard className="size-4" />,
  weekday: <Calendar className="size-4" />,
  hours: <Clock className="size-4" />,
  tier: <Award className="size-4" />,
  visits: <RefreshCw className="size-4" />,
  store: <Store className="size-4" />,
};

const TRIGGER_ICON: Record<string, React.ReactNode> = {
  transaction: <Activity className="size-4" />,
  enroll: <Gift className="size-4" />,
  birthday: <Gift className="size-4" />,
};

function PaletteBlockRow({
  block,
  onAdd,
  dragId,
}: {
  block: PaletteBlock;
  onAdd: () => void;
  dragId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { source: "palette", block },
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted/60",
        isDragging && "opacity-40",
      )}
      onClick={onAdd}
      onKeyDown={(e) => e.key === "Enter" && onAdd()}
      role="button"
      tabIndex={0}
    >
      <button
        type="button"
        className="touch-none text-muted-foreground"
        aria-label="Drag"
        {...listeners}
        {...attributes}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="size-4" />
      </button>
      <div className={cn("flex size-8 items-center justify-center rounded-lg", KIND_CLASS[block.kind])}>
        {block.type === "mult" || block.type === "notify" ? (
          block.type === "mult" ? <Zap className="size-4" /> : <Bell className="size-4" />
        ) : block.type === "flat" ? (
          <Plus className="size-4" />
        ) : block.type === "reward" ? (
          <Gift className="size-4" />
        ) : block.type === "tierup" ? (
          <Award className="size-4" />
        ) : (
          COND_ICON[block.type] ?? <Activity className="size-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold">{block.label}</p>
        <p className="text-[10px] text-muted-foreground">{block.sub}</p>
      </div>
      <Plus className="size-3.5 text-muted-foreground" />
    </div>
  );
}

function DropZone({
  id,
  children,
  hint,
}: {
  id: string;
  children: React.ReactNode;
  hint: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border border-dashed p-2 transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-border/60",
      )}
    >
      {children}
      <p className="mt-2 text-center text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ConditionEditor({
  cond,
  onUpdate,
  onRemove,
}: {
  cond: AdvancedRuleDraft["conditions"][number];
  onUpdate: (patch: Partial<AdvancedRuleDraft["conditions"][number]>) => void;
  onRemove: () => void;
}) {
  const titles: Record<string, string> = {
    amount: "Montant de l'achat",
    weekday: "Jour de la semaine",
    hours: "Plage horaire",
    tier: "Palier du client",
    visits: "Nombre de visites",
    store: "Boutique",
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <div className="text-muted-foreground">{COND_ICON[cond.type]}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{titles[cond.type] ?? cond.type}</p>
        </div>
        <Button type="button" size="icon" variant="ghost" className="size-7" onClick={onRemove}>
          <X className="size-3.5" />
        </Button>
      </div>
      <div className="space-y-2 bg-muted/30 p-3">
        {cond.type === "amount" ? (
          <div className="flex gap-2">
            <select
              className="h-9 flex-1 rounded-md border bg-background px-2 text-sm"
              value={cond.op ?? ">="}
              onChange={(e) => onUpdate({ op: e.target.value })}
            >
              <option value=">=">≥ supérieur ou égal</option>
              <option value="<=">≤ inférieur ou égal</option>
              <option value="=">= égal à</option>
            </select>
            <Input
              type="number"
              className="w-28"
              value={cond.value ?? 0}
              onChange={(e) => onUpdate({ value: Number(e.target.value) || 0 })}
            />
          </div>
        ) : null}
        {cond.type === "weekday" ? (
          <div className="flex flex-wrap gap-1">
            {DAYS_FR.map((d, i) => {
              const on = (cond.days ?? []).includes(i);
              return (
                <button
                  key={d}
                  type="button"
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-medium",
                    on ? "bg-primary text-primary-foreground" : "bg-background border",
                  )}
                  onClick={() =>
                    onUpdate({
                      days: on ? (cond.days ?? []).filter((x) => x !== i) : [...(cond.days ?? []), i].sort(),
                    })
                  }
                >
                  {d}
                </button>
              );
            })}
          </div>
        ) : null}
        {cond.type === "hours" ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">De</span>
            <Input
              type="number"
              className="w-20"
              value={cond.from ?? 0}
              onChange={(e) => onUpdate({ from: Number(e.target.value) })}
            />
            <span className="text-muted-foreground">à</span>
            <Input
              type="number"
              className="w-20"
              value={cond.to ?? 0}
              onChange={(e) => onUpdate({ to: Number(e.target.value) })}
            />
            <span className="text-muted-foreground">heures</span>
          </div>
        ) : null}
        {cond.type === "tier" ? (
          <div className="flex flex-wrap gap-1">
            {[
              ["bronze", "Bronze"],
              ["argent", "Argent"],
              ["or", "Or"],
              ["platine", "Platine"],
            ].map(([id, label]) => {
              const on = (cond.tiers ?? []).includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs",
                    on ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "bg-background",
                  )}
                  onClick={() =>
                    onUpdate({
                      tiers: on
                        ? (cond.tiers ?? []).filter((x) => x !== id)
                        : [...(cond.tiers ?? []), id],
                    })
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : null}
        {cond.type === "visits" ? (
          <Input
            type="number"
            value={cond.value ?? 0}
            onChange={(e) => onUpdate({ value: Number(e.target.value) || 0 })}
          />
        ) : null}
        {cond.type === "store" ? (
          <select
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            value={cond.store ?? "all"}
            onChange={(e) => onUpdate({ store: e.target.value })}
          >
            <option value="all">Toutes les boutiques</option>
            <option value="hq">Siège</option>
          </select>
        ) : null}
      </div>
    </div>
  );
}

function SortableCondition({
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
                {l === "AND" ? "ET" : "OU"}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          className="mt-3 touch-none text-muted-foreground"
          aria-label="Reorder"
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

function SortableAction({
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const titles: Record<string, string> = {
    mult: "Multiplier les points par",
    flat: "Ajouter des points fixes",
    reward: "Débloquer la récompense",
    notify: "Notifier le client par",
    tierup: "Faire monter le client de palier",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2",
        isDragging && "opacity-50",
      )}
    >
      <button type="button" className="touch-none text-muted-foreground" {...listeners} {...attributes}>
        <GripVertical className="size-4" />
      </button>
      <Zap className="size-4 text-emerald-600" />
      <span className="flex-1 text-sm font-medium">{titles[act.type] ?? act.type}</span>
      {act.type === "mult" ? (
        <Input
          type="number"
          className="w-16 h-8"
          value={act.factor ?? 2}
          onChange={(e) => onUpdate({ factor: Number(e.target.value) || 1 })}
        />
      ) : null}
      {act.type === "flat" ? (
        <Input
          type="number"
          className="w-20 h-8"
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
          <option>SMS</option>
          <option>Push</option>
          <option>Les deux</option>
        </select>
      ) : null}
      {act.type === "reward" ? (
        <Input
          className="h-8 w-36"
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

export function AdvancedEditor() {
  const t = useTranslations("store.pointsRules");
  const tenantId = useTenantId();
  const draft = useRuleEditorStore((s) => s.draft) as AdvancedRuleDraft;
  const patchDraft = useRuleEditorStore((s) => s.patchDraft);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [activeDrag, setActiveDrag] = useState<PaletteBlock | null>(null);

  const condIds = draft.conditions.map((_, i) => `cond-${i}`);
  const actIds = draft.actions.map((_, i) => `act-${i}`);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const simMut = useMutation({
    mutationFn: () =>
      simulateRules(tenantId!, {
        amount_fcfa: 5000,
        tier: "or",
        draft_rules: [advancedDraftToRule(draft)],
      }),
  });

  const addCondition = (type: string) =>
    patchDraft({ conditions: [...draft.conditions, defaultCondition(type)] });

  const addAction = (type: string) =>
    patchDraft({ actions: [...draft.actions, defaultAction(type)] });

  const handleDragStart = (event: DragStartEvent) => {
    const block = event.active.data.current?.block as PaletteBlock | undefined;
    if (block) setActiveDrag(block);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const paletteBlock = active.data.current?.block as PaletteBlock | undefined;
    if (paletteBlock && active.data.current?.source === "palette") {
      if (over.id === "drop-conditions" && PALETTE.conditions.some((c) => c.type === paletteBlock.type)) {
        addCondition(paletteBlock.type);
      }
      if (over.id === "drop-actions" && PALETTE.actions.some((a) => a.type === paletteBlock.type)) {
        addAction(paletteBlock.type);
      }
      return;
    }

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
  };

  const triggerMeta = PALETTE.triggers.find((tr) => tr.type === draft.trigger) ?? PALETTE.triggers[0];

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <span>{t("dragHint")}</span>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setJsonOpen(true)}>
            {"{ }"} {t("viewJson")}
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid min-h-[560px] md:grid-cols-[230px_1fr]">
          <aside className="space-y-4 border-r bg-muted/20 p-3">
            {(
              [
                ["triggers", PALETTE.triggers, "paletteTriggers"],
                ["conditions", PALETTE.conditions, "paletteConditions"],
                ["actions", PALETTE.actions, "paletteActions"],
              ] as const
            ).map(([key, blocks, labelKey]) => (
              <div key={key}>
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t(labelKey)}
                </p>
                {blocks.map((block) => (
                  <PaletteBlockRow
                    key={block.type}
                    block={block}
                    dragId={`palette-${key}-${block.type}`}
                    onAdd={() => {
                      if (key === "triggers") {
                        patchDraft({ trigger: block.type as AdvancedRuleDraft["trigger"] });
                      } else if (key === "conditions") {
                        addCondition(block.type);
                      } else {
                        addAction(block.type);
                      }
                    }}
                  />
                ))}
              </div>
            ))}
          </aside>

          <div className="space-y-4 p-5">
            <Input
              value={draft.name}
              onChange={(e) => patchDraft({ name: e.target.value })}
              className="text-base font-semibold"
              placeholder={t("name")}
            />

            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className={cn("flex size-9 items-center justify-center rounded-lg", KIND_CLASS.em)}>
                {TRIGGER_ICON[draft.trigger]}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {t("triggerLabel")} — {triggerMeta.label}
                </p>
                <p className="text-xs text-emerald-800/80">
                  {draft.trigger === "transaction"
                    ? t("triggerTransactionHint")
                    : triggerMeta.sub}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t("sectionIf")}
              </p>
              <DropZone id="drop-conditions" hint={t("addConditionHint")}>
                <SortableContext items={condIds} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1">
                    {draft.conditions.map((cond, i) => (
                      <SortableCondition
                        key={condIds[i]}
                        id={condIds[i]!}
                        index={i}
                        cond={cond}
                        logic={draft.logic}
                        onLogic={(logic) => patchDraft({ logic })}
                        onUpdate={(patch) =>
                          patchDraft({
                            conditions: draft.conditions.map((c, j) => (j === i ? { ...c, ...patch } : c)),
                          })
                        }
                        onRemove={() =>
                          patchDraft({ conditions: draft.conditions.filter((_, j) => j !== i) })
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </DropZone>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t("sectionThen")}
              </p>
              <DropZone id="drop-actions" hint={t("addActionHint")}>
                <div className="overflow-hidden rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                    <Zap className="size-4" />
                    {t("actionsToRun")}
                  </div>
                  <div className="space-y-2 p-3">
                    <SortableContext items={actIds} strategy={verticalListSortingStrategy}>
                      {draft.actions.map((act, i) => (
                        <SortableAction
                          key={actIds[i]}
                          id={actIds[i]!}
                          act={act}
                          onUpdate={(patch) =>
                            patchDraft({
                              actions: draft.actions.map((a, j) => (j === i ? { ...a, ...patch } : a)),
                            })
                          }
                          onRemove={() => patchDraft({ actions: draft.actions.filter((_, j) => j !== i) })}
                        />
                      ))}
                    </SortableContext>
                  </div>
                </div>
              </DropZone>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {t("naturalLanguageLabel")}
              </p>
              <p className="text-sm leading-relaxed">{formatNaturalLanguage(draft)}</p>
            </div>

            {showTest ? (
              <div className="rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold">{t("testWithData")}</p>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowTest(false)}>
                    <X className="size-4" />
                  </Button>
                </div>
                <SimulatorPanel fallbackDefault={false} draftRules={[advancedDraftToRule(draft)]} />
              </div>
            ) : null}

            {simMut.data ? (
              <p className="text-sm font-medium">{t("simulateResult", { total: String(simMut.data.total) })}</p>
            ) : null}
          </div>
        </div>

        <DragOverlay>
          {activeDrag ? (
            <div className="rounded-lg border bg-card px-3 py-2 text-sm font-medium shadow-lg">
              {activeDrag.label}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="flex flex-wrap items-center gap-2 border-t bg-muted/20 px-4 py-3">
        <Badge variant="outline" className="border-emerald-300 text-emerald-700">
          {t("ruleValid")}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {draft.conditions.length} {t("conditionsCount")} · {draft.actions.length} {t("actionsCount")}
        </span>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setShowTest((s) => !s)}>
            {t("testWithData")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={simMut.isPending}
            onClick={() => simMut.mutate()}
          >
            {t("quickSimulate")}
          </Button>
        </div>
      </div>

      <Dialog open={jsonOpen} onOpenChange={setJsonOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("viewJson")}</DialogTitle>
          </DialogHeader>
          <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">
            {JSON.stringify(advancedDraftToRule(draft), null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
