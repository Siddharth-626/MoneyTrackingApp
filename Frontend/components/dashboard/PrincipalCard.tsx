"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { updateFinancialProfile } from "@/lib/finance/service";
import { FinancialProfile } from "@/types/finance";

export function PrincipalCard({ profile }: { profile: FinancialProfile }) {
  const { user } = useAuth();
  const [principal, setPrincipal] = useState(profile.principal.toString());
  const [classRate, setClassRate] = useState(profile.classRate.toString());
  const [interestRate, setInterestRate] = useState(profile.monthlyInterestRate.toString());

  const onSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    await updateFinancialProfile(user.uid, {
      principal: Number(principal),
      classRate: Number(classRate),
      monthlyInterestRate: Number(interestRate)
    });
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-panel">
      <h2 className="text-lg font-semibold text-slateInk">Principal & Rates</h2>
      <form onSubmit={onSave} className="mt-4 space-y-3">
        <label className="block text-sm text-slate-700">
          Current Principal
          <input value={principal} onChange={(e) => setPrincipal(e.target.value)} className="mt-1 w-full rounded-xl border p-2" />
        </label>
        <label className="block text-sm text-slate-700">
          Class Rate
          <input value={classRate} onChange={(e) => setClassRate(e.target.value)} className="mt-1 w-full rounded-xl border p-2" />
        </label>
        <label className="block text-sm text-slate-700">
          Monthly Interest Rate (%)
          <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="mt-1 w-full rounded-xl border p-2" />
        </label>
        <button type="submit" className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
          Save Settings
        </button>
      </form>
    </section>
  );
}
