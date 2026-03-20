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
  YAxis,
} from "recharts";
import { AuthGate } from "@/components/auth/AuthGate";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useFinanceDataset } from "@/hooks/useFinanceDataset";
import {
  applyAnalyticsFilters,
  bestEarningWeekday,
  computeStreak,
  groupDirectIncomeByMonth,
  groupExpensesByMonth,
  groupIncomeByDay,
  groupIncomeByMonth,
  highestEarningDay,
  monthOverMonth,
} from "@/lib/finance/analytics";
import { formatCurrency } from "@/lib/finance/calculations";
import { exportCSV, exportExcel, exportJSON, exportPdfReport } from "@/lib/finance/export";
import { updateFinancialProfileV2 } from "@/lib/finance/service";
import { useAuth } from "@/hooks/useAuth";
import { signOutUser } from "@/lib/firebase/auth";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();
const CURRENT_MONTH = NOW.getMonth() + 1;

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { profile, classEntries, expenses, incomeHistory, loading, error } = useFinanceDataset();

  const [year, setYear] = useState(CURRENT_YEAR); // 0 = All Time
  const [month, setMonth] = useState(0); // 0 = All Months
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

  // Dynamic year list from actual data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const e of classEntries) years.add(Number(e.dateISO.slice(0, 4)));
    for (const e of expenses) years.add(Number(e.dateISO.slice(0, 4)));
    for (const r of incomeHistory) years.add(Number(r.dateISO.slice(0, 4)));
    if (years.size === 0) years.add(CURRENT_YEAR);
    return [...years].sort((a, b) => b - a);
  }, [classEntries, expenses, incomeHistory]);

  const filters = useMemo(
    () => ({
      year: year === 0 ? undefined : year,
      month: month === 0 ? undefined : month,
      range: startISO || endISO ? { startISO: startISO || undefined, endISO: endISO || undefined } : undefined,
      onlyIncomeDays,
      onlyExpenseDays,
    }),
    [year, month, startISO, endISO, onlyIncomeDays, onlyExpenseDays]
  );

  const filtered = useMemo(
    () => applyAnalyticsFilters(classEntries, expenses, incomeHistory, filters),
    [classEntries, expenses, incomeHistory, filters]
  );

  const dailyIncome = useMemo(
    () => groupIncomeByDay(filtered.entries).map((d) => ({ date: d.dateISO, income: d.amount })),
    [filtered.entries]
  );

  const monthlyClassIncome = useMemo(() => groupIncomeByMonth(filtered.entries), [filtered.entries]);
  const monthlyDirectIncome = useMemo(() => groupDirectIncomeByMonth(filtered.incomeRecords), [filtered.incomeRecords]);
  const monthlyExpensesData = useMemo(() => groupExpensesByMonth(filtered.expenses), [filtered.expenses]);

  // Merged monthly data: Class Income + Direct Income (stacked) vs Expenses
  const monthlyMixed = useMemo(() => {
    const monthSet = new Set([
      ...monthlyClassIncome.map((m) => m.monthKey),
      ...monthlyDirectIncome.map((m) => m.monthKey),
      ...monthlyExpensesData.map((m) => m.monthKey),
    ]);
    const classMap = new Map(monthlyClassIncome.map((m) => [m.monthKey, m.amount]));
    const directMap = new Map(monthlyDirectIncome.map((m) => [m.monthKey, m.amount]));
    const expMap = new Map(monthlyExpensesData.map((m) => [m.monthKey, m.amount]));
    return [...monthSet].sort().map((mk) => ({
      month: mk,
      "Class Income": classMap.get(mk) ?? 0,
      "Direct Income": directMap.get(mk) ?? 0,
      Expenses: expMap.get(mk) ?? 0,
    }));
  }, [monthlyClassIncome, monthlyDirectIncome, monthlyExpensesData]);

  const streak = useMemo(() => computeStreak(classEntries), [classEntries]);
  const weekday = useMemo(() => bestEarningWeekday(classEntries), [classEntries]);
  const bestDay = useMemo(() => highestEarningDay(filtered.entries), [filtered.entries]);

  // Reference year/month for month-over-month and goal tracking
  const refYear = year === 0 ? CURRENT_YEAR : year;
  const refMonth = month === 0 ? CURRENT_MONTH : month;

  const monthComparison = useMemo(
    () => monthOverMonth(classEntries, refYear, refMonth),
    [classEntries, refYear, refMonth]
  );

  const totals = useMemo(() => {
    if (!profile) return null;
    const classIncome = filtered.entries.reduce((s, e) => s + e.earning, 0);
    const directIncome = filtered.incomeRecords.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = filtered.expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = Number(profile.netProfit ?? 0);
    const totalValue = profile.principal + netProfit;
    const netGrowth = totalValue - profile.initialPrincipal;
    const roiPct = profile.initialPrincipal > 0 ? (netGrowth / profile.initialPrincipal) * 100 : 0;
    const monthlyAvg = monthlyClassIncome.length
      ? monthlyClassIncome.reduce((s, m) => s + m.amount, 0) / monthlyClassIncome.length
      : 0;
    return {
      classIncome,
      directIncome,
      totalInterest: profile.totalInterest,
      totalExpenses,
      netProfit,
      currentPrincipal: profile.principal,
      roiPct,
      highestEarningDay: bestDay.dateISO ? `${bestDay.dateISO} (${formatCurrency(bestDay.amount)})` : "—",
      monthlyAverage: monthlyAvg,
      totalClassesTaken: filtered.entries.length,
    };
  }, [profile, filtered, monthlyClassIncome, bestDay]);

  const goal = Number(profile?.goals?.monthlyIncomeGoal ?? 0);
  const currentMonthIncome = useMemo(() => {
    const mk = `${refYear}-${String(refMonth).padStart(2, "0")}`;
    return groupIncomeByMonth(classEntries).find((m) => m.monthKey === mk)?.amount ?? 0;
  }, [classEntries, refYear, refMonth]);
  const goalPct = goal > 0 ? Math.min(100, (currentMonthIncome / goal) * 100) : 0;

  const saveGoal = async () => {
    if (!user || !profile) return;
    setSavingGoal(true);
    try {
      await updateFinancialProfileV2(user.uid, { goals: { monthlyIncomeGoal: Number(goalDraft || 0) } });
    } finally {
      setSavingGoal(false);
    }
  };

  const doExportJSON = () => {
    if (!profile) return;
    exportJSON(
      { profile, classEntries: filtered.entries, expenses: filtered.expenses, incomeHistory: filtered.incomeRecords },
      `money-tracking-backup-${Date.now()}.json`
    );
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
        { name: "Direct Income", rows: filtered.incomeRecords.map((r) => ({ date: r.dateISO, amount: r.amount, note: r.note ?? "" })) },
        {
          name: "Expenses",
          rows: filtered.expenses.map((e) => ({
            date: e.dateISO,
            category: e.category === "Custom" ? e.customCategory ?? "Custom" : e.category,
            amount: e.amount,
            notes: e.notes ?? "",
          })),
        },
      ],
      `money-tracking-${Date.now()}.xlsx`
    );
  };

  const doExportPDF = async () => {
    if (!profile || !totals) return;
    const nodes = [
      dailyChartRef.current ? { title: "Daily Class Income Trend", node: dailyChartRef.current } : null,
      monthlyChartRef.current ? { title: "Monthly Overview", node: monthlyChartRef.current } : null,
      mixChartRef.current ? { title: "Income vs Expenses Trend", node: mixChartRef.current } : null,
      piesChartRef.current ? { title: "Breakdowns", node: piesChartRef.current } : null,
    ].filter(Boolean) as Array<{ title: string; node: HTMLElement }>;
    await exportPdfReport(
      {
        profile,
        entries: filtered.entries,
        expenses: filtered.expenses,
        summary: {
          totalClassesTaken: totals.totalClassesTaken,
          totalEarnings: totals.classIncome,
          totalExpenses: totals.totalExpenses,
          netProfit: totals.netProfit,
          currentPrincipal: totals.currentPrincipal,
          roiPct: totals.roiPct,
        },
        chartNodes: nodes,
      },
      `money-tracking-report-${Date.now()}.pdf`
    );
  };

  const filterLabel =
    year === 0
      ? "All Time"
      : month === 0
      ? String(year)
      : `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <AuthGate>
      <main className="mx-auto max-w-6xl p-4 md:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slateInk dark:text-slate-100 md:text-3xl">Analytics</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Viewing: <span className="font-medium text-slateInk dark:text-slate-200">{filterLabel}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard" className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
              Dashboard
            </Link>
            <Link href="/monthly" className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
              Monthly
            </Link>
            <ThemeToggle />
            <button
              type="button"
              onClick={signOutUser}
              className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm dark:text-slate-100"
            >
              Sign Out
            </button>
          </div>
        </header>

        {error ? (
          <p className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">{error}</p>
        ) : null}

        {loading || !profile || !totals ? (
          <p className="text-slate-600 dark:text-slate-400">Loading analytics...</p>
        ) : (
          <div className="space-y-4">

            {/* ── Filters ── */}
            <section className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
              <h2 className="text-lg font-semibold text-slateInk dark:text-slate-100">Filters</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  Year
                  <select
                    value={year}
                    onChange={(e) => { setYear(Number(e.target.value)); setMonth(0); }}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2"
                  >
                    <option value={0}>All Time</option>
                    {availableYears.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  Month
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    disabled={year === 0}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2 disabled:opacity-50"
                  >
                    <option value={0}>All Months</option>
                    {MONTH_NAMES.map((name, i) => (
                      <option key={i + 1} value={i + 1}>{name}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  Start date
                  <input
                    type="date"
                    value={startISO}
                    onChange={(e) => setStartISO(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2"
                  />
                </label>
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  End date
                  <input
                    type="date"
                    value={endISO}
                    onChange={(e) => setEndISO(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2"
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-700 dark:text-slate-300">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={onlyIncomeDays} onChange={(e) => setOnlyIncomeDays(e.target.checked)} />
                  Only class income days
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={onlyExpenseDays} onChange={(e) => setOnlyExpenseDays(e.target.checked)} />
                  Only expense days
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setYear(CURRENT_YEAR);
                    setMonth(0);
                    setStartISO("");
                    setEndISO("");
                    setOnlyIncomeDays(false);
                    setOnlyExpenseDays(false);
                  }}
                  className="ml-auto rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Reset filters
                </button>
              </div>
            </section>

            {/* ── Summary Cards ── */}
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Current Principal", value: formatCurrency(totals.currentPrincipal), color: "" },
                { label: "Class Income", value: formatCurrency(totals.classIncome), color: "text-mint" },
                { label: "Direct Income Added", value: formatCurrency(totals.directIncome), color: "text-bankBlue dark:text-blue-400" },
                { label: "Interest Earned", value: formatCurrency(totals.totalInterest), color: "text-mint", sub: "all-time" },
                { label: "Total Expenses", value: formatCurrency(totals.totalExpenses), color: totals.totalExpenses > 0 ? "text-ember" : "" },
                { label: "Net Profit", value: formatCurrency(totals.netProfit), color: totals.netProfit >= 0 ? "text-mint" : "text-red-500" },
                {
                  label: "ROI",
                  value: `${totals.roiPct >= 0 ? "+" : ""}${totals.roiPct.toFixed(2)}%`,
                  color: totals.roiPct >= 0 ? "text-mint" : "text-red-500",
                },
                { label: "Monthly Avg (Class)", value: formatCurrency(totals.monthlyAverage), color: "" },
              ].map((c) => (
                <article key={c.label} className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-panel">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{c.label}</p>
                  <p className={`mt-1 text-xl font-semibold tabular-nums ${c.color || "text-slateInk dark:text-slate-100"}`}>{c.value}</p>
                  {c.sub && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{c.sub}</p>}
                </article>
              ))}
            </section>

            {/* ── Smart Insights ── */}
            <section className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
              <h2 className="mb-3 text-lg font-semibold text-slateInk dark:text-slate-100">Smart Insights</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-4">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slateInk dark:text-slate-100">Monthly Income Goal</span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {formatCurrency(currentMonthIncome)} / {formatCurrency(goal)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white dark:bg-slate-600">
                    <div className="h-2 rounded-full bg-mint transition-all" style={{ width: `${goalPct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{goalPct.toFixed(0)}% achieved</p>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={goalDraft}
                      onChange={(e) => setGoalDraft(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 p-2 text-sm"
                      placeholder="Set goal amount"
                    />
                    <button
                      type="button"
                      disabled={savingGoal}
                      onClick={saveGoal}
                      className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {savingGoal ? "..." : "Save"}
                    </button>
                  </div>
                </div>
                <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Class streak</span>
                    <span className="font-semibold text-slateInk dark:text-slate-100">{streak} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Best earning weekday</span>
                    <span className="font-semibold text-slateInk dark:text-slate-100">{weekday.weekday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Highest class earning day</span>
                    <span className="font-semibold text-slateInk dark:text-slate-100">{totals.highestEarningDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Vs previous month (class)</span>
                    <span className={`font-semibold ${monthComparison.delta >= 0 ? "text-mint" : "text-red-500"}`}>
                      {formatCurrency(monthComparison.delta)} ({monthComparison.pct >= 0 ? "+" : ""}
                      {monthComparison.pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Total classes taken</span>
                    <span className="font-semibold text-slateInk dark:text-slate-100">{totals.totalClassesTaken}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Charts ── */}
            <section className="grid gap-4 lg:grid-cols-2">
              <div ref={dailyChartRef} className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
                <h2 className="text-lg font-semibold text-slateInk dark:text-slate-100">Daily Class Income</h2>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyIncome}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" hide />
                      <YAxis tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} width={55} />
                      <Tooltip formatter={(v) => typeof v === "number" ? formatCurrency(v) : String(v ?? "")} />
                      <Line type="monotone" dataKey="income" name="Class Income" stroke="#30c48d" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div ref={monthlyChartRef} className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
                <h2 className="text-lg font-semibold text-slateInk dark:text-slate-100">Monthly Overview</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Class + Direct income (stacked) vs Expenses</p>
                <div className="mt-3 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyMixed} margin={{ left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} width={55} />
                      <Tooltip formatter={(v) => typeof v === "number" ? formatCurrency(v) : String(v ?? "")} />
                      <Legend />
                      <Bar dataKey="Class Income" fill="#30c48d" stackId="income" />
                      <Bar dataKey="Direct Income" fill="#0b3b74" stackId="income" />
                      <Bar dataKey="Expenses" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div ref={mixChartRef} className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
                <h2 className="text-lg font-semibold text-slateInk dark:text-slate-100">Income vs Expenses Trend</h2>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyMixed}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} width={55} />
                      <Tooltip formatter={(v) => typeof v === "number" ? formatCurrency(v) : String(v ?? "")} />
                      <Legend />
                      <Line type="monotone" dataKey="Class Income" stroke="#30c48d" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Direct Income" stroke="#0b3b74" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Expenses" stroke="#f97316" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div ref={piesChartRef} className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
                <h2 className="text-lg font-semibold text-slateInk dark:text-slate-100">Breakdowns</h2>
                <div className="mt-4 grid h-64 grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1 text-center text-xs text-slate-500 dark:text-slate-400">Income vs Expenses</p>
                    <ResponsiveContainer width="100%" height="90%">
                      <PieChart>
                        <Tooltip formatter={(v) => typeof v === "number" ? formatCurrency(v) : String(v ?? "")} />
                        <Pie
                          data={[
                            { name: "Class Income", value: totals.classIncome },
                            { name: "Direct Income", value: totals.directIncome },
                            { name: "Expenses", value: totals.totalExpenses },
                          ].filter((d) => d.value > 0)}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={70}
                        >
                          {["#30c48d", "#0b3b74", "#f97316"].map((c, i) => (
                            <Cell key={i} fill={c} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="mb-1 text-center text-xs text-slate-500 dark:text-slate-400">Principal vs Net Profit</p>
                    <ResponsiveContainer width="100%" height="90%">
                      <PieChart>
                        <Tooltip formatter={(v) => typeof v === "number" ? formatCurrency(v) : String(v ?? "")} />
                        <Pie
                          data={[
                            { name: "Principal", value: totals.currentPrincipal },
                            { name: "Net Profit", value: Math.max(0, totals.netProfit) },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={70}
                        >
                          {["#0b3b74", "#30c48d"].map((c, i) => (
                            <Cell key={i} fill={c} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Direct Income History ── */}
            {filtered.incomeRecords.length > 0 && (
              <section className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
                <h2 className="mb-3 text-lg font-semibold text-slateInk dark:text-slate-100">
                  Direct Income Added to Principal
                  <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                    ({filtered.incomeRecords.length} {filtered.incomeRecords.length === 1 ? "entry" : "entries"} &middot;{" "}
                    {formatCurrency(totals.directIncome)} total)
                  </span>
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-600 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                        <th className="pb-2 pr-4">Date</th>
                        <th className="pb-2 pr-4">Amount</th>
                        <th className="pb-2">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filtered.incomeRecords
                        .slice()
                        .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
                        .map((r) => (
                          <tr key={r.id} className="text-slate-700 dark:text-slate-300">
                            <td className="py-2 pr-4 font-mono text-xs">{r.dateISO}</td>
                            <td className="py-2 pr-4 font-semibold text-mint">{formatCurrency(r.amount)}</td>
                            <td className="py-2 text-slate-500 dark:text-slate-400">{r.note ?? "—"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ── Export ── */}
            <section className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
              <h2 className="mb-3 text-lg font-semibold text-slateInk dark:text-slate-100">Export</h2>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={doExportCSV} className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
                  CSV
                </button>
                <button type="button" onClick={doExportJSON} className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
                  JSON Backup
                </button>
                <button type="button" onClick={doExportExcel} className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
                  Excel
                </button>
                <button type="button" onClick={doExportPDF} className="rounded-xl bg-bankBlue px-4 py-2 text-sm font-medium text-white">
                  PDF Report
                </button>
              </div>
            </section>

          </div>
        )}
      </main>
    </AuthGate>
  );
}
