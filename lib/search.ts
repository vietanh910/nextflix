import type { SearchIndexItem } from "./types";

export type SearchFilters = {
  query?: string;
  source?: string;
  category?: string;
  year?: number;
  status?: string;
};

export function filterMovies(items: SearchIndexItem[], filters: SearchFilters): SearchIndexItem[] {
  const query = filters.query?.trim().toLowerCase();

  return items.filter((item) => {
    if (query) {
      const haystack = `${item.name} ${item.originName ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (filters.source && item.source !== filters.source) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (typeof filters.year === "number" && item.year !== filters.year) return false;
    if (filters.category && !item.categories.some((cat) => cat.slug === filters.category)) return false;

    return true;
  });
}

