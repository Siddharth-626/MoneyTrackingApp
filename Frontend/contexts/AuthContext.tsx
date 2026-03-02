"use client";

import type { ReactNode } from "react";
import { createContext, useEffect, useMemo, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { ensureUserProfile } from "@/lib/finance/service";

const AUTH_TIMEOUT_MS = 15_000;

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
};

export const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, error: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Safety timeout: if Firebase SDK does not respond within 15s, unblock the UI.
    const timeoutId = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          setError("Authentication is taking too long. Please refresh the page or check your connection.");
          return false;
        }
        return prev;
      });
    }, AUTH_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      clearTimeout(timeoutId);
      setLoading(true);
      try {
        setError(null);
        if (nextUser) {
          await ensureUserProfile(nextUser.uid);
        }
        setUser(nextUser);
      } catch (err) {
        console.error("Auth initialization error:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred during authentication.");
      } finally {
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ user, loading, error }), [loading, user, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
