"use client";

import Link from "next/link";
import type { Skill } from "@/lib/types";
import { clsx } from "clsx";

const toolColors: Record<string, string> = {
  cursor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  claude: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  agents: "bg-green-500/10 text-green-400 border-green-500/20",
  plugin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const scopeLabels: Record<string, string> = {
  global: "Global",
  plugin: "Plugin",
  project: "Project",
};

interface SkillCardProps {
  skill: Skill;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onToggle?: (id: string, enabled: boolean) => void;
}

export default function SkillCard({ skill, selected, onSelect, onToggle }: SkillCardProps) {
  return (
    <div
      className={clsx(
        "group relative border rounded-xl p-4 transition-all duration-200",
        selected
          ? "border-accent bg-accent-muted"
          : "border-border hover:border-border-hover bg-card hover:bg-card-hover",
        !skill.enabled && "opacity-50"
      )}
    >
      {onSelect && (
        <button
          onClick={() => onSelect(skill.id)}
          className={clsx(
            "absolute top-3 right-3 w-5 h-5 rounded border transition-colors",
            selected
              ? "bg-accent border-accent"
              : "border-border-hover hover:border-muted"
          )}
        >
          {selected && (
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      )}

      <Link href={`/skills/${skill.id}`} className="block">
        <div className="flex items-start gap-3 mb-3">
          <div className={clsx("shrink-0 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider border", toolColors[skill.tool])}>
            {skill.tool}
          </div>
          <span className="text-[10px] text-muted uppercase tracking-wider">
            {scopeLabels[skill.scope]}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-accent-hover transition-colors">
          {skill.name}
        </h3>

        <p className="text-xs text-muted line-clamp-2 leading-relaxed mb-3">
          {skill.description || "No description"}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-card-hover text-muted border border-border">
            {skill.category}
          </span>

          {onToggle && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggle(skill.id, !skill.enabled);
              }}
              className={clsx(
                "w-8 h-4 rounded-full transition-colors relative",
                skill.enabled ? "bg-success" : "bg-border"
              )}
            >
              <div
                className={clsx(
                  "w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform",
                  skill.enabled ? "translate-x-4" : "translate-x-0.5"
                )}
              />
            </button>
          )}
        </div>
      </Link>
    </div>
  );
}
