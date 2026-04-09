import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const { repoUrl, skill, targetId, projectPath } = await req.json();

  if (!repoUrl) {
    return NextResponse.json({ error: "Repository URL required" }, { status: 400 });
  }

  const tmpDir = path.join(os.tmpdir(), `skill-fetch-${Date.now()}`);

  try {
    await execAsync(`git clone --depth 1 ${repoUrl} ${tmpDir}`, { timeout: 60000 });

    const skillsDir = path.join(tmpDir, "skills");
    let availableSkills: string[] = [];

    // Check for skills/ directory in the repo
    try {
      const entries = await fs.readdir(skillsDir, { withFileTypes: true });
      availableSkills = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
      // Try root level - maybe each dir is a skill
      const entries = await fs.readdir(tmpDir, { withFileTypes: true });
      availableSkills = entries
        .filter((e) => e.isDirectory() && !e.name.startsWith("."))
        .filter((e) => {
          try {
            // sync check, within async handler is fine for tmp dir
            return require("fs").existsSync(path.join(tmpDir, e.name, "SKILL.md"));
          } catch {
            return false;
          }
        })
        .map((e) => e.name);
    }

    // If specific skill requested, install it
    if (skill && targetId) {
      const INSTALL_TARGETS: Record<string, string> = {
        "agents-global": path.join(os.homedir(), ".agents", "skills"),
        "cursor-global": path.join(os.homedir(), ".cursor", "skills"),
        "claude-global": path.join(os.homedir(), ".claude", "skills"),
        "agents-project": ".agents/skills",
        "cursor-project": ".cursor/skills",
        "claude-project": ".claude/skills",
      };

      let basePath = INSTALL_TARGETS[targetId];
      if (!basePath) {
        return NextResponse.json({ error: "Invalid target" }, { status: 400 });
      }

      if (targetId.endsWith("-project")) {
        if (!projectPath) {
          return NextResponse.json({ error: "Project path required" }, { status: 400 });
        }
        basePath = path.join(projectPath, basePath);
      }

      // Find the skill source dir
      let sourceDir = path.join(skillsDir, skill);
      try {
        await fs.access(sourceDir);
      } catch {
        sourceDir = path.join(tmpDir, skill);
      }

      const destDir = path.join(basePath, skill);
      await fs.mkdir(destDir, { recursive: true });

      // Copy all files
      async function copyRecursive(src: string, dest: string) {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          if (entry.isDirectory()) {
            await copyRecursive(srcPath, destPath);
          } else {
            await fs.copyFile(srcPath, destPath);
          }
        }
      }

      await copyRecursive(sourceDir, destDir);

      // Cleanup
      await fs.rm(tmpDir, { recursive: true, force: true });

      return NextResponse.json({ success: true, installed: skill, path: destDir });
    }

    // Otherwise return available skills list
    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });

    return NextResponse.json({ skills: availableSkills });
  } catch (err: unknown) {
    // Cleanup on error
    try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch { /* */ }

    const error = err as { message?: string };
    return NextResponse.json({ error: error.message || "Failed to fetch repo" }, { status: 500 });
  }
}
