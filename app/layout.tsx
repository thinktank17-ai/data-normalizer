import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DataNorm AI — Instant Data Normalization",
  description:
    "Upload CSV or JSON data. AI automatically standardizes formats, deduplicates records, and cleans your dataset in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0f1e] text-[#e8eaf6] antialiased">
        {children}
      </body>
    </html>
  );
}
