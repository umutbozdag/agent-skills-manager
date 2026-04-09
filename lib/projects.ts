import fs from "fs/promises";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".agent-skills-manager");
const PROJECTS_FILE = path.join(CONFIG_DIR, "projects.json");
const DISCOVERED_CACHE_FILE = path.join(CONFIG_DIR, "discovered-cache.json");

const SKILL_SUBDIRS = [
  { subdir: ".agents/skills", tool: "agents" as const },
  { subdir: ".cursor/skills", tool: "cursor" as const },
  { subdir: ".claude/skills", tool: "claude" as const },
  { subdir: ".windsurf/rules", tool: "windsurf" as const },
  { subdir: ".cline/rules", tool: "cline" as const },
  { subdir: ".clinerules", tool: "cline" as const },
  { subdir: ".continue/rules", tool: "continue" as const },
  { subdir: ".roo/rules", tool: "roo" as const },
];

export interface SavedProject {
  path: string;
  name: string;
  addedAt: string;
}

interface DiscoveryCache {
  discovered: string[];
  scannedAt: string;
  scanDurationMs: number;
}

interface ScanStatus {
  running: boolean;
  found: number;
  currentDir: string;
  startedAt: number;
}

let scanStatus: ScanStatus = { running: false, found: 0, currentDir: "", startedAt: 0 };
let latestDiscovered: string[] = [];

async function ensureConfigDir() {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

export async function getSavedProjects(): Promise<SavedProject[]> {
  try {
    const raw = await fs.readFile(PROJECTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function addProject(projectPath: string): Promise<SavedProject> {
  await ensureConfigDir();
  const projects = await getSavedProjects();

  const normalized = path.resolve(projectPath);
  if (projects.some((p) => p.path === normalized)) {
    return projects.find((p) => p.path === normalized)!;
  }

  const project: SavedProject = {
    path: normalized,
    name: path.basename(normalized),
    addedAt: new Date().toISOString(),
  };

  projects.push(project);
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));
  return project;
}

export async function removeProject(projectPath: string): Promise<void> {
  const projects = await getSavedProjects();
  const filtered = projects.filter((p) => p.path !== projectPath);
  await ensureConfigDir();
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(filtered, null, 2));
}

// --- Discovery engine ---

const SKIP_DIRS = new Set([
  "node_modules", ".git", ".svn", ".hg", "vendor", "Pods",
  "build", "dist", "DerivedData", ".build", ".swiftpm",
  ".Trash", ".npm", ".nvm", ".cargo", ".rustup",
  ".local", ".cache", ".docker", ".vscode", ".cursor",
  "go", "pkg", "libexec", "share", "include", "lib",
  "sbin", "bin", "etc", "man", "info",
  "Library", "Applications", "Pictures", "Music", "Movies",
  "Public", "Photos",
]);

const SKIP_ROOT_DIRS = new Set([
  "System", "Library", "cores", "private",
  "sbin", "bin", "usr", "etc", "tmp", "dev",
]);

const MAX_DEPTH = 5;

async function hasSkillDir(dirPath: string): Promise<boolean> {
  for (const { subdir } of SKILL_SUBDIRS) {
    try {
      await fs.access(path.join(dirPath, subdir));
      return true;
    } catch { /* */ }
  }
  return false;
}

async function walkForProjects(
  dirPath: string,
  depth: number,
  results: string[],
  visited: Set<string>
): Promise<void> {
  if (depth > MAX_DEPTH) return;

  let realPath: string;
  try {
    realPath = await fs.realpath(dirPath);
  } catch {
    return;
  }
  if (visited.has(realPath)) return;
  visited.add(realPath);

  scanStatus.currentDir = dirPath;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    const dirs = entries.filter((e) => {
      if (!e.isDirectory()) return false;
      if (e.name.startsWith(".") && depth > 0) return false;
      if (SKIP_DIRS.has(e.name)) return false;
      return true;
    });

    const batchSize = 10;
    for (let i = 0; i < dirs.length; i += batchSize) {
      const batch = dirs.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (entry) => {
          const fullPath = path.join(dirPath, entry.name);
          if (await hasSkillDir(fullPath)) {
            results.push(fullPath);
            scanStatus.found = results.length;
          }
          await walkForProjects(fullPath, depth + 1, results, visited);
        })
      );
    }
  } catch {
    // permission denied
  }
}

async function loadCachedDiscovery(): Promise<DiscoveryCache | null> {
  try {
    const raw = await fs.readFile(DISCOVERED_CACHE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveCachedDiscovery(discovered: string[], durationMs: number): Promise<void> {
  await ensureConfigDir();
  const cache: DiscoveryCache = {
    discovered,
    scannedAt: new Date().toISOString(),
    scanDurationMs: durationMs,
  };
  await fs.writeFile(DISCOVERED_CACHE_FILE, JSON.stringify(cache, null, 2));
}

export function getScanStatus() {
  return {
    ...scanStatus,
    elapsedMs: scanStatus.running ? Date.now() - scanStatus.startedAt : 0,
  };
}

export async function getDiscoveredProjects(): Promise<{ discovered: string[]; cached: boolean; scannedAt?: string }> {
  if (latestDiscovered.length > 0) {
    return { discovered: latestDiscovered, cached: true };
  }

  const cache = await loadCachedDiscovery();
  if (cache) {
    latestDiscovered = cache.discovered;
    return { discovered: cache.discovered, cached: true, scannedAt: cache.scannedAt };
  }

  return { discovered: [], cached: false };
}

export async function startDiscoveryScan(): Promise<void> {
  if (scanStatus.running) return;

  scanStatus = { running: true, found: 0, currentDir: "", startedAt: Date.now() };
  const discovered: string[] = [];
  const visited = new Set<string>();

  const scanRoots: string[] = [];

  // All user homes
  try {
    const users = await fs.readdir("/Users", { withFileTypes: true });
    for (const u of users) {
      if (u.isDirectory() && !u.name.startsWith(".") && u.name !== "Shared") {
        scanRoots.push(path.join("/Users", u.name));
      }
    }
  } catch { /* */ }

  // Common dev locations
  for (const d of ["/opt", "/var/www", "/srv"]) {
    scanRoots.push(d);
  }

  // Mounted volumes
  try {
    const volumes = await fs.readdir("/Volumes", { withFileTypes: true });
    for (const v of volumes) {
      if (v.isDirectory() && v.name !== "Macintosh HD") {
        scanRoots.push(path.join("/Volumes", v.name));
      }
    }
  } catch { /* */ }

  // Root-level non-system dirs
  try {
    const rootEntries = await fs.readdir("/", { withFileTypes: true });
    for (const entry of rootEntries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      if (SKIP_ROOT_DIRS.has(entry.name)) continue;
      if (entry.name === "Users" || entry.name === "Volumes") continue;
      const rootPath = path.join("/", entry.name);
      if (!scanRoots.includes(rootPath)) scanRoots.push(rootPath);
    }
  } catch { /* */ }

  for (const scanDir of scanRoots) {
    try {
      await fs.access(scanDir);
      await walkForProjects(scanDir, 0, discovered, visited);
    } catch { /* */ }
  }

  const unique = [...new Set(discovered)].sort((a, b) => a.localeCompare(b));
  const durationMs = Date.now() - scanStatus.startedAt;

  latestDiscovered = unique;
  await saveCachedDiscovery(unique, durationMs);

  scanStatus = { running: false, found: unique.length, currentDir: "", startedAt: 0 };
}

export function getProjectSkillDirs(projectPath: string): { path: string; tool: "agents" | "cursor" | "claude" | "windsurf" | "cline" | "continue" | "roo" }[] {
  return SKILL_SUBDIRS.map(({ subdir, tool }) => ({
    path: path.join(projectPath, subdir),
    tool,
  }));
}
