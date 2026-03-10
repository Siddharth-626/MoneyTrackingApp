"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToExpenses } from "@/lib/firestore/repository";
import type { ExpenseRecord } from "@/types/finance";

export function useExpenses() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setRows([]);
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

    const unsub = subscribeToExpenses(user.uid, (items) => {
      clearTimeout(timeoutId);
      setRows(items);
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
  }, [user]);

  const total = useMemo(() => rows.reduce((sum, r) => sum + r.amount, 0), [rows]);

  return { rows, loading, error, total };
}
