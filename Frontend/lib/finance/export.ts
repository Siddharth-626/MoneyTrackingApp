import type { ClassEntry, ExpenseRecord, FinancialProfile } from "@/types/finance";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportJSON(payload: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  downloadBlob(blob, filename);
}

export function exportCSV(rows: Array<Record<string, unknown>>, filename: string) {
  if (rows.length === 0) {
    downloadBlob(new Blob([""], { type: "text/csv" }), filename);
    return;
  }

  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
    return s;
  };

  const lines = [headers.join(",")].concat(rows.map((r) => headers.map((h) => escape(r[h])).join(",")));
  downloadBlob(new Blob([lines.join("\n")], { type: "text/csv" }), filename);
}

export async function exportExcel(
  sheets: Array<{ name: string; rows: Array<Record<string, unknown>> }>,
  filename: string
) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  for (const s of sheets) {
    const ws = XLSX.utils.json_to_sheet(s.rows);
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
}

export type PdfReportInput = {
  profile: FinancialProfile;
  entries: ClassEntry[];
  expenses: ExpenseRecord[];
  summary: {
    totalClassesTaken: number;
    totalEarnings: number;
    totalExpenses: number;
    netProfit: number;
    currentPrincipal: number;
    roiPct: number;
  };
  chartNodes?: Array<{ title: string; node: HTMLElement }>;
};

export async function exportPdfReport(input: PdfReportInput, filename: string) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const htmlToImage = await import("html-to-image");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  let y = 40;

  doc.setFontSize(16);
  doc.text("Money Tracking Report", marginX, y);
  y += 18;

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, y);
  y += 18;

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total Classes", String(input.summary.totalClassesTaken)],
      ["Total Earnings", String(input.summary.totalEarnings.toFixed(2))],
      ["Total Expenses", String(input.summary.totalExpenses.toFixed(2))],
      ["Net Profit", String(input.summary.netProfit.toFixed(2))],
      ["Current Principal", String(input.summary.currentPrincipal.toFixed(2))],
      ["ROI %", String(input.summary.roiPct.toFixed(2))]
    ]
  });

  y = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y) + 20;

  if (input.chartNodes?.length) {
    for (const chart of input.chartNodes) {
      if (y > 740) {
        doc.addPage();
        y = 40;
      }

      doc.setFontSize(12);
      doc.text(chart.title, marginX, y);
      y += 10;

      const dataUrl = await htmlToImage.toPng(chart.node, { pixelRatio: 2, backgroundColor: "#ffffff" });
      doc.addImage(dataUrl, "PNG", marginX, y, 520, 240);
      y += 260;
    }
  }

  // Tables
  if (y > 700) {
    doc.addPage();
    y = 40;
  }

  autoTable(doc, {
    startY: y,
    head: [["Date", "Earning", "Note"]],
    body: input.entries
      .slice()
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
      .map((e) => [e.dateISO, e.earning.toFixed(2), e.note ?? ""]),
    styles: { fontSize: 8 }
  });

  y = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y) + 20;
  if (y > 700) {
    doc.addPage();
    y = 40;
  }

  autoTable(doc, {
    startY: y,
    head: [["Date", "Category", "Amount", "Notes"]],
    body: input.expenses
      .slice()
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
      .map((e) => [e.dateISO, e.category === "Custom" ? e.customCategory ?? "Custom" : e.category, e.amount.toFixed(2), e.notes ?? ""]),
    styles: { fontSize: 8 }
  });

  downloadBlob(doc.output("blob"), filename);
}
