import { promises as fs } from "node:fs";
import path from "node:path";
import type { CategoryPageData, Manifest, MovieDetail, SearchIndexItem, SourcesHealth, Stats } from "./types";

const dataDir = path.join(process.cwd(), "public", "data");

async function readJson<T>(relativePath: string): Promise<T> {
  const filePath = path.join(dataDir, relativePath);
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function getManifest(): Promise<Manifest> {
  return readJson<Manifest>("manifest.json");
}

export async function getLatest(): Promise<MovieDetail[]> {
  return readJson<MovieDetail[]>("latest.json");
}

export async function getStats(): Promise<Stats> {
  return readJson<Stats>("stats.json");
}

export async function getSearchIndex(): Promise<SearchIndexItem[]> {
  return readJson<SearchIndexItem[]>("search-index.json");
}

export async function getSourcesHealth(): Promise<SourcesHealth> {
  return readJson<SourcesHealth>("sources.json");
}

export async function getMovieById(id: string): Promise<MovieDetail> {
  return readJson<MovieDetail>(path.join("movies", `${id}.json`));
}

export async function getCategoryPage(slug: string, page: number): Promise<CategoryPageData> {
  return readJson<CategoryPageData>(path.join("category", slug, `page-${page}.json`));
}

