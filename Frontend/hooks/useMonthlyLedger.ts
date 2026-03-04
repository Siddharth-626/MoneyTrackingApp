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

    try {
      const unsub = subscribeToMonths(user.uid, (items) => {
        setRows(items);
        setLoading(false);
      }, (e) => {
        setError(e.message);
        setLoading(false);
      });
      return unsub;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to subscribe to months");
      setLoading(false);
    }
  }, [user]);

  return { rows, loading, error };
}
