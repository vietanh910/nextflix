"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { filterMovies } from "../../lib/search";
import type { SearchIndexItem } from "../../lib/types";

export default function SearchClient() {
  const [items, setItems] = useState<SearchIndexItem[]>([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/data/search-index.json")
      .then((res) => res.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const q = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() ?? "";

  const filtered = useMemo(() => {
    const base = filterMovies(items, {
      query: q || undefined,
      category: category || undefined,
      status: status || undefined,
    });

    return base
      .filter((movie) => {
        if (type && movie.type !== type) return false;
        return true;
      })
      .slice(0, 300);
  }, [items, q, type, status, category]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Kết quả tìm kiếm</h1>

      <div className="rounded-xl border border-white/10 bg-panel p-3 text-sm text-textMuted">
        <p>
          Từ khóa: <span className="text-textMain">{q || "(trống)"}</span>
          {type ? ` | Loại: ${type}` : ""}
          {status ? ` | Trạng thái: ${status}` : ""}
          {category ? ` | Thể loại: ${category}` : ""}
        </p>
      </div>

      <p className="text-sm text-textMuted">Tìm thấy {filtered.length} kết quả</p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {filtered.map((movie) => (
          <Link key={movie.id} href={`/phim/${movie.id}`} className="rounded-xl border border-white/10 bg-panel p-3 hover:border-accent/60">
            <p className="font-semibold">{movie.name}</p>
            <p className="text-xs text-textMuted">{movie.originName ?? "-"} | {movie.year ?? "Unknown"}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
