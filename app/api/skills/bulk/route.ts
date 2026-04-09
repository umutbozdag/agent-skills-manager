import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getSkillById } from "@/lib/skills-scanner";
import { deleteSkill, toggleSkill, copySkill, moveSkill } from "@/lib/skill-writer";
import { INSTALL_TARGETS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const { action, skillIds, targetId, projectPath } = await req.json();
  const results: { id: string; success: boolean; error?: string }[] = [];

  for (const skillId of skillIds) {
    try {
      const skill = await getSkillById(skillId);
      if (!skill) {
        results.push({ id: skillId, success: false, error: "Not found" });
        continue;
      }

      switch (action) {
        case "delete":
          await deleteSkill(skill.dirPath);
          break;

        case "toggle":
          await toggleSkill(skill.filePath, !skill.enabled);
          break;

        case "copy":
        case "move": {
          const target = INSTALL_TARGETS.find((t) => t.id === targetId);
          if (!target) {
            results.push({ id: skillId, success: false, error: "Invalid target" });
            continue;
          }
          let basePath = target.basePath;
          if (target.scope === "project" && projectPath) {
            basePath = path.join(projectPath, target.basePath);
          }
          if (action === "copy") {
            await copySkill(skill.dirPath, basePath, skill.name);
          } else {
            await moveSkill(skill.dirPath, basePath, skill.name);
          }
          break;
        }
      }

      results.push({ id: skillId, success: true });
    } catch (err) {
      results.push({ id: skillId, success: false, error: String(err) });
    }
  }

  return NextResponse.json({ results });
}
