import type { Messages } from "@jubely/i18n";

type NavigationGroupKey = keyof Messages["navigation"]["groups"];
type NavigationItemKey = keyof Messages["navigation"]["items"];

export type NavGroupTitle = `groups.${NavigationGroupKey}`;
export type NavItemTitle = `items.${NavigationItemKey}`;

export type NavLink = {
  title: NavItemTitle;
  url: string;
  icon?: React.ElementType;
  badge?: string | number;
  items?: never;
};

export type NavCollapsible = {
  title: NavItemTitle;
  url?: never;
  icon?: React.ElementType;
  badge?: string | number;
  items: { title: NavItemTitle; url: string; icon?: React.ElementType; badge?: string | number }[];
};

export type NavItem = NavLink | NavCollapsible;

export type NavGroup = {
  title: NavGroupTitle;
  items: NavItem[];
};
