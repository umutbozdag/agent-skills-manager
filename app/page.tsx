"use client";

import { useState, useMemo, useCallback } from "react";
import SkillCard from "@/components/SkillCard";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import StatsCards from "@/components/StatsCards";
import BulkActions from "@/components/BulkActions";
import { useSkills, useDebounce } from "@/lib/hooks";

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const debouncedSearch = useDebounce(search, 300);
  const { skills, loading, refetch } = useSkills({
    search: debouncedSearch,
    category,
    source,
  });

  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    skills.forEach((s) => counts.set(s.category, (counts.get(s.category) || 0) + 1));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, label: value, count }));
  }, [skills]);

  const sourceOptions = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    skills.forEach((s) => {
      const existing = counts.get(s.sourceId);
      if (existing) {
        existing.count++;
      } else {
        counts.set(s.sourceId, { label: s.sourceLabel, count: 1 });
      }
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([value, { label, count }]) => ({ value, label, count }));
  }, [skills]);

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggle = useCallback(async (skillId: string, enabled: boolean) => {
    await fetch("/api/skills/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId, enabled }),
    });
    refetch();
  }, [refetch]);

  const handleBulkAction = useCallback(async (action: string, targetId?: string, projectPath?: string) => {
    await fetch("/api/skills/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        skillIds: Array.from(selectedIds),
        targetId,
        projectPath,
      }),
    });
    setSelectedIds(new Set());
    refetch();
  }, [selectedIds, refetch]);

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Agent Skills Manager</h1>
        <p className="text-sm text-muted">Manage all your AI agent skills from a single dashboard</p>
      </div>

      {!loading && <StatsCards skills={skills} />}

      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "table" ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <FilterBar label="Category" options={categoryOptions} value={category} onChange={setCategory} />
        <FilterBar label="Source" options={sourceOptions} value={source} onChange={setSource} />
      </div>

      {loading ? (
        <div className="mt-12 text-center">
          <div className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-sm text-muted">Scanning skill directories...</p>
        </div>
      ) : skills.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-muted">No skills found matching your filters.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              selected={selectedIds.has(skill.id)}
              onSelect={handleSelect}
              onToggle={handleToggle}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-card border-b border-border">
                <th className="w-8 p-3">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(skills.map((s) => s.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                    className="rounded border-border"
                  />
                </th>
                <th className="text-left p-3 text-xs font-medium text-muted uppercase tracking-wider">Name</th>
                <th className="text-left p-3 text-xs font-medium text-muted uppercase tracking-wider">Category</th>
                <th className="text-left p-3 text-xs font-medium text-muted uppercase tracking-wider">Source</th>
                <th className="text-left p-3 text-xs font-medium text-muted uppercase tracking-wider">Tool</th>
                <th className="text-left p-3 text-xs font-medium text-muted uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => (
                <tr
                  key={skill.id}
                  className="border-b border-border hover:bg-card-hover transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/skills/${skill.id}`}
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(skill.id)}
                      onChange={() => handleSelect(skill.id)}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="p-3">
                    <p className="text-sm font-medium text-foreground">{skill.name}</p>
                    <p className="text-xs text-muted line-clamp-1">{skill.description}</p>
                  </td>
                  <td className="p-3 text-xs text-muted">{skill.category}</td>
                  <td className="p-3 text-xs text-muted">{skill.sourceLabel}</td>
                  <td className="p-3 text-xs text-muted uppercase">{skill.tool}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${skill.enabled ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                      {skill.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BulkActions
        selectedCount={selectedIds.size}
        selectedIds={Array.from(selectedIds)}
        onAction={handleBulkAction}
        onClearSelection={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
