import { WebSocketServer, WebSocket } from "ws";
import * as pty from "node-pty";
import os from "os";

const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });

console.log(`PTY WebSocket server running on ws://localhost:${PORT}`);

function cleanEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }
  env["TERM"] = "xterm-256color";
  env["COLORTERM"] = "truecolor";
  return env;
}

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");

  let ptyProcess: pty.IPty;

  try {
    ptyProcess = pty.spawn("/bin/zsh", ["-l"], {
      name: "xterm-256color",
      cols: 120,
      rows: 30,
      cwd: os.homedir(),
      env: cleanEnv(),
    });
  } catch (err) {
    console.error("Failed to spawn PTY:", err);
    ws.send(JSON.stringify({ type: "output", data: `\r\nError: Failed to start shell\r\n${err}\r\n` }));
    ws.close();
    return;
  }

  console.log(`PTY spawned, pid: ${ptyProcess.pid}`);

  ptyProcess.onData((data: string) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "output", data }));
    }
  });

  ptyProcess.onExit(({ exitCode }) => {
    console.log(`PTY exited with code ${exitCode}`);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "exit", code: exitCode }));
      ws.close();
    }
  });

  ws.on("message", (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString());

      switch (msg.type) {
        case "input":
          ptyProcess.write(msg.data);
          break;
        case "resize":
          if (msg.cols > 0 && msg.rows > 0) {
            ptyProcess.resize(msg.cols, msg.rows);
          }
          break;
      }
    } catch {
      ptyProcess.write(raw.toString());
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected, killing PTY");
    try {
      ptyProcess.kill();
    } catch { /* already dead */ }
  });
});
