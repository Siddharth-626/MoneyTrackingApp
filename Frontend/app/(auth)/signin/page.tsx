"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/hooks/useAuth";

const FEATURES = [
  { icon: "💰", label: "Track principal & lending returns" },
  { icon: "📚", label: "Log daily classes & earnings" },
  { icon: "📈", label: "Apply monthly interest automatically" },
  { icon: "🧾", label: "Record and categorise expenses" },
  { icon: "📊", label: "Analytics with charts & CSV exports" },
];

export default function SignInPage() {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <svg className="h-8 w-8 animate-spin text-bankBlue" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <section className="rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-panel">
          {/* Logo / brand mark */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bankBlue text-white text-xl font-bold select-none">
              ₹
            </div>
            <div>
              <h1 className="text-xl font-bold text-slateInk dark:text-slate-100 leading-none">Money Tracker</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Personal Finance Dashboard</p>
            </div>
          </div>

          <p className="mt-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Track your lending principal, class income, monthly interest, and expenses — all in one place.
          </p>

          {/* Features */}
          <ul className="mt-5 space-y-2">
            {FEATURES.map(({ icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                <span className="text-base leading-none">{icon}</span>
                <span>{label}</span>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="my-6 border-t border-slate-100 dark:border-slate-700" />

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Sign-in */}
          <GoogleSignInButton />

          <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
            Your data is stored securely in Firebase and never shared.
          </p>
        </section>
      </div>
    </main>
  );
}
