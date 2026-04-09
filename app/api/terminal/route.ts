import { NextRequest } from "next/server";
import { spawn } from "child_process";
import os from "os";

const ALLOWED_COMMANDS = [
  "npx",
  "npm",
  "git",
  "curl",
  "wget",
  "ls",
  "cat",
  "mkdir",
];

function isCommandAllowed(command: string): boolean {
  const trimmed = command.trim();
  const firstWord = trimmed.split(/\s+/)[0];
  return ALLOWED_COMMANDS.includes(firstWord);
}

export async function POST(req: NextRequest) {
  const { command, cwd } = await req.json();

  if (!command) {
    return new Response(JSON.stringify({ error: "Command required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!isCommandAllowed(command)) {
    return new Response(
      JSON.stringify({ error: `Command not allowed. Allowed: ${ALLOWED_COMMANDS.join(", ")}` }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const workingDir = cwd || os.homedir();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      function send(type: string, data: string) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`));
      }

      const child = spawn("bash", ["-l", "-c", command], {
        cwd: workingDir,
        env: {
          ...process.env,
          HOME: os.homedir(),
          PATH: process.env.PATH,
          TERM: "dumb",
          CI: "true",
          FORCE_COLOR: "0",
          NO_COLOR: "1",
        },
        stdio: ["ignore", "pipe", "pipe"],
      });

      const timeout = setTimeout(() => {
        send("system", "Command timed out after 120 seconds");
        child.kill("SIGTERM");
      }, 120000);

      child.stdout.on("data", (chunk: Buffer) => {
        send("stdout", chunk.toString());
      });

      child.stderr.on("data", (chunk: Buffer) => {
        send("stderr", chunk.toString());
      });

      child.on("close", (code) => {
        clearTimeout(timeout);
        send("exit", `Process exited with code ${code ?? "unknown"}`);
        controller.close();
      });

      child.on("error", (err) => {
        clearTimeout(timeout);
        send("error", err.message);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
