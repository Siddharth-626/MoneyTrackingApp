import { formatCurrency } from "@/lib/finance/calculations";
import { DashboardMetrics } from "@/types/finance";

type CardDef = {
  label: string;
  value: string;
  valueColor?: string;
  sub?: string;
};

function buildCards(d: DashboardMetrics): CardDef[] {
  const profitColor = d.netProfit >= 0 ? "text-mint" : "text-red-500 dark:text-red-400";
  const growthColor = d.netGrowth >= 0 ? "text-mint" : "text-red-500 dark:text-red-400";
  const roiColor = d.roiPct >= 0 ? "text-mint" : "text-red-500 dark:text-red-400";

  return [
    { label: "Current Principal", value: formatCurrency(d.currentPrincipal) },
    { label: "Net Profit", value: formatCurrency(d.netProfit), valueColor: profitColor },
    { label: "Total Value", value: formatCurrency(d.totalValue) },
    { label: "Total Classes", value: d.totalClasses.toLocaleString("en-IN"), sub: "classes taken" },
    { label: "Class Earnings", value: formatCurrency(d.totalClassIncome) },
    { label: "Interest Earned", value: formatCurrency(d.totalInterest) },
    {
      label: "Total Expenses",
      value: formatCurrency(d.totalExpenses),
      valueColor: d.totalExpenses > 0 ? "text-ember" : undefined,
    },
    { label: "Net Growth", value: formatCurrency(d.netGrowth), valueColor: growthColor },
    {
      label: "ROI",
      value: `${d.roiPct >= 0 ? "+" : ""}${d.roiPct.toFixed(2)}%`,
      valueColor: roiColor,
    },
  ];
}

export function SummaryCards({ dashboard }: { dashboard: DashboardMetrics }) {
  const cards = buildCards(dashboard);

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Financial summary">
      {cards.map((card) => (
        <article key={card.label} className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-panel">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {card.label}
          </p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${card.valueColor ?? "text-slateInk dark:text-slate-100"}`}>
            {card.value}
          </p>
          {card.sub && (
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{card.sub}</p>
          )}
        </article>
      ))}
    </section>
  );
}
