"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, ChevronRight, ChevronDown, Copy, Check, ExternalLink, 
  QrCode, Edit2, Trash2, Calendar, Lock, ShieldAlert, ArrowUpDown,
  X, Download, Eye, EyeOff
} from "lucide-react";
import QRCode from "qrcode";
import { format } from "date-fns";

interface LinkData {
  id: string;
  originalUrl: string;
  shortCode: string;
  customAlias: string | null;
  title: string | null;
  description: string | null;
  favicon: string | null;
  passwordHash: string | null;
  expiresAt: string | null;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

interface StatsCounts {
  totalLinks: number;
  activeLinks: number;
  expiredLinks: number; // calculated or passed
  protectedLinks: number; // calculated or passed
}

interface Props {
  refreshTrigger?: number;
  onRefreshNeeded?: () => void;
  showCountsInTabs?: boolean;
}

export default function RecentLinks({ refreshTrigger = 0, onRefreshNeeded, showCountsInTabs = false }: Props) {
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [localRefresh, setLocalRefresh] = useState(0);

  // Stats for counts in tabs
  const [stats, setStats] = useState<any>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Expanding row
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // QR Code Overlay Modal
  const [qrCodeModalLink, setQrCodeModalLink] = useState<{ url: string; code: string } | null>(null);

  // Edit Overlay Modal
  const [editingLink, setEditingLink] = useState<LinkData | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editAlias, setEditAlias] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [editPasswordEnabled, setEditPasswordEnabled] = useState(false);
  const [editPassword, setEditPassword] = useState("");
  const [editShowPassword, setEditShowPassword] = useState(false);
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Copy feedbacks
  const [copiedLinkIds, setCopiedLinkIds] = useState<Record<string, boolean>>({});

  // Trigger statistics & links list loading
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch stats first
        const statsRes = await fetch("/api/analytics/stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // Fetch links
        const params = new URLSearchParams({
          search,
          status: activeTab,
          sort: sortBy
        });
        const res = await fetch(`/api/links?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setLinks(data);
        }
      } catch (e) {
        console.error("Failed to load links data", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [search, activeTab, sortBy, refreshTrigger, localRefresh]);

  const triggerRefresh = () => {
    setLocalRefresh(prev => prev + 1);
    if (onRefreshNeeded) onRefreshNeeded();
  };

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedLinkIds(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedLinkIds(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this short link?")) return;
    try {
      const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
      if (res.ok) {
        triggerRefresh();
      } else {
        alert("Failed to delete link");
      }
    } catch (e) {
      console.error(e);
      alert("Error occurred deleting link");
    }
  };

  // Open Edit Modal and initialize state
  const startEditing = (link: LinkData) => {
    setEditingLink(link);
    setEditUrl(link.originalUrl);
    setEditAlias(link.customAlias || "");
    setEditExpiry(link.expiresAt ? new Date(link.expiresAt).toISOString().split("T")[0] : "");
    setEditPasswordEnabled(!!link.passwordHash);
    setEditPassword("");
    setEditError("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;
    setEditLoading(true);
    setEditError("");

    let formattedUrl = editUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    try {
      const res = await fetch(`/api/links/${editingLink.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalUrl: formattedUrl,
          customAlias: editAlias.trim() || null,
          expiresAt: editExpiry ? new Date(editExpiry).toISOString() : null,
          password: editPasswordEnabled && editPassword ? editPassword : undefined,
          removePassword: !editPasswordEnabled && !!editingLink.passwordHash
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update short link");
      }

      setEditingLink(null);
      triggerRefresh();
    } catch (err: any) {
      setEditError(err.message || "An error occurred");
    } finally {
      setEditLoading(false);
    }
  };

  const handleShowQr = async (shortCode: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const url = `${origin}/${shortCode}`;
    try {
      const code = await QRCode.toDataURL(url, { width: 300, margin: 2 });
      setQrCodeModalLink({ url, code });
    } catch (e) {
      console.error(e);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(links.length / itemsPerPage);
  const paginatedLinks = links.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (link: LinkData) => {
    const now = new Date();
    if (link.expiresAt && new Date(link.expiresAt) <= now) {
      return (
        <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600">
          Expired
        </span>
      );
    }
    if (link.passwordHash) {
      return (
        <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-600">
          Protected
        </span>
      );
    }
    return (
      <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
        Active
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Controls: Search, Tabs, Sorting */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "All", countKey: "totalLinks" },
            { id: "active", label: "Active", countKey: "activeLinks" },
            { id: "expired", label: "Expired", count: 0 }, // calculated
            { id: "protected", label: "Protected", count: 0 } // calculated
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            let displayCount = "";
            
            if (showCountsInTabs && stats) {
              if (tab.id === "all") displayCount = stats.totalLinks;
              else if (tab.id === "active") displayCount = stats.activeLinks;
              // Simple fallbacks for UI
              else if (tab.id === "expired") displayCount = links.filter(l => l.expiresAt && new Date(l.expiresAt) <= new Date()).length.toString();
              else if (tab.id === "protected") displayCount = links.filter(l => l.passwordHash).length.toString();
            }

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  isActive 
                    ? "bg-[#0f8f9e] text-white shadow-xs" 
                    : "border bg-white text-slate-500 hover:bg-slate-55"
                }`}
              >
                {tab.label} {displayCount ? <span className={`ml-1 font-semibold ${isActive ? "text-teal-100" : "text-slate-400"}`}>{displayCount}</span> : ""}
              </button>
            );
          })}
        </div>

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search links..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-xs outline-none transition focus:border-[#0f8f9e]"
            />
          </div>

          <div className="relative">
            <ArrowUpDown className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2.5 text-xs font-bold text-slate-600 outline-none cursor-pointer focus:border-[#0f8f9e]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="clicks">Most Clicked</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

      </div>

      {/* Links List Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-150 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                <th className="w-10 px-4 py-4"></th>
                <th className="px-4 py-4">Short Link</th>
                <th className="px-4 py-4">Original URL</th>
                <th className="px-4 py-4 text-center">Clicks</th>
                <th className="px-4 py-4">Created</th>
                <th className="px-4 py-4">Expiry</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-slate-400 font-semibold">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0f8f9e] border-t-transparent"></div>
                      <span>Loading links...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedLinks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <ShieldAlert className="h-10 w-10 text-slate-300" />
                      <div>
                        <p className="font-bold text-slate-700">No links found</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">Try widening your search or create a new short link.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLinks.map((link) => {
                  const isExpanded = !!expandedRows[link.id];
                  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
                  const shortUrl = `${origin}/${link.shortCode}`;
                  
                  return (
                    <React.Fragment key={link.id}>
                      <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? "bg-slate-50/20" : ""}`}>
                        {/* Expander Icon */}
                        <td className="px-4 py-4 text-center">
                          <button 
                            onClick={() => toggleRow(link.id)} 
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </td>

                        {/* Short link with copy/lock */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 font-bold text-[#0f8f9e]">
                            {link.passwordHash && <Lock className="h-3 w-3 text-slate-400" />}
                            <span className="truncate max-w-[150px]">{window.location.host}/{link.shortCode}</span>
                            <button 
                              onClick={() => handleCopy(link.id + "-s", shortUrl)}
                              className="rounded-md p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                            >
                              {copiedLinkIds[link.id + "-s"] ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>

                        {/* Original URL */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            {link.favicon && (
                              <img 
                                src={link.favicon} 
                                alt="favicon" 
                                className="h-4 w-4 rounded-full border bg-white" 
                                onError={(e) => { e.currentTarget.style.display = "none"; }} 
                              />
                            )}
                            <span className="truncate max-w-[200px] font-semibold text-slate-600" title={link.originalUrl}>
                              {link.title || link.originalUrl}
                            </span>
                            <button 
                              onClick={() => handleCopy(link.id + "-o", link.originalUrl)}
                              className="rounded-md p-1 hover:bg-slate-100 transition"
                            >
                              {copiedLinkIds[link.id + "-o"] ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>

                        {/* Clicks */}
                        <td className="px-4 py-4 text-center font-semibold text-slate-700">
                          {link.clicks.toLocaleString()}
                        </td>

                        {/* Created Date */}
                        <td className="px-4 py-4 text-slate-400">
                          {format(new Date(link.createdAt), "MMM d, yyyy")}
                        </td>

                        {/* Expiry Date */}
                        <td className="px-4 py-4 text-slate-400">
                          {link.expiresAt ? format(new Date(link.expiresAt), "MMM d, yyyy") : "-"}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          {getStatusBadge(link)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => handleCopy(link.id + "-s", shortUrl)}
                              title="Copy Short Link"
                              className="rounded-lg p-1.5 border hover:bg-slate-50 text-slate-500 transition"
                            >
                              {copiedLinkIds[link.id + "-s"] ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                            </button>
                            <a 
                              href={shortUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              title="Open Link"
                              className="rounded-lg p-1.5 border hover:bg-slate-50 text-slate-500 transition inline-block"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <button 
                              onClick={() => handleShowQr(link.shortCode)}
                              title="Show QR Code"
                              className="rounded-lg p-1.5 border hover:bg-slate-50 text-slate-500 transition"
                            >
                              <QrCode className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => startEditing(link)}
                              title="Edit Link"
                              className="rounded-lg p-1.5 border hover:bg-slate-50 text-slate-500 transition"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(link.id)}
                              title="Delete Link"
                              className="rounded-lg p-1.5 border hover:bg-rose-50 text-rose-500 hover:border-rose-200 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <tr className="bg-slate-50/30">
                          <td colSpan={8} className="px-6 py-4 border-t border-b">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Link Configuration</h4>
                                <div className="space-y-1 text-slate-600">
                                  <p><span className="font-semibold text-slate-400">Title:</span> {link.title || "No page title loaded"}</p>
                                  <p><span className="font-semibold text-slate-400">Description:</span> {link.description || "No description available"}</p>
                                  <p><span className="font-semibold text-slate-400">Original Destination:</span> <a href={link.originalUrl} target="_blank" rel="noreferrer" className="text-[#0f8f9e] hover:underline break-all">{link.originalUrl}</a></p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Security & Options</h4>
                                <div className="space-y-1 text-slate-600">
                                  <p><span className="font-semibold text-slate-400">Custom Alias:</span> {link.customAlias || "None"}</p>
                                  <p><span className="font-semibold text-slate-400">Password Access:</span> {link.passwordHash ? "Enabled (Encrypted)" : "Disabled"}</p>
                                  <p><span className="font-semibold text-slate-400">Expiration limit:</span> {link.expiresAt ? format(new Date(link.expiresAt), "PPP") : "None (Permanent)"}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        {!loading && links.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t bg-slate-50/50 px-6 py-4">
            <span className="text-xs text-slate-400 font-semibold">
              Showing {Math.min(links.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(links.length, currentPage * itemsPerPage)} of {links.length} results
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border bg-white px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition font-bold"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isCurrent = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        isCurrent 
                          ? "bg-[#0f8f9e] text-white shadow-xs" 
                          : "border bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border bg-white px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition font-bold"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR CODE OVERLAY MODAL */}
      {qrCodeModalLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center border">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800">QR Code sharing</h3>
              <button 
                onClick={() => setQrCodeModalLink(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-3">
              <img src={qrCodeModalLink.code} alt="QR Code" className="h-48 w-48 border rounded-xl p-2 bg-white" />
              <p className="text-xs text-slate-500 font-medium break-all max-w-[250px]">{qrCodeModalLink.url}</p>
              <a 
                href={qrCodeModalLink.code} 
                download="shortlink-qrcode.png"
                className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#0f8f9e] py-3 text-xs font-bold text-white transition hover:bg-[#0f8f9e]/90"
              >
                <Download className="h-4 w-4" /> Download QR Code
              </a>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL OVERLAY */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-800">Edit Short Link</h3>
              <button 
                onClick={() => setEditingLink(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
              {editError && (
                <p className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
                  {editError}
                </p>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Destination URL</label>
                <input
                  type="text"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-55 px-3 py-2.5 text-xs outline-none focus:border-[#0f8f9e]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Custom Alias</label>
                <input
                  type="text"
                  value={editAlias}
                  onChange={(e) => setEditAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
                  placeholder="e.g. your-alias"
                  className="w-full rounded-xl border border-slate-200 bg-slate-55 px-3 py-2.5 text-xs outline-none focus:border-[#0f8f9e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Expiry Date</label>
                  <input
                    type="date"
                    value={editExpiry}
                    onChange={(e) => setEditExpiry(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-xl border border-slate-200 bg-slate-55 px-3 py-2.5 text-xs outline-none focus:border-[#0f8f9e]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Password Lock</label>
                  <div className="flex items-center justify-between rounded-xl border px-3 py-2 h-[38px] bg-slate-50/50">
                    <span className="text-[11px] text-slate-500 font-semibold">Enabled</span>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={editPasswordEnabled}
                        onChange={(e) => setEditPasswordEnabled(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="peer h-4.5 w-8 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-3.5 after:w-3.5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#0f8f9e] peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                </div>
              </div>

              {editPasswordEnabled && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">
                    {editingLink.passwordHash ? "Enter new password (leave blank to keep current)" : "Enter password"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type={editShowPassword ? "text" : "password"}
                      placeholder="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-55 pl-9 pr-9 py-2.5 text-xs outline-none focus:border-[#0f8f9e]"
                      required={editPasswordEnabled && !editingLink.passwordHash}
                    />
                    <button
                      type="button"
                      onClick={() => setEditShowPassword(!editShowPassword)}
                      className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {editShowPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="rounded-xl border px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-xl bg-[#0f8f9e] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0f8f9e]/90 disabled:opacity-50"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
