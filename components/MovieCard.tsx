import Link from "next/link";
import type { MovieListItem } from "../lib/types";

type Props = {
  movie: MovieListItem;
};

export default function MovieCard({ movie }: Props) {
  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-panel">
      <Link href={`/phim/${movie.id}`}>
        <div className="aspect-[2/3] bg-panelSoft">
          {movie.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={movie.posterUrl} alt={movie.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-textMuted">No Poster</div>
          )}
        </div>
      </Link>
      <div className="space-y-1 p-3">
        <Link href={`/phim/${movie.id}`} className="line-clamp-2 font-semibold hover:text-accent">
          {movie.name}
        </Link>
        <p className="text-xs text-textMuted">{movie.year ?? "Unknown Year"}</p>
        {movie.episodeCurrent ? <p className="text-xs text-accent">{movie.episodeCurrent}</p> : null}
      </div>
    </article>
  );
}
