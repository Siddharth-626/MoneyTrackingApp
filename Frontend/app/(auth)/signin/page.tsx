"use client";

import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/hooks/useAuth";

export default function SignInPage() {
  const { user } = useAuth();

  if (user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6">
        <div className="w-full rounded-2xl bg-white p-8 shadow-panel">
          <p className="mb-4 text-slate-700">You are already signed in.</p>
          <Link href="/dashboard" className="rounded-xl bg-bankBlue px-4 py-2 text-white">
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6">
      <section className="w-full rounded-2xl bg-white p-8 shadow-panel">
        <h1 className="text-3xl font-bold text-slateInk">Money Tracking</h1>
        <p className="mt-2 text-slate-600">Track principal, class income, monthly interest, and expenses.</p>
        <div className="mt-8">
          <GoogleSignInButton />
        </div>
      </section>
    </main>
  );
}
