"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/hooks/useAuth";

export default function SignInPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6 text-center">
        <div className="text-sm text-slate-600 dark:text-slate-400 animate-pulse">Authenticating...</div>
      </main>
    );
  }

  if (user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6 text-center">
        <div className="text-sm text-slate-600 dark:text-slate-400 animate-pulse">Redirecting...</div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6">
      <section className="w-full rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-panel">
        <h1 className="text-3xl font-bold text-slateInk dark:text-slate-100">Money Tracking</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Track principal, class income, monthly interest, and expenses.</p>
        <div className="mt-8">
          <GoogleSignInButton />
        </div>
      </section>
    </main>
  );
}
