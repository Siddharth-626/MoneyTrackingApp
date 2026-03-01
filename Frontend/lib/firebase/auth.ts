import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

type SignInResult =
  | { success: true }
  | { success: false; error: string };

export async function signInWithGoogle(): Promise<SignInResult> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    await signInWithPopup(auth, provider);
    return { success: true };
  } catch (err) {
    if (err instanceof FirebaseError) {
      switch (err.code) {
        case "auth/popup-blocked":
          return { success: false, error: "Pop-up was blocked. Please allow pop-ups for this site and try again." };
        case "auth/popup-closed-by-user":
        case "auth/cancelled-popup-request":
          return { success: false, error: "Sign-in was cancelled. Please try again." };
        case "auth/network-request-failed":
          return { success: false, error: "Network error. Please check your connection and try again." };
        case "auth/too-many-requests":
          return { success: false, error: "Too many sign-in attempts. Please wait a moment and try again." };
        default:
          return { success: false, error: err.message };
      }
    }
    return { success: false, error: "An unexpected error occurred during sign-in." };
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
