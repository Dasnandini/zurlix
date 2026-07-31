export type SidebarIconName =
  | "home"
  | "links"
//   | "qr-codes"
  | "analytics"
  | "settings"


export interface SidebarItem {
  title: string;
  href: string;
  icon: SidebarIconName;
  badge?: string;
}

export interface SidebarSection {
  items: SidebarItem[];
}