"use client";

import { useMemo, useState } from "react";
import MovieGrid from "../components/MovieGrid";
import type { MovieListItem } from "../lib/types";

type Props = {
  items: MovieListItem[];
};

export default function HomeLatestFilter({ items }: Props) {
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [year, setYear] = useState("");

  const categories = useMemo(
    () =>
      [...new Set(items.flatMap((movie) => movie.categories.map((cat) => `${cat.slug}|${cat.name}`)))].map((value) => {
        const [slug, name] = value.split("|");
        return { slug, name };
      }),
    [items],
  );

  const countries = useMemo(
    () =>
      [...new Set(items.flatMap((movie) => (movie.countries ?? []).map((entry) => `${entry.slug}|${entry.name}`)))].map((value) => {
        const [slug, name] = value.split("|");
        return { slug, name };
      }),
    [items],
  );

  const years = useMemo(
    () =>
      [...new Set(items.map((movie) => movie.year).filter((value): value is number => typeof value === "number"))].sort((a, b) => b - a),
    [items],
  );

  const filtered = useMemo(() => {
    return items.filter((movie) => {
      if (category && !movie.categories.some((item) => item.slug === category)) return false;
      if (country && !(movie.countries ?? []).some((item) => item.slug === country)) return false;
      if (year && movie.year !== Number(year)) return false;
      return true;
    });
  }, [items, category, country, year]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-panel p-4">
        <div className="grid gap-2 md:grid-cols-3">
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-md border border-white/15 bg-panelSoft px-3 py-2 text-sm">
            <option value="">Tất cả thể loại</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <select value={country} onChange={(event) => setCountry(event.target.value)} className="rounded-md border border-white/15 bg-panelSoft px-3 py-2 text-sm">
            <option value="">Tất cả quốc gia</option>
            {countries.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <select value={year} onChange={(event) => setYear(event.target.value)} className="rounded-md border border-white/15 bg-panelSoft px-3 py-2 text-sm">
            <option value="">Tất cả năm</option>
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-sm text-textMuted">Hiển thị {filtered.length}/{items.length} phim mới nhất</p>
      </div>

      {filtered.length > 0 ? (
        <MovieGrid title="30 phim mới nhất" items={filtered} />
      ) : (
        <div className="rounded-xl border border-white/10 bg-panel p-4 text-sm text-textMuted">Không tìm thấy phim phù hợp bộ lọc.</div>
      )}
    </section>
  );
}
