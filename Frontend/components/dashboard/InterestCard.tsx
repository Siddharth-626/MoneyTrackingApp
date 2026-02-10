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

  const onApply = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setProcessing(true);
    try {
      await applyMonthlyInterest(user.uid, monthKey, profile.monthlyInterestRate);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-panel">
      <h2 className="text-lg font-semibold text-slateInk">Monthly Interest</h2>
      <p className="mt-1 text-sm text-slate-600">Applied once per month using current principal.</p>
      <form onSubmit={onApply} className="mt-4 space-y-3">
        <label className="block text-sm text-slate-700">
          Month (YYYY-MM)
          <input
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value as MonthKey)}
            className="mt-1 w-full rounded-xl border p-2"
          />
        </label>
        <button disabled={processing} type="submit" className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
          {processing ? "Applying..." : "Apply Interest"}
        </button>
      </form>
    </section>
  );
}
