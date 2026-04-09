import { NextRequest, NextResponse } from "next/server";
import { getSkillById, getSkillContent } from "@/lib/skills-scanner";
import { updateSkillContent, deleteSkill } from "@/lib/skill-writer";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const skill = await getSkillById(id);
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const rawContent = await getSkillContent(skill.filePath);
  return NextResponse.json({ ...skill, rawContent });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const skill = await getSkillById(id);
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const { rawContent } = await req.json();
  await updateSkillContent(skill.filePath, rawContent);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const skill = await getSkillById(id);
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  await deleteSkill(skill.dirPath);
  return NextResponse.json({ success: true });
}
