import { DashboardMetrics, FinancialProfile } from "@/types/finance";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

export function buildDashboardMetrics(profile: FinancialProfile): DashboardMetrics {
  const netProfit = Number(profile.netProfit ?? 0);
  const totalValue = profile.principal + netProfit;
  const totalEarnings = profile.totalClassIncome + profile.totalInterest;
  const netGrowth = totalValue - profile.initialPrincipal;
  const roiPct = profile.initialPrincipal > 0 ? (netGrowth / profile.initialPrincipal) * 100 : 0;

  return {
    currentPrincipal: profile.principal,
    netProfit,
    totalValue,
    totalClasses: profile.totalClasses,
    totalClassIncome: profile.totalClassIncome,
    totalInterest: profile.totalInterest,
    totalExpenses: profile.totalExpenses,
    totalEarnings,
    netGrowth,
    roiPct
  };
}
