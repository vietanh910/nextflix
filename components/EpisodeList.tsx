"use client";

import type { Episode } from "../lib/types";

type Props = {
  episodes: Episode[];
  activeIndex: number;
  onChange: (index: number) => void;
};

export default function EpisodeList({ episodes, activeIndex, onChange }: Props) {
  if (episodes.length === 0) {
    return <p className="text-sm text-textMuted">Chưa có danh sách tập.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {episodes.map((episode, index) => {
        const active = index === activeIndex;
        return (
          <button
            type="button"
            key={`${episode.serverName}-${episode.name}-${index}`}
            onClick={() => onChange(index)}
            className={`flex items-center gap-3 rounded-lg border px-4 py-4 text-left text-base transition-colors ${
              active
                ? "border-white/80 bg-panelSoft text-textMain"
                : "border-white/15 bg-[#222941] text-textMuted hover:border-white/35 hover:text-textMain"
            }`}
          >
            <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 ${active ? "text-accent" : "text-textMuted"}`} fill="currentColor">
              <path d="M8 6v12l10-6z" />
            </svg>
            {episode.name}
          </button>
        );
      })}
    </div>
  );
}
