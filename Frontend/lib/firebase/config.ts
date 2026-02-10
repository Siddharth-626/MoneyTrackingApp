import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCF7z5BRgDlaCzh9FqmEC4CWJ8JBg4DYmI",
  authDomain: "moneytracking-1dcdc.firebaseapp.com",
  projectId: "moneytracking-1dcdc",
  storageBucket: "moneytracking-1dcdc.firebasestorage.app",
  messagingSenderId: "755165187671",
  appId: "1:755165187671:web:a90725c76fb3a807885d12",
  measurementId: "G-LH2ZR4QFK7"
};

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
