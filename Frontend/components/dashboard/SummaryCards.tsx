import { formatCurrency } from "@/lib/finance/calculations";
import { DashboardMetrics } from "@/types/finance";

export function SummaryCards({ dashboard }: { dashboard: DashboardMetrics }) {
  const cards = [
    { label: "Current Principal", value: formatCurrency(dashboard.currentPrincipal) },
    { label: "Net Profit", value: formatCurrency(dashboard.netProfit) },
    { label: "Total Value", value: formatCurrency(dashboard.totalValue) },
    { label: "Total Classes", value: dashboard.totalClasses.toString() },
    { label: "Class Earnings", value: formatCurrency(dashboard.totalClassIncome) },
    { label: "Interest Earned", value: formatCurrency(dashboard.totalInterest) },
    { label: "Expenses", value: formatCurrency(dashboard.totalExpenses) },
    { label: "Net Growth", value: formatCurrency(dashboard.netGrowth) },
    { label: "ROI %", value: `${dashboard.roiPct.toFixed(2)}%` }
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <article key={card.label} className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-panel">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-slateInk dark:text-slate-100">{card.value}</p>
        </article>
      ))}
    </section>
  );
}
