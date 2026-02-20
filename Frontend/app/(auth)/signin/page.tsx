"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/hooks/useAuth";

export default function SignInPage() {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || (user && !error)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6">
        <p className="text-slate-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6 text-center">
      <section className="w-full rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-panel text-left">
        <h1 className="text-3xl font-bold text-slateInk dark:text-slate-100">Money Tracking</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Track principal, class income, monthly interest, and expenses.</p>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">
            <p className="font-bold">Authentication Error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        <div className="mt-8">
          <GoogleSignInButton />
        </div>
      </section>
    </main>
  );
}
