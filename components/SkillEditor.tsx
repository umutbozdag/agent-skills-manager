"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { clsx } from "clsx";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

interface SkillEditorProps {
  rawContent: string;
  onSave: (content: string) => Promise<void>;
}

export default function SkillEditor({ rawContent, onSave }: SkillEditorProps) {
  const [content, setContent] = useState(rawContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview" | "split">("split");

  const hasChanges = content !== rawContent;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(content);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const markdownContent = content.replace(/^---[\s\S]*?---\n*/m, "");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-1 bg-background rounded-lg p-0.5">
          {(["edit", "split", "preview"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={clsx(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize",
                mode === m ? "bg-accent text-white" : "text-muted hover:text-foreground"
              )}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-warning">Unsaved changes</span>
          )}
          {saved && (
            <span className="text-xs text-success">Saved!</span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={clsx(
              "px-4 py-1.5 text-xs font-medium rounded-lg transition-colors",
              hasChanges
                ? "bg-accent text-white hover:bg-accent-hover"
                : "bg-card-hover text-muted cursor-not-allowed"
            )}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {(mode === "edit" || mode === "split") && (
          <div className={clsx("overflow-auto", mode === "split" ? "w-1/2 border-r border-border" : "w-full")}>
            <CodeMirror
              value={content}
              onChange={setContent}
              height="100%"
              theme="dark"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
              }}
              className="h-full"
            />
          </div>
        )}

        {(mode === "preview" || mode === "split") && (
          <div className={clsx("overflow-auto p-6", mode === "split" ? "w-1/2" : "w-full")}>
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdownContent}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
