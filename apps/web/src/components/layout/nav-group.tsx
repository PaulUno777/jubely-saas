"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@jubely/ui";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavCollapsible, NavGroup, NavLink } from "./types";

export function NavGroup({ title, items }: NavGroup) {
  const { state } = useSidebar();
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const key = item.title;
          if (!("items" in item) || !item.items) {
            return <NavMenuLink key={key} item={item as NavLink} pathname={pathname} />;
          }
          if (state === "collapsed") {
            return (
              <NavMenuLink
                key={key}
                item={{
                  title: item.title,
                  url: item.items[0]?.url ?? "/root",
                  icon: item.icon,
                  badge: item.badge,
                }}
                pathname={pathname}
              />
            );
          }
          return <NavMenuCollapsible key={key} item={item as NavCollapsible} pathname={pathname} />;
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function isActive(pathname: string, url: string) {
  return pathname === url || (url !== "/" && pathname.startsWith(url + "/"));
}

function NavMenuLink({ item, pathname }: { item: NavLink; pathname: string }) {
  const active = isActive(pathname, item.url);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
        <Link href={item.url}>
          {item.icon ? <item.icon className="size-4" /> : null}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
      {item.badge !== undefined ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
    </SidebarMenuItem>
  );
}

function NavMenuCollapsible({ item, pathname }: { item: NavCollapsible; pathname: string }) {
  const active = item.items.some((it) => isActive(pathname, it.url));
  return (
    <Collapsible defaultOpen={active} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={active} tooltip={item.title}>
            {item.icon ? <item.icon className="size-4" /> : null}
            <span>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {item.badge !== undefined ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map((sub) => {
              const subActive = isActive(pathname, sub.url);
              return (
                <SidebarMenuSubItem key={sub.url}>
                  <SidebarMenuSubButton asChild isActive={subActive}>
                    <Link href={sub.url}>
                      {sub.icon ? <sub.icon className="size-4" /> : null}
                      <span>{sub.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

