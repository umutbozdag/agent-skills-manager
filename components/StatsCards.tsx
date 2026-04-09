"use client";

import type { Skill } from "@/lib/types";

interface StatsCardsProps {
  skills: Skill[];
}

export default function StatsCards({ skills }: StatsCardsProps) {
  const totalSkills = skills.length;
  const enabledSkills = skills.filter((s) => s.enabled).length;
  const categories = new Set(skills.map((s) => s.category));
  const sources = new Set(skills.map((s) => s.sourceId));

  const stats = [
    { label: "Total Skills", value: totalSkills, color: "text-accent" },
    { label: "Enabled", value: enabledSkills, color: "text-success" },
    { label: "Categories", value: categories.size, color: "text-warning" },
    { label: "Sources", value: sources.size, color: "text-purple-400" },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">{stat.label}</p>
          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
