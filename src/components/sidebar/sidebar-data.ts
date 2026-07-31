import { SidebarSection } from "./types";

export const sidebarSections: SidebarSection[] = [
  {
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: "home",
      },
      {
        title: "Links",
        href: "/links",
        icon: "links",
      },
    //   {
    //     title: "QR Codes",
    //     href: "/qr-codes",
    //     icon: "qr-codes",
    //   },
      {
        title: "Analytics",
        href: "/analytics",
        icon: "analytics",
      },
      
    ],
  },

  {
    items: [
      {
        title: "Settings",
        href: "/settings",
        icon: "settings",
      },
    
    ],
  },
];