"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminGate from "../AdminGate";
import { filterMovies } from "../../../lib/search";
import type { SearchIndexItem } from "../../../lib/types";

function MoviesClient() {
  const [items, setItems] = useState<SearchIndexItem[]>([]);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    fetch("/data/search-index.json")
      .then((res) => res.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const filtered = useMemo(
    () =>
      filterMovies(items, {
        query,
        source: source || undefined,
        status: status || undefined,
        category: category || undefined,
        year: year ? Number(year) : undefined,
      }),
    [category, items, query, source, status, year],
  );

  const sourceOptions = [...new Set(items.map((item) => item.source))];
  const statusOptions = [...new Set(items.map((item) => item.status).filter(Boolean))];
  const categoryOptions = [...new Set(items.flatMap((item) => item.categories.map((cat) => cat.slug)))];
  const yearOptions = [...new Set(items.map((item) => item.year).filter((v): v is number => typeof v === "number"))].sort((a, b) => b - a);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Quản lý phim</h1>
      <div className="grid gap-2 rounded-xl border border-white/10 bg-panel p-4 md:grid-cols-5">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm phim..." className="rounded-md border border-white/15 bg-panelSoft px-3 py-2 text-sm" />
        <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-md border border-white/15 bg-panelSoft px-3 py-2 text-sm">
          <option value="">Tất cả nguồn</option>
          {sourceOptions.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-white/15 bg-panelSoft px-3 py-2 text-sm">
          <option value="">Tất cả thể loại</option>
          {categoryOptions.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)} className="rounded-md border border-white/15 bg-panelSoft px-3 py-2 text-sm">
          <option value="">Tất cả năm</option>
          {yearOptions.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-white/15 bg-panelSoft px-3 py-2 text-sm">
          <option value="">Tất cả trạng thái</option>
          {statusOptions.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-textMuted">Kết quả: {filtered.length}</p>

      <div className="grid grid-cols-1 gap-2">
        {filtered.slice(0, 400).map((movie) => (
          <Link key={movie.id} href={`/phim/${movie.id}`} className="rounded-xl border border-white/10 bg-panel p-3 hover:border-accent/60">
            <p className="font-semibold">{movie.name}</p>
            <p className="text-xs text-textMuted">{movie.originName ?? "-"} | {movie.source} | {movie.year ?? "Unknown"}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AdminMoviesPage() {
  return (
    <AdminGate>
      <MoviesClient />
    </AdminGate>
  );
}

