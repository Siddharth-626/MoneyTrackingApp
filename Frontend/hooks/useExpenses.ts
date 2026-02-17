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
    const unsub = subscribeToExpenses(user.uid, (items) => {
      setRows(items);
      setLoading(false);
    }, (e) => {
      setError(e.message);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const total = useMemo(() => rows.reduce((sum, r) => sum + r.amount, 0), [rows]);

  return { rows, loading, error, total };
}
