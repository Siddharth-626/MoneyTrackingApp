"use client";

import type { ReactNode } from "react";
import { createContext, useEffect, useMemo, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { ensureUserProfile } from "@/lib/finance/service";

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
    const unsubscribe = onAuthStateChanged(
      auth,
      async (nextUser) => {
        try {
          setUser(nextUser);
          if (nextUser) {
            await ensureUserProfile(nextUser.uid);
          }
          setError(null);
        } catch (e: unknown) {
          console.error("Auth context initialization error:", e);
          setError(e instanceof Error ? e.message : "Failed to initialize user profile");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("onAuthStateChanged error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const value = useMemo(() => ({ user, loading, error }), [loading, user, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
