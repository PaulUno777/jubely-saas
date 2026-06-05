"use client";

import { Calendar, Check, ChevronDown } from "lucide-react";
import * as React from "react";
import { useMemo, useState } from "react";
import { cn } from "../../cn";
import {
  DATE_RANGE_PRESETS,
  parseDateInputValue,
  resolveDateRange,
  toDateInputValue,
  type DateRangePreset,
  type DateRangeValue,
} from "../../date-range";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const PRESET_OPTIONS = DATE_RANGE_PRESETS.filter((p) => p !== "custom");

export type DateRangeSelectorLabels = {
  sectionTitle: string;
  presets: Record<Exclude<DateRangePreset, "custom">, string>;
  customRange: string;
  customTitle: string;
  startLabel: string;
  endLabel: string;
  apply: string;
  cancel: string;
  invalidRange?: string;
};

export type DateRangeSelectorProps = {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  labels: DateRangeSelectorLabels;
  formatPresetSubtitle: (preset: DateRangePreset, start: Date, end: Date) => string;
  presets?: DateRangePreset[];
  referenceDate?: Date;
  timeZone?: string;
  className?: string;
  disabled?: boolean;
  align?: "start" | "center" | "end";
};

export function DateRangeSelector({
  value,
  onChange,
  labels,
  formatPresetSubtitle,
  presets = [...PRESET_OPTIONS, "custom"],
  referenceDate,
  timeZone,
  className,
  disabled,
  align = "end",
}: DateRangeSelectorProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  const refDate = useMemo(() => referenceDate ?? new Date(), [referenceDate]);

  const visiblePresets = useMemo(
    () => presets.filter((p): p is Exclude<DateRangePreset, "custom"> => p !== "custom"),
    [presets],
  );

  const presetRanges = useMemo(() => {
    const map = new Map<Exclude<DateRangePreset, "custom">, DateRangeValue>();
    for (const preset of visiblePresets) {
      map.set(preset, resolveDateRange(preset, { referenceDate: refDate, timeZone }));
    }
    return map;
  }, [visiblePresets, refDate, timeZone]);

  const triggerTitle =
    value.preset === "custom"
      ? labels.customRange.replace(/\.{3}$/, "").trim() || labels.customRange
      : labels.presets[value.preset as Exclude<DateRangePreset, "custom">] ??
        labels.presets.last_7_days;

  const triggerSubtitle = formatPresetSubtitle(value.preset, value.start, value.end);

  function selectPreset(preset: Exclude<DateRangePreset, "custom">) {
    const next = presetRanges.get(preset) ?? resolveDateRange(preset, { referenceDate: refDate, timeZone });
    onChange(next);
    setMenuOpen(false);
  }

  function openCustomDialog() {
    setMenuOpen(false);
    setCustomError(null);
    if (value.preset === "custom") {
      setCustomStart(toDateInputValue(value.start));
      setCustomEnd(toDateInputValue(value.end));
    } else {
      const fallback = presetRanges.get("last_7_days") ?? value;
      setCustomStart(toDateInputValue(fallback.start));
      setCustomEnd(toDateInputValue(fallback.end));
    }
    setCustomOpen(true);
  }

  function applyCustomRange() {
    const startDate = parseDateInputValue(customStart);
    const endDate = parseDateInputValue(customEnd);
    if (!startDate || !endDate) {
      setCustomError(labels.invalidRange ?? "Invalid range");
      return;
    }
    if (startDate.getTime() > endDate.getTime()) {
      setCustomError(labels.invalidRange ?? "Invalid range");
      return;
    }
    onChange(
      resolveDateRange("custom", {
        referenceDate: refDate,
        timeZone,
        customStart: startDate,
        customEnd: endDate,
      }),
    );
    setCustomOpen(false);
    setCustomError(null);
  }

  const showCustom = presets.includes("custom");

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            disabled={disabled}
            className={cn(
              "h-auto min-h-9 gap-2 px-3 py-1.5 text-left font-normal shadow-none",
              className,
            )}
            aria-label={`${triggerTitle}, ${triggerSubtitle}`}
          >
            <Calendar className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex min-w-0 flex-1 flex-col items-start leading-tight">
              <span className="text-xs font-semibold text-foreground">{triggerTitle}</span>
              <span className="text-[11px] text-muted-foreground">{triggerSubtitle}</span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          className="w-[min(100vw-2rem,280px)] rounded-xl p-1.5"
        >
          <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {labels.sectionTitle}
          </DropdownMenuLabel>
          {visiblePresets.map((preset) => {
            const range = presetRanges.get(preset)!;
            const selected = value.preset === preset;
            const subtitle = formatPresetSubtitle(preset, range.start, range.end);
            return (
              <DropdownMenuItem
                key={preset}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 focus:bg-accent/30",
                  selected && "bg-accent/40",
                )}
                onSelect={(e) => {
                  e.preventDefault();
                  selectPreset(preset);
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {labels.presets[preset]}
                  </div>
                  <div className="text-xs text-muted-foreground">{subtitle}</div>
                </div>
                {selected ? (
                  <Check className="size-4 shrink-0 text-primary" aria-hidden />
                ) : (
                  <span className="size-4 shrink-0" aria-hidden />
                )}
              </DropdownMenuItem>
            );
          })}
          {showCustom ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 rounded-lg px-2 py-2.5 text-sm font-medium"
                onSelect={(e) => {
                  e.preventDefault();
                  openCustomDialog();
                }}
              >
                <Calendar className="size-4 text-muted-foreground" />
                {labels.customRange}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{labels.customTitle}</DialogTitle>
            <DialogDescription className="sr-only">{labels.customRange}</DialogDescription>
          </DialogHeader>
          <DialogBody className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date-range-start">{labels.startLabel}</Label>
              <Input
                id="date-range-start"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date-range-end">{labels.endLabel}</Label>
              <Input
                id="date-range-end"
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
            {customError ? (
              <p className="text-sm text-destructive" role="alert">
                {customError}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setCustomOpen(false)}>
              {labels.cancel}
            </Button>
            <Button type="button" onClick={applyCustomRange}>
              {labels.apply}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
