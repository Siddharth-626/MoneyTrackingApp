import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Money Tracker — Personal Finance Dashboard",
  description: "Track lending principal, class income, monthly interest, and expenses in one place.",
  applicationName: "Money Tracker",
  authors: [{ name: "Money Tracker" }],
  keywords: ["finance", "money tracking", "expenses", "interest", "classes", "principal"]
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" }
  ]
};

// Inline script applied before first paint to prevent dark-mode flash (FOUC).
const themeScript = `(function(){try{var s=localStorage.getItem('theme');var dark=s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
