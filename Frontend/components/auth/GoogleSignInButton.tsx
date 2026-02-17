"use client";

import { signInWithGoogle } from "@/lib/firebase/auth";

export function GoogleSignInButton() {
  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 font-medium text-slateInk dark:text-slate-100 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-600"
    >
      Continue with Google
    </button>
  );
}
