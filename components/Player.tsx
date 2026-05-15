"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import type { Episode } from "../lib/types";

type Props = {
  episode?: Episode;
  preferredStream?: "m3u8" | "embed";
};

export default function Player({ episode, preferredStream = "m3u8" }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hlsError, setHlsError] = useState<string | null>(null);

  const streamMode = useMemo(() => {
    if (!episode) return "none";
    if (preferredStream === "embed" && episode.embedUrl) return "embed";
    if (episode.m3u8Url) return "m3u8";
    if (episode.embedUrl) return "embed";
    return "none";
  }, [episode, preferredStream]);

  useEffect(() => {
    setHlsError(null);
    if (streamMode !== "m3u8" || !episode?.m3u8Url || !videoRef.current) return;

    if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = episode.m3u8Url;
      return;
    }

    if (!Hls.isSupported()) {
      setHlsError("Trình duyệt không hỗ trợ HLS.");
      return;
    }

    const hls = new Hls();
    hls.loadSource(episode.m3u8Url);
    hls.attachMedia(videoRef.current);
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        setHlsError("Không phát được stream M3U8.");
      }
    });

    return () => {
      hls.destroy();
    };
  }, [episode?.m3u8Url, streamMode]);

  if (!episode) {
    return <div className="rounded-xl border border-white/10 bg-panel p-4 text-textMuted">Chọn tập để xem.</div>;
  }

  if (streamMode === "m3u8") {
    return (
      <div className="space-y-2">
        <video ref={videoRef} controls playsInline className="aspect-video w-full rounded-xl border border-white/10 bg-black" />
        {hlsError ? <p className="text-sm text-red-400">{hlsError}</p> : null}
      </div>
    );
  }

  if (streamMode === "embed" && episode.embedUrl) {
    return (
      <iframe
        src={episode.embedUrl}
        className="aspect-video w-full rounded-xl border border-white/10 bg-black"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        title={episode.name}
      />
    );
  }

  return <div className="rounded-xl border border-white/10 bg-panel p-4 text-textMuted">Tập này chưa có nguồn phát hợp lệ.</div>;
}

