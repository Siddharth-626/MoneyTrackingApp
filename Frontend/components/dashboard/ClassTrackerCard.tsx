"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { setMonthlyClasses } from "@/lib/finance/service";
import { FinancialProfile, MonthKey } from "@/types/finance";

function currentMonthKey(): MonthKey {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function ClassTrackerCard({ profile }: { profile: FinancialProfile }) {
  const { user } = useAuth();
  const [monthKey, setMonthKey] = useState<MonthKey>(currentMonthKey());
  const [classes, setClasses] = useState("0");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await setMonthlyClasses(user.uid, monthKey, Number(classes), profile.classRate);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-panel">
      <h2 className="text-lg font-semibold text-slateInk">Class Tracking</h2>
      <p className="mt-1 text-sm text-slate-600">Income is auto-added to principal.</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-sm text-slate-700">
          Month (YYYY-MM)
          <input
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value as MonthKey)}
            className="mt-1 w-full rounded-xl border p-2"
          />
        </label>
        <label className="block text-sm text-slate-700">
          Classes in Month
          <input value={classes} onChange={(e) => setClasses(e.target.value)} className="mt-1 w-full rounded-xl border p-2" />
        </label>
        <button disabled={saving} type="submit" className="rounded-xl bg-mint px-4 py-2 text-sm font-medium text-white">
          {saving ? "Saving..." : "Save Classes"}
        </button>
      </form>
    </section>
  );
}
