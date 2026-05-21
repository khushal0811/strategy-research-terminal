import type { Metadata } from "next";
import "./globals.css";
import ToastManager from "@/components/notifications/ToastManager";

export const metadata: Metadata = {
  title: "Strategy Research Terminal | Quantitative Backtesting Suite",
  description: "Institutional-grade quantitative backtesting terminal. Resolve trading strategies and asset universes with LLMs, execute deterministic event-driven simulations, and stream live risk metrics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
        {children}
        <ToastManager />
      </body>
    </html>
  );
}
