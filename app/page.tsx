import Link from "next/link";
import { getLatest, getStats } from "../lib/data";
import HomeLatestFilter from "./HomeLatestFilter";

export default async function HomePage() {
  const [latest, stats] = await Promise.all([getLatest(), getStats()]);
  const latest30 = latest.slice(0, 30);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-panel p-5">
        <h1 className="text-2xl font-bold">Nextflix</h1>
        <p className="mt-2 text-sm text-textMuted">Kho phim cá nhân, static-first, cập nhật bằng sync script.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin" className="rounded-md border border-white/20 px-4 py-2 text-sm text-textMuted hover:text-textMain">
            Quản trị
          </Link>
          <p className="self-center text-xs text-textMuted">Tổng phim kho dữ liệu: {stats.totalMovies}</p>
        </div>
      </section>

      <HomeLatestFilter items={latest30} />

      <section className="rounded-xl border border-white/10 bg-panel p-4">
        <h2 className="text-lg font-semibold">Thể loại nổi bật</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {stats.byCategory.map((category) => (
            <Link key={category.slug} href={`/tim-kiem?category=${category.slug}`} className="rounded-md border border-white/15 px-3 py-1 text-sm text-textMuted hover:text-textMain">
              {category.name} ({category.count})
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
