"use client";

import { useState } from "react";
const COPY_TARGETS = [
  { id: "agents-global", label: "Agents Global", scope: "global" as const },
  { id: "cursor-global", label: "Cursor Global", scope: "global" as const },
  { id: "claude-global", label: "Claude Global", scope: "global" as const },
  { id: "agents-project", label: "Agents (Project)", scope: "project" as const },
  { id: "cursor-project", label: "Cursor (Project)", scope: "project" as const },
  { id: "claude-project", label: "Claude (Project)", scope: "project" as const },
];

interface BulkActionsProps {
  selectedCount: number;
  selectedIds: string[];
  onAction: (action: string, targetId?: string, projectPath?: string) => void;
  onClearSelection: () => void;
}

export default function BulkActions({ selectedCount, selectedIds, onAction, onClearSelection }: BulkActionsProps) {
  const [showCopyTarget, setShowCopyTarget] = useState(false);
  const [projectPath, setProjectPath] = useState("");

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4">
      <span className="text-sm text-foreground font-medium">
        {selectedCount} selected
      </span>

      <div className="w-px h-6 bg-border" />

      <button
        onClick={() => onAction("toggle")}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-card-hover text-foreground hover:bg-border transition-colors"
      >
        Toggle
      </button>

      <button
        onClick={() => setShowCopyTarget(!showCopyTarget)}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
      >
        Copy to...
      </button>

      <button
        onClick={() => {
          if (confirm(`Delete ${selectedCount} skills permanently?`)) {
            onAction("delete");
          }
        }}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
      >
        Delete
      </button>

      <button
        onClick={onClearSelection}
        className="text-muted hover:text-foreground transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {showCopyTarget && (
        <div className="absolute bottom-full mb-2 left-0 bg-card border border-border rounded-xl p-4 shadow-2xl min-w-[300px]">
          <p className="text-xs text-muted mb-2 font-medium">Copy to:</p>
          <div className="space-y-1 mb-3">
            {COPY_TARGETS.map((target) => (
              <button
                key={target.id}
                onClick={() => {
                  if (target.scope === "project" && !projectPath) {
                    return alert("Enter a project path first");
                  }
                  onAction("copy", target.id, projectPath || undefined);
                  setShowCopyTarget(false);
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-card-hover text-foreground transition-colors"
              >
                {target.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Project path (for project scope)"
            value={projectPath}
            onChange={(e) => setProjectPath(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>
      )}
    </div>
  );
}
