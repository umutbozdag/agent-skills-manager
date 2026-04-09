import { NextRequest, NextResponse } from "next/server";
import {
  getSavedProjects,
  addProject,
  removeProject,
  getDiscoveredProjects,
  startDiscoveryScan,
  getScanStatus,
} from "@/lib/projects";

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  if (action === "status") {
    return NextResponse.json(getScanStatus());
  }

  if (action === "scan") {
    startDiscoveryScan();
    return NextResponse.json({ started: true });
  }

  const saved = await getSavedProjects();
  const { discovered, cached, scannedAt } = await getDiscoveredProjects();
  const status = getScanStatus();

  const unsaved = discovered.filter(
    (d) => !saved.some((s) => s.path === d)
  );

  return NextResponse.json({ saved, discovered: unsaved, cached, scannedAt, scanStatus: status });
}

export async function POST(req: NextRequest) {
  const { path: projectPath } = await req.json();
  if (!projectPath) {
    return NextResponse.json({ error: "Path required" }, { status: 400 });
  }
  const project = await addProject(projectPath);
  return NextResponse.json({ success: true, project });
}

export async function DELETE(req: NextRequest) {
  const { path: projectPath } = await req.json();
  if (!projectPath) {
    return NextResponse.json({ error: "Path required" }, { status: 400 });
  }
  await removeProject(projectPath);
  return NextResponse.json({ success: true });
}
