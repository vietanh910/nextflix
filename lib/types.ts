export type MovieSource = "ophim" | "phimapi" | "nguonc" | "animapper";

export type Category = {
  name: string;
  slug: string;
};

export type Country = {
  name: string;
  slug: string;
};

export type MovieListItem = {
  id: string;
  source: MovieSource;
  slug: string;
  name: string;
  originName?: string;
  posterUrl?: string;
  thumbUrl?: string;
  year?: number;
  type?: "single" | "series" | "anime" | "tvshow";
  status?: "ongoing" | "completed" | "unknown";
  episodeCurrent?: string;
  categories: Category[];
  countries?: Country[];
};

export type Episode = {
  name: string;
  slug?: string;
  serverName: string;
  source?: MovieSource;
  embedUrl?: string;
  m3u8Url?: string;
};

export type MovieDetail = MovieListItem & {
  description?: string;
  quality?: string;
  lang?: string;
  episodes: Episode[];
  sources?: {
    source: MovieSource;
    slug: string;
    episodeCount?: number;
    priority?: number;
  }[];
};

export type Stats = {
  updatedAt: string;
  totalMovies: number;
  bySource: Record<string, number>;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byCategory: {
    slug: string;
    name: string;
    count: number;
  }[];
};

export type SearchIndexItem = {
  id: string;
  source: MovieSource;
  slug: string;
  name: string;
  originName?: string;
  year?: number;
  type?: MovieListItem["type"];
  status?: MovieListItem["status"];
  episodeCurrent?: string;
  posterUrl?: string;
  categories: Category[];
};

export type Manifest = {
  updatedAt: string;
  totalMovies: number;
  movieIds: string[];
  categorySlugs: string[];
  categoryPages: Record<string, number>;
};

export type SourcesHealth = {
  updatedAt: string;
  mode: "latest" | "full";
  sources: {
    source: MovieSource;
    enabled: boolean;
    baseUrl: string;
    ok: boolean;
    fetchedCount: number;
    errorMessage?: string;
    lastSyncAt: string;
  }[];
};

export type CategoryPageData = {
  slug: string;
  name: string;
  page: number;
  totalPages: number;
  items: MovieListItem[];
};
