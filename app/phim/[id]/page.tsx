import Link from "next/link";
import { notFound } from "next/navigation";
import { getManifest, getMovieById } from "../../../lib/data";
import FavoriteButton from "./FavoriteButton";

type Params = {
  id: string;
};

export async function generateStaticParams() {
  try {
    const manifest = await getManifest();
    return manifest.movieIds.map((id) => ({ id }));
  } catch {
    return [{ id: "sample-movie-1" }];
  }
}

export default async function MovieDetailPage({ params }: { params: Params }) {
  try {
    const movie = await getMovieById(params.id);

    return (
      <div className="space-y-6">
        <div className="grid gap-5 md:grid-cols-[260px_1fr]">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-panel">
            {movie.posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={movie.posterUrl} alt={movie.name} className="h-full w-full object-cover" />
            ) : (
              <div className="aspect-[2/3]" />
            )}
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold">{movie.name}</h1>
            <p className="text-sm text-textMuted">{movie.originName ?? "No origin name"}</p>
            <p className="text-sm text-textMuted">{movie.year ?? "Unknown"} | {movie.type ?? "unknown"} | {movie.status ?? "unknown"}</p>
            <p className="text-sm leading-7 text-textMuted">{movie.description ?? "Chưa có mô tả."}</p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/xem/${movie.id}`} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg">
                Xem phim
              </Link>
              <FavoriteButton movie={movie} />
            </div>
          </div>
        </div>

        <section className="rounded-xl border border-white/10 bg-panel p-4">
          <h2 className="text-lg font-semibold">Danh sách tập</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {movie.episodes.length > 0 ? (
              movie.episodes.map((episode, index) => (
                <Link
                  key={`${episode.serverName}-${episode.name}-${index}`}
                  href={`/xem/${movie.id}?ep=${index + 1}`}
                  className="rounded-md border border-white/15 px-3 py-1 text-sm text-textMuted hover:text-textMain"
                >
                  {episode.name}
                </Link>
              ))
            ) : (
              <p className="text-sm text-textMuted">Chưa có tập.</p>
            )}
          </div>
        </section>
      </div>
    );
  } catch {
    notFound();
  }
}
