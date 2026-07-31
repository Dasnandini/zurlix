"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo1.png";
import Image from "next/image";
const getProviderLabel = (provider: string) => {
  switch (provider) {
    case "google":
      return "Google";
    case "github":
      return "GitHub";
    default:
      return provider;
  }
};

function LoginContent() {
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");
  const duplicateProvider = authError?.startsWith("OAuthAccountExists:")
    ? authError.split(":")[1]
    : null;

  const errorMessage = duplicateProvider
    ? `An account already exists with this email. Please sign in using ${getProviderLabel(duplicateProvider)}.`
    : null;

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", {
        callbackUrl: "/dashboard",
      });
    } catch (error) {
      console.error(error);
      setIsGoogleLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setIsGithubLoading(true);
    try {
      await signIn("github", {
        callbackUrl: "/dashboard",
      });
    } catch (error) {
      console.error(error);
      setIsGithubLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-slate-50 justify-center items-center relative overflow-hidden select-none">
   

      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-hidden">
        <div className="w-full max-w-[460px] flex flex-col items-center">
          {errorMessage ? (
            <div className="w-full mb-4 rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3.5 text-xs font-medium text-red-700 shadow-sm animate-pulse-subtle">
              {errorMessage}
            </div>
          ) : null}

          <div className="w-full bg-white rounded-[32px] p-8 sm:p-12 shadow-[0_8px_40px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.02)] border border-slate-100/80 flex flex-col relative z-10">
            
            {/* Zurlix Logo */}
            <div className="flex items-center gap-3 justify-center mb-7">
              <div className="flex  items-center justify-center">
                <Image src={logo} alt="Zurlix Logo" className="" />
              </div>
            </div>

            {/* Headers */}
            <div className="text-center mb-8">
              <h2 className="text-[26px] font-extrabold text-slate-900 tracking-tight leading-none">Welcome to Zurlix</h2>
              <p className="text-sm text-slate-400 font-semibold mt-2.5">
                Sign in to manage your links and analytics.
              </p>
            </div>

            <div className="space-y-4">
              <button
                disabled={isGoogleLoading || isGithubLoading}
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center py-3.5 border border-slate-200/80 rounded-2xl bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100/80 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-3 text-slate-500" />
                ) : (
                  <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
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
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Continue with Google
              </button>

              <button
                disabled={isGoogleLoading || isGithubLoading}
                onClick={handleGithubSignIn}
                className="w-full flex items-center justify-center py-3.5 border border-slate-200/80 rounded-2xl bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100/80 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
              >
                {isGithubLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-3 text-slate-500" />
                ) : (
                  <svg className="h-5 w-5 mr-3 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.43 9.8 8.2 11.38.6.11.82-.26.82-.57 0-.28-.01-1.04-.01-2.04-3.34.72-4.04-1.61-4.04-1.61C4.42 18.07 3.63 17.7 3.63 17.7c-1.08-.74.08-.73.08-.73 1.2.08 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.77.41-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23.96-.27 1.98-.4 3-.41 1.02 0 2.04.14 3 .41 2.29-1.55 3.3-1.23 3.3-1.23.64 1.65.24 2.87.12 3.18.76.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.47 5.92.42.36.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .31.2.69.82.57C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12" />
                  </svg>
                )}
                Continue with GitHub
              </button>
            </div>

            <div className="flex items-center my-7">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="px-4 text-[10px] font-bold tracking-wider text-slate-300 uppercase">OR</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <p className="text-xs text-slate-400 text-center leading-relaxed font-medium">
              By continuing, you agree to our{" "}
              <a href="#" className="text-slate-600 hover:text-slate-800 hover:underline transition-colors font-semibold">
                Terms
              </a>{" "}
              &{" "}
              <a href="#" className="text-slate-600 hover:text-slate-800 hover:underline transition-colors font-semibold">
                Privacy Policy
              </a>.
            </p>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-400/80 z-10 w-full text-center">
          © 2026 Zurlix. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-[#0f8f9e]" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
