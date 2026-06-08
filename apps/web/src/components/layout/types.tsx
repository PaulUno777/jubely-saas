export type NavLink = {
  title: string;
  url: string;
  icon?: React.ElementType;
  badge?: string | number;
  items?: never;
};

export type NavCollapsible = {
  title: string;
  url?: never;
  icon?: React.ElementType;
  badge?: string | number;
  items: { title: string; url: string; icon?: React.ElementType; badge?: string | number }[];
};

export type NavItem = NavLink | NavCollapsible;

export type NavGroup = {
  title: string;
  items: NavItem[];
};

