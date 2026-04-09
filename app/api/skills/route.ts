import { NextRequest, NextResponse } from "next/server";
import { scanAllSkills } from "@/lib/skills-scanner";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search")?.toLowerCase() || "";
  const category = searchParams.get("category") || "";
  const source = searchParams.get("source") || "";
  const scope = searchParams.get("scope") || "";

  let skills = await scanAllSkills();

  if (search) {
    skills = skills.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.description.toLowerCase().includes(search)
    );
  }

  if (category) {
    skills = skills.filter((s) => s.category === category);
  }

  if (source) {
    skills = skills.filter((s) => s.sourceId === source);
  }

  if (scope) {
    skills = skills.filter((s) => s.scope === scope);
  }

  return NextResponse.json({ skills, total: skills.length });
}
