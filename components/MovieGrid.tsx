import type { MovieListItem } from "../lib/types";
import MovieCard from "./MovieCard";

type Props = {
  title?: string;
  items: MovieListItem[];
};

export default function MovieGrid({ title, items }: Props) {
  return (
    <section className="space-y-4">
      {title ? <h2 className="text-xl font-semibold">{title}</h2> : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
