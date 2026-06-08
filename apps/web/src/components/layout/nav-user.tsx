"use client";

import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useSidebar,
} from "@jubely/ui";
import { BadgeCheck, ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { clearSession } from "@/lib/session";

type NavUserProps = {
  name: string;
  email: string;
  role: string;
};

function UserInitialsMark({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      data-nav-user-mark
      className={cn(
        "jb-nav-user-mark flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground",
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function NavUser({ name, email, role }: NavUserProps) {
  const t = useTranslations("navigation.userMenu");
  const { isMobile, state } = useSidebar();
  const collapsed = state === "collapsed";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const trigger = (
    <button
      type="button"
      className={cn(
        "jb-nav-user-trigger flex w-full items-center gap-2 rounded-md text-start text-sm text-sidebar-foreground outline-none ring-sidebar-ring transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
        "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:w-9",
        "group-data-[collapsible=icon]:min-w-9 group-data-[collapsible=icon]:max-w-9 group-data-[collapsible=icon]:shrink-0",
        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:overflow-visible group-data-[collapsible=icon]:p-0",
        !collapsed && "h-12 p-2",
      )}
      aria-label={name}
    >
      <UserInitialsMark initials={initials} />
      <div className="grid min-w-0 flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate font-semibold">{name}</span>
        <span className="truncate text-xs text-muted-foreground">{role}</span>
      </div>
      <ChevronsUpDown className="ms-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
    </button>
  );

  return (
    <SidebarMenu className="jb-nav-user-menu group-data-[collapsible=icon]:items-center">
      <SidebarMenuItem className="jb-nav-user-item group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" hidden={!collapsed || isMobile}>
              {name}
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <UserInitialsMark initials={initials} />
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/account/security">
                  <BadgeCheck className="mr-2 size-4" />
                  {t("account")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/account/security">
                  <Settings className="mr-2 size-4" />
                  {t("settings")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                clearSession();
                window.location.href = "/login";
              }}
            >
              <LogOut className="mr-2 size-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
