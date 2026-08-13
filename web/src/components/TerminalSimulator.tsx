"use client";

import { useState, useRef, useEffect } from "react";

const canned: Record<string, string> = {
  "perf sched latency":
    "  TASK                 |  Runtime ms | Switches | Avg delay ms |\n  benchmark:1234       |    120.4    |   842    |    0.041     |",
  "stress-ng --cpu 8":
    "stress-ng: info: dispatching hogs: 8 cpu\nstress-ng: info: successful run completed in 5.02s",
  "trace-cmd report":
    "cpus=4\n  benchmark-1234 [000] sched_switch: prev_comm=benchmark ==> next_comm=swapper",
};

export default function TerminalSimulator() {
  const [history, setHistory] = useState<{ cmd: string; out: string }[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  function run() {
    const cmd = input.trim();
    if (!cmd) return;
    const out =
      canned[cmd] ??
      `command not found in simulated sandbox: ${cmd}\n(this is a stub — wire up a real WebSocket-backed Linux sandbox to execute this for real)`;
    setHistory((h) => [...h, { cmd, out }]);
    setInput("");
  }

  return (
    <div className="w-full rounded-lg border border-zinc-800 bg-black font-mono text-sm">
      <div className="border-b border-zinc-800 px-4 py-2 text-xs text-zinc-500">
        simulated sandbox — try: perf sched latency · stress-ng --cpu 8 · trace-cmd report
      </div>
      <div className="max-h-72 overflow-y-auto p-4">
        {history.map((h, i) => (
          <div key={i} className="mb-3">
            <div className="text-emerald-400">$ {h.cmd}</div>
            <pre className="whitespace-pre-wrap text-zinc-300">{h.out}</pre>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-zinc-800 px-4 py-2">
        <span className="text-emerald-400">$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="type a command..."
          className="flex-1 bg-transparent text-zinc-100 outline-none placeholder:text-zinc-600"
        />
      </div>
    </div>
  );
}
