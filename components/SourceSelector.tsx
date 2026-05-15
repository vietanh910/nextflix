"use client";

type SourceOption = {
  label: string;
  value: string;
  badge?: string;
};

type Props = {
  options: SourceOption[];
  active: string;
  onChange: (value: string) => void;
};

export default function SourceSelector({ options, active, onChange }: Props) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((option) => {
        const isActive = option.value === active;
        return (
          <button
            type="button"
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              isActive
                ? "border-white/90 bg-panelSoft text-textMain"
                : "border-white/15 bg-panel text-textMuted hover:border-white/35 hover:text-textMain"
            }`}
          >
            <svg viewBox="0 0 24 24" className={`h-4 w-4 ${isActive ? "text-accent" : "text-textMuted"}`} fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="7" width="18" height="10" rx="2" />
              <path d="M7 11h5" />
            </svg>
            {option.label}
            {option.badge ? <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] uppercase tracking-wide">{option.badge}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
