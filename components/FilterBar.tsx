"use client";

import { clsx } from "clsx";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function FilterBar({ label, options, value, onChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted font-medium uppercase tracking-wider shrink-0">{label}:</span>
      <button
        onClick={() => onChange("")}
        className={clsx(
          "px-2.5 py-1 rounded-lg text-xs transition-colors",
          !value
            ? "bg-accent text-white"
            : "text-muted hover:text-foreground hover:bg-card-hover"
        )}
      >
        All
      </button>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value === value ? "" : opt.value)}
          className={clsx(
            "px-2.5 py-1 rounded-lg text-xs transition-colors",
            opt.value === value
              ? "bg-accent text-white"
              : "text-muted hover:text-foreground hover:bg-card-hover"
          )}
        >
          {opt.label}
          {opt.count !== undefined && (
            <span className="ml-1 opacity-60">({opt.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
