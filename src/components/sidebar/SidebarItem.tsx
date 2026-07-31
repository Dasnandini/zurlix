"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Home,
  Link2,
  QrCode,
  BarChart3,
  Megaphone,
  Globe,
  Boxes,
  Code2,
  Settings,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { SidebarItem as Item, type SidebarIconName } from "./types";

interface Props {
  item: Item;
}

const iconMap: Record<SidebarIconName, LucideIcon> = {
  home: Home,
  links: Link2,
//   "qr-codes": QrCode,
  analytics: BarChart3,
  settings: Settings,

};

export default function SidebarItem({ item }: Props) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const Icon = iconMap[item.icon];

  return (
    <Link
      href={item.href}
      className={clsx(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
        active
          ? "bg-indigo-50 text-[#0f8f9e] font-medium"
          : "text-slate-600 hover:bg-slate-100"
      )}
    >
      <Icon className="h-4 w-4" />

      <span>{item.title}</span>

      {item.badge && (
        <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-[#0f8f9e]">
          {item.badge}
        </span>
      )}
    </Link>
  );
}