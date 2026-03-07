"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signOutUser } from "@/lib/firebase/auth";

const SLOW_THRESHOLD_MS = 5_000;

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, error } = useAuth();
  const router = useRouter();
  const [isSlow, setIsSlow] = useState(false);

  // Show a "taking longer than usual" hint after 5 seconds of loading
  useEffect(() => {
    if (!loading) return;
    const id = setTimeout(() => setIsSlow(true), SLOW_THRESHOLD_MS);
    return () => clearTimeout(id);
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    if (!user && !error) router.replace("/signin");
  }, [loading, router, user, error]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-panel">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Authentication Error</h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={() => signOutUser()}
            className="mt-6 w-full rounded-xl bg-slate-100 dark:bg-slate-700 px-4 py-2.5 text-sm font-medium text-slateInk dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
          >
            Sign Out &amp; Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        {/* Spinner */}
        <svg className="h-8 w-8 animate-spin text-bankBlue dark:text-slate-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {loading ? "Authenticating…" : "Redirecting…"}
        </p>
        {isSlow && loading && (
          <p className="text-xs text-slate-500 dark:text-slate-500 max-w-xs text-center">
            This is taking longer than usual. Please check your internet connection.
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
