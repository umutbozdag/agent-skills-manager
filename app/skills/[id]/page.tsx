"use client";

import { use, useState, useCallback } from "react";
import Link from "next/link";
import { useSkill } from "@/lib/hooks";
import SkillEditor from "@/components/SkillEditor";
import { clsx } from "clsx";

const toolColors: Record<string, string> = {
  cursor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  claude: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  agents: "bg-green-500/10 text-green-400 border-green-500/20",
  plugin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { skill, loading, refetch } = useSkill(id);
  const [showEditor, setShowEditor] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  const handleSave = useCallback(async (rawContent: string) => {
    await fetch(`/api/skills/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawContent }),
    });
    refetch();
  }, [id, refetch]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this skill permanently?")) return;
    setDeleting(true);
    await fetch(`/api/skills/${id}`, { method: "DELETE" });
    window.location.href = "/";
  }, [id]);

  const handleToggle = useCallback(async () => {
    if (!skill) return;
    await fetch("/api/skills/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId: id, enabled: !skill.enabled }),
    });
    refetch();
  }, [id, skill, refetch]);

  const handleInstall = useCallback(async (targetId: string, projectPath?: string) => {
    await fetch("/api/skills/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceSkillId: id,
        targetId,
        projectPath,
        skillName: skill?.name,
      }),
    });
    setShowInstall(false);
    alert("Skill installed successfully!");
  }, [id, skill]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted mb-4">Skill not found</p>
        <Link href="/" className="text-accent hover:text-accent-hover text-sm">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (showEditor) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card">
          <button
            onClick={() => setShowEditor(false)}
            className="text-muted hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-foreground">Editing: {skill.name}</span>
        </div>
        <div className="flex-1">
          <SkillEditor rawContent={skill.rawContent} onSave={handleSave} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </Link>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={clsx("px-2.5 py-0.5 rounded-md text-[11px] font-medium uppercase tracking-wider border", toolColors[skill.tool])}>
                  {skill.tool}
                </span>
                <span className="text-xs text-muted">{skill.scope}</span>
                <span className={clsx("text-xs px-2 py-0.5 rounded-full", skill.enabled ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>
                  {skill.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <h1 className="text-xl font-bold text-foreground">{skill.name}</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInstall(!showInstall)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
              >
                Install to...
              </button>
              <button
                onClick={() => setShowEditor(true)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleToggle}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-card-hover text-foreground hover:bg-border transition-colors"
              >
                {skill.enabled ? "Disable" : "Enable"}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>

          <p className="text-sm text-muted leading-relaxed">{skill.description}</p>
        </div>

        {showInstall && (
          <InstallPanel skillName={skill.name} onInstall={handleInstall} onClose={() => setShowInstall(false)} />
        )}

        <div className="p-6 border-b border-border">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <DetailRow label="Category" value={skill.category} />
            <DetailRow label="Source" value={skill.sourceLabel} />
            <DetailRow label="File Size" value={`${(skill.fileSize / 1024).toFixed(1)} KB`} />
            <DetailRow label="Last Modified" value={new Date(skill.modifiedAt).toLocaleDateString()} />
            <div className="col-span-2">
              <DetailRow label="File Path" value={skill.filePath} mono />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wider">Content Preview</h3>
            <button
              onClick={() => setShowEditor(true)}
              className="text-xs text-accent hover:text-accent-hover transition-colors"
            >
              Open Editor
            </button>
          </div>
          <div className="bg-background rounded-xl p-6 border border-border">
            <pre className="text-xs text-muted font-mono whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-auto">
              {skill.rawContent}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted mb-0.5">{label}</p>
      <p className={clsx("text-sm text-foreground", mono && "font-mono text-xs break-all")}>{value}</p>
    </div>
  );
}

function InstallPanel({ skillName, onInstall, onClose }: { skillName: string; onInstall: (targetId: string, projectPath?: string) => void; onClose: () => void }) {
  const [projectPath, setProjectPath] = useState("");

  const targets = [
    { id: "agents-global", label: "Agents Global", desc: "~/.agents/skills/", scope: "global" },
    { id: "cursor-global", label: "Cursor Global", desc: "~/.cursor/skills/", scope: "global" },
    { id: "claude-global", label: "Claude Global", desc: "~/.claude/skills/", scope: "global" },
    { id: "agents-project", label: "Agents (Project)", desc: "<project>/.agents/skills/", scope: "project" },
    { id: "cursor-project", label: "Cursor (Project)", desc: "<project>/.cursor/skills/", scope: "project" },
    { id: "claude-project", label: "Claude (Project)", desc: "<project>/.claude/skills/", scope: "project" },
  ];

  return (
    <div className="p-6 border-b border-border bg-accent-muted">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Install "{skillName}" to:</h3>
        <button onClick={onClose} className="text-muted hover:text-foreground">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-xs text-muted mb-1.5">Project Path (for project-scoped targets)</label>
        <input
          type="text"
          value={projectPath}
          onChange={(e) => setProjectPath(e.target.value)}
          placeholder="/Users/username/MyProject"
          className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {targets.map((target) => (
          <button
            key={target.id}
            onClick={() => {
              if (target.scope === "project" && !projectPath) {
                alert("Please enter a project path first");
                return;
              }
              onInstall(target.id, projectPath || undefined);
            }}
            className="text-left p-3 rounded-xl bg-card border border-border hover:border-accent hover:bg-card-hover transition-all"
          >
            <p className="text-sm font-medium text-foreground">{target.label}</p>
            <p className="text-[10px] text-muted font-mono mt-0.5">{target.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
