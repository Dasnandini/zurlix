"use client";

import React, { useState } from "react";
import RecentLinks from "@/components/RecentLinks";
import { useCreateLinkModal } from "@/context/CreateLinkModalContext";
import { Plus } from "lucide-react";

export default function LinksClient() {
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Links</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Manage and track all your short links in one place.
          </p>
        </div>
        <button
          onClick={handleCreateShortLinkClick}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0f8f9e] px-5 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#0f8f9e]/90"
        >
          <Plus className="h-4 w-4" /> Create Short Link
        </button>
      </div>

      {/* Links List Table with tab counts enabled */}
      <RecentLinks
        refreshTrigger={refreshTrigger}
        onRefreshNeeded={handleRefresh}
        showCountsInTabs={true}
      />
    </div>
  );
}
