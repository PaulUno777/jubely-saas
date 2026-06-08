"use client";

import { cn } from "@jubely/ui";

export type ListPageTab = {
  id: string;
  label: string;
  count?: number;
};

type ListPageTabsProps = {
  tabs: ListPageTab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
};

export function ListPageTabs({ tabs, active, onChange, className }: ListPageTabsProps) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                  isActive ? "bg-muted text-foreground" : "bg-muted/80 text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
