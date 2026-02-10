"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { buildDashboardMetrics } from "@/lib/finance/calculations";
import { subscribeToProfile } from "@/lib/firestore/repository";
import { DashboardMetrics, FinancialProfile } from "@/types/finance";

type FinanceData = {
  profile: FinancialProfile;
  dashboard: DashboardMetrics;
};

export function useFinanceData() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const unsub = subscribeToProfile(
      user.uid,
      (nextProfile) => {
        setProfile(nextProfile);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  const data = useMemo<FinanceData | null>(() => {
    if (!profile) return null;
    return {
      profile,
      dashboard: buildDashboardMetrics(profile)
    };
  }, [profile]);

  return { data, loading, error };
}
