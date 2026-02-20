"use client";

import { useState } from "react";
import { signInWithGoogle } from "@/lib/firebase/auth";

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      console.error("Sign in error:", e);
      if (e instanceof Error) {
        if (e.message.includes("auth/popup-closed-by-user")) {
          setError("Sign-in popup was closed before completion.");
        } else if (e.message.includes("auth/cancelled-by-user")) {
          setError("Sign-in was cancelled.");
        } else {
          setError(e.message);
        }
      } else {
        setError("An unexpected error occurred during sign-in.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={loading}
        onClick={handleSignIn}
        className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 font-medium text-slateInk dark:text-slate-100 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50"
      >
        {loading ? "Connecting..." : "Continue with Google"}
      </button>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
