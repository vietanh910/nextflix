"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import EpisodeList from "../../../components/EpisodeList";
import Player from "../../../components/Player";
import SourceSelector from "../../../components/SourceSelector";
import { addWatchHistory } from "../../../lib/storage";
import type { Episode, MovieDetail, MovieListItem, MovieSource } from "../../../lib/types";

type Props = {
  movie: MovieDetail;
};

type SourceOption = {
  value: string;
  label: string;
  badge: string;
  source: MovieSource;
};

type SubSourceOption = {
  value: string;
  label: string;
  badge: string;
  streamKind: "m3u8" | "embed";
  serverName: string;
};

const SOURCE_ABBREVIATION: Record<MovieSource, string> = {
  ophim: "OPH",
  phimapi: "PA",
  nguonc: "NC",
  animapper: "AM",
};

const SOURCE_ORDER: MovieSource[] = ["ophim", "phimapi", "nguonc", "animapper"];

function resolveEpisodeSource(episode: Episode, movie: MovieDetail): MovieSource | undefined {
  if (episode.source) return episode.source;
  if ((movie.sources?.length ?? 0) === 1) return movie.sources?.[0].source;
  return undefined;
}

export default function WatchClient({ movie }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const sourceOptions = useMemo<SourceOption[]>(() => {
    return SOURCE_ORDER.map((source, index) => ({
      value: source,
      source,
      label: `Nguon ${index + 1}`,
      badge: SOURCE_ABBREVIATION[source] ?? source.toUpperCase(),
    }));
  }, []);

  const selectedSourceValue = searchParams.get("sv") ?? "";
  const selectedSource = sourceOptions.find((option) => option.value === selectedSourceValue);
  const hasSelectedSource = Boolean(selectedSource);

  const episodesByApiSource = useMemo(() => {
    if (!selectedSource) return [];
    return movie.episodes.filter((episode) => resolveEpisodeSource(episode, movie) === selectedSource.source);
  }, [movie, selectedSource]);

  const subSourceOptions = useMemo<SubSourceOption[]>(() => {
    if (!selectedSource) return [];
    const map = new Map<string, SubSourceOption>();

    episodesByApiSource.forEach((episode) => {
      if (episode.m3u8Url) {
        const key = `${episode.serverName}|m3u8`;
        if (!map.has(key)) {
          map.set(key, {
            value: key,
            label: `Nguon ${sourceOptions.findIndex((item) => item.value === selectedSource.value) + 1}.${map.size + 1}`,
            badge: "M3U8",
            streamKind: "m3u8",
            serverName: episode.serverName,
          });
        }
      }

      if (episode.embedUrl) {
        const key = `${episode.serverName}|embed`;
        if (!map.has(key)) {
          map.set(key, {
            value: key,
            label: `Nguon ${sourceOptions.findIndex((item) => item.value === selectedSource.value) + 1}.${map.size + 1}`,
            badge: "EMB",
            streamKind: "embed",
            serverName: episode.serverName,
          });
        }
      }
    });

    return [...map.values()];
  }, [episodesByApiSource, selectedSource, sourceOptions]);

  const selectedSubSourceValue = searchParams.get("ss") ?? "";
  const selectedSubSource = subSourceOptions.find((option) => option.value === selectedSubSourceValue);
  const hasSelectedSubSource = Boolean(selectedSubSource);

  const episodesBySubSource = useMemo(() => {
    if (!selectedSubSource) return [];
    return episodesByApiSource.filter((episode) => {
      if (episode.serverName !== selectedSubSource.serverName) return false;
      if (selectedSubSource.streamKind === "m3u8") return Boolean(episode.m3u8Url);
      return Boolean(episode.embedUrl);
    });
  }, [episodesByApiSource, selectedSubSource]);

  const episodeIndexFromQuery = hasSelectedSubSource ? Number(searchParams.get("ep") ?? "1") - 1 : -1;
  const [activeIndex, setActiveIndex] = useState(Number.isFinite(episodeIndexFromQuery) ? Math.max(0, episodeIndexFromQuery) : 0);

  useEffect(() => {
    if (!hasSelectedSubSource) {
      setActiveIndex(-1);
      return;
    }

    const nextIndex = Number(searchParams.get("ep") ?? "1") - 1;
    const safeIndex = Number.isFinite(nextIndex)
      ? Math.max(0, Math.min(nextIndex, Math.max(0, episodesBySubSource.length - 1)))
      : 0;
    setActiveIndex(safeIndex);
  }, [searchParams, episodesBySubSource.length, hasSelectedSubSource]);

  const activeEpisode = activeIndex >= 0 ? episodesBySubSource[activeIndex] : undefined;

  useEffect(() => {
    if (!activeEpisode || !hasSelectedSubSource) return;
    addWatchHistory(movie as MovieListItem, { name: activeEpisode.name, serverName: activeEpisode.serverName });
  }, [activeEpisode, movie, hasSelectedSubSource]);

  const pushParams = (params: URLSearchParams) => {
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const onEpisodeChange = (index: number) => {
    setActiveIndex(index);
    const params = new URLSearchParams(searchParams.toString());
    params.set("ep", String(index + 1));
    if (selectedSource) params.set("sv", selectedSource.value);
    if (selectedSubSource) params.set("ss", selectedSubSource.value);
    pushParams(params);
  };

  const onSourceChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sv", value);
    params.delete("ss");
    params.delete("ep");
    pushParams(params);
  };

  const onSubSourceChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedSource) params.set("sv", selectedSource.value);
    params.set("ss", value);
    params.set("ep", "1");
    pushParams(params);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-panel p-4">
        <h1 className="text-2xl font-bold">{movie.name}</h1>
        <p className="mt-1 text-sm text-textMuted">{movie.originName ?? "No origin name"}</p>
      </div>

      <Player episode={activeEpisode} preferredStream={selectedSubSource?.streamKind ?? "m3u8"} />

      <section className="space-y-3 rounded-xl border border-white/10 bg-panel p-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-xl font-semibold text-white/90">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#f4d35e]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
          <span>Phan 1</span>
        </div>

        <SourceSelector options={sourceOptions} active={selectedSourceValue} onChange={onSourceChange} />

        {hasSelectedSource ? (
          subSourceOptions.length > 0 ? (
            <SourceSelector options={subSourceOptions} active={selectedSubSourceValue} onChange={onSubSourceChange} />
          ) : (
            <div className="rounded-lg border border-white/10 bg-panelSoft px-4 py-3 text-sm text-textMuted">
              API nay chua co nguon con (m3u8/embed/server).
            </div>
          )
        ) : (
          <div className="rounded-lg border border-white/10 bg-panelSoft px-4 py-3 text-sm text-textMuted">
            Chon nguon API truoc.
          </div>
        )}

        {hasSelectedSubSource ? (
          episodesBySubSource.length > 0 ? (
            <EpisodeList episodes={episodesBySubSource} activeIndex={activeIndex} onChange={onEpisodeChange} />
          ) : (
            <div className="rounded-lg border border-white/10 bg-panelSoft px-4 py-3 text-sm text-textMuted">
              Nguon con nay hien khong co tap phat.
            </div>
          )
        ) : hasSelectedSource && subSourceOptions.length > 0 ? (
          <div className="rounded-lg border border-white/10 bg-panelSoft px-4 py-3 text-sm text-textMuted">
            Chon nguon con trong API de hien thi danh sach tap.
          </div>
        ) : null}
      </section>
    </div>
  );
}
