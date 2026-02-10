"use client";

import Link from "next/link";
import { AuthGate } from "@/components/auth/AuthGate";
import { MonthlyTable } from "@/components/monthly/MonthlyTable";
import { useMonthlyLedger } from "@/hooks/useMonthlyLedger";
import { signOutUser } from "@/lib/firebase/auth";

export default function MonthlyPage() {
  const { rows, loading } = useMonthlyLedger();

  return (
    <AuthGate>
      <main className="mx-auto max-w-6xl p-4 md:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-slateInk md:text-3xl">Monthly Breakdown</h1>
          <div className="flex gap-2">
            <Link href="/dashboard" className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
              Back
            </Link>
            <button type="button" onClick={signOutUser} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm">
              Sign Out
            </button>
          </div>
        </header>
        {loading ? <p className="text-slate-600">Loading months...</p> : <MonthlyTable rows={rows} />}
      </main>
    </AuthGate>
  );
}
