import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getSkillById, getSkillContent } from "@/lib/skills-scanner";
import { copySkill, createSkill } from "@/lib/skill-writer";
import { INSTALL_TARGETS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const { sourceSkillId, targetId, projectPath, skillName, content } = await req.json();

  const target = INSTALL_TARGETS.find((t) => t.id === targetId);
  if (!target) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  let basePath = target.basePath;
  if (target.scope === "project") {
    if (!projectPath) {
      return NextResponse.json({ error: "Project path required for project-scoped install" }, { status: 400 });
    }
    basePath = path.join(projectPath, target.basePath);
  }

  if (sourceSkillId) {
    const skill = await getSkillById(sourceSkillId);
    if (!skill) {
      return NextResponse.json({ error: "Source skill not found" }, { status: 404 });
    }
    const resultDir = await copySkill(skill.dirPath, basePath, skillName || skill.name);
    return NextResponse.json({ success: true, path: resultDir });
  }

  if (content) {
    const resultFile = await createSkill(basePath, skillName, content);
    return NextResponse.json({ success: true, path: resultFile });
  }

  const resultFile = await createSkill(basePath, skillName, "");
  return NextResponse.json({ success: true, path: resultFile });
}
