"use client";

import Link from "next/link";
import { AuthGate } from "@/components/auth/AuthGate";
import { ClassTrackerCard } from "@/components/dashboard/ClassTrackerCard";
import { ExpenseLoggerCard } from "@/components/dashboard/ExpenseLoggerCard";
import { InterestCard } from "@/components/dashboard/InterestCard";
import { PrincipalCard } from "@/components/dashboard/PrincipalCard";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { useFinanceData } from "@/hooks/useFinanceData";
import { signOutUser } from "@/lib/firebase/auth";

export default function DashboardPage() {
  const { data, loading, error } = useFinanceData();

  return (
    <AuthGate>
      <main className="mx-auto max-w-6xl p-4 md:p-8">
        <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold text-slateInk md:text-3xl">Dashboard</h1>
          <div className="flex gap-2">
            <Link href="/monthly" className="w-fit rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
              Monthly View
            </Link>
            <button type="button" onClick={signOutUser} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm">
              Sign Out
            </button>
          </div>
        </header>

        {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading || !data ? (
          <p className="text-slate-600">Loading financial data...</p>
        ) : (
          <div className="space-y-4">
            <SummaryCards dashboard={data.dashboard} />
            <div className="grid gap-4 lg:grid-cols-2">
              <PrincipalCard profile={data.profile} />
              <ClassTrackerCard profile={data.profile} />
              <InterestCard profile={data.profile} />
              <ExpenseLoggerCard />
            </div>
          </div>
        )}
      </main>
    </AuthGate>
  );
}
