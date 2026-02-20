"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

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
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/30 p-6 shadow-panel">
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400">Authentication Error</h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-sm text-slate-600 dark:text-slate-400">
        Authenticating...
      </div>
    );
  }

  return <>{children}</>;
}
