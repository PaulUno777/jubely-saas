"use client";

import { Input, cn } from "@jubely/ui";
import { Search } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { Header } from "@/components/layout/header";

export type PortalPageHeaderProps = {
  title: string;
  context?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  searchEnabled?: boolean;
  actions?: ReactNode;
  className?: string;
};

export function PortalPageHeader({
  title,
  context,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  searchInputRef,
  searchEnabled = true,
  actions,
  className,
}: PortalPageHeaderProps) {
  const showSearch = searchEnabled && searchPlaceholder;

  return (
    <Header
      fixed
      className={cn(
        "portal-topbar m-0 h-16 w-full shrink-0 border-b border-border/80 px-4 md:px-6",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
        <div className="jb-topbar-crumb flex min-w-0 shrink flex-col gap-0.5 sm:min-w-0 sm:flex-row sm:items-baseline sm:gap-2">
          <h1 className="truncate font-serif text-2xl leading-none font-medium italic tracking-tight text-foreground md:text-[24px]">
            {title}
          </h1>
          {context ? (
            <span className="jb-topbar-meta truncate text-xs font-normal text-muted-foreground sm:text-sm">
              {context}
            </span>
          ) : null}
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-2 md:gap-3">
          {showSearch ? (
            <div className="relative hidden w-[min(100%,17.5rem)] shrink-0 md:block lg:w-80">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchValue ?? ""}
                onChange={onSearchChange ? (e) => onSearchChange(e.target.value) : undefined}
                readOnly={!onSearchChange}
                className="h-9 w-full rounded-[10px] border-border bg-secondary pr-14 pl-9 text-sm shadow-none"
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
              />
              <kbd className="jb-numeric pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground lg:inline">
                ⌘K
              </kbd>
            </div>
          ) : null}
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </Header>
  );
}
