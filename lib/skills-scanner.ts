import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { GLOBAL_SKILL_SOURCES, PLUGIN_SKILL_BASE, SINGLE_FILE_SOURCES, categorizeSkill } from "./constants";
import { getSavedProjects, getProjectSkillDirs } from "./projects";
import type { Skill, SkillFrontmatter } from "./types";

function generateId(filePath: string): string {
  return Buffer.from(filePath).toString("base64url");
}

async function parseSkillFile(filePath: string): Promise<{ frontmatter: SkillFrontmatter; content: string } | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(raw);
    return {
      frontmatter: {
        name: data.name || path.basename(path.dirname(filePath)),
        description: data.description || "",
        ...data,
      },
      content,
    };
  } catch {
    return null;
  }
}

async function scanDirectory(
  dirPath: string,
  sourceId: string,
  sourceLabel: string,
  scope: Skill["scope"],
  tool: Skill["tool"]
): Promise<Skill[]> {
  const skills: Skill[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      // Handle subdirectories with SKILL.md files (Cursor, Claude, Agents pattern)
      if (entry.isDirectory()) {
        const skillDir = path.join(dirPath, entry.name);
        const skillFile = path.join(skillDir, "SKILL.md");
        const disabledFile = path.join(skillDir, "SKILL.md.disabled");

        let targetFile = skillFile;
        let enabled = true;

        try {
          await fs.access(skillFile);
        } catch {
          try {
            await fs.access(disabledFile);
            targetFile = disabledFile;
            enabled = false;
          } catch {
            // Check for .md files inside subdirectory (Windsurf, Cline, Continue, Roo pattern)
            try {
              const subEntries = await fs.readdir(skillDir);
              const mdFile = subEntries.find((f) => f.endsWith(".md") && !f.endsWith(".disabled"));
              const disabledMd = subEntries.find((f) => f.endsWith(".md.disabled"));

              if (mdFile) {
                targetFile = path.join(skillDir, mdFile);
              } else if (disabledMd) {
                targetFile = path.join(skillDir, disabledMd);
                enabled = false;
              } else {
                continue;
              }
            } catch {
              continue;
            }
          }
        }

        const parsed = await parseSkillFile(targetFile);
        if (!parsed) continue;

        const stat = await fs.stat(targetFile);
        const name = parsed.frontmatter.name || entry.name;

        skills.push({
          id: generateId(targetFile),
          name,
          description: typeof parsed.frontmatter.description === "string"
            ? parsed.frontmatter.description
            : "",
          category: categorizeSkill(name),
          filePath: targetFile,
          dirPath: skillDir,
          sourceId,
          sourceLabel,
          scope,
          tool,
          enabled,
          fileSize: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          frontmatter: parsed.frontmatter,
        });
        continue;
      }

      // Handle loose .md files directly in the rules directory
      if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".mdc")) && !entry.name.endsWith(".disabled")) {
        const filePath = path.join(dirPath, entry.name);
        const parsed = await parseSkillFile(filePath);
        if (!parsed) continue;

        const stat = await fs.stat(filePath);
        const baseName = entry.name.replace(/\.(md|mdc)$/, "");
        const name = parsed.frontmatter.name || baseName;

        skills.push({
          id: generateId(filePath),
          name,
          description: typeof parsed.frontmatter.description === "string"
            ? parsed.frontmatter.description
            : "",
          category: categorizeSkill(name),
          filePath,
          dirPath: dirPath,
          sourceId,
          sourceLabel,
          scope,
          tool,
          enabled: true,
          fileSize: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          frontmatter: parsed.frontmatter,
        });
      }

      // Handle disabled loose files
      if (entry.isFile() && entry.name.endsWith(".disabled")) {
        const filePath = path.join(dirPath, entry.name);
        const parsed = await parseSkillFile(filePath);
        if (!parsed) continue;

        const stat = await fs.stat(filePath);
        const baseName = entry.name.replace(/\.(md|mdc)\.disabled$/, "");
        const name = parsed.frontmatter.name || baseName;

        skills.push({
          id: generateId(filePath),
          name,
          description: typeof parsed.frontmatter.description === "string"
            ? parsed.frontmatter.description
            : "",
          category: categorizeSkill(name),
          filePath,
          dirPath: dirPath,
          sourceId,
          sourceLabel,
          scope,
          tool,
          enabled: false,
          fileSize: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          frontmatter: parsed.frontmatter,
        });
      }
    }
  } catch {
    // Directory doesn't exist or not readable
  }

  return skills;
}

async function scanSingleFileSources(): Promise<Skill[]> {
  const skills: Skill[] = [];

  for (const source of SINGLE_FILE_SOURCES) {
    try {
      await fs.access(source.filePath);
      const raw = await fs.readFile(source.filePath, "utf-8");
      const stat = await fs.stat(source.filePath);
      const fileName = path.basename(source.filePath);

      let frontmatter: SkillFrontmatter;
      let content: string;

      try {
        const parsed = matter(raw);
        frontmatter = {
          name: parsed.data.name || fileName,
          description: parsed.data.description || `${source.label} configuration file`,
          ...parsed.data,
        };
        content = parsed.content;
      } catch {
        frontmatter = {
          name: fileName,
          description: `${source.label} configuration file`,
        };
        content = raw;
      }

      skills.push({
        id: generateId(source.filePath),
        name: frontmatter.name,
        description: typeof frontmatter.description === "string" ? frontmatter.description : "",
        category: categorizeSkill(frontmatter.name),
        filePath: source.filePath,
        dirPath: path.dirname(source.filePath),
        sourceId: source.id,
        sourceLabel: source.label,
        scope: "global",
        tool: source.tool,
        enabled: true,
        fileSize: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        frontmatter,
      });
    } catch {
      // File doesn't exist
    }
  }

  return skills;
}

async function scanPlugins(): Promise<Skill[]> {
  const skills: Skill[] = [];

  try {
    const orgs = await fs.readdir(PLUGIN_SKILL_BASE, { withFileTypes: true });

    for (const org of orgs) {
      if (!org.isDirectory()) continue;
      const orgPath = path.join(PLUGIN_SKILL_BASE, org.name);
      const plugins = await fs.readdir(orgPath, { withFileTypes: true });

      for (const plugin of plugins) {
        if (!plugin.isDirectory()) continue;
        const pluginPath = path.join(orgPath, plugin.name);
        const versions = await fs.readdir(pluginPath, { withFileTypes: true });

        for (const version of versions) {
          if (!version.isDirectory()) continue;
          const skillsDir = path.join(pluginPath, version.name, "skills");
          const sourceLabel = `Plugin: ${org.name}/${plugin.name}`;
          const sourceId = `plugin-${org.name}-${plugin.name}`;

          const found = await scanDirectory(skillsDir, sourceId, sourceLabel, "plugin", "plugin");
          skills.push(...found);
        }
      }
    }
  } catch {
    // Plugin directory doesn't exist
  }

  return skills;
}

async function scanProjects(): Promise<Skill[]> {
  const skills: Skill[] = [];
  const projects = await getSavedProjects();

  for (const project of projects) {
    const skillDirs = getProjectSkillDirs(project.path);

    for (const { path: dirPath, tool } of skillDirs) {
      const sourceId = `project-${tool}-${project.name}`;
      const sourceLabel = `${project.name} (${tool})`;
      const found = await scanDirectory(dirPath, sourceId, sourceLabel, "project", tool);
      skills.push(...found);
    }

    // Scan project-level single files
    const projectSingleFiles = [
      { filePath: path.join(project.path, ".github", "copilot-instructions.md"), tool: "copilot" as const, label: "Copilot" },
      { filePath: path.join(project.path, ".codex", "AGENTS.md"), tool: "codex" as const, label: "Codex" },
      { filePath: path.join(project.path, "augment-guidelines.md"), tool: "augment" as const, label: "Augment" },
      { filePath: path.join(project.path, ".aider.conf.yml"), tool: "aider" as const, label: "Aider" },
    ];

    for (const sf of projectSingleFiles) {
      try {
        await fs.access(sf.filePath);
        const raw = await fs.readFile(sf.filePath, "utf-8");
        const stat = await fs.stat(sf.filePath);
        const fileName = path.basename(sf.filePath);

        let frontmatter: SkillFrontmatter;
        try {
          const parsed = matter(raw);
          frontmatter = {
            name: parsed.data.name || fileName,
            description: parsed.data.description || `${sf.label} config for ${project.name}`,
            ...parsed.data,
          };
        } catch {
          frontmatter = {
            name: fileName,
            description: `${sf.label} config for ${project.name}`,
          };
        }

        skills.push({
          id: generateId(sf.filePath),
          name: frontmatter.name,
          description: typeof frontmatter.description === "string" ? frontmatter.description : "",
          category: categorizeSkill(frontmatter.name),
          filePath: sf.filePath,
          dirPath: path.dirname(sf.filePath),
          sourceId: `project-${sf.tool}-${project.name}`,
          sourceLabel: `${project.name} (${sf.tool})`,
          scope: "project",
          tool: sf.tool,
          enabled: true,
          fileSize: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          frontmatter,
        });
      } catch {
        // File doesn't exist
      }
    }
  }

  return skills;
}

export async function scanAllSkills(): Promise<Skill[]> {
  const allSkills: Skill[] = [];

  const globalScans = GLOBAL_SKILL_SOURCES.map((source) =>
    scanDirectory(source.path, source.id, source.label, source.scope, source.tool)
  );

  const results = await Promise.all([...globalScans, scanSingleFileSources(), scanPlugins(), scanProjects()]);

  for (const batch of results) {
    allSkills.push(...batch);
  }

  allSkills.sort((a, b) => a.name.localeCompare(b.name));
  return allSkills;
}

export async function getSkillById(id: string): Promise<(Skill & { content: string }) | null> {
  const all = await scanAllSkills();
  const skill = all.find((s) => s.id === id);
  if (!skill) return null;

  const parsed = await parseSkillFile(skill.filePath);
  if (!parsed) return null;

  return { ...skill, content: parsed.content };
}

export async function getSkillContent(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

export { generateId };
