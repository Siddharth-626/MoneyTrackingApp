"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signOutUser } from "@/lib/firebase/auth";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user && !error) router.replace("/signin");
  }, [loading, router, user, error]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-panel">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Authentication Error</h2>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">{error}</p>
          <button
            type="button"
            onClick={() => signOutUser()}
            className="mt-6 w-full rounded-xl bg-slate-200 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slateInk dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Sign Out & Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-sm text-slate-600 dark:text-slate-400 animate-pulse">Authenticating...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-sm text-slate-600 dark:text-slate-400">Redirecting...</div>
      </div>
    );
  }

  return <>{children}</>;
}
