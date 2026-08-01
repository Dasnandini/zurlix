"use client";

import React, { useState } from "react";
import { Link2, Calendar, Lock, QrCode, Copy, Check, Eye, EyeOff, Download } from "lucide-react";
import QRCode from "qrcode";

interface Props {
  onLinkCreated?: () => void;
}

export default function CreateLinkCard({ onLinkCreated }: Props) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [generateQr, setGenerateQr] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{ shortUrl: string; qrCode?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const applyDefaultExpiry = () => {
    const def = localStorage.getItem("defaultLinkExpiry");
    if (def && def !== "never") {
      const days = parseInt(def);
      const date = new Date();
      date.setDate(date.getDate() + days);
      setExpiresAt(date.toISOString().split("T")[0]);
    } else {
      setExpiresAt("");
    }
  };

  React.useEffect(() => {
    applyDefaultExpiry();
  }, []);

  const handleCopy = async () => {
    if (!successData) return;
    await navigator.clipboard.writeText(successData.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setOriginalUrl("");
    setCustomAlias("");
    applyDefaultExpiry();
    setPasswordEnabled(false);
    setPassword("");
    setGenerateQr(false);
    setError("");
    setSuccessData(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!originalUrl) {
      setError("Original URL is required");
      setLoading(false);
      return;
    }

    let formattedUrl = originalUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalUrl: formattedUrl,
          customAlias: customAlias.trim() || undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
          password: passwordEnabled ? password : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create short link");
      }

      const data = await res.json();
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const shortUrl = `${origin}/${data.shortCode}`;
      
      let qrCodeDataUrl = "";
      if (generateQr) {
        qrCodeDataUrl = await QRCode.toDataURL(shortUrl, { width: 200, margin: 2 });
      }

      setSuccessData({ shortUrl, qrCode: qrCodeDataUrl || undefined });
      
      if (onLinkCreated) {
        onLinkCreated();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition duration-300">
      
      {/* Title */}
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-base font-bold text-slate-800">Create Short Link</h2>
      </div>
      <p className="text-xs text-slate-400 mb-5">Quickly shorten a long URL and start sharing.</p>

      {successData ? (
        <div className="flex flex-col md:flex-row items-center gap-6 rounded-xl border border-emerald-100 bg-emerald-50/20 p-5 mt-4">
          <div className="flex-1 space-y-3 w-full">
            <div className="flex items-center gap-2 text-emerald-600">
              <Check className="h-5 w-5" />
              <span className="text-sm font-bold">Short Link Created!</span>
            </div>
            
            <div className="flex w-full items-center justify-between gap-2 rounded-lg border bg-white p-2.5">
              <span className="truncate text-xs font-semibold text-[#0f8f9e] select-all">{successData.shortUrl}</span>
              <button 
                onClick={handleCopy} 
                className="flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <button 
              onClick={handleClear}
              className="rounded-lg bg-[#0f8f9e] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0f8f9e]/90"
            >
              Shorten another link
            </button>
          </div>

          {successData.qrCode && (
            <div className="flex flex-col items-center gap-1.5 border rounded-xl p-3.5 bg-white shadow-xs">
              <img src={successData.qrCode} alt="QR Code" className="h-32 w-32" />
              <a 
                href={successData.qrCode} 
                download="qr-code.png"
                className="flex items-center gap-1 text-[10px] text-[#0f8f9e] font-bold hover:underline"
              >
                <Download className="h-3 w-3" /> Download QR
              </a>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
              {error}
            </p>
          )}

          {/* Inline inputs Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Original URL */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Original URL</label>
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-55 pl-10 pr-4 py-3 text-xs outline-none transition focus:border-[#0f8f9e] focus:ring-1 focus:ring-[#0f8f9e]"
                  required
                />
              </div>
            </div>

            {/* Custom Alias */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Custom Alias <span className="font-normal text-slate-400">(optional)</span></label>
              <input
                type="text"
                placeholder="your-alias"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
                className="w-full rounded-xl border border-slate-200 bg-slate-55 px-4 py-3 text-xs outline-none transition focus:border-[#0f8f9e] focus:ring-1 focus:ring-[#0f8f9e]"
              />
            </div>

            {/* Expiry Date */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Expiry <span className="font-normal text-slate-400">(optional)</span></label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl border border-slate-200 bg-slate-55 pl-10 pr-4 py-3 text-xs outline-none transition focus:border-[#0f8f9e] focus:ring-1 focus:ring-[#0f8f9e]"
                />
              </div>
            </div>

          </div>

          {/* Toggle Switches Row */}
          <div className="flex flex-wrap gap-x-8 gap-y-3 pt-2">
            {/* Password Toggle */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={passwordEnabled}
                  onChange={(e) => setPasswordEnabled(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#0f8f9e] peer-checked:after:translate-x-full peer-focus:outline-hidden"></div>
              </label>
              <span className="text-xs font-semibold text-slate-600">Password Protection</span>
            </div>

            {/* QR Code Toggle */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={generateQr}
                  onChange={(e) => setGenerateQr(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#0f8f9e] peer-checked:after:translate-x-full peer-focus:outline-hidden"></div>
              </label>
              <span className="text-xs font-semibold text-slate-600">Generate QR Code</span>
            </div>
          </div>

          {/* Dynamic Password Input */}
          {passwordEnabled && (
            <div className="space-y-1.5 max-w-md animate-fadeIn">
              <label className="text-xs font-bold text-slate-500">Enter password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-55 pl-10 pr-10 py-3 text-xs outline-none transition focus:border-[#0f8f9e] focus:ring-1 focus:ring-[#0f8f9e]"
                  required={passwordEnabled}
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
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-300">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-xl border border-slate-200 px-6 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#0f8f9e] px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0f8f9e]/90 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Short Link"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// Sparkle logo icon helper
function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z" opacity="0.4" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" opacity="0.4" />
    </svg>
  );
}
