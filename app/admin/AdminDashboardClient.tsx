"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminStatCard from "../../components/AdminStatCard";
import type { SourcesHealth, Stats } from "../../lib/types";

export default function AdminDashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sources, setSources] = useState<SourcesHealth | null>(null);

  useEffect(() => {
    const run = async () => {
      const [statsRes, sourcesRes] = await Promise.all([fetch("/data/stats.json"), fetch("/data/sources.json")]);
      setStats(await statsRes.json());
      setSources(await sourcesRes.json());
    };

    run().catch(() => {
      setStats(null);
    });
  }, []);

  if (!stats) {
    return <p className="text-textMuted">Đang tải dữ liệu admin...</p>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Tổng số phim" value={stats.totalMovies} />
        <AdminStatCard label="Lần cập nhật" value={new Date(stats.updatedAt).toLocaleString()} />
        <AdminStatCard label="Số nguồn" value={Object.keys(stats.bySource).length} />
        <AdminStatCard label="Số thể loại" value={stats.byCategory.length} />
      </section>

      <section className="rounded-xl border border-white/10 bg-panel p-4">
        <h2 className="text-lg font-semibold">Nguồn API</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-textMuted">
              <tr>
                <th className="px-2 py-2">Source</th>
                <th className="px-2 py-2">Enabled</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Fetched</th>
              </tr>
            </thead>
            <tbody>
              {sources?.sources.map((item) => (
                <tr key={item.source} className="border-t border-white/10">
                  <td className="px-2 py-2">{item.source}</td>
                  <td className="px-2 py-2">{item.enabled ? "Yes" : "No"}</td>
                  <td className="px-2 py-2">{item.ok ? "OK" : item.errorMessage ?? "Error"}</td>
                  <td className="px-2 py-2">{item.fetchedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-panel p-4">
          <h2 className="text-lg font-semibold">Tổng hợp theo nguồn</h2>
          <ul className="mt-3 space-y-1 text-sm text-textMuted">
            {Object.entries(stats.bySource).map(([key, value]) => (
              <li key={key}>
                {key}: {value}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 bg-panel p-4">
          <h2 className="text-lg font-semibold">Tổng hợp theo loại/trạng thái</h2>
          <ul className="mt-3 space-y-1 text-sm text-textMuted">
            {Object.entries(stats.byType).map(([key, value]) => (
              <li key={key}>
                Type {key}: {value}
              </li>
            ))}
            {Object.entries(stats.byStatus).map(([key, value]) => (
              <li key={key}>
                Status {key}: {value}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-panel p-4">
        <h2 className="text-lg font-semibold">Top thể loại</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {stats.byCategory.slice(0, 12).map((category) => (
            <Link key={category.slug} href={`/admin/categories/${category.slug}`} className="rounded-md border border-white/15 px-3 py-1 text-sm text-textMuted hover:text-textMain">
              {category.name} ({category.count})
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-panel p-4">
        <h2 className="text-lg font-semibold">Cập nhật dữ liệu</h2>
        <p className="mt-2 text-sm text-textMuted">Cập nhật thủ công bằng GitHub Actions workflow "Sync Movies" hoặc chạy command local:</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText("npm run sync")}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg"
          >
            Copy npm run sync
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-white/15 px-4 py-2 text-sm text-textMuted hover:text-textMain"
          >
            Mở GitHub Actions
          </a>
        </div>
      </section>
    </div>
  );
}

