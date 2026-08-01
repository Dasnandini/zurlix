"use client";

import React, { useState } from "react";
import { X, Link2, Calendar, Lock, QrCode, Copy, Check, Eye, EyeOff, Download } from "lucide-react";
import { useCreateLinkModal } from "@/context/CreateLinkModalContext";
import QRCode from "qrcode";

export default function CreateLinkModal() {
  const { isOpen, closeModal, triggerSuccess } = useCreateLinkModal();
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
    if (isOpen) {
      applyDefaultExpiry();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
        qrCodeDataUrl = await QRCode.toDataURL(shortUrl, { width: 250, margin: 2 });
      }

      setSuccessData({ shortUrl, qrCode: qrCodeDataUrl || undefined });
      triggerSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-[#0f8f9e]">
              <Link2 className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Create Short Link</h2>
          </div>
          <button 
            onClick={closeModal} 
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {successData ? (
          <div className="mt-6 flex flex-col items-center gap-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <Check className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Link Created Successfully!</h3>
              <p className="text-sm text-slate-500 mt-1">Your shortened link is ready to share.</p>
            </div>

            <div className="flex w-full items-center justify-between gap-2 rounded-xl border bg-slate-50 p-3">
              <span className="truncate text-sm font-medium text-[#0f8f9e] select-all">{successData.shortUrl}</span>
              <button 
                onClick={handleCopy} 
                className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs border hover:bg-slate-50 transition"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {successData.qrCode && (
              <div className="flex flex-col items-center gap-2 border rounded-xl p-3 bg-white shadow-xs">
                <img src={successData.qrCode} alt="Short Link QR Code" className="h-40 w-40" />
                <a 
                  href={successData.qrCode} 
                  download="qr-code.png"
                  className="flex items-center gap-1 text-xs text-[#0f8f9e] font-semibold hover:underline"
                >
                  <Download className="h-3.5 w-3.5" /> Download QR Code
                </a>
              </div>
            )}

            <button 
              onClick={handleClear} 
              className="w-full rounded-xl bg-[#0f8f9e] py-3 text-sm font-medium text-white transition hover:bg-[#0f8f9e]/90 mt-2"
            >
              Shorten Another URL
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                {error}
              </p>
            )}

            {/* Original URL */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Original URL</label>
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-55 pl-10 pr-4 py-3 text-sm outline-none transition focus:border-[#0f8f9e] focus:ring-1 focus:ring-[#0f8f9e]"
                  required
                />
              </div>
            </div>

            {/* Custom Alias */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700">Custom Alias <span className="text-xs font-normal text-slate-400">(optional)</span></label>
                {customAlias.trim() && (
                  <span className="text-xs text-slate-400 truncate max-w-[200px]">
                    Preview: <span className="font-semibold text-[#0f8f9e]">{typeof window !== "undefined" ? window.location.host : "zurlix.nandini.digital"}/{customAlias.trim()}</span>
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="my-custom-link"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
                className="w-full rounded-xl border border-slate-200 bg-slate-55 px-4 py-3 text-sm outline-none transition focus:border-[#0f8f9e] focus:ring-1 focus:ring-[#0f8f9e]"
              />
            </div>

            {/* Expiry and Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Expiry <span className="text-xs font-normal text-slate-400">(optional)</span></label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-xl border border-slate-200 bg-slate-55 pl-10 pr-4 py-3 text-sm outline-none transition focus:border-[#0f8f9e] focus:ring-1 focus:ring-[#0f8f9e]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Password Protection</label>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 h-[46px]">
                  <span className="text-xs text-slate-500 font-medium">Require a password</span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={passwordEnabled}
                      onChange={(e) => setPasswordEnabled(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#0f8f9e] peer-checked:after:translate-x-full peer-focus:outline-hidden"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Password input when enabled */}
            {passwordEnabled && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Enter password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-55 pl-10 pr-10 py-3 text-sm outline-none transition focus:border-[#0f8f9e] focus:ring-1 focus:ring-[#0f8f9e]"
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

            {/* Generate QR Code toggle */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Generate QR Code</span>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={generateQr}
                  onChange={(e) => setGenerateQr(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#0f8f9e] peer-checked:after:translate-x-full peer-focus:outline-hidden"></div>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="w-1/3 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50 transition"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-[#0f8f9e] py-3 text-sm font-semibold text-white transition hover:bg-[#0f8f9e]/90 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Short Link"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
