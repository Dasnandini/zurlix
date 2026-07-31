"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";

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

export default function SidebarProfile() {
  const { data: session } = useSession();
  const user = session?.user;
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="relative w-full">
      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Overlay to close when clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-xl border border-slate-100 bg-white p-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <Settings className="h-4 w-4 text-slate-500" />
              <span>Settings</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition cursor-pointer text-left w-full"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </>
      )}

      {/* Profile Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-100 shadow-sm p-3 hover:bg-slate-50 transition cursor-pointer bg-white"
      >
        <div className="flex items-center gap-3">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || "User Avatar"}
              className="h-10 w-10 rounded-full object-cover border border-slate-100"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f8f9e] text-sm font-semibold text-white">
              {getInitials(user?.name, user?.email)}
            </div>
          )}

          <div className="text-left">
            <p className="text-sm font-semibold text-slate-700 truncate max-w-[130px]">
              {user?.name || user?.email?.split("@")[0] || "User"}
            </p>

            <p className="text-xs text-slate-400 truncate max-w-[130px]">
              {user?.email || "No email"}
            </p>
          </div>
        </div>

        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}