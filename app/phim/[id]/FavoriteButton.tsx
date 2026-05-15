"use client";

import { useEffect, useState } from "react";
import type { MovieListItem } from "../../../lib/types";
import { isFavorite, toggleFavorite } from "../../../lib/storage";

type Props = {
  movie: MovieListItem;
};

export default function FavoriteButton({ movie }: Props) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isFavorite(movie.id));
  }, [movie.id]);

  const onToggle = () => {
    toggleFavorite(movie);
    setActive(isFavorite(movie.id));
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-md px-4 py-2 text-sm font-semibold ${active ? "bg-accentSoft text-accent" : "bg-panelSoft text-textMuted"}`}
    >
      {active ? "Đã yêu thích" : "Thêm yêu thích"}
    </button>
  );
}
