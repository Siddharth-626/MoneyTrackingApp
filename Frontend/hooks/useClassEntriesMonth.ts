"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToClassEntriesInRange } from "@/lib/firestore/repository";
import type { ClassEntry } from "@/types/finance";

function monthBoundsISO(year: number, monthIndex0: number) {
  const start = new Date(Date.UTC(year, monthIndex0, 1));
  const end = new Date(Date.UTC(year, monthIndex0 + 1, 0));
  const startISO = start.toISOString().slice(0, 10);
  const endISO = end.toISOString().slice(0, 10);
  return { startISO, endISO };
}

export function useClassEntriesMonth(year: number, monthIndex0: number) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ClassEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => monthBoundsISO(year, monthIndex0), [year, monthIndex0]);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Safety timeout: if Firestore does not respond within 10s, unblock the UI.
    const timeoutId = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          setError("Data is taking too long to load. Please check your connection.");
          return false;
        }
        return prev;
      });
    }, 10_000);

    const unsub = subscribeToClassEntriesInRange(user.uid, range.startISO, range.endISO, (rows) => {
      clearTimeout(timeoutId);
      setEntries(rows);
      setError(null);
      setLoading(false);
    }, (e) => {
      clearTimeout(timeoutId);
      setError(e.message);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsub();
    };
  }, [user, range.startISO, range.endISO]);

  const byDate = useMemo(() => {
    const map = new Map<string, ClassEntry>();
    for (const entry of entries) map.set(entry.dateISO, entry);
    return map;
  }, [entries]);

  return { entries, byDate, loading, error, startISO: range.startISO, endISO: range.endISO };
}
