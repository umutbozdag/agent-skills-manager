import fs from "fs/promises";
import path from "path";

export async function updateSkillContent(filePath: string, rawContent: string): Promise<void> {
  await fs.writeFile(filePath, rawContent, "utf-8");
}

export async function deleteSkill(dirPath: string): Promise<void> {
  await fs.rm(dirPath, { recursive: true, force: true });
}

export async function toggleSkill(filePath: string, enabled: boolean): Promise<string> {
  const dir = path.dirname(filePath);
  const enabledPath = path.join(dir, "SKILL.md");
  const disabledPath = path.join(dir, "SKILL.md.disabled");

  if (enabled) {
    await fs.rename(filePath, enabledPath);
    return enabledPath;
  } else {
    await fs.rename(filePath, disabledPath);
    return disabledPath;
  }
}

export async function moveSkill(sourceDirPath: string, targetBasePath: string, skillName: string): Promise<string> {
  const targetDir = path.join(targetBasePath, skillName);
  await fs.mkdir(targetDir, { recursive: true });

  const entries = await fs.readdir(sourceDirPath, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(sourceDirPath, entry.name);
    const destPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }

  await fs.rm(sourceDirPath, { recursive: true, force: true });
  return targetDir;
}

export async function copySkill(sourceDirPath: string, targetBasePath: string, skillName: string): Promise<string> {
  const targetDir = path.join(targetBasePath, skillName);
  await fs.mkdir(targetDir, { recursive: true });

  const entries = await fs.readdir(sourceDirPath, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(sourceDirPath, entry.name);
    const destPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }

  return targetDir;
}

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export async function createSkill(targetBasePath: string, skillName: string, content: string): Promise<string> {
  const targetDir = path.join(targetBasePath, skillName);
  await fs.mkdir(targetDir, { recursive: true });

  const skillFile = path.join(targetDir, "SKILL.md");
  const template = content || `---
name: ${skillName}
description: TODO - Add description
---

# ${skillName}

TODO - Add skill instructions here.
`;

  await fs.writeFile(skillFile, template, "utf-8");
  return skillFile;
}
