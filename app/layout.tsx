import type { Metadata } from "next";
import "./app.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Polynex",
  description: "Polynex trading bot on Polymarket.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main id="app">
          <AppShell />
        </main>
        {children}
      </body>
    </html>
  );
}
