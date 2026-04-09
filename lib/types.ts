export interface SkillFrontmatter {
  name: string;
  description: string;
  [key: string]: unknown;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  filePath: string;
  dirPath: string;
  sourceId: string;
  sourceLabel: string;
  scope: "global" | "plugin" | "project";
  tool: "cursor" | "claude" | "agents" | "plugin";
  enabled: boolean;
  fileSize: number;
  modifiedAt: string;
  frontmatter: SkillFrontmatter;
  content?: string;
}

export interface ProjectInfo {
  path: string;
  name: string;
  skillDirs: string[];
}

export interface InstallRequest {
  sourceSkillId?: string;
  targetId: string;
  projectPath?: string;
  skillName: string;
  content?: string;
}

export interface BulkAction {
  action: "copy" | "move" | "delete" | "toggle";
  skillIds: string[];
  targetId?: string;
  projectPath?: string;
}
