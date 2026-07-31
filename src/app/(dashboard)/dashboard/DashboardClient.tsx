"use client";

import React, { useState } from "react";
import StatsCards from "@/components/StatsCards";
import CreateLinkCard from "@/components/CreateLinkCard";
import RecentLinks from "@/components/RecentLinks";
import { useCreateLinkModal } from "@/context/CreateLinkModalContext";
import { Plus } from "lucide-react";

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function DashboardClient({ user }: { user: User }) {
  const { openModal } = useCreateLinkModal();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleCreateShortLinkClick = () => {
    openModal(handleRefresh);
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Welcome back, {user.name || "User"} 👋
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create, manage, and track all your short links from one place.
          </p>
        </div>
        <button
          onClick={handleCreateShortLinkClick}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0f8f9e] px-5 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#0f8f9e]/90"
        >
          <Plus className="h-4 w-4" /> Create Short Link
        </button>
      </div>

      {/* Stats Cards */}
      <StatsCards refreshTrigger={refreshTrigger} />

      {/* Inline Create Form */}
      <CreateLinkCard onLinkCreated={handleRefresh} />

      {/* Links List Table */}
      <RecentLinks
        refreshTrigger={refreshTrigger}
        onRefreshNeeded={handleRefresh}
      />
    </div>
  );
}
