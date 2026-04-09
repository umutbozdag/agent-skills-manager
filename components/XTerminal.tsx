"use client";

import { useEffect, useRef, useState } from "react";

export default function XTerminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const termRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");

      // Dynamically load xterm CSS
      if (!document.getElementById("xterm-css")) {
        const link = document.createElement("link");
        link.id = "xterm-css";
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/@xterm/xterm@5/css/xterm.min.css";
        document.head.appendChild(link);
      }

      if (cancelled || !containerRef.current) return;

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: "var(--font-geist-mono), 'SF Mono', Monaco, 'Cascadia Code', monospace",
        theme: {
          background: "#09090b",
          foreground: "#fafafa",
          cursor: "#6366f1",
          selectionBackground: "rgba(99, 102, 241, 0.3)",
          black: "#09090b",
          red: "#ef4444",
          green: "#22c55e",
          yellow: "#f59e0b",
          blue: "#6366f1",
          magenta: "#a855f7",
          cyan: "#06b6d4",
          white: "#fafafa",
          brightBlack: "#3f3f46",
          brightRed: "#f87171",
          brightGreen: "#4ade80",
          brightYellow: "#fbbf24",
          brightBlue: "#818cf8",
          brightMagenta: "#c084fc",
          brightCyan: "#22d3ee",
          brightWhite: "#ffffff",
        },
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      term.open(containerRef.current);
      fitAddon.fit();

      termRef.current = term;
      fitRef.current = fitAddon;

      const ws = new WebSocket("ws://localhost:3001");
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        setStatus("connected");
        ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "output") {
            term.write(msg.data);
          } else if (msg.type === "exit") {
            term.write("\r\n\x1b[33m[Process exited]\x1b[0m\r\n");
            setStatus("disconnected");
          }
        } catch {
          // raw
        }
      };

      ws.onclose = () => {
        if (!cancelled) setStatus("disconnected");
      };

      ws.onerror = () => {
        if (!cancelled) setStatus("disconnected");
      };

      term.onData((data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "input", data }));
        }
      });

      term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "resize", cols, rows }));
        }
      });

      const resizeObserver = new ResizeObserver(() => {
        try {
          fitAddon.fit();
        } catch { /* */ }
      });
      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }

    init();

    return () => {
      cancelled = true;
      wsRef.current?.close();
      termRef.current?.dispose();
    };
  }, []);

  const reconnect = () => {
    wsRef.current?.close();
    termRef.current?.dispose();
    setStatus("connecting");

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    // Re-trigger effect
    window.location.reload();
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card-hover">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <span className="text-xs text-muted ml-2">Terminal (PTY)</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            status === "connected" ? "bg-success/10 text-success" :
            status === "connecting" ? "bg-warning/10 text-warning animate-pulse" :
            "bg-danger/10 text-danger"
          }`}>
            {status}
          </span>
        </div>
        {status === "disconnected" && (
          <button
            onClick={reconnect}
            className="px-2.5 py-1 text-[10px] font-medium rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          >
            Reconnect
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        className="h-[400px] w-full"
        style={{ padding: "8px" }}
      />
    </div>
  );
}
