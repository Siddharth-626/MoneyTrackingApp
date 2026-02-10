import { formatCurrency } from "@/lib/finance/calculations";
import { DashboardMetrics } from "@/types/finance";

export function SummaryCards({ dashboard }: { dashboard: DashboardMetrics }) {
  const cards = [
    { label: "Current Principal", value: formatCurrency(dashboard.currentPrincipal) },
    { label: "Total Classes", value: dashboard.totalClasses.toString() },
    { label: "Class Income", value: formatCurrency(dashboard.totalClassIncome) },
    { label: "Interest Earned", value: formatCurrency(dashboard.totalInterest) },
    { label: "Expenses", value: formatCurrency(dashboard.totalExpenses) },
    { label: "Net Growth", value: formatCurrency(dashboard.netGrowth) }
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <article key={card.label} className="rounded-2xl bg-white p-4 shadow-panel">
          <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-slateInk">{card.value}</p>
        </article>
      ))}
    </section>
  );
}
