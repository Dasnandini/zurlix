"use client";

import React, { useEffect, useState } from "react";
import { Link2, MousePointerClick, ShieldCheck, BarChart3, TrendingUp, TrendingDown, MoreHorizontal } from "lucide-react";

interface StatsData {
  totalLinks: number;
  totalLinksTrend: string;
  totalClicks: number;
  totalClicksTrend: string;
  activeLinks: number;
  activeLinksTrend: string;
  averageCtr: number;
  averageCtrTrend: string;
}

interface Props {
  refreshTrigger?: number;
}

export default function StatsCards({ refreshTrigger = 0 }: Props) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/analytics/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error("Failed to fetch stats", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 w-full animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex justify-between">
              <div className="h-10 w-10 rounded-full bg-slate-100"></div>
              <div className="h-4 w-8 rounded-md bg-slate-100"></div>
            </div>
            <div className="mt-4 h-6 w-20 rounded-md bg-slate-100"></div>
            <div className="mt-2 h-4 w-32 rounded-md bg-slate-100"></div>
          </div>
        ))}
      </div>
    );
  }

  const items = [
    {
      title: "Total Links",
      value: stats?.totalLinks.toLocaleString() ?? "0",
      trend: stats?.totalLinksTrend ?? "+0%",
      bgIcon: "bg-teal-50 text-[#0f8f9e]",
    },
    {
      title: "Total Clicks",
      value: stats?.totalClicks.toLocaleString() ?? "0",
      trend: stats?.totalClicksTrend ?? "+0%",
      bgIcon: "bg-blue-50 text-blue-500",
    },
    {
      title: "Active Links",
      value: stats?.activeLinks.toLocaleString() ?? "0",
      trend: stats?.activeLinksTrend ?? "+0%",
      bgIcon: "bg-emerald-50 text-emerald-500",
    },
    {
      title: "Average CTR",
      value: `${stats?.averageCtr ?? "0"}%`,
      trend: stats?.averageCtrTrend ?? "+0%",
      bgIcon: "bg-indigo-50 text-indigo-500",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {items.map((item, index) => {
        const isUp = item.trend.startsWith("+") || parseFloat(item.trend) > 0;
        const displayTrend = item.trend.replace("+", "").replace("-", "");
        return (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md duration-300">
            
            <div className="">
              <span className="text-xs font-semibold text-slate-400">{item.title}</span>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">{item.value}</h3>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs">
              <span className={`flex items-center gap-0.5 font-bold ${isUp ? "text-emerald-600" : "text-rose-500"}`}>
                {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {displayTrend}
              </span>
              <span className="text-slate-400 font-medium">from last month</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
