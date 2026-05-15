"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGate from "../AdminGate";

type CategoryStat = {
  slug: string;
  name: string;
  count: number;
};

type StatsPayload = {
  byCategory: CategoryStat[];
};

function CategoriesClient() {
  const [stats, setStats] = useState<StatsPayload | null>(null);

  useEffect(() => {
    fetch("/data/stats.json")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  if (!stats) return <p className="text-textMuted">Đang tải thể loại...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Danh sách thể loại</h1>
      <div className="rounded-xl border border-white/10 bg-panel p-4">
        <ul className="space-y-2">
          {stats.byCategory.map((category) => (
            <li key={category.slug}>
              <Link href={`/admin/categories/${category.slug}`} className="text-sm text-textMuted hover:text-textMain">
                {category.name} ({category.count})
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  return (
    <AdminGate>
      <CategoriesClient />
    </AdminGate>
  );
}

