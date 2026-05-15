import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header";
import { getStats } from "../lib/data";

export const metadata: Metadata = {
  title: "Nextflix",
  description: "Web xem phim ca nhan static-first",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let categories: Awaited<ReturnType<typeof getStats>>["byCategory"] = [];

  try {
    const stats = await getStats();
    categories = stats.byCategory;
  } catch {
    categories = [];
  }

  return (
    <html lang="vi">
      <body>
        <Header categories={categories} />
        <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
