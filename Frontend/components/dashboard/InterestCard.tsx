"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { applyMonthlyInterest } from "@/lib/finance/service";
import { FinancialProfile, MonthKey } from "@/types/finance";

function currentMonthKey(): MonthKey {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function InterestCard({ profile }: { profile: FinancialProfile }) {
  const { user } = useAuth();
  const [monthKey, setMonthKey] = useState<MonthKey>(currentMonthKey());
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const onApply = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setProcessing(true);
    setMessage(null);
    try {
      await applyMonthlyInterest(user.uid, monthKey, profile.monthlyInterestRate);
      setMessage({ type: "success", text: "Interest applied successfully. (Updated if already exists)" });
    } catch (error: unknown) {
      console.error(error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to apply interest."
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
      <h2 className="text-lg font-semibold text-slateInk dark:text-slate-100">Monthly Interest</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Applied once per month using current principal.</p>
      <form onSubmit={onApply} className="mt-4 space-y-3">
        {message && (
          <div className={`rounded-xl p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
            {message.text}
          </div>
        )}
        <label className="block text-sm text-slate-700 dark:text-slate-300">
          Month (YYYY-MM)
          <input
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value as MonthKey)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2"
          />
        </label>
        <button disabled={processing} type="submit" className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
          {processing ? "Applying..." : "Apply Interest"}
        </button>
      </form>
    </section>
  );
}
