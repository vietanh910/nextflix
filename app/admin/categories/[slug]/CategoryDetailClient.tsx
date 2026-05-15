"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { CategoryPageData } from "../../../../lib/types";

type Props = {
  slug: string;
};

export default function CategoryDetailClient({ slug }: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const page = useMemo(() => {
    const value = Number(searchParams.get("page") ?? "1");
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
  }, [searchParams]);

  const [data, setData] = useState<CategoryPageData | null>(null);

  useEffect(() => {
    fetch(`/data/category/${slug}/page-${page}.json`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then(setData)
      .catch(() => setData(null));
  }, [slug, page]);

  if (!data) {
    return <p className="text-textMuted">Dang tai du lieu the loai...</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{data.name}</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {data.items.map((movie) => (
          <Link key={movie.id} href={`/phim/${movie.id}`} className="rounded-xl border border-white/10 bg-panel p-3 hover:border-accent/60">
            <p className="line-clamp-2 text-sm font-semibold">{movie.name}</p>
            <p className="mt-1 text-xs text-textMuted">{movie.year ?? "Unknown"}</p>
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={`${pathname}?page=${Math.max(1, page - 1)}`}
          className="rounded-md border border-white/15 px-3 py-1 text-sm text-textMuted hover:text-textMain"
        >
          Prev
        </Link>
        <p className="text-sm text-textMuted">
          Page {data.page}/{data.totalPages}
        </p>
        <Link
          href={`${pathname}?page=${Math.min(data.totalPages, page + 1)}`}
          className="rounded-md border border-white/15 px-3 py-1 text-sm text-textMuted hover:text-textMain"
        >
          Next
        </Link>
      </div>
    </div>
  );
}