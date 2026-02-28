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

    let profileReceived = false;
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribeToProfile(
        user.uid,
        (p) => {
          setProfile(p);
          if (!profileReceived) {
            profileReceived = true;
            setLoading(false);
          }
        },
        (e) => {
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
        (e) => {
          setError(e.message);
          setLoading(false);
        }
      )
    );

    unsubs.push(
      subscribeToExpenses(
        user.uid,
        (rows) => {
          setExpenses(rows);
        },
        (e) => {
          setError(e.message);
          setLoading(false);
        }
      )
    );

    unsubs.push(
      subscribeToCompoundingHistory(
        user.uid,
        (rows) => {
          setCompoundingHistory(rows);
        },
        (e) => {
          setError(e.message);
          setLoading(false);
        }
      )
    );

    return () => {
      for (const u of unsubs) u();
    };
  }, [user]);

  const ready = useMemo(() => Boolean(profile) && !loading && !error, [profile, loading, error]);

  return { profile, classEntries, expenses, compoundingHistory, loading, error, ready };
}
