"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToMonths } from "@/lib/firestore/repository";
import { MonthlyLedgerRow } from "@/types/finance";

export function useMonthlyLedger() {
  const { user } = useAuth();
  const [rows, setRows] = useState<MonthlyLedgerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToMonths(user.uid, (items) => {
      setRows(items);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  return { rows, loading };
}
