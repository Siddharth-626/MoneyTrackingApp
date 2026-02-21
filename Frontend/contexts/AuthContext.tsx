"use client";

import type { ReactNode } from "react";
import { createContext, useEffect, useMemo, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { ensureUserProfile } from "@/lib/finance/service";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: Error | null;
};

export const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, error: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setError(null);
      try {
        setUser(nextUser);
        if (nextUser) {
          await ensureUserProfile(nextUser.uid);
        }
      } catch (e) {
        console.error("Auth initialization error:", e);
        setError(e instanceof Error ? e : new Error("Failed to initialize user profile"));
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo(() => ({ user, loading, error }), [loading, user, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
