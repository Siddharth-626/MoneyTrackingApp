"use client";

import { signInWithGoogle } from "@/lib/firebase/auth";

export function GoogleSignInButton() {
  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slateInk shadow-sm transition hover:bg-slate-50"
    >
      Continue with Google
    </button>
  );
}
