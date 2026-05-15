import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { buildGlobalKey, buildGlobalTitle, normalizeVietnamese, safeSlug } from "../lib/normalize";
import {
  fetchSourceMovieDetail,
  fetchSourceMovies,
  getCategoryPageSize,
  getSourceConfigs,
  getSyncPages,
  SOURCE_PRIORITY,
  type SyncMode,
  type SourceRuntime,
} from "../lib/sources";
import type {
  CategoryPageData,
  Manifest,
  MovieDetail,
  MovieListItem,
  SearchIndexItem,
  SourcesHealth,
  Stats,
} from "../lib/types";

type WorkingMovie = MovieDetail & { _priority: number };

const DATA_DIR = path.join(process.cwd(), "public", "data");

function parseMode(): SyncMode {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg?.split("=")[1];
  return mode === "full" ? "full" : "latest";
}

function nowIso(): string {
  return new Date().toISOString();
}

function readPositiveEnvNumber(name: string): number | null {
  const raw = process.env[name]?.trim();
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
}

function movieHasSource(movie: MovieDetail, source: MovieDetail["source"]): boolean {
  if (movie.source === source) return true;
  return (movie.sources ?? []).some((entry) => entry.source === source);
}

function limitMoviesForTesting(
  movies: MovieDetail[],
  maxMovies: number,
  minMoviesPerSource: number,
  enabledSources: MovieDetail["source"][],
): MovieDetail[] {
  if (maxMovies <= 0 || movies.length <= maxMovies) return movies;

  const selected: MovieDetail[] = [];
  const selectedIds = new Set<string>();

  const safeEnabledSources = enabledSources.length > 0 ? enabledSources : SOURCE_PRIORITY;
  const maxMinPerSource = Math.max(1, Math.floor(maxMovies / safeEnabledSources.length));
  const perSourceTarget = Math.max(1, Math.min(minMoviesPerSource, maxMinPerSource));

  for (const source of safeEnabledSources) {
    let pickedForSource = 0;
    for (const movie of movies) {
      if (pickedForSource >= perSourceTarget) break;
      if (selected.length >= maxMovies) break;
      if (selectedIds.has(movie.id)) continue;
      if (!movieHasSource(movie, source)) continue;

      selected.push(movie);
      selectedIds.add(movie.id);
      pickedForSource += 1;
    }
  }

  for (const movie of movies) {
    if (selected.length >= maxMovies) break;
    if (selectedIds.has(movie.id)) continue;
    selected.push(movie);
    selectedIds.add(movie.id);
  }

  return selected;
}

function noYearCanMerge(a: WorkingMovie, b: WorkingMovie): boolean {
  if (!a.year && !b.year) {
    const typeConflict = Boolean(a.type && b.type && a.type !== b.type);
    if (typeConflict) return false;

    const aOrigin = normalizeVietnamese(a.originName ?? "");
    const bOrigin = normalizeVietnamese(b.originName ?? "");
    if (aOrigin && bOrigin && aOrigin !== bOrigin) return false;

    return true;
  }

  return false;
}

function mergeEpisodes(base: MovieDetail["episodes"], incoming: MovieDetail["episodes"]): MovieDetail["episodes"] {
  const merged = [...base];
  const seen = new Set(merged.map((item) => `${item.serverName}|${item.name}|${item.embedUrl ?? ""}|${item.m3u8Url ?? ""}`));

  incoming.forEach((episode) => {
    const key = `${episode.serverName}|${episode.name}|${episode.embedUrl ?? ""}|${episode.m3u8Url ?? ""}`;
    if (!seen.has(key)) {
      merged.push(episode);
      seen.add(key);
    }
  });

  return merged;
}

function mergeMovie(existing: WorkingMovie, incoming: WorkingMovie): WorkingMovie {
  const preferIncoming = incoming.episodes.length > existing.episodes.length;
  const primary = preferIncoming ? incoming : existing;
  const secondary = preferIncoming ? existing : incoming;

  const sources = [...(existing.sources ?? []), ...(incoming.sources ?? [])];
  const sourceKeySet = new Set<string>();
  const uniqueSources = sources.filter((entry) => {
    const key = `${entry.source}:${entry.slug}`;
    if (sourceKeySet.has(key)) return false;
    sourceKeySet.add(key);
    return true;
  });

  return {
    ...primary,
    id: primary.id,
    slug: primary.slug || secondary.slug,
    originName: primary.originName || secondary.originName,
    posterUrl: primary.posterUrl || secondary.posterUrl,
    thumbUrl: primary.thumbUrl || secondary.thumbUrl,
    year: primary.year || secondary.year,
    type: primary.type || secondary.type,
    status: primary.status || secondary.status,
    episodeCurrent: primary.episodeCurrent || secondary.episodeCurrent,
    categories: primary.categories.length > 0 ? primary.categories : secondary.categories,
    countries: (primary.countries && primary.countries.length > 0) ? primary.countries : secondary.countries,
    description: primary.description || secondary.description,
    quality: primary.quality || secondary.quality,
    lang: primary.lang || secondary.lang,
    episodes: mergeEpisodes(primary.episodes, secondary.episodes),
    sources: uniqueSources.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99)),
    _priority: Math.min(existing._priority, incoming._priority),
  };
}

function stableId(base: string, used: Set<string>): string {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  let index = 2;
  while (used.has(`${base}-${index}`)) {
    index += 1;
  }

  const id = `${base}-${index}`;
  used.add(id);
  return id;
}

function buildCompactMovieId(movie: WorkingMovie): string {
  const canonical = buildGlobalKey(movie.name, movie.originName, movie.year);
  const shortTitle = safeSlug(buildGlobalTitle(movie.name, movie.originName)).slice(0, 24) || "movie";
  const yearPart = movie.year ? `-${movie.year}` : "";
  const hashSeed = `${canonical}|${movie.slug}|${movie.source}`;
  const hash = createHash("sha1").update(hashSeed).digest("hex").slice(0, 8);
  return `${shortTitle}${yearPart}-${hash}`;
}

function makeSampleMovies(): MovieDetail[] {
  return [
    {
      id: "sample-movie-1",
      source: "ophim",
      slug: "sample-movie-1",
      name: "Sample Movie One",
      originName: "Sample Origin One",
      posterUrl: "https://placehold.co/320x480/131829/ffffff?text=Sample+1",
      thumbUrl: "https://placehold.co/480x270/131829/ffffff?text=Sample+1",
      year: 2025,
      type: "single",
      status: "completed",
      episodeCurrent: "Full",
      categories: [{ name: "Sample", slug: "sample" }],
      countries: [{ name: "US", slug: "us" }],
      description: "Sample data fallback when API is unavailable.",
      quality: "HD",
      lang: "Vietsub",
      episodes: [
        {
          name: "Tap 1",
          serverName: "Sample Server",
          embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        },
      ],
      sources: [{ source: "ophim", slug: "sample-movie-1", episodeCount: 1, priority: 0 }],
    },
    {
      id: "sample-movie-2",
      source: "phimapi",
      slug: "sample-movie-2",
      name: "Sample Movie Two",
      originName: "Sample Origin Two",
      posterUrl: "https://placehold.co/320x480/1b2135/ffffff?text=Sample+2",
      thumbUrl: "https://placehold.co/480x270/1b2135/ffffff?text=Sample+2",
      year: 2024,
      type: "series",
      status: "ongoing",
      episodeCurrent: "Tap 4",
      categories: [{ name: "Sample", slug: "sample" }, { name: "Drama", slug: "drama" }],
      description: "Second sample item for MVP fallback.",
      episodes: [
        {
          name: "Tap 1",
          serverName: "Sample Server",
          embedUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ",
        },
      ],
      sources: [{ source: "phimapi", slug: "sample-movie-2", episodeCount: 1, priority: 1 }],
    },
    {
      id: "sample-movie-3",
      source: "nguonc",
      slug: "sample-movie-3",
      name: "Sample Movie Three",
      originName: "Sample Origin Three",
      posterUrl: "https://placehold.co/320x480/265f54/ffffff?text=Sample+3",
      thumbUrl: "https://placehold.co/480x270/265f54/ffffff?text=Sample+3",
      year: 2026,
      type: "anime",
      status: "ongoing",
      episodeCurrent: "Tap 12",
      categories: [{ name: "Anime", slug: "anime" }],
      description: "Third sample item for MVP fallback.",
      episodes: [
        {
          name: "Tap 1",
          serverName: "Sample Server",
          embedUrl: "https://www.youtube.com/embed/YE7VzlLtp-4",
        },
      ],
      sources: [{ source: "nguonc", slug: "sample-movie-3", episodeCount: 1, priority: 2 }],
    },
  ];
}

function toListItem(movie: MovieDetail): MovieListItem {
  return {
    id: movie.id,
    source: movie.source,
    slug: movie.slug,
    name: movie.name,
    originName: movie.originName,
    posterUrl: movie.posterUrl,
    thumbUrl: movie.thumbUrl,
    year: movie.year,
    type: movie.type,
    status: movie.status,
    episodeCurrent: movie.episodeCurrent,
    categories: movie.categories,
    countries: movie.countries,
  };
}

async function writeJson(relativePath: string, data: unknown): Promise<void> {
  const fullPath = path.join(DATA_DIR, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, JSON.stringify(data, null, 2), "utf8");
}

async function cleanupOldMovieJsonFiles(validIds: string[]): Promise<void> {
  const moviesDir = path.join(DATA_DIR, "movies");
  await fs.mkdir(moviesDir, { recursive: true });

  const validFileNames = new Set(validIds.map((id) => `${id}.json`));
  const existingFiles = await fs.readdir(moviesDir);

  await Promise.all(
    existingFiles.map(async (fileName) => {
      if (!fileName.endsWith(".json")) return;
      if (validFileNames.has(fileName)) return;
      await fs.unlink(path.join(moviesDir, fileName));
    }),
  );
}

function dedupeMovies(movies: WorkingMovie[]): MovieDetail[] {
  const deduped: WorkingMovie[] = [];
  const withYearMap = new Map<string, number>();
  const noYearMap = new Map<string, number[]>();

  movies.forEach((movie) => {
    const normalizedTitle = buildGlobalTitle(movie.name, movie.originName);

    if (movie.year) {
      const key = `${normalizedTitle}-${movie.year}`;
      const index = withYearMap.get(key);
      if (typeof index === "number") {
        deduped[index] = mergeMovie(deduped[index], movie);
      } else {
        withYearMap.set(key, deduped.length);
        deduped.push(movie);
      }
      return;
    }

    const maybeIndices = noYearMap.get(normalizedTitle) ?? [];
    let merged = false;
    for (const index of maybeIndices) {
      const current = deduped[index];
      if (noYearCanMerge(current, movie)) {
        deduped[index] = mergeMovie(current, movie);
        merged = true;
        break;
      }
    }

    if (!merged) {
      const nextIndex = deduped.length;
      deduped.push(movie);
      noYearMap.set(normalizedTitle, [...maybeIndices, nextIndex]);
    }
  });

  const idSet = new Set<string>();
  return deduped.map((movie) => {
    const baseId = buildCompactMovieId(movie);
    const id = stableId(baseId, idSet);

    return {
      ...movie,
      id,
      slug: movie.slug || safeSlug(movie.name),
      sources: movie.sources?.map((source) => ({ ...source, episodeCount: source.episodeCount ?? movie.episodes.length })),
    };
  });
}

async function generateData(mode: SyncMode): Promise<void> {
  const startedAt = nowIso();
  const configs = getSourceConfigs();
  const pages = getSyncPages(mode);
  const categoryPageSize = getCategoryPageSize();
  const maxMovies = readPositiveEnvNumber("MAX_MOVIES");
  const minMoviesPerSource = readPositiveEnvNumber("MIN_MOVIES_PER_SOURCE") ?? 10;

  const sourceStatuses: SourceRuntime[] = configs.map((config) => ({
    ...config,
    fetchedCount: 0,
    ok: !config.enabled,
  }));

  const collected: WorkingMovie[] = [];

  for (const status of sourceStatuses) {
    if (!status.enabled) continue;

    try {
      const summaries = await fetchSourceMovies(status, pages, mode);
      status.fetchedCount = summaries.length;

      for (const summary of summaries) {
        const detail = await fetchSourceMovieDetail(status, summary);
        if (!detail) continue;

        collected.push({
          ...detail,
          _priority: status.priority,
          source: detail.source,
          categories: detail.categories ?? [],
          status: detail.status ?? "unknown",
          sources: detail.sources ?? [{ source: detail.source, slug: detail.slug, episodeCount: detail.episodes.length, priority: status.priority }],
        });
      }

      status.ok = true;
    } catch (error) {
      status.ok = false;
      status.errorMessage = error instanceof Error ? error.message : "Unknown source error";
      console.warn(`[sync] Source failed: ${status.source} -> ${status.errorMessage}`);
    }
  }

  const enabledSources = configs.filter((config) => config.enabled).map((config) => config.source);

  let movies: MovieDetail[];
  if (collected.length === 0) {
    movies = makeSampleMovies();
  } else {
    movies = dedupeMovies(collected)
      .sort((a, b) => {
        if ((b.year ?? 0) !== (a.year ?? 0)) return (b.year ?? 0) - (a.year ?? 0);
        const ap = SOURCE_PRIORITY.indexOf(a.source);
        const bp = SOURCE_PRIORITY.indexOf(b.source);
        if (ap !== bp) return ap - bp;
        return a.name.localeCompare(b.name);
      });
  }

  if (maxMovies) {
    movies = limitMoviesForTesting(movies, maxMovies, minMoviesPerSource, enabledSources);
  }

  const latest = movies.slice(0, 120);

  const searchIndex: SearchIndexItem[] = movies.map((movie) => ({
    id: movie.id,
    source: movie.source,
    slug: movie.slug,
    name: movie.name,
    originName: movie.originName,
    year: movie.year,
    type: movie.type,
    status: movie.status,
    episodeCurrent: movie.episodeCurrent,
    posterUrl: movie.posterUrl,
    categories: movie.categories,
  }));

  const bySource: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byCategoryMap = new Map<string, { slug: string; name: string; count: number; items: MovieListItem[] }>();

  movies.forEach((movie) => {
    bySource[movie.source] = (bySource[movie.source] ?? 0) + 1;
    byType[movie.type ?? "unknown"] = (byType[movie.type ?? "unknown"] ?? 0) + 1;
    byStatus[movie.status ?? "unknown"] = (byStatus[movie.status ?? "unknown"] ?? 0) + 1;

    const listItem = toListItem(movie);
    const movieCategories = movie.categories.length > 0 ? movie.categories : [{ name: "Khac", slug: "khac" }];

    movieCategories.forEach((category) => {
      const current = byCategoryMap.get(category.slug);
      if (current) {
        current.count += 1;
        current.items.push(listItem);
      } else {
        byCategoryMap.set(category.slug, {
          slug: category.slug,
          name: category.name,
          count: 1,
          items: [listItem],
        });
      }
    });
  });

  const byCategory = [...byCategoryMap.values()]
    .map(({ slug, name, count }) => ({ slug, name, count }))
    .sort((a, b) => b.count - a.count);

  const stats: Stats = {
    updatedAt: startedAt,
    totalMovies: movies.length,
    bySource,
    byType,
    byStatus,
    byCategory,
  };

  const categoryPages: Record<string, number> = {};

  for (const [slug, payload] of byCategoryMap.entries()) {
    const totalPages = Math.max(1, Math.ceil(payload.items.length / categoryPageSize));
    categoryPages[slug] = totalPages;

    for (let page = 1; page <= totalPages; page += 1) {
      const start = (page - 1) * categoryPageSize;
      const end = start + categoryPageSize;
      const pageData: CategoryPageData = {
        slug,
        name: payload.name,
        page,
        totalPages,
        items: payload.items.slice(start, end),
      };

      await writeJson(path.join("category", slug, `page-${page}.json`), pageData);
    }
  }

  const categories = byCategory.map((category) => ({
    ...category,
    totalPages: categoryPages[category.slug] ?? 1,
  }));

  const manifest: Manifest = {
    updatedAt: startedAt,
    totalMovies: movies.length,
    movieIds: movies.map((movie) => movie.id),
    categorySlugs: categories.map((category) => category.slug),
    categoryPages,
  };

  const sourcesHealth: SourcesHealth = {
    updatedAt: startedAt,
    mode,
    sources: sourceStatuses.map((source) => ({
      source: source.source,
      enabled: source.enabled,
      baseUrl: source.baseUrl,
      ok: source.ok,
      fetchedCount: source.fetchedCount,
      errorMessage: source.errorMessage,
      lastSyncAt: startedAt,
    })),
  };

  await fs.mkdir(DATA_DIR, { recursive: true });

  await Promise.all([
    writeJson("manifest.json", manifest),
    writeJson("stats.json", stats),
    writeJson("latest.json", latest),
    writeJson("search-index.json", searchIndex),
    writeJson("categories.json", categories),
    writeJson("sources.json", sourcesHealth),
  ]);

  await cleanupOldMovieJsonFiles(movies.map((movie) => movie.id));
  await Promise.all(movies.map((movie) => writeJson(path.join("movies", `${movie.id}.json`), movie)));

  console.log(`[sync] Done mode=${mode}, pages=${pages}, movies=${movies.length}`);
}

generateData(parseMode()).catch((error) => {
  console.error("[sync] Fatal error", error);
  process.exitCode = 1;
});
