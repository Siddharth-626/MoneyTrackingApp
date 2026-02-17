"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useClassEntriesMonth } from "@/hooks/useClassEntriesMonth";
import { clearAllClassData, toggleClassEntry, updateClassEntryNote } from "@/lib/finance/service";
import { formatCurrency } from "@/lib/finance/calculations";
import { FinancialProfile } from "@/types/finance";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isoDate(year: number, monthIndex0: number, day: number) {
  const d = new Date(Date.UTC(year, monthIndex0, day));
  return d.toISOString().slice(0, 10);
}

function daysInMonth(year: number, monthIndex0: number) {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

function firstWeekday(year: number, monthIndex0: number) {
  return new Date(Date.UTC(year, monthIndex0, 1)).getUTCDay();
}

export function ClassTrackerCard({ profile }: { profile: FinancialProfile }) {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex0, setMonthIndex0] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [noteDraft, setNoteDraft] = useState("");
  const [busyDateISO, setBusyDateISO] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { byDate, loading } = useClassEntriesMonth(year, monthIndex0);

  const monthName = useMemo(() => {
    return new Date(Date.UTC(year, monthIndex0, 1)).toLocaleString(undefined, { month: "long", year: "numeric" });
  }, [year, monthIndex0]);

  const totalDays = daysInMonth(year, monthIndex0);
  const offset = firstWeekday(year, monthIndex0);

  const selectedDateISO = selectedDay ? isoDate(year, monthIndex0, selectedDay) : null;
  const selectedEntry = selectedDateISO ? byDate.get(selectedDateISO) : undefined;
  const predictedEarning = Number(profile.classRate ?? 0);

  const goPrevMonth = () => {
    const d = new Date(Date.UTC(year, monthIndex0, 1));
    d.setUTCMonth(d.getUTCMonth() - 1);
    setYear(d.getUTCFullYear());
    setMonthIndex0(d.getUTCMonth());
    setSelectedDay(1);
  };

  const goNextMonth = () => {
    const d = new Date(Date.UTC(year, monthIndex0, 1));
    d.setUTCMonth(d.getUTCMonth() + 1);
    setYear(d.getUTCFullYear());
    setMonthIndex0(d.getUTCMonth());
    setSelectedDay(1);
  };

  const onToggleSelected = async () => {
    if (!user || !selectedDateISO) return;
    setBusyDateISO(selectedDateISO);
    setMessage(null);
    try {
      await toggleClassEntry(user.uid, { dateISO: selectedDateISO });
      setMessage({ type: "success", text: "Class entry updated." });
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to update class entry." });
    } finally {
      setBusyDateISO(null);
    }
  };

  const onSaveNote = async () => {
    if (!user || !selectedDateISO) return;
    if (!byDate.get(selectedDateISO)) return;
    setBusyDateISO(selectedDateISO);
    setMessage(null);
    try {
      await updateClassEntryNote(user.uid, selectedDateISO, noteDraft);
      setMessage({ type: "success", text: "Note saved." });
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to save note." });
    } finally {
      setBusyDateISO(null);
    }
  };

  const onClearAll = async () => {
    if (!user) return;
    setClearing(true);
    setMessage(null);
    try {
      await clearAllClassData(user.uid);
      setMessage({ type: "success", text: "All class data deleted successfully." });
      setClearOpen(false);
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to delete class data." });
    } finally {
      setClearing(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
      <h2 className="text-lg font-semibold text-slateInk dark:text-slate-100">Class Tracking</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Click a date to mark/unmark &ldquo;Class Taken&rdquo;. One entry per date.</p>

      {message ? (
        <div className={`mt-3 rounded-xl p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
          {message.text}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-2">
        <button type="button" onClick={goPrevMonth} className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm dark:text-slate-100">
          Prev
        </button>
        <div className="text-sm font-semibold text-slateInk dark:text-slate-100">{monthName}</div>
        <button type="button" onClick={goNextMonth} className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm dark:text-slate-100">
          Next
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`spacer-${i}`} />
        ))}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const dateISO = isoDate(year, monthIndex0, day);
          const marked = byDate.has(dateISO);
          const selected = selectedDay === day;
          const isBusy = busyDateISO === dateISO;

          return (
            <button
              key={dateISO}
              type="button"
              onClick={() => {
                setSelectedDay(day);
                const entry = byDate.get(dateISO);
                setNoteDraft(entry?.note ?? "");
              }}
              className={
                "aspect-square rounded-xl border p-2 text-sm font-medium transition " +
                (selected ? "border-bankBlue" : "border-slate-200 dark:border-slate-600") +
                " " +
                (marked ? "bg-mint text-white" : "bg-white dark:bg-slate-700 text-slateInk dark:text-slate-100") +
                (isBusy ? " opacity-60" : "")
              }
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-medium text-slateInk dark:text-slate-100">{selectedDateISO ?? "Select a date"}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Earnings: {formatCurrency(selectedEntry?.earning ?? predictedEarning)}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!selectedDateISO || !user || busyDateISO === selectedDateISO}
            onClick={onToggleSelected}
            className={
              "rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50 " +
              (selectedEntry ? "bg-ember" : "bg-mint")
            }
          >
            {selectedEntry ? "Unmark Class" : "Mark Class Taken"}
          </button>
        </div>

        <label className="mt-3 block text-sm text-slate-700 dark:text-slate-300">
          Optional note
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={2}
            className="mt-1 w-full resize-none rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 p-2"
            placeholder={selectedEntry ? "Add a note for this class..." : "Mark the class first to save a note."}
          />
        </label>
        <button
          type="button"
          disabled={!selectedEntry || busyDateISO === selectedDateISO}
          onClick={onSaveNote}
          className="mt-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slateInk dark:text-slate-100 disabled:opacity-50"
        >
          Save Note
        </button>

        {loading ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Loading entries...</p> : null}
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          disabled={clearing}
          onClick={() => setClearOpen(true)}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
        >
          Delete All Class Data
        </button>
      </div>

      <ConfirmModal
        open={clearOpen}
        title="Delete all class data"
        description="This will remove all class entries and reset class-based totals. Expenses and interest history remain untouched."
        confirmText="Delete"
        onClose={() => setClearOpen(false)}
        onConfirm={onClearAll}
        loading={clearing}
      />
    </section>
  );
}
