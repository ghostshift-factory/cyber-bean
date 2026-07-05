import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "cyber-bean",
  description: "cyber-bean — built by the GhostShift factory.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
