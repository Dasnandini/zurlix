"use client";

import React, { useState, useEffect } from "react";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  TrendingUp, BarChart3, Laptop, Globe, Calendar, Clock,
  MousePointerClick, Compass, AlertCircle, Copy, Check
} from "lucide-react";
import { format } from "date-fns";

interface ClickOverTime {
  date: string;
  clicks: number;
}

interface TopLink {
  id: string;
  shortCode: string;
  originalUrl: string;
  clicks: number;
  title: string | null;
}

interface Breakdown {
  name: string;
  value: number;
}

interface RecentActivity {
  id: string;
  browser: string | null;
  os: string | null;
  device: string | null;
  referrer: string | null;
  country: string | null;
  clickedAt: string;
  link: {
    shortCode: string;
    originalUrl: string;
    title: string | null;
  };
}

interface AnalyticsData {
  clicksOverTime: ClickOverTime[];
  topLinks: TopLink[];
  deviceBreakdown: Breakdown[];
  browserBreakdown: Breakdown[];
  recentActivity: RecentActivity[];
}

const COLORS = ["#0f8f9e", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#64748b"];

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const stats = await res.json();
          setData(stats);
        }
      } catch (e) {
        console.error("Failed to fetch analytics", e);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#0f8f9e] border-t-transparent"></div>
          <span className="text-xs text-slate-400 font-bold">Generating reports...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-8">
        <AlertCircle className="h-10 w-10 text-slate-400" />
        <h3 className="text-sm font-bold text-slate-700">No Analytics Data</h3>
        <p className="text-xs text-slate-400">Share your short links to start tracking clicks!</p>
      </div>
    );
  }

  // Calculate total clicks in dataset
  const totalClicks = data.clicksOverTime.reduce((sum, item) => sum + item.clicks, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Analytics</h1>
        <p className="text-xs text-slate-400 mt-0.5 font-medium">
          Detailed metrics and visitor insights for your shortened links.
        </p>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Clicks Over Time (Line Chart) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-150 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Clicks Over Time</h3>
              <p className="text-[10px] text-slate-400 font-medium">Visual display of link clicks over the last 7 days</p>
            </div>
            <div className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-[#0f8f9e]">
              Total clicks: {totalClicks}
            </div>
          </div>

          <div className="h-72 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.clicksOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="#0f8f9e" 
                    strokeWidth={3} 
                    dot={{ fill: "#0f8f9e", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Links */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-150 bg-white p-5 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Top Performing Links</h3>
            <p className="text-[10px] text-slate-400 font-medium mb-4">Short links with the highest engagement</p>
          </div>

          <div className="space-y-3.5">
            {data.topLinks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No clicks recorded yet.</p>
            ) : (
              data.topLinks.map((link, index) => {
                const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
                const shortUrl = `${origin}/${link.shortCode}`;
                return (
                  <div key={link.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl border hover:bg-slate-50/50 transition">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#0f8f9e] truncate block">
                        {window.location.host}/{link.shortCode}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block mt-0.5" title={link.originalUrl}>
                        {link.title || link.originalUrl}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                        {link.clicks} clicks
                      </span>
                      <button 
                        onClick={() => handleCopy(link.id, shortUrl)}
                        className="rounded-lg p-1 border hover:bg-white text-slate-400 hover:text-[#0f8f9e] transition bg-slate-50"
                      >
                        {copiedId === link.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Grid: Breakdowns */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        
        {/* Device Breakdown */}
        <div className="rounded-2xl border border-slate-150 bg-white p-5 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Device Breakdown</h3>
            <p className="text-[10px] text-slate-400 font-medium mb-2">Visitor distributions by device platform</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around h-60">
            {mounted && data.deviceBreakdown.length > 0 ? (
              <>
                <div className="h-44 w-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.deviceBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data.deviceBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} clicks`, "Traffic"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4 sm:mt-0">
                  {data.deviceBreakdown.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="font-semibold text-slate-600">{item.name}:</span>
                      <span className="font-bold text-slate-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400 text-center py-20 w-full">No device statistics available.</p>
            )}
          </div>
        </div>

        {/* Browser Breakdown */}
        <div className="rounded-2xl border border-slate-150 bg-white p-5 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Browser Breakdown</h3>
            <p className="text-[10px] text-slate-400 font-medium mb-2">Traffic share across major browsers</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around h-60">
            {mounted && data.browserBreakdown.length > 0 ? (
              <>
                <div className="h-44 w-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.browserBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data.browserBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} clicks`, "Traffic"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4 sm:mt-0">
                  {data.browserBreakdown.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="font-semibold text-slate-600">{item.name}:</span>
                      <span className="font-bold text-slate-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400 text-center py-20 w-full">No browser statistics available.</p>
            )}
          </div>
        </div>

      </div>

      {/* Recent Click Activity */}
      <div className="rounded-2xl border border-slate-150 bg-white p-5 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Recent Click Activity</h3>
          <p className="text-[10px] text-slate-400 font-medium mb-4">Real-time listing of visitor logs</p>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3">Short Link</th>
                <th className="px-4 py-3">Clicked At</th>
                <th className="px-4 py-3">Referrer</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Browser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {data.recentActivity.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No recent click activity.
                  </td>
                </tr>
              ) : (
                data.recentActivity.map((activity) => (
                  <tr key={activity.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 font-bold text-[#0f8f9e]">
                      /{activity.link.shortCode}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {format(new Date(activity.clickedAt), "MMM d, yyyy HH:mm:ss")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="truncate max-w-[150px] block" title={activity.referrer || "Direct"}>
                        {activity.referrer || "Direct"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                        {activity.country || "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {activity.device || "Desktop"}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {activity.browser || "Other"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
