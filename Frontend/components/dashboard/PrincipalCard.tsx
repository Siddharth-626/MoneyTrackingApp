"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { addNetProfitToPrincipal, updateFinancialProfileV2 } from "@/lib/finance/service";
import { formatCurrency } from "@/lib/finance/calculations";
import { FinancialProfile } from "@/types/finance";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function PrincipalCard({ profile }: { profile: FinancialProfile }) {
  const { user } = useAuth();
  const [principal, setPrincipal] = useState(profile.principal.toString());
  const [classRate, setClassRate] = useState(profile.classRate.toString());
  const [interestRate, setInterestRate] = useState(profile.monthlyInterestRate.toString());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [compounding, setCompounding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync local state when profile updates from Firestore subscription
  useEffect(() => {
    setPrincipal(profile.principal.toString());
    setClassRate(profile.classRate.toString());
    setInterestRate(profile.monthlyInterestRate.toString());
  }, [profile.principal, profile.classRate, profile.monthlyInterestRate]);

  const onSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const numPrincipal = Number(principal);
    const numClassRate = Number(classRate);
    const numInterestRate = Number(interestRate);

    if ([numPrincipal, numClassRate, numInterestRate].some(Number.isNaN)) {
      setMessage({ type: "error", text: "Please enter valid numbers for all fields." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await updateFinancialProfileV2(user.uid, {
        principal: numPrincipal,
        classRate: numClassRate,
        monthlyInterestRate: numInterestRate
      });
      setMessage({ type: "success", text: "Settings saved successfully." });
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  const netProfit = Number(profile.netProfit ?? 0);
  const canCompound = netProfit > 0;

  const onConfirmCompound = async () => {
    if (!user) return;
    setCompounding(true);
    setMessage(null);
    try {
      await addNetProfitToPrincipal(user.uid);
      setMessage({ type: "success", text: "Net profit added to principal successfully." });
      setConfirmOpen(false);
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to compound." });
    } finally {
      setCompounding(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
      <h2 className="text-lg font-semibold text-slateInk dark:text-slate-100">Principal & Rates</h2>

      {message ? (
        <div className={`mt-3 rounded-xl p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
          {message.text}
        </div>
      ) : null}

      <form onSubmit={onSave} className="mt-4 space-y-3">
        <label className="block text-sm text-slate-700 dark:text-slate-300">
          Current Principal
          <input type="number" step="any" value={principal} onChange={(e) => setPrincipal(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2" />
        </label>
        <label className="block text-sm text-slate-700 dark:text-slate-300">
          Class Rate (₹ per class)
          <input type="number" step="any" value={classRate} onChange={(e) => setClassRate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2" />
        </label>
        <label className="block text-sm text-slate-700 dark:text-slate-300">
          Monthly Interest Rate (%)
          <input type="number" step="any" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2" />
        </label>
        <button disabled={saving} type="submit" className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {saving ? "Saving..." : "Save Settings"}
        </button>

        <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-3 text-sm text-slate-700 dark:text-slate-300">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">Net Profit</span>
            <span className="font-semibold">{formatCurrency(netProfit)}</span>
          </div>
          <button
            type="button"
            disabled={!canCompound || compounding}
            onClick={() => setConfirmOpen(true)}
            className="mt-3 w-full rounded-xl bg-mint px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {compounding ? "Processing..." : "Add Net Profit to Principal"}
          </button>
        </div>
      </form>

      <ConfirmModal
        open={confirmOpen}
        title="Add Net Profit to Principal"
        description="This will add your current Net Profit to Principal and reset Net Profit to 0. This action is saved in compounding history."
        confirmText="Confirm"
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirmCompound}
        loading={compounding}
      />
    </section>
  );
}
