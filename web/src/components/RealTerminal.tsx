"use client";

import { useState, useRef, useEffect } from "react";

const BACKEND_HTTP = "http://localhost:8877";
const BACKEND_WS = "ws://localhost:8877/ws/lab";

interface Environment {
  status: string;
  kernel?: string;
  machine?: string;
  cpu?: string;
  memory?: string;
}

export default function RealTerminal() {
  const [env, setEnv] = useState<Environment>({ status: "connecting" });
  const [history, setHistory] = useState<{ cmd: string; out: string }[]>([]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const currentOutRef = useRef<string>("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${BACKEND_HTTP}/api/environment`)
      .then((r) => r.json())
      .then(setEnv)
      .catch(() => setEnv({ status: "disconnected" }));
  }, []);

  useEffect(() => {
    const ws = new WebSocket(BACKEND_WS);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      currentOutRef.current += event.data;
      setHistory((h) => {
        const next = [...h];
        next[next.length - 1] = { ...next[next.length - 1], out: currentOutRef.current };
        return next;
      });
      if (event.data.includes("[exit code:") || event.data.includes("not allowed") || event.data.includes("[killed:")) {
        setRunning(false);
      }
    };
    ws.onerror = () => setEnv((e) => ({ ...e, status: "disconnected" }));

    return () => ws.close();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  function run() {
    const cmd = input.trim();
    if (!cmd || running || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    currentOutRef.current = "";
    setHistory((h) => [...h, { cmd, out: "" }]);
    setRunning(true);
    wsRef.current.send(cmd);
    setInput("");
  }

  return (
    <div className="w-full space-y-4">
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-sm">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <div className="text-xs text-zinc-500">Status</div>
            <div className={env.status === "connected" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
              {env.status === "connected" ? "Connected" : env.status === "connecting" ? "Connecting…" : "Disconnected"}
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">Kernel</div>
            <div className="text-zinc-800 dark:text-zinc-200">{env.kernel ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">CPU</div>
            <div className="text-zinc-800 dark:text-zinc-200">{env.cpu ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">Memory</div>
            <div className="text-zinc-800 dark:text-zinc-200">{env.memory ?? "—"}</div>
          </div>
        </div>
        <div className="mt-3 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <div className="text-xs text-zinc-500">Machine (uname -a, from the sandboxed container)</div>
          <div className="mt-1 break-all font-mono text-xs text-zinc-700 dark:text-zinc-300">{env.machine ?? "—"}</div>
        </div>
      </div>

      <div className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black font-mono text-sm">
        <div className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs text-zinc-500">
          real sandboxed execution — allowed: perf · trace-cmd · stress-ng · ps · top · uname
        </div>
        <div className="max-h-96 overflow-y-auto p-4">
          {history.map((h, i) => (
            <div key={i} className="mb-3">
              <div className="text-emerald-600 dark:text-emerald-400">$ {h.cmd}</div>
              <pre className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{h.out}</pre>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="flex items-center gap-2 border-t border-zinc-200 dark:border-zinc-800 px-4 py-2">
          <span className="text-emerald-600 dark:text-emerald-400">$</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            disabled={running}
            placeholder={running ? "running…" : "type a command..."}
            className="flex-1 bg-transparent text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-500 dark:placeholder:text-zinc-600 disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}
