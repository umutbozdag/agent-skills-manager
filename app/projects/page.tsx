"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { clsx } from "clsx";

interface SavedProject {
  path: string;
  name: string;
  addedAt: string;
}

interface ScanStatus {
  running: boolean;
  found: number;
  currentDir: string;
  elapsedMs: number;
}

export default function ProjectsPage() {
  const [saved, setSaved] = useState<SavedProject[]>([]);
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPath, setNewPath] = useState("");
  const [adding, setAdding] = useState(false);
  const [cached, setCached] = useState(false);
  const [scannedAt, setScannedAt] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus>({ running: false, found: 0, currentDir: "", elapsedMs: 0 });
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      const json = await res.json();
      setSaved(json.saved);
      setDiscovered(json.discovered);
      setCached(json.cached);
      setScannedAt(json.scannedAt || null);
      if (json.scanStatus) setScanStatus(json.scanStatus);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/projects?action=status");
      const status: ScanStatus = await res.json();
      setScanStatus(status);

      if (!status.running) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        fetchProjects();
      }
    } catch { /* */ }
  }, [fetchProjects]);

  const startScan = useCallback(async () => {
    await fetch("/api/projects?action=scan");
    setScanStatus({ running: true, found: 0, currentDir: "Starting...", elapsedMs: 0 });

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(pollStatus, 1000);
  }, [pollStatus]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleAdd = useCallback(async (projectPath: string) => {
    setAdding(true);
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: projectPath }),
      });
      setNewPath("");
      fetchProjects();
    } finally {
      setAdding(false);
    }
  }, [fetchProjects]);

  const handleRemove = useCallback(async (projectPath: string) => {
    await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: projectPath }),
    });
    fetchProjects();
  }, [fetchProjects]);

  const formatElapsed = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-1">Projects</h1>
      <p className="text-sm text-muted mb-8">Add projects to scan their local skill directories (.agents/skills, .cursor/skills, .claude/skills)</p>

      {/* Manual add */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Add Project Manually</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            placeholder="/path/to/your/project"
            className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newPath.trim()) handleAdd(newPath.trim());
            }}
          />
          <button
            onClick={() => newPath.trim() && handleAdd(newPath.trim())}
            disabled={!newPath.trim() || adding}
            className={clsx(
              "px-5 py-2.5 text-sm font-medium rounded-xl transition-colors",
              newPath.trim() ? "bg-accent text-white hover:bg-accent-hover" : "bg-card-hover text-muted cursor-not-allowed"
            )}
          >
            {adding ? "Adding..." : "Add"}
          </button>
        </div>
      </div>

      {/* Full PC scan */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Full System Scan</h2>
            <p className="text-xs text-muted mt-0.5">
              Scans your entire computer for projects with skill directories
            </p>
          </div>
          <button
            onClick={startScan}
            disabled={scanStatus.running}
            className={clsx(
              "px-4 py-2 text-sm font-medium rounded-xl transition-colors",
              scanStatus.running
                ? "bg-card-hover text-muted cursor-not-allowed"
                : "bg-accent text-white hover:bg-accent-hover"
            )}
          >
            {scanStatus.running ? "Scanning..." : "Scan Entire PC"}
          </button>
        </div>

        {scanStatus.running && (
          <div className="bg-background rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-sm text-foreground font-medium">
                Scanning... found {scanStatus.found} project{scanStatus.found !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-muted ml-auto">
                {formatElapsed(scanStatus.elapsedMs)}
              </span>
            </div>
            <p className="text-[10px] text-muted font-mono truncate">
              {scanStatus.currentDir}
            </p>
          </div>
        )}

        {!scanStatus.running && scannedAt && (
          <p className="text-xs text-muted">
            Last scan: {new Date(scannedAt).toLocaleString()}
            {cached && " (cached)"}
          </p>
        )}

        {!scanStatus.running && !scannedAt && !cached && (
          <p className="text-xs text-muted">
            No scan results yet. Click "Scan Entire PC" to find all projects with skill directories.
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Tracked projects */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                Tracked Projects ({saved.length})
              </h2>
              <p className="text-xs text-muted mt-0.5">Skills from these projects appear on the dashboard</p>
            </div>

            {saved.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-muted">
                No projects tracked yet. Add manually or scan your PC to discover them.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {saved.map((project) => (
                  <div key={project.path} className="px-6 py-4 flex items-center justify-between hover:bg-card-hover transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{project.name}</p>
                      <p className="text-xs text-muted font-mono">{project.path}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted">
                        Added {new Date(project.addedAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleRemove(project.path)}
                        className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discovered (not yet tracked) */}
          {discovered.length > 0 && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Discovered Projects ({discovered.length})
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    Found on your system but not yet tracked
                  </p>
                </div>
                <button
                  onClick={async () => {
                    for (const p of discovered) {
                      await fetch("/api/projects", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ path: p }),
                      });
                    }
                    fetchProjects();
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                >
                  Add All
                </button>
              </div>
              <div className="divide-y divide-border">
                {discovered.map((projectPath) => (
                  <div key={projectPath} className="px-6 py-4 flex items-center justify-between hover:bg-card-hover transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {projectPath.split("/").pop()}
                      </p>
                      <p className="text-xs text-muted font-mono">{projectPath}</p>
                    </div>
                    <button
                      onClick={() => handleAdd(projectPath)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
