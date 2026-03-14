"use client";

import Link from "next/link";
import { AuthGate } from "@/components/auth/AuthGate";
import { MonthlyTable } from "@/components/monthly/MonthlyTable";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useMonthlyLedger } from "@/hooks/useMonthlyLedger";
import { signOutUser } from "@/lib/firebase/auth";

export default function MonthlyPage() {
  const { rows, loading, error } = useMonthlyLedger();

  return (
    <AuthGate>
      <main className="mx-auto max-w-6xl p-4 md:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-slateInk dark:text-slate-100 md:text-3xl">Monthly Breakdown</h1>
          <div className="flex gap-2">
            <Link href="/dashboard" className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
              Back
            </Link>
            <Link href="/analytics" className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
              Analytics
            </Link>
            <ThemeToggle />
            <button type="button" onClick={signOutUser} className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm dark:text-slate-100">
              Sign Out
            </button>
          </div>
        </header>

        {error && (
          <div role="alert" className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-700 dark:text-amber-400">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Loading months...
          </div>
        ) : (
          <MonthlyTable rows={rows} />
        )}
      </main>
    </AuthGate>
  );
}
