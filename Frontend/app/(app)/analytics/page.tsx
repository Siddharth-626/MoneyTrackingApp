"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { AuthGate } from "@/components/auth/AuthGate";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useFinanceDataset } from "@/hooks/useFinanceDataset";
import {
  applyAnalyticsFilters,
  bestEarningWeekday,
  computeStreak,
  groupExpensesByMonth,
  groupIncomeByDay,
  groupIncomeByMonth,
  highestEarningDay,
  monthOverMonth
} from "@/lib/finance/analytics";
import { formatCurrency } from "@/lib/finance/calculations";
import { exportCSV, exportExcel, exportJSON, exportPdfReport } from "@/lib/finance/export";
import { updateFinancialProfileV2 } from "@/lib/finance/service";
import { useAuth } from "@/hooks/useAuth";
import { signOutUser } from "@/lib/firebase/auth";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { profile, classEntries, expenses, loading, error } = useFinanceDataset();

  const PIE_COLORS_1 = ["#30c48d", "#f97316"];
  const PIE_COLORS_2 = ["#0b3b74", "#30c48d"];

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [startISO, setStartISO] = useState("");
  const [endISO, setEndISO] = useState("");
  const [onlyIncomeDays, setOnlyIncomeDays] = useState(false);
  const [onlyExpenseDays, setOnlyExpenseDays] = useState(false);

  const [goalDraft, setGoalDraft] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  const dailyChartRef = useRef<HTMLDivElement | null>(null);
  const monthlyChartRef = useRef<HTMLDivElement | null>(null);
  const mixChartRef = useRef<HTMLDivElement | null>(null);
  const piesChartRef = useRef<HTMLDivElement | null>(null);

  const filters = useMemo(
    () => ({
      year,
      month,
      range: startISO || endISO ? { startISO: startISO || undefined, endISO: endISO || undefined } : undefined,
      onlyIncomeDays,
      onlyExpenseDays
    }),
    [year, month, startISO, endISO, onlyIncomeDays, onlyExpenseDays]
  );

  const filtered = useMemo(() => {
    return applyAnalyticsFilters(classEntries, expenses, filters);
  }, [classEntries, expenses, filters]);

  const dailyIncome = useMemo(() => groupIncomeByDay(filtered.entries).map((d) => ({ date: d.dateISO, income: d.amount })), [filtered.entries]);
  const monthlyIncome = useMemo(
    () => groupIncomeByMonth(filtered.entries).map((m) => ({ month: m.monthKey, income: m.amount })),
    [filtered.entries]
  );
  const monthlyExpenses = useMemo(
    () => groupExpensesByMonth(filtered.expenses).map((m) => ({ month: m.monthKey, expenses: m.amount })),
    [filtered.expenses]
  );

  const monthComparison = useMemo(() => monthOverMonth(classEntries, year, month), [classEntries, year, month]);
  const streak = useMemo(() => computeStreak(classEntries), [classEntries]);
  const weekday = useMemo(() => bestEarningWeekday(classEntries), [classEntries]);
  const bestDay = useMemo(() => highestEarningDay(filtered.entries), [filtered.entries]);

  const totals = useMemo(() => {
    if (!profile) return null;
    const totalClassesTaken = filtered.entries.length;
    const totalEarnings = filtered.entries.reduce((s, e) => s + e.earning, 0) + profile.totalInterest;
    const totalExpenses = filtered.expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = Number(profile.netProfit ?? 0);
    const totalValue = profile.principal + netProfit;
    const netGrowth = totalValue - profile.initialPrincipal;
    const roiPct = profile.initialPrincipal > 0 ? (netGrowth / profile.initialPrincipal) * 100 : 0;
    const monthlyAvg = monthlyIncome.length ? monthlyIncome.reduce((s, m) => s + m.income, 0) / monthlyIncome.length : 0;

    return {
      totalClassesTaken,
      totalEarnings,
      totalExpenses,
      netProfit,
      currentPrincipal: profile.principal,
      roiPct,
      highestEarningDay: bestDay.dateISO ? `${bestDay.dateISO} (${formatCurrency(bestDay.amount)})` : "—",
      monthlyAverage: monthlyAvg
    };
  }, [profile, filtered.entries, filtered.expenses, monthlyIncome, bestDay]);

  const goal = Number(profile?.goals?.monthlyIncomeGoal ?? 0);
  const currentMonthIncome = useMemo(() => {
    const mk = `${year}-${String(month).padStart(2, "0")}`;
    return groupIncomeByMonth(classEntries).find((m) => m.monthKey === mk)?.amount ?? 0;
  }, [classEntries, year, month]);
  const goalPct = goal > 0 ? Math.min(100, (currentMonthIncome / goal) * 100) : 0;

  const saveGoal = async () => {
    if (!user || !profile) return;
    setSavingGoal(true);
    try {
      await updateFinancialProfileV2(user.uid, {
        goals: {
          monthlyIncomeGoal: Number(goalDraft || 0)
        }
      });
    } finally {
      setSavingGoal(false);
    }
  };

  const doExportJSON = () => {
    if (!profile) return;
    exportJSON({ profile, classEntries: filtered.entries, expenses: filtered.expenses }, `money-tracking-backup-${Date.now()}.json`);
  };

  const doExportCSV = () => {
    exportCSV(
      filtered.entries.map((e) => ({ date: e.dateISO, earning: e.earning, note: e.note ?? "" })),
      `class-entries-${Date.now()}.csv`
    );
  };

  const doExportExcel = async () => {
    if (!profile) return;
    await exportExcel(
      [
        { name: "Class Entries", rows: filtered.entries.map((e) => ({ date: e.dateISO, earning: e.earning, note: e.note ?? "" })) },
        {
          name: "Expenses",
          rows: filtered.expenses.map((e) => ({
            date: e.dateISO,
            category: e.category === "Custom" ? e.customCategory ?? "Custom" : e.category,
            amount: e.amount,
            notes: e.notes ?? ""
          }))
        }
      ],
      `money-tracking-${Date.now()}.xlsx`
    );
  };

  const doExportPDF = async () => {
    if (!profile || !totals) return;
    const nodes = [
      dailyChartRef.current ? { title: "Daily Income Trend", node: dailyChartRef.current } : null,
      monthlyChartRef.current ? { title: "Monthly Income Trend", node: monthlyChartRef.current } : null,
      mixChartRef.current ? { title: "Monthly Income vs Expenses", node: mixChartRef.current } : null,
      piesChartRef.current ? { title: "Breakdowns", node: piesChartRef.current } : null
    ].filter(Boolean) as Array<{ title: string; node: HTMLElement }>;

    await exportPdfReport(
      {
        profile,
        entries: filtered.entries,
        expenses: filtered.expenses,
        summary: {
          totalClassesTaken: totals.totalClassesTaken,
          totalEarnings: totals.totalEarnings,
          totalExpenses: totals.totalExpenses,
          netProfit: totals.netProfit,
          currentPrincipal: totals.currentPrincipal,
          roiPct: totals.roiPct
        },
        chartNodes: nodes
      },
      `money-tracking-report-${Date.now()}.pdf`
    );
  };

  return (
    <AuthGate>
      <main className="mx-auto max-w-6xl p-4 md:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-slateInk dark:text-slate-100 md:text-3xl">Analytics</h1>
          <div className="flex gap-2">
            <Link href="/dashboard" className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
              Dashboard
            </Link>
            <Link href="/monthly" className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
              Monthly
            </Link>
            <ThemeToggle />
            <button type="button" onClick={signOutUser} className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm dark:text-slate-100">
              Sign Out
            </button>
          </div>
        </header>

        {error ? (
          <div role="alert" className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        ) : loading ? (
          <p className="text-slate-600 dark:text-slate-400">Loading analytics...</p>
        ) : !profile || !totals ? (
          <div role="alert" className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-700 dark:text-amber-400">
            No analytics data available.
          </div>
        ) : (
          <div className="space-y-4">
            <section className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
              <h2 className="text-lg font-semibold text-slateInk dark:text-slate-100">Filters</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  Year
                  <input
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2"
                  />
                </label>
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  Month
                  <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {String(i + 1).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  Start date
                  <input type="date" value={startISO} onChange={(e) => setStartISO(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2" />
                </label>
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  End date
                  <input type="date" value={endISO} onChange={(e) => setEndISO(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2" />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-700 dark:text-slate-300">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={onlyIncomeDays} onChange={(e) => setOnlyIncomeDays(e.target.checked)} />
                  Only income days
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={onlyExpenseDays} onChange={(e) => setOnlyExpenseDays(e.target.checked)} />
                  Only expense days
                </label>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Total Classes Taken", value: String(totals.totalClassesTaken) },
                { label: "Total Earnings", value: formatCurrency(totals.totalEarnings) },
                { label: "Total Expenses", value: formatCurrency(totals.totalExpenses) },
                { label: "Net Profit", value: formatCurrency(totals.netProfit) },
                { label: "Current Principal", value: formatCurrency(totals.currentPrincipal) },
                { label: "ROI %", value: `${totals.roiPct.toFixed(2)}%` },
                { label: "Highest Earning Day", value: totals.highestEarningDay },
                { label: "Monthly Average", value: formatCurrency(totals.monthlyAverage) }
              ].map((c) => (
                <article key={c.label} className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-panel">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{c.label}</p>
                  <p className="mt-1 text-xl font-semibold text-slateInk dark:text-slate-100">{c.value}</p>
                </article>
              ))}
            </section>

            <section className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
              <h2 className="text-lg font-semibold text-slateInk dark:text-slate-100">Smart</h2>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slateInk dark:text-slate-100">Monthly income goal</span>
                    <span className="text-slate-600 dark:text-slate-400">{formatCurrency(currentMonthIncome)} / {formatCurrency(goal)}</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white dark:bg-slate-600">
                    <div className="h-2 rounded-full bg-mint" style={{ width: `${goalPct}%` }} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={goalDraft}
                      onChange={(e) => setGoalDraft(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2 text-sm"
                      placeholder="Set goal (amount)"
                    />
                    <button
                      type="button"
                      disabled={savingGoal}
                      onClick={saveGoal}
                      className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {savingGoal ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-3 text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slateInk dark:text-slate-100">Class streak</span>
                    <span className="font-semibold text-slateInk dark:text-slate-100">{streak} days</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-medium text-slateInk dark:text-slate-100">Best earning weekday</span>
                    <span className="font-semibold text-slateInk dark:text-slate-100">{weekday.weekday}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-medium text-slateInk dark:text-slate-100">Vs previous month</span>
                    <span className="font-semibold text-slateInk dark:text-slate-100">{formatCurrency(monthComparison.delta)} ({monthComparison.pct.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div ref={dailyChartRef} className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
                <h2 className="text-lg font-semibold text-slateInk dark:text-slate-100">Daily income trend</h2>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyIncome}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" hide />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="income" stroke="#30c48d" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div ref={monthlyChartRef} className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
                <h2 className="text-lg font-semibold text-slateInk dark:text-slate-100">Monthly income trend</h2>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyIncome}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="income" stroke="#0b3b74" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div ref={mixChartRef} className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
                <h2 className="text-lg font-semibold text-slateInk dark:text-slate-100">Monthly income comparison</h2>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyIncome.map((m) => ({ ...m, expenses: monthlyExpenses.find((e) => e.month === m.month)?.expenses ?? 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="income" fill="#30c48d" />
                      <Bar dataKey="expenses" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div ref={piesChartRef} className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
                <h2 className="text-lg font-semibold text-slateInk dark:text-slate-100">Breakdowns</h2>
                <div className="mt-4 grid h-64 grid-cols-2 gap-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip />
                      <Pie
                        data={[
                          { name: "Income", value: totals.totalEarnings },
                          { name: "Expenses", value: totals.totalExpenses }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={80}
                      >
                        {[totals.totalEarnings, totals.totalExpenses].map((_, i) => (
                          <Cell key={`ie-${i}`} fill={PIE_COLORS_1[i]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip />
                      <Pie
                        data={[
                          { name: "Principal", value: totals.currentPrincipal },
                          { name: "Profit", value: totals.netProfit }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={80}
                      >
                        {[totals.currentPrincipal, totals.netProfit].map((_, i) => (
                          <Cell key={`pp-${i}`} fill={PIE_COLORS_2[i]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
              <h2 className="text-lg font-semibold text-slateInk dark:text-slate-100">Export</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={doExportCSV} className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
                  CSV
                </button>
                <button type="button" onClick={doExportJSON} className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
                  JSON backup
                </button>
                <button type="button" onClick={doExportExcel} className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
                  Excel
                </button>
                <button type="button" onClick={doExportPDF} className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
                  PDF report
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </AuthGate>
  );
}
