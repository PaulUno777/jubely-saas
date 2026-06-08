import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { cn } from "../../cn";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

export type PaginationLabels = {
  rowsPerPage?: string;
  range?: (from: number, to: number, total: number) => string;
  previous?: string;
  next?: string;
};

export type PaginationProps = {
  offset: number;
  limit: number;
  total: number;
  onOffsetChange: (offset: number) => void;
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: number[];
  labels?: PaginationLabels;
  className?: string;
};

const defaultLabels: Required<PaginationLabels> = {
  rowsPerPage: "Rows per page",
  range: (from, to, total) => `${from}–${to} of ${total}`,
  previous: "Previous",
  next: "Next",
};

export function Pagination({
  offset,
  limit,
  total,
  onOffsetChange,
  onLimitChange,
  pageSizeOptions = [10, 25, 50],
  labels: labelsProp,
  className,
}: PaginationProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const safeTotal = Math.max(total, 0);
  const from = safeTotal === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, safeTotal);
  const canPrev = offset > 0;
  const canNext = offset + limit < safeTotal;

  return (
    <div
      data-slot="pagination"
      className={cn(
        "flex flex-col gap-3 border-t border-border px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">{labels.range!(from, to, safeTotal)}</p>

      <div className="flex flex-wrap items-center gap-3">
        {onLimitChange ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{labels.rowsPerPage}</span>
            <Select value={String(limit)} onValueChange={(v) => onLimitChange(Number(v))}>
              <SelectTrigger className="h-8 w-[4.5rem]" aria-label={labels.rowsPerPage}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canPrev}
            onClick={() => onOffsetChange(Math.max(0, offset - limit))}
            aria-label={labels.previous}
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">{labels.previous}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canNext}
            onClick={() => onOffsetChange(offset + limit)}
            aria-label={labels.next}
          >
            <span className="hidden sm:inline">{labels.next}</span>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
