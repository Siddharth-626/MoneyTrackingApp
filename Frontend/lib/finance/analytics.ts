import type { ClassEntry, ExpenseRecord, FinancialProfile } from "@/types/finance";

export type DateRangeFilter = {
  startISO?: string;
  endISO?: string;
};

export type AnalyticsFilters = {
  month?: number; // 1-12
  year?: number;
  range?: DateRangeFilter;
  onlyIncomeDays?: boolean;
  onlyExpenseDays?: boolean;
};

export function clampISO(dateISO: string) {
  // Expected YYYY-MM-DD
  return dateISO.slice(0, 10);
}

export function monthKeyFromISO(dateISO: string) {
  return dateISO.slice(0, 7);
}

export function withinRange(dateISO: string, startISO?: string, endISO?: string) {
  const d = clampISO(dateISO);
  if (startISO && d < startISO) return false;
  if (endISO && d > endISO) return false;
  return true;
}

export function applyAnalyticsFilters(entries: ClassEntry[], expenses: ExpenseRecord[], filters: AnalyticsFilters) {
  let filteredEntries = entries;
  let filteredExpenses = expenses;

  if (filters.year && filters.month) {
    const mk = `${filters.year}-${String(filters.month).padStart(2, "0")}`;
    filteredEntries = filteredEntries.filter((e) => e.monthKey === mk);
    filteredExpenses = filteredExpenses.filter((e) => e.monthKey === mk);
  } else if (filters.year) {
    const y = String(filters.year);
    filteredEntries = filteredEntries.filter((e) => e.dateISO.startsWith(y));
    filteredExpenses = filteredExpenses.filter((e) => e.dateISO.startsWith(y));
  }

  if (filters.range?.startISO || filters.range?.endISO) {
    filteredEntries = filteredEntries.filter((e) => withinRange(e.dateISO, filters.range?.startISO, filters.range?.endISO));
    filteredExpenses = filteredExpenses.filter((e) => withinRange(e.dateISO, filters.range?.startISO, filters.range?.endISO));
  }

  if (filters.onlyIncomeDays) {
    const incomeDates = new Set(filteredEntries.map((e) => e.dateISO));
    filteredExpenses = filteredExpenses.filter((e) => incomeDates.has(e.dateISO));
  }

  if (filters.onlyExpenseDays) {
    const expenseDates = new Set(filteredExpenses.map((e) => e.dateISO));
    filteredEntries = filteredEntries.filter((e) => expenseDates.has(e.dateISO));
  }

  return { entries: filteredEntries, expenses: filteredExpenses };
}

export function groupIncomeByDay(entries: ClassEntry[]) {
  const map = new Map<string, number>();
  for (const e of entries) map.set(e.dateISO, (map.get(e.dateISO) ?? 0) + e.earning);
  return [...map.entries()]
    .map(([dateISO, amount]) => ({ dateISO, amount }))
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}

export function groupIncomeByMonth(entries: ClassEntry[]) {
  const map = new Map<string, number>();
  for (const e of entries) map.set(e.monthKey, (map.get(e.monthKey) ?? 0) + e.earning);
  return [...map.entries()]
    .map(([monthKey, amount]) => ({ monthKey, amount }))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

export function groupExpensesByMonth(expenses: ExpenseRecord[]) {
  const map = new Map<string, number>();
  for (const e of expenses) map.set(e.monthKey, (map.get(e.monthKey) ?? 0) + e.amount);
  return [...map.entries()]
    .map(([monthKey, amount]) => ({ monthKey, amount }))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

export function computeStreak(entries: ClassEntry[]) {
  const dates = new Set(entries.map((e) => e.dateISO));
  if (dates.size === 0) return 0;

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // If today has no class yet, start counting from yesterday
  const todayISO = new Date(Date.UTC(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())).toISOString().slice(0, 10);
  if (!dates.has(todayISO)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (true) {
    const iso = new Date(Date.UTC(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())).toISOString().slice(0, 10);
    if (!dates.has(iso)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function bestEarningWeekday(entries: ClassEntry[]) {
  const sums = new Array(7).fill(0) as number[];
  const counts = new Array(7).fill(0) as number[];

  for (const e of entries) {
    const d = new Date(e.dateISO + "T00:00:00Z");
    const wd = d.getUTCDay();
    sums[wd] += e.earning;
    counts[wd] += 1;
  }

  let best = { weekday: 0, avg: 0 };
  for (let i = 0; i < 7; i++) {
    const avg = counts[i] ? sums[i] / counts[i] : 0;
    if (avg > best.avg) best = { weekday: i, avg };
  }

  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return { weekday: names[best.weekday], avg: best.avg };
}

export function highestEarningDay(entries: ClassEntry[]) {
  const daily = groupIncomeByDay(entries);
  let best = { dateISO: "", amount: 0 };
  for (const d of daily) if (d.amount > best.amount) best = d;
  return best;
}

export function monthOverMonth(entries: ClassEntry[], year: number, month: number) {
  const mk = `${year}-${String(month).padStart(2, "0")}`;
  const prev = new Date(Date.UTC(year, month - 1, 1));
  prev.setUTCMonth(prev.getUTCMonth() - 1);
  const prevMK = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}`;

  const byMonth = groupIncomeByMonth(entries);
  const current = byMonth.find((x) => x.monthKey === mk)?.amount ?? 0;
  const previous = byMonth.find((x) => x.monthKey === prevMK)?.amount ?? 0;
  const delta = current - previous;
  const pct = previous > 0 ? (delta / previous) * 100 : 0;
  return { currentMonthKey: mk, current, prevMonthKey: prevMK, previous, delta, pct };
}

export function computeAnalyticsSummary(profile: FinancialProfile, entries: ClassEntry[], expenses: ExpenseRecord[]) {
  const totalClassesTaken = entries.length;
  const totalEarnings = entries.reduce((s, e) => s + e.earning, 0) + profile.totalInterest;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = Number(profile.netProfit ?? 0);
  const totalValue = profile.principal + netProfit;
  const netGrowth = totalValue - profile.initialPrincipal;
  const roiPct = profile.initialPrincipal > 0 ? (netGrowth / profile.initialPrincipal) * 100 : 0;

  return {
    totalClassesTaken,
    totalEarnings,
    totalExpenses,
    netProfit,
    currentPrincipal: profile.principal,
    roiPct
  };
}
