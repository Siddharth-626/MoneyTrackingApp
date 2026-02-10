import { formatCurrency } from "@/lib/finance/calculations";
import { MonthlyLedgerRow } from "@/types/finance";

export function MonthlyTable({ rows }: { rows: MonthlyLedgerRow[] }) {
  if (rows.length === 0) {
    return <p className="rounded-xl bg-white p-4 text-sm text-slate-600 shadow-panel">No monthly records yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-panel">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3">Month</th>
            <th className="px-4 py-3">Classes</th>
            <th className="px-4 py-3">Class Income</th>
            <th className="px-4 py-3">Interest</th>
            <th className="px-4 py-3">Expenses</th>
            <th className="px-4 py-3">Closing Principal</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.monthKey} className="border-b last:border-b-0">
              <td className="px-4 py-3">{row.monthKey}</td>
              <td className="px-4 py-3">{row.classesTaken}</td>
              <td className="px-4 py-3">{formatCurrency(row.classIncome)}</td>
              <td className="px-4 py-3">{formatCurrency(row.interestAmount)}</td>
              <td className="px-4 py-3">{formatCurrency(row.expenseTotal)}</td>
              <td className="px-4 py-3 font-medium">{formatCurrency(row.closingPrincipal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
