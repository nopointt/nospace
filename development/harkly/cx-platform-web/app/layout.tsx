import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harkly CX Platform",
  description: "OSINT Research Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0f] text-white min-h-screen">
        <header className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
          <span className="text-[#f2b90d] font-bold text-lg tracking-tight">
            Harkly
          </span>
          <span className="text-white/40 text-sm">CX Platform</span>
        </header>
        <main className="px-6 py-8 max-w-4xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
