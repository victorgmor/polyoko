import type { Metadata } from "next";
import "./app.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Plusmarket",
  description: "Plusmarket trading bot on Polymarket.",
  icons: {
    icon: [{ url: "/icon", type: "image/svg+xml" }],
    apple: [{ url: "/icon" }],
  },
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
