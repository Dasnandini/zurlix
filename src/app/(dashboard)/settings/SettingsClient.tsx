"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { 
  User as UserIcon, Lock, Moon, Sun, Calendar, Trash2, 
  Check, Save, AlertTriangle
} from "lucide-react";

interface Account {
  provider: string;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  accounts: Account[];
}

export default function SettingsClient({ user }: { user: User }) {
  const [name, setName] = useState(user.name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [darkMode, setDarkMode] = useState(false);

  const [defaultExpiry, setDefaultExpiry] = useState("never");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark") || 
                   localStorage.getItem("theme") === "dark";
    setDarkMode(isDark);

    const expiry = localStorage.getItem("defaultLinkExpiry") || "never";
    setDefaultExpiry(expiry);
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);
    setProfileError("");

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update profile");
      }

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || "An error occurred");
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleTheme = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleExpiryChange = (val: string) => {
    setDefaultExpiry(val);
    localStorage.setItem("defaultLinkExpiry", val);
  };

  const handleDeleteAccount = async () => {
    const doubleConfirm = confirm(
      "WARNING: This action is irreversible. Deleting your account will remove your user profile and ALL shortened links and statistics permanently. Are you absolutely sure?"
    );
    if (!doubleConfirm) return;

    try {
      const res = await fetch("/api/settings/account", { method: "DELETE" });
      if (res.ok) {
        alert("Your account has been deleted successfully.");
        signOut({ callbackUrl: "/login" });
      } else {
        alert("Failed to delete account. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred during account deletion.");
    }
  };

  const isGoogleConnected = user.accounts.some((acc) => acc.provider === "google");
  const isGithubConnected = user.accounts.some((acc) => acc.provider === "github");

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5 font-medium">
          Customize your user profile, configurations, and security.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
          <UserIcon className="h-4 w-4 text-slate-400" /> User Profile
        </h3>
        <p className="text-[10px] text-slate-400 font-medium mb-5">Update your display information and contact details</p>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {profileError && (
            <p className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
              {profileError}
            </p>
          )}
          {profileSuccess && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-600">
              Profile updated successfully!
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-55 px-3 py-2.5 text-xs outline-none focus:border-[#0f8f9e]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Email Address</label>
              <input
                type="email"
                value={user.email || ""}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-100/50 px-3 py-2.5 text-xs outline-none text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f8f9e] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#0f8f9e]/90 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" /> {savingProfile ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
          <GithubIcon className="h-4 w-4 text-slate-400" /> Connected Accounts
        </h3>
        <p className="text-[10px] text-slate-400 font-medium mb-5">View and manage third-party login providers</p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">Google Account</p>
                <p className="text-[10px] text-slate-400">Sign in with Google authentication</p>
              </div>
            </div>
            {isGoogleConnected ? (
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                Connected
              </span>
            ) : (
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-400">
                Not Linked
              </span>
            )}
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border">
                <GithubIcon className="h-4 w-4 text-slate-800" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">GitHub Account</p>
                <p className="text-[10px] text-slate-400">Sign in with GitHub credentials</p>
              </div>
            </div>
            {isGithubConnected ? (
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                Connected
              </span>
            ) : (
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-400">
                Not Linked
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
            {darkMode ? <Moon className="h-4 w-4 text-[#0f8f9e]" /> : <Sun className="h-4 w-4 text-[#0f8f9e]" />}
            Theme Preference
          </h3>
          <p className="text-[10px] text-slate-400 font-medium mb-5">Switch between light and dark display modes</p>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-xs font-semibold text-slate-600">Dark Mode</span>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) => toggleTheme(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#0f8f9e] peer-checked:after:translate-x-full"></div>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-slate-400" /> Default Link Expiry
          </h3>
          <p className="text-[10px] text-slate-400 font-medium mb-5">Set your default lifetime limit for new short links</p>

          <select
            value={defaultExpiry}
            onChange={(e) => handleExpiryChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 outline-none "
          >
            <option value="never">Never (Permanent links)</option>
            <option value="7">7 Days</option>
            <option value="30">30 Days</option>
            <option value="90">90 Days</option>
          </select>
        </div>

      </div>

      <div className="rounded-2xl border border-slate-200 bg-rose-50/20 p-6">
        <h3 className="text-sm font-bold text-rose-600 flex items-center gap-2 mb-1">
          <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" /> Danger Zone
        </h3>
        <p className="text-[10px] text-slate-400 font-medium mb-5">Permanently delete your entire account database record</p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-rose-100 bg-white">
          <div>
            <p className="text-xs font-bold text-slate-700">Delete Account</p>
            <p className="text-[10px] text-slate-400 mt-0.5">This action deletes all your shortened links and analytics forever.</p>
          </div>
          <button
            onClick={handleDeleteAccount}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700 shadow-xs"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}
