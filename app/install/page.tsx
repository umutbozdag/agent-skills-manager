"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { clsx } from "clsx";

const XTerminal = dynamic(() => import("@/components/XTerminal"), { ssr: false });

const targets = [
  { id: "agents-global", label: "Agents Global", desc: "~/.agents/skills/", scope: "global", tool: "agents", color: "border-green-500/30 hover:border-green-500" },
  { id: "cursor-global", label: "Cursor Global", desc: "~/.cursor/skills/", scope: "global", tool: "cursor", color: "border-blue-500/30 hover:border-blue-500" },
  { id: "claude-global", label: "Claude Global", desc: "~/.claude/skills/", scope: "global", tool: "claude", color: "border-orange-500/30 hover:border-orange-500" },
  { id: "agents-project", label: "Agents (Project)", desc: "<project>/.agents/skills/", scope: "project", tool: "agents", color: "border-green-500/30 hover:border-green-500" },
  { id: "cursor-project", label: "Cursor (Project)", desc: "<project>/.cursor/skills/", scope: "project", tool: "cursor", color: "border-blue-500/30 hover:border-blue-500" },
  { id: "claude-project", label: "Claude (Project)", desc: "<project>/.claude/skills/", scope: "project", tool: "claude", color: "border-orange-500/30 hover:border-orange-500" },
];

type Tab = "create" | "git" | "terminal";

export default function InstallPage() {
  const [activeTab, setActiveTab] = useState<Tab>("git");

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-1">Install Skill</h1>
      <p className="text-sm text-muted mb-6">Install skills from Git repos, create manually, or use the terminal</p>

      <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveTab("git")}
          className={clsx(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2",
            activeTab === "git" ? "bg-accent text-white" : "text-muted hover:text-foreground"
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
          From Git Repo
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={clsx(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            activeTab === "create" ? "bg-accent text-white" : "text-muted hover:text-foreground"
          )}
        >
          Create Manually
        </button>
        <button
          onClick={() => setActiveTab("terminal")}
          className={clsx(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2",
            activeTab === "terminal" ? "bg-accent text-white" : "text-muted hover:text-foreground"
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Terminal
        </button>
      </div>

      {activeTab === "git" && <GitRepoTab />}
      {activeTab === "create" && <CreateTab />}
      {activeTab === "terminal" && <TerminalTab />}
    </div>
  );
}

const POPULAR_REPOS = [
  {
    name: "Vercel Labs Skills",
    url: "https://github.com/vercel-labs/skills",
    description: "Official skills from Vercel Labs",
  },
  {
    name: "Anthropic Skills",
    url: "https://github.com/anthropics/courses",
    description: "Anthropic's official skill collections",
  },
];

const installTargets = [
  { id: "agents-global", label: "Agents Global", desc: "~/.agents/skills/", scope: "global" },
  { id: "cursor-global", label: "Cursor Global", desc: "~/.cursor/skills/", scope: "global" },
  { id: "claude-global", label: "Claude Global", desc: "~/.claude/skills/", scope: "global" },
  { id: "agents-project", label: "Agents (Project)", desc: "<project>/.agents/skills/", scope: "project" },
  { id: "cursor-project", label: "Cursor (Project)", desc: "<project>/.cursor/skills/", scope: "project" },
  { id: "claude-project", label: "Claude (Project)", desc: "<project>/.claude/skills/", scope: "project" },
];

function GitRepoTab() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [targetId, setTargetId] = useState("cursor-global");
  const [projectPath, setProjectPath] = useState("");
  const [installing, setInstalling] = useState(false);
  const [results, setResults] = useState<{ skill: string; success: boolean; path?: string; error?: string }[]>([]);
  const [error, setError] = useState("");

  const needsProjectPath = targetId.endsWith("-project");

  const fetchSkills = useCallback(async (url: string) => {
    setLoading(true);
    setError("");
    setAvailableSkills([]);
    setSelectedSkills(new Set());
    setResults([]);

    try {
      const res = await fetch("/api/skills/fetch-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: url }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to fetch repository");
        return;
      }

      setAvailableSkills(json.skills || []);
      if (json.skills?.length === 0) {
        setError("No skills found in this repository");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleSkill = useCallback((name: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedSkills.size === availableSkills.length) {
      setSelectedSkills(new Set());
    } else {
      setSelectedSkills(new Set(availableSkills));
    }
  }, [selectedSkills.size, availableSkills]);

  const handleInstall = useCallback(async () => {
    if (selectedSkills.size === 0) return;
    if (needsProjectPath && !projectPath.trim()) {
      setError("Enter a project path for project-scoped targets");
      return;
    }

    setInstalling(true);
    setResults([]);
    const newResults: typeof results = [];

    for (const skill of selectedSkills) {
      try {
        const res = await fetch("/api/skills/fetch-repo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repoUrl,
            skill,
            targetId,
            projectPath: needsProjectPath ? projectPath : undefined,
          }),
        });
        const json = await res.json();
        if (res.ok) {
          newResults.push({ skill, success: true, path: json.path });
        } else {
          newResults.push({ skill, success: false, error: json.error });
        }
      } catch (err) {
        newResults.push({ skill, success: false, error: String(err) });
      }
    }

    setResults(newResults);
    setInstalling(false);
  }, [selectedSkills, repoUrl, targetId, projectPath, needsProjectPath]);

  return (
    <div className="space-y-4">
      {/* Popular repos */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Popular Skill Repositories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {POPULAR_REPOS.map((repo) => (
            <button
              key={repo.url}
              onClick={() => {
                setRepoUrl(repo.url);
                fetchSkills(repo.url);
              }}
              className={clsx(
                "text-left p-4 rounded-xl border transition-all",
                repoUrl === repo.url
                  ? "border-accent bg-accent-muted"
                  : "border-border bg-card-hover hover:border-accent"
              )}
            >
              <p className="text-sm font-medium text-foreground">{repo.name}</p>
              <p className="text-xs text-muted mt-0.5">{repo.description}</p>
              <p className="text-[10px] text-muted font-mono mt-1.5">{repo.url}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom URL */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Or enter a repository URL</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/user/skill-repo"
            className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            onKeyDown={(e) => {
              if (e.key === "Enter" && repoUrl.trim()) fetchSkills(repoUrl.trim());
            }}
          />
          <button
            onClick={() => repoUrl.trim() && fetchSkills(repoUrl.trim())}
            disabled={!repoUrl.trim() || loading}
            className={clsx(
              "px-5 py-2.5 text-sm font-medium rounded-xl transition-colors",
              repoUrl.trim() && !loading
                ? "bg-accent text-white hover:bg-accent-hover"
                : "bg-card-hover text-muted cursor-not-allowed"
            )}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Fetching...
              </div>
            ) : "Fetch Skills"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Skills list */}
      {availableSkills.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Available Skills ({availableSkills.length})
              </h2>
              <p className="text-xs text-muted mt-0.5">Select which skills to install</p>
            </div>
            <button
              onClick={selectAll}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
            >
              {selectedSkills.size === availableSkills.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="max-h-64 overflow-auto divide-y divide-border">
            {availableSkills.map((skill) => (
              <label
                key={skill}
                className="flex items-center gap-3 px-6 py-3 hover:bg-card-hover cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedSkills.has(skill)}
                  onChange={() => toggleSkill(skill)}
                  className="rounded border-border-hover accent-accent"
                />
                <span className="text-sm text-foreground font-mono">{skill}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Install target */}
      {selectedSkills.size > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Install {selectedSkills.size} skill{selectedSkills.size > 1 ? "s" : ""} to:
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {installTargets.map((target) => (
              <button
                key={target.id}
                onClick={() => setTargetId(target.id)}
                className={clsx(
                  "text-left p-3 rounded-xl border transition-all",
                  targetId === target.id
                    ? "border-accent bg-accent-muted"
                    : "border-border hover:border-accent hover:bg-card-hover"
                )}
              >
                <p className="text-xs font-medium text-foreground">{target.label}</p>
                <p className="text-[10px] text-muted font-mono mt-0.5">{target.desc}</p>
              </button>
            ))}
          </div>

          {needsProjectPath && (
            <input
              type="text"
              value={projectPath}
              onChange={(e) => setProjectPath(e.target.value)}
              placeholder="/path/to/your/project"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent mb-4"
            />
          )}

          <button
            onClick={handleInstall}
            disabled={installing}
            className="px-6 py-2.5 text-sm font-medium rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {installing ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Installing...
              </div>
            ) : `Install ${selectedSkills.size} Skill${selectedSkills.size > 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Results</h2>
          </div>
          <div className="divide-y divide-border">
            {results.map((r) => (
              <div key={r.skill} className="px-6 py-3 flex items-center justify-between">
                <span className="text-sm font-mono text-foreground">{r.skill}</span>
                {r.success ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-success">Installed</span>
                    <span className="text-[10px] text-muted font-mono truncate max-w-[300px]">{r.path}</span>
                  </div>
                ) : (
                  <span className="text-xs text-danger">{r.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateTab() {
  const [step, setStep] = useState(1);
  const [skillName, setSkillName] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("");
  const [projectPath, setProjectPath] = useState("");
  const [content, setContent] = useState("");
  const [installing, setInstalling] = useState(false);
  const [result, setResult] = useState<{ success: boolean; path?: string; error?: string } | null>(null);

  const selectedTargetInfo = targets.find((t) => t.id === selectedTarget);
  const needsProjectPath = selectedTargetInfo?.scope === "project";
  const canProceedStep2 = skillName.trim().length > 0;
  const canProceedStep3 = selectedTarget !== "" && (!needsProjectPath || projectPath.trim().length > 0);

  const handleInstall = useCallback(async () => {
    setInstalling(true);
    setResult(null);
    try {
      const res = await fetch("/api/skills/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: selectedTarget,
          projectPath: needsProjectPath ? projectPath : undefined,
          skillName,
          content: content || undefined,
        }),
      });
      const json = await res.json();
      setResult(res.ok ? { success: true, path: json.path } : { success: false, error: json.error });
    } catch (err) {
      setResult({ success: false, error: String(err) });
    } finally {
      setInstalling(false);
    }
  }, [selectedTarget, projectPath, skillName, content, needsProjectPath]);

  return (
    <>
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={clsx(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              step >= s ? "bg-accent text-white" : "bg-card border border-border text-muted"
            )}>
              {s}
            </div>
            {s < 3 && <div className={clsx("w-16 h-0.5", step > s ? "bg-accent" : "bg-border")} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Name your skill</h2>
          <input
            type="text"
            value={skillName}
            onChange={(e) => setSkillName(e.target.value.replace(/\s+/g, "-").toLowerCase())}
            placeholder="my-awesome-skill"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm"
          />
          <p className="text-xs text-muted mt-2">This will be the directory name. Use lowercase with hyphens.</p>
          <button
            onClick={() => setStep(2)}
            disabled={!canProceedStep2}
            className={clsx(
              "mt-4 px-6 py-2 text-sm font-medium rounded-xl transition-colors",
              canProceedStep2 ? "bg-accent text-white hover:bg-accent-hover" : "bg-card-hover text-muted cursor-not-allowed"
            )}
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Choose where to install</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {targets.map((target) => (
              <button
                key={target.id}
                onClick={() => setSelectedTarget(target.id)}
                className={clsx(
                  "text-left p-4 rounded-xl border-2 transition-all",
                  selectedTarget === target.id ? "border-accent bg-accent-muted" : `bg-card-hover ${target.color}`,
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium uppercase text-muted">{target.tool}</span>
                  <span className="text-[10px] text-muted">({target.scope})</span>
                </div>
                <p className="text-sm font-medium text-foreground">{target.label}</p>
                <p className="text-[10px] text-muted font-mono mt-1">{target.desc}</p>
              </button>
            ))}
          </div>
          {needsProjectPath && (
            <div className="mb-4">
              <label className="block text-xs text-muted mb-1.5 font-medium">Project Path</label>
              <input type="text" value={projectPath} onChange={(e) => setProjectPath(e.target.value)} placeholder="/Users/username/MyProject"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm" />
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={() => setStep(1)} className="px-6 py-2 text-sm font-medium rounded-xl bg-card-hover text-foreground hover:bg-border transition-colors">Back</button>
            <button onClick={() => setStep(3)} disabled={!canProceedStep3}
              className={clsx("px-6 py-2 text-sm font-medium rounded-xl transition-colors", canProceedStep3 ? "bg-accent text-white hover:bg-accent-hover" : "bg-card-hover text-muted cursor-not-allowed")}>Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Skill Content (optional)</h2>
          <p className="text-xs text-muted mb-4">Paste your SKILL.md content below, or leave empty to create a template.</p>
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            placeholder={`---\nname: ${skillName}\ndescription: Your skill description\n---\n\n# ${skillName}\n\nAdd your skill instructions here...`}
            rows={16} className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm font-mono resize-y" />
          <div className="bg-background rounded-xl p-4 mt-4 border border-border">
            <h3 className="text-xs font-medium text-muted mb-2">Summary</h3>
            <div className="text-sm space-y-1">
              <p className="text-foreground"><span className="text-muted">Skill:</span> {skillName}</p>
              <p className="text-foreground"><span className="text-muted">Target:</span> {selectedTargetInfo?.label}</p>
              {projectPath && <p className="text-foreground"><span className="text-muted">Project:</span> {projectPath}</p>}
            </div>
          </div>
          {result && (
            <div className={clsx("mt-4 p-4 rounded-xl border", result.success ? "bg-success/10 border-success/30 text-success" : "bg-danger/10 border-danger/30 text-danger")}>
              {result.success ? (
                <div>
                  <p className="text-sm font-medium">Skill installed successfully!</p>
                  <p className="text-xs mt-1 opacity-80 font-mono">{result.path}</p>
                </div>
              ) : (
                <p className="text-sm">{result.error}</p>
              )}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={() => setStep(2)} className="px-6 py-2 text-sm font-medium rounded-xl bg-card-hover text-foreground hover:bg-border transition-colors">Back</button>
            <button onClick={handleInstall} disabled={installing}
              className="px-6 py-2 text-sm font-medium rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50">
              {installing ? "Installing..." : "Install Skill"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function TerminalTab() {
  return (
    <div className="space-y-4">
      <div className="bg-accent-muted border border-accent/30 rounded-2xl p-4">
        <p className="text-sm text-foreground">
          This is a <strong>full interactive terminal</strong> powered by a PTY (pseudo-terminal).
          You can run any command, including interactive CLIs like{" "}
          <code className="bg-card px-1.5 py-0.5 rounded text-accent text-xs">npx skills add</code>,
          navigate with arrow keys, and use Ctrl+C.
        </p>
        <p className="text-xs text-muted mt-2">
          Make sure the PTY server is running:{" "}
          <code className="bg-card px-1.5 py-0.5 rounded text-xs">npx tsx server/pty-server.ts</code>
        </p>
      </div>

      <XTerminal />
    </div>
  );
}
