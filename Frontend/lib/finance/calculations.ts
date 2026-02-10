import { DashboardMetrics, FinancialProfile } from "@/types/finance";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

export function buildDashboardMetrics(profile: FinancialProfile): DashboardMetrics {
  return {
    currentPrincipal: profile.principal,
    totalClasses: profile.totalClasses,
    totalClassIncome: profile.totalClassIncome,
    totalInterest: profile.totalInterest,
    totalExpenses: profile.totalExpenses,
    netGrowth: profile.principal - profile.initialPrincipal
  };
}
