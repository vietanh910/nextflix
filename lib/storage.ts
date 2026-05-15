import type { MovieListItem } from "./types";

type HistoryItem = {
  movieId: string;
  movieName: string;
  episodeName: string;
  source?: string;
  watchedAt: string;
};

const FAVORITES_KEY = "nextflix:favorites";
const HISTORY_KEY = "nextflix:history";

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getFavorites(): MovieListItem[] {
  return readJson<MovieListItem[]>(FAVORITES_KEY, []);
}

export function isFavorite(id: string): boolean {
  return getFavorites().some((item) => item.id === id);
}

export function toggleFavorite(movie: MovieListItem): MovieListItem[] {
  const favorites = getFavorites();
  const exists = favorites.some((item) => item.id === movie.id);
  const next = exists ? favorites.filter((item) => item.id !== movie.id) : [movie, ...favorites].slice(0, 200);
  writeJson(FAVORITES_KEY, next);
  return next;
}

export function getWatchHistory(): HistoryItem[] {
  return readJson<HistoryItem[]>(HISTORY_KEY, []);
}

export function addWatchHistory(movie: MovieListItem, episode: { name: string; serverName?: string }): HistoryItem[] {
  const history = getWatchHistory().filter((item) => !(item.movieId === movie.id && item.episodeName === episode.name));

  const next: HistoryItem[] = [
    {
      movieId: movie.id,
      movieName: movie.name,
      episodeName: episode.name,
      source: episode.serverName,
      watchedAt: new Date().toISOString(),
    },
    ...history,
  ].slice(0, 100);

  writeJson(HISTORY_KEY, next);
  return next;
}

