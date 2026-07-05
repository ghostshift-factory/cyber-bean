import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "cyber-bean",
  description: "cyber-bean — espresso dial-in logbook. Night City tech.",
};

export const viewport = {
  themeColor: "#0a0a0c",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Dark-only product: explicit dark marker, no prefers-color-scheme fork.
    <html lang="en" className="dark" data-theme="dark">
      <body className="min-h-dvh bg-bg text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
