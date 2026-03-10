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

    const unsub = subscribeToMonths(user.uid, (items) => {
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

  return { rows, loading, error };
}
