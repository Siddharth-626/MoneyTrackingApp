"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToMonths } from "@/lib/firestore/repository";
import { MonthlyLedgerRow } from "@/types/finance";

export function useMonthlyLedger() {
  const { user } = useAuth();
  const [rows, setRows] = useState<MonthlyLedgerRow[]>([]);
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
          setError("Ledger loading is taking longer than expected. Please check your connection.");
          return false;
        }
        return prev;
      });
    }, 10000);

    const unsub = subscribeToMonths(user.uid, (items) => {
      clearTimeout(timeoutId);
      setRows(items);
      setLoading(false);
      setError(null);
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

  return { rows, loading, error };
}
