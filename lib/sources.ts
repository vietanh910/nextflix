import { buildGlobalKey, buildGlobalTitle, safeSlug } from "./normalize";
import type { Episode, MovieDetail, MovieListItem, MovieSource } from "./types";

export type SyncMode = "latest" | "full";

export type SourceConfig = {
  source: MovieSource;
  baseUrl: string;
  enabled: boolean;
  priority: number;
};

export type SourceRuntime = SourceConfig & {
  fetchedCount: number;
  ok: boolean;
  errorMessage?: string;
};

export type SourceMovieSummary = {
  source: MovieSource;
  slug: string;
  name: string;
  originName?: string;
  posterUrl?: string;
  thumbUrl?: string;
  year?: number;
  type?: MovieListItem["type"];
  status?: MovieListItem["status"];
  episodeCurrent?: string;
  categories?: MovieListItem["categories"];
  countries?: MovieListItem["countries"];
};

function env(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export const SOURCE_PRIORITY: MovieSource[] = ["ophim", "phimapi", "nguonc", "animapper"];

export function getSourceConfigs(): SourceConfig[] {
  const defaults: Record<MovieSource, string> = {
    phimapi: "https://phimapi.com",
    nguonc: "https://phim.nguonc.com",
    ophim: "https://ophim1.com",
    animapper: "https://api.animapper.net/api/v1",
  };

  return SOURCE_PRIORITY.map((source, index) => {
    const key = `API_${source.toUpperCase()}`;
    const ophimOverride = process.env.API_OPHIM1?.trim();
    return {
      source,
      baseUrl: source === "ophim" && ophimOverride ? ophimOverride : env(key, defaults[source]),
      enabled: process.env[`DISABLE_${source.toUpperCase()}`] !== "1",
      priority: index,
    };
  });
}

export function getSyncPages(mode: SyncMode): number {
  const latestPages = envNumber("LATEST_SYNC_PAGES", 1);
  const maxFullPages = envNumber("MAX_FULL_PAGES", 20);
  const fullPages = envNumber("FULL_SYNC_PAGES", maxFullPages);

  if (mode === "latest") return latestPages;
  return Math.min(fullPages, maxFullPages);
}

export function getCategoryPageSize(): number {
  return envNumber("CATEGORY_PAGE_SIZE", 24);
}

async function fetchJsonWithFallback(urls: string[]): Promise<unknown> {
  let lastError: unknown;
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: {
          "user-agent": "nextflix-sync-script",
          accept: "application/json,text/plain,*/*",
        },
      });
      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Cannot fetch any endpoint");
}

function normalizeStatus(value?: string): MovieListItem["status"] {
  if (!value) return "unknown";
  const lower = value.toLowerCase();
  if (lower.includes("ongoing") || lower.includes("dang") || lower.includes("tap") || lower.includes("updating")) return "ongoing";
  if (lower.includes("full") || lower.includes("completed") || lower.includes("hoan")) return "completed";
  return "unknown";
}

function normalizeType(value?: string): MovieListItem["type"] {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if (lower.includes("single") || lower.includes("le")) return "single";
  if (lower.includes("anime") || lower.includes("hoat")) return "anime";
  if (lower.includes("tv")) return "tvshow";
  return "series";
}

function toCategories(raw: any): MovieListItem["categories"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      name: String(item?.name ?? item?.title ?? "Khac"),
      slug: safeSlug(String(item?.slug ?? item?.name ?? item?.title ?? "khac")),
    }))
    .filter((item) => item.name);
}

function toCountries(raw: any): MovieListItem["countries"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      name: String(item?.name ?? "Unknown"),
      slug: safeSlug(String(item?.slug ?? item?.name ?? "unknown")),
    }))
    .filter((item) => item.name);
}

function extractItems(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result?.items)) return payload.result.items;
  return [];
}

function toSummary(source: MovieSource, item: any): SourceMovieSummary {
  if (source === "animapper") {
    const preferredTitle =
      item?.titles?.["user-preferred"] ?? item?.titles?.main ?? item?.titles?.en ?? item?.titles?.ja ?? "Unknown";
    const originName = item?.titles?.en ?? item?.titles?.main ?? item?.titles?.ja;
    const genres = Array.isArray(item?.genres)
      ? item.genres.map((genre: any) => ({
          name: String(genre?.name ?? genre),
          slug: safeSlug(String(genre?.name ?? genre)),
        }))
      : [];

    return {
      source,
      slug: String(item?.id ?? item?.slug ?? "unknown"),
      name: String(preferredTitle),
      originName: originName ? String(originName) : undefined,
      posterUrl: item?.images?.coverXl ?? item?.images?.coverLg ?? item?.images?.coverMd,
      thumbUrl: item?.images?.bannerUrl ?? item?.images?.coverLg ?? item?.images?.coverMd,
      year: item?.seasonYear ? Number(item.seasonYear) : undefined,
      type: "anime",
      status: normalizeStatus(item?.status),
      categories: genres,
    };
  }

  return {
    source,
    slug: String(item?.slug ?? item?._id ?? item?.id ?? item?.name ?? "unknown"),
    name: String(item?.name ?? item?.title ?? "Unknown"),
    originName: item?.origin_name ?? item?.original_name ?? item?.originName ?? item?.originalName,
    posterUrl: item?.poster_url ?? item?.poster ?? item?.image,
    thumbUrl: item?.thumb_url ?? item?.thumb ?? item?.thumbnail,
    year: item?.year ? Number(item.year) : undefined,
    type: normalizeType(item?.type),
    status: normalizeStatus(item?.status ?? item?.episode_current ?? item?.current_episode),
    episodeCurrent: item?.episode_current ?? item?.current_episode,
    categories: toCategories(item?.category ?? item?.categories),
    countries: toCountries(item?.country ?? item?.countries),
  };
}

function extractEpisodes(detail: any, source: MovieSource): Episode[] {
  const blocks = detail?.episodes ?? detail?.episode ?? detail?.servers;
  if (!Array.isArray(blocks)) return [];

  const list: Episode[] = [];
  blocks.forEach((serverBlock: any) => {
    const serverName = String(serverBlock?.server_name ?? serverBlock?.serverName ?? "Server");
    const entries = Array.isArray(serverBlock?.server_data)
      ? serverBlock.server_data
      : Array.isArray(serverBlock?.items)
        ? serverBlock.items
        : [];

    entries.forEach((ep: any, index: number) => {
      const embedUrl = ep?.link_embed ?? ep?.embed ?? ep?.embed_url;
      const m3u8Url = ep?.link_m3u8 ?? ep?.m3u8 ?? ep?.m3u8_url;
      list.push({
        name: String(ep?.name ?? ep?.title ?? `Tap ${index + 1}`),
        slug: ep?.slug ? String(ep.slug) : undefined,
        serverName,
        source,
        embedUrl: embedUrl ? String(embedUrl) : undefined,
        m3u8Url: m3u8Url ? String(m3u8Url) : undefined,
      });
    });
  });

  return list;
}

export async function fetchSourceMovies(config: SourceConfig, pages: number, mode: SyncMode): Promise<SourceMovieSummary[]> {
  const all: SourceMovieSummary[] = [];

  for (let page = 1; page <= pages; page += 1) {
    const urls =
      config.source === "nguonc"
        ? [
            `${config.baseUrl}/api/films/phim-moi-cap-nhat?page=${page}`,
            `${config.baseUrl}/api/films/danh-sach/phim-dang-chieu?page=${page}`,
          ]
        : config.source === "animapper"
          ? [
              `${config.baseUrl}/search?limit=50&offset=${(page - 1) * 50}&sortBy=UPDATED_AT`,
              `${config.baseUrl}/search?limit=50&offset=${(page - 1) * 50}`,
            ]
          : [
              `${config.baseUrl}/danh-sach/phim-moi-cap-nhat?page=${page}`,
              `${config.baseUrl}/api/danh-sach/phim-moi-cap-nhat?page=${page}`,
              `${config.baseUrl}/api/v1/movies?page=${page}`,
              `${config.baseUrl}/movies?page=${page}`,
            ];

    let payload: unknown;
    try {
      payload = await fetchJsonWithFallback(urls);
    } catch (error) {
      // Keep first-page failure as hard failure so source health remains accurate.
      if (page === 1) throw error;
      break;
    }

    const items = extractItems(payload);
    if (items.length === 0) {
      if (mode === "full") break;
      continue;
    }

    all.push(...items.map((item) => toSummary(config.source, item)));
  }

  return all;
}

export async function fetchSourceMovieDetail(config: SourceConfig, summary: SourceMovieSummary): Promise<MovieDetail | null> {
  const slug = summary.slug;
  const urls =
    config.source === "nguonc"
      ? [
          `${config.baseUrl}/api/film/${slug}`,
          `${config.baseUrl}/phim/${slug}`,
          `${config.baseUrl}/api/phim/${slug}`,
        ]
      : config.source === "animapper"
        ? [`${config.baseUrl}/metadata?id=${slug}`]
        : [
            `${config.baseUrl}/phim/${slug}`,
            `${config.baseUrl}/api/phim/${slug}`,
            `${config.baseUrl}/movie/${slug}`,
            `${config.baseUrl}/movies/${slug}`,
          ];

  try {
    const payload: any = await fetchJsonWithFallback(urls);
    const movie =
      config.source === "animapper"
        ? payload?.result ?? payload?.data?.result ?? payload?.data ?? payload
        : payload?.movie ?? payload?.data?.movie ?? payload?.data ?? payload;
    const detail = payload?.data?.item ?? payload?.item ?? movie ?? payload;

    const normalizedSlug = safeSlug(String(detail?.slug ?? summary.slug));
    const idSeed = buildGlobalKey(summary.name, summary.originName, summary.year);

    const episodes =
      config.source === "animapper"
        ? []
        : extractEpisodes(payload?.episodes ? payload : detail, summary.source);

    const animapperGenres = Array.isArray(detail?.genres)
      ? detail.genres.map((genre: any) => ({
          name: String(genre?.name ?? genre),
          slug: safeSlug(String(genre?.name ?? genre)),
        }))
      : undefined;

    const animapperYear =
      detail?.seasonYear
        ? Number(detail.seasonYear)
        : typeof detail?.startDate === "string" && detail.startDate.length >= 4
          ? Number(detail.startDate.slice(0, 4))
          : undefined;

    return {
      id: `${idSeed}-${summary.source}`,
      source: summary.source,
      slug: normalizedSlug,
      name: String(detail?.name ?? detail?.titles?.["user-preferred"] ?? detail?.titles?.main ?? detail?.titles?.en ?? summary.name),
      originName:
        detail?.origin_name ??
        detail?.original_name ??
        detail?.originName ??
        detail?.titles?.en ??
        detail?.titles?.main ??
        detail?.titles?.ja ??
        summary.originName,
      posterUrl: detail?.poster_url ?? detail?.images?.coverXl ?? detail?.images?.coverLg ?? summary.posterUrl,
      thumbUrl: detail?.thumb_url ?? detail?.images?.bannerUrl ?? detail?.images?.coverLg ?? summary.thumbUrl,
      year: detail?.year ? Number(detail.year) : animapperYear ?? summary.year,
      type: normalizeType(detail?.type) ?? (config.source === "animapper" ? "anime" : summary.type),
      status: normalizeStatus(detail?.status ?? detail?.episode_current ?? detail?.current_episode ?? summary.status),
      episodeCurrent: detail?.episode_current ?? detail?.current_episode ?? summary.episodeCurrent,
      categories: toCategories(detail?.category ?? animapperGenres ?? summary.categories),
      countries: toCountries(detail?.country ?? summary.countries),
      description: detail?.content ?? detail?.description ?? detail?.descriptions?.en,
      quality: detail?.quality,
      lang: detail?.lang,
      episodes,
      sources: [
        {
          source: summary.source,
          slug: summary.slug,
          episodeCount: episodes.length,
          priority: config.priority,
        },
      ],
    };
  } catch {
    const idSeed = buildGlobalTitle(summary.name, summary.originName);
    return {
      id: `${idSeed}-${summary.source}`,
      source: summary.source,
      slug: safeSlug(summary.slug),
      name: summary.name,
      originName: summary.originName,
      posterUrl: summary.posterUrl,
      thumbUrl: summary.thumbUrl,
      year: summary.year,
      type: summary.type,
      status: summary.status,
      episodeCurrent: summary.episodeCurrent,
      categories: summary.categories ?? [],
      countries: summary.countries,
      episodes: [],
      sources: [
        {
          source: summary.source,
          slug: summary.slug,
          episodeCount: 0,
          priority: config.priority,
        },
      ],
    };
  }
}

