import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getSkillById } from "@/lib/skills-scanner";
import { moveSkill } from "@/lib/skill-writer";
import { INSTALL_TARGETS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const { skillId, targetId, projectPath } = await req.json();

  const skill = await getSkillById(skillId);
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const target = INSTALL_TARGETS.find((t) => t.id === targetId);
  if (!target) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  let basePath = target.basePath;
  if (target.scope === "project") {
    if (!projectPath) {
      return NextResponse.json({ error: "Project path required" }, { status: 400 });
    }
    basePath = path.join(projectPath, target.basePath);
  }

  const resultDir = await moveSkill(skill.dirPath, basePath, skill.name);
  return NextResponse.json({ success: true, path: resultDir });
}
