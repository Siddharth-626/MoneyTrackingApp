"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/signin");
  }, [loading, router, user]);

  if (loading || !user) {
    return <div className="p-6 text-sm text-slate-600">Authenticating...</div>;
  }

  return <>{children}</>;
}
