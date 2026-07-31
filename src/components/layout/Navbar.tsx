"use client";

import { useSession, signOut } from "next-auth/react";
import {
  Bell,
  Search,
  Settings,
  LogOut,
} from "lucide-react";

const getInitials = (name?: string | null, email?: string | null) => {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "U";
};

export default function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 shadow-sm bg-white px-8">
      <div className="relative w-[420px]">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 "
          size={18}
        />

        <input
          placeholder="Search links, QR codes, or domains..."
          className="h-11 w-full rounded-xl  bg-indigo-50 pl-11 pr-12 text-sm outline-none transition focus:border-[#0f8f9e]"
        />
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || "User Avatar"}
              className="h-9 w-9 rounded-full object-cover border border-slate-100"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f8f9e] text-sm font-semibold text-white">
              {getInitials(user?.name, user?.email)}
            </div>
          )}

          <span className="text-sm font-medium text-slate-700">
            {user?.name || user?.email?.split("@")[0] || "User"}
          </span>
        </div>

        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}