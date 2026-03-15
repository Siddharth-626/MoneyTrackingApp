"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || error) return;
    router.replace(user ? "/dashboard" : "/signin");
  }, [loading, user, error, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <svg className="h-8 w-8 animate-spin text-bankBlue dark:text-slate-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
    </main>
  );
}
