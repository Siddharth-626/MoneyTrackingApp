"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { addExpense } from "@/lib/finance/service";
import { formatCurrency } from "@/lib/finance/calculations";
import { useExpenses } from "@/hooks/useExpenses";

const CATEGORIES = ["Travel", "Maintenance", "Misc", "Custom"] as const;

export function ExpenseLoggerCard() {
  const { user } = useAuth();
  const { rows, loading, error: loadError } = useExpenses();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Misc");
  const [customCategory, setCustomCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const numAmount = Number(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      setMessage({ type: "error", text: "Please enter a valid positive amount." });
      return;
    }
    if (!date) {
      setMessage({ type: "error", text: "Please select a date." });
      return;
    }
    if (category === "Custom" && !customCategory.trim()) {
      setMessage({ type: "error", text: "Please enter a custom category name." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await addExpense(user.uid, {
        amount: numAmount,
        category,
        customCategory: category === "Custom" ? customCategory : undefined,
        dateISO: date,
        notes: notes || undefined
      });
      setAmount("");
      setNotes("");
      setCustomCategory("");
      setMessage({ type: "success", text: "Expense added successfully." });
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to add expense." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
      <h2 className="text-lg font-semibold text-slateInk dark:text-slate-100">Expenses</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Expenses reduce Net Profit and are stored as an audit trail.</p>

      {message ? (
        <div className={`mt-3 rounded-xl p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
          {message.text}
        </div>
      ) : null}

      {loadError ? (
        <div className="mt-3 rounded-xl bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">{loadError}</div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-sm text-slate-700 dark:text-slate-300">
          Amount
          <input type="number" step="any" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2" />
        </label>
        <label className="block text-sm text-slate-700 dark:text-slate-300">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {category === "Custom" ? (
          <label className="block text-sm text-slate-700 dark:text-slate-300">
            Custom category
            <input
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2"
              placeholder="e.g. Fuel"
            />
          </label>
        ) : null}
        <label className="block text-sm text-slate-700 dark:text-slate-300">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2" />
        </label>
        <label className="block text-sm text-slate-700 dark:text-slate-300">
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full resize-none rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2"
            placeholder="Optional details..."
          />
        </label>
        <button disabled={saving} type="submit" className="rounded-xl bg-ember px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {saving ? "Saving..." : "Add Expense"}
        </button>
      </form>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slateInk dark:text-slate-100">Recent</h3>
          {loading ? <span className="text-xs text-slate-500 dark:text-slate-400">Loading...</span> : null}
        </div>
        <div className="mt-2 space-y-2">
          {rows.slice(0, 6).map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-slateInk dark:text-slate-100">
                  {r.category === "Custom" ? r.customCategory ?? "Custom" : r.category}
                </div>
                <div className="text-sm font-semibold text-slateInk dark:text-slate-100">-{formatCurrency(r.amount)}</div>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{r.dateISO}</span>
                {r.notes ? <span className="truncate">{r.notes}</span> : <span />}
              </div>
            </div>
          ))}
          {rows.length === 0 && !loading ? <p className="text-sm text-slate-600 dark:text-slate-400">No expenses yet.</p> : null}
        </div>
      </div>
    </section>
  );
}
