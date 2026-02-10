"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { addExpense } from "@/lib/finance/service";

export function ExpenseLoggerCard() {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("General");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await addExpense(user.uid, {
        amount: Number(amount),
        category,
        dateISO: date
      });
      setAmount("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-panel">
      <h2 className="text-lg font-semibold text-slateInk">Log Expense</h2>
      <p className="mt-1 text-sm text-slate-600">Each expense is permanently stored and deducted from principal.</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-sm text-slate-700">
          Amount
          <input value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-xl border p-2" />
        </label>
        <label className="block text-sm text-slate-700">
          Category
          <input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-xl border p-2" />
        </label>
        <label className="block text-sm text-slate-700">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-xl border p-2" />
        </label>
        <button disabled={saving} type="submit" className="rounded-xl bg-ember px-4 py-2 text-sm font-medium text-white">
          {saving ? "Saving..." : "Add Expense"}
        </button>
      </form>
    </section>
  );
}
