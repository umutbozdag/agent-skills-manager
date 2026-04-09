import os from "os";
import path from "path";

const HOME = os.homedir();

export type ToolType = "cursor" | "claude" | "agents" | "windsurf" | "codex" | "copilot" | "cline" | "aider" | "continue" | "roo" | "augment" | "plugin";

export interface SkillSource {
  id: string;
  label: string;
  path: string;
  scope: "global" | "plugin";
  tool: ToolType;
}

// Single-file tools store config in one file rather than a skills directory
export interface SingleFileSource {
  id: string;
  label: string;
  filePath: string;
  tool: ToolType;
}

export const GLOBAL_SKILL_SOURCES: SkillSource[] = [
  {
    id: "agents-global",
    label: "Agents (Global)",
    path: path.join(HOME, ".agents", "skills"),
    scope: "global",
    tool: "agents",
  },
  {
    id: "cursor-global",
    label: "Cursor (Global)",
    path: path.join(HOME, ".cursor", "skills"),
    scope: "global",
    tool: "cursor",
  },
  {
    id: "cursor-builtin",
    label: "Cursor Built-in",
    path: path.join(HOME, ".cursor", "skills-cursor"),
    scope: "global",
    tool: "cursor",
  },
  {
    id: "claude-global",
    label: "Claude (Global)",
    path: path.join(HOME, ".claude", "skills"),
    scope: "global",
    tool: "claude",
  },
  {
    id: "windsurf-global",
    label: "Windsurf (Global)",
    path: path.join(HOME, ".windsurf", "rules"),
    scope: "global",
    tool: "windsurf",
  },
  {
    id: "cline-global",
    label: "Cline (Global)",
    path: path.join(HOME, ".cline", "rules"),
    scope: "global",
    tool: "cline",
  },
  {
    id: "cline-global-alt",
    label: "Cline (Global Alt)",
    path: path.join(HOME, ".clinerules"),
    scope: "global",
    tool: "cline",
  },
  {
    id: "continue-global",
    label: "Continue (Global)",
    path: path.join(HOME, ".continue", "rules"),
    scope: "global",
    tool: "continue",
  },
  {
    id: "roo-global",
    label: "Roo Code (Global)",
    path: path.join(HOME, ".roo", "rules"),
    scope: "global",
    tool: "roo",
  },
];

export const SINGLE_FILE_SOURCES: SingleFileSource[] = [
  {
    id: "copilot-global",
    label: "Copilot (Global)",
    filePath: path.join(HOME, ".github", "copilot-instructions.md"),
    tool: "copilot",
  },
  {
    id: "codex-global",
    label: "Codex (Global)",
    filePath: path.join(HOME, ".codex", "AGENTS.md"),
    tool: "codex",
  },
  {
    id: "aider-global",
    label: "Aider (Global)",
    filePath: path.join(HOME, ".aider.conf.yml"),
    tool: "aider",
  },
  {
    id: "augment-global",
    label: "Augment (Global)",
    filePath: path.join(HOME, "augment-guidelines.md"),
    tool: "augment",
  },
];

export const PLUGIN_SKILL_BASE = path.join(HOME, ".cursor", "plugins", "cache");

export const INSTALL_TARGETS = [
  { id: "agents-global", label: "Agents Global", basePath: path.join(HOME, ".agents", "skills"), scope: "global" as const, tool: "agents" as const },
  { id: "cursor-global", label: "Cursor Global", basePath: path.join(HOME, ".cursor", "skills"), scope: "global" as const, tool: "cursor" as const },
  { id: "claude-global", label: "Claude Global", basePath: path.join(HOME, ".claude", "skills"), scope: "global" as const, tool: "claude" as const },
  { id: "windsurf-global", label: "Windsurf Global", basePath: path.join(HOME, ".windsurf", "rules"), scope: "global" as const, tool: "windsurf" as const },
  { id: "cline-global", label: "Cline Global", basePath: path.join(HOME, ".cline", "rules"), scope: "global" as const, tool: "cline" as const },
  { id: "continue-global", label: "Continue Global", basePath: path.join(HOME, ".continue", "rules"), scope: "global" as const, tool: "continue" as const },
  { id: "roo-global", label: "Roo Code Global", basePath: path.join(HOME, ".roo", "rules"), scope: "global" as const, tool: "roo" as const },
  { id: "agents-project", label: "Agents (Project)", basePath: ".agents/skills", scope: "project" as const, tool: "agents" as const },
  { id: "cursor-project", label: "Cursor (Project)", basePath: ".cursor/skills", scope: "project" as const, tool: "cursor" as const },
  { id: "claude-project", label: "Claude (Project)", basePath: ".claude/skills", scope: "project" as const, tool: "claude" as const },
  { id: "windsurf-project", label: "Windsurf (Project)", basePath: ".windsurf/rules", scope: "project" as const, tool: "windsurf" as const },
  { id: "cline-project", label: "Cline (Project)", basePath: ".cline/rules", scope: "project" as const, tool: "cline" as const },
  { id: "continue-project", label: "Continue (Project)", basePath: ".continue/rules", scope: "project" as const, tool: "continue" as const },
  { id: "roo-project", label: "Roo Code (Project)", basePath: ".roo/rules", scope: "project" as const, tool: "roo" as const },
];

export const CATEGORY_MAP: Record<string, string> = {
  "asc-": "App Store Connect",
  "swiftui-": "SwiftUI",
  "figma-": "Figma",
  "jira-": "JIRA",
  "cloudflare": "Cloudflare",
  "agents-sdk": "Cloudflare",
  "durable-objects": "Cloudflare",
  "workers-": "Cloudflare",
  "wrangler": "Cloudflare",
  "sandbox-sdk": "Cloudflare",
  "web-perf": "Performance",
  "plasmo-": "Chrome Extension",
  "code-connect": "Figma",
  "implement-design": "Figma",
  "design-system": "Design",
  "frontend-design": "Design",
  "animate": "Design",
  "arrange": "Design",
  "colorize": "Design",
  "polish": "Design",
  "distill": "Design",
  "bolder": "Design",
  "quieter": "Design",
  "typeset": "Design",
  "normalize": "Design",
  "adapt": "Design",
  "critique": "Design",
  "harden": "Design",
  "onboard": "Design",
  "optimize": "Performance",
  "delight": "Design",
  "extract": "Design",
  "overdrive": "Design",
  "clarify": "UX Writing",
  "audit": "Quality",
  "build-feature": "iOS Development",
  "add-component": "iOS Development",
  "explore-recipes": "iOS Development",
  "find-skills": "Utility",
  "ios-app-icon": "iOS Development",
  "app-icon": "iOS Development",
  "app-store": "App Store",
  "aso-": "App Store",
  "babysit": "Git/CI",
  "canvas": "Cursor",
  "create-rule": "Cursor",
  "create-skill": "Cursor",
  "create-subagent": "Cursor",
  "cursor-blame": "Cursor",
  "migrate-to-skills": "Cursor",
  "shell": "Cursor",
  "update-cursor": "Cursor",
  "pr-review": "Git/CI",
  "review": "Git/CI",
  "test-case": "Testing",
  "ui-design": "Design",
  "job-descriptor": "Utility",
  "capture-tasks": "JIRA",
  "generate-status": "JIRA",
  "search-company": "JIRA",
  "spec-to-backlog": "JIRA",
  "triage-issue": "JIRA",
  "teach-impeccable": "Design",
};

export function categorizeSkill(name: string): string {
  for (const [prefix, category] of Object.entries(CATEGORY_MAP)) {
    if (name.startsWith(prefix) || name.includes(prefix)) {
      return category;
    }
  }
  return "Other";
}
