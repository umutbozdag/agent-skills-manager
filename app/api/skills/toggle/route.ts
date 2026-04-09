import { NextRequest, NextResponse } from "next/server";
import { getSkillById } from "@/lib/skills-scanner";
import { toggleSkill } from "@/lib/skill-writer";

export async function POST(req: NextRequest) {
  const { skillId, enabled } = await req.json();

  const skill = await getSkillById(skillId);
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const newPath = await toggleSkill(skill.filePath, enabled);
  return NextResponse.json({ success: true, newPath });
}
