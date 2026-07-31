"use client";

import React, { useState } from "react";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function PasswordForm({ linkId }: { linkId: string }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/links/${linkId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Incorrect password");
      }

      const { originalUrl } = await res.json();
      window.location.href = originalUrl;
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 text-center">
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-600">Password</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter link password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-10 py-3 text-sm outline-none transition focus:border-[#0f8f9e] focus:ring-1 focus:ring-[#0f8f9e]"
            required
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0f8f9e] py-3 text-sm font-semibold text-white transition hover:bg-[#0f8f9e]/90 disabled:opacity-50"
      >
        {loading ? "Redirecting..." : "Access Link"}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
