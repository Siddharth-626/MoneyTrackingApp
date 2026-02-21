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
    if (loading || error) return;
    if (!user) router.replace("/signin");
  }, [loading, error, router, user]);

  if (error) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">
          <p className="font-semibold">Authentication Error</p>
          <p className="mt-1">{error.message}</p>
        </div>
        <button
          onClick={() => signOutUser()}
          className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white"
        >
          Sign Out & Retry
        </button>
      </div>
    );
  }

  if (loading || !user) {
    return <div className="p-6 text-sm text-slate-600 dark:text-slate-400">Authenticating...</div>;
  }

  return <>{children}</>;
}
