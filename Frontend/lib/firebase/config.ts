import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyCF7z5BRgDlaCzh9FqmEC4CWJ8JBg4DYmI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "moneytracking-1dcdc.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "moneytracking-1dcdc",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "moneytracking-1dcdc.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "755165187671",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:755165187671:web:a90725c76fb3a807885d12",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-LH2ZR4QFK7"
};

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
