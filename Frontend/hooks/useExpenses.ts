"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToExpenses } from "@/lib/firestore/repository";
import { DATA_TIMEOUT_MS } from "@/lib/constants";
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

    const timeoutId = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          setError("Expenses loading is taking longer than expected. Please check your connection.");
          return false;
        }
        return prev;
      });
    }, DATA_TIMEOUT_MS);

    const unsub = subscribeToExpenses(user.uid, (items) => {
      clearTimeout(timeoutId);
      setError(null);
      setRows(items);
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
