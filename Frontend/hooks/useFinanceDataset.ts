"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  subscribeToClassEntries,
  subscribeToCompoundingHistory,
  subscribeToExpenses,
  subscribeToProfile
} from "@/lib/firestore/repository";
import type { ClassEntry, CompoundingRecord, ExpenseRecord, FinancialProfile } from "@/types/finance";

export function useFinanceDataset() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [classEntries, setClassEntries] = useState<ClassEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [compoundingHistory, setCompoundingHistory] = useState<CompoundingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setClassEntries([]);
      setExpenses([]);
      setCompoundingHistory([]);
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

    let profileReceived = false;
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribeToProfile(
        user.uid,
        (p) => {
          setProfile(p);
          if (!profileReceived) {
            clearTimeout(timeoutId);
            profileReceived = true;
            setError(null);
            setLoading(false);
          }
        },
        (e) => {
          clearTimeout(timeoutId);
          setError(e.message);
          setLoading(false);
        }
      )
    );

    unsubs.push(
      subscribeToClassEntries(
        user.uid,
        (rows) => {
          setClassEntries(rows);
        },
        (e) => setError(e.message)
      )
    );

    unsubs.push(
      subscribeToExpenses(
        user.uid,
        (rows) => {
          setExpenses(rows);
        },
        (e) => setError(e.message)
      )
    );

    unsubs.push(
      subscribeToCompoundingHistory(
        user.uid,
        (rows) => {
          setCompoundingHistory(rows);
        },
        (e) => setError(e.message)
      )
    );

    return () => {
      clearTimeout(timeoutId);
      for (const u of unsubs) u();
    };
  }, [user]);

  const ready = useMemo(() => Boolean(profile) && !loading && !error, [profile, loading, error]);

  return { profile, classEntries, expenses, compoundingHistory, loading, error, ready };
}
