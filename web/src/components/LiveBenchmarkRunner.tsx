"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { simulateBenchmark } from "@/lib/simulate";

const BACKEND_WS = "ws://localhost:8877/ws/benchmark";

type StageStatus = "idle" | "running" | "done";

interface StageState {
  compile: StageStatus;
  boot: StageStatus;
}

interface RunResult {
  process_creation?: { mean_us: number; p99_us: number };
  context_switch?: { switches_per_sec: number };
  scheduler_latency?: { mean_us: number; p99_us: number };
}

const STAGES: { key: keyof StageState; label: string }[] = [
  { key: "compile", label: "Compile Test" },
  { key: "boot", label: "Execute Workload" },
];

function StageDot({ status }: { status: StageStatus }) {
  const color =
    status === "done" ? "#10b981" : status === "running" ? "#f59e0b" : "#3f3f46";
  return (
    <motion.div
      animate={{
        backgroundColor: color,
        scale: status === "running" ? [1, 1.15, 1] : 1,
      }}
      transition={
        status === "running"
          ? { duration: 0.8, repeat: Infinity }
          : { duration: 0.3 }
      }
      className="h-3 w-3 rounded-full"
    />
  );
}

export default function LiveBenchmarkRunner() {
  const [kernel, setKernel] = useState<"baseline" | "optimized">("optimized");
  const [stages, setStages] = useState<StageState>({ compile: "idle", boot: "idle" });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState<boolean | null>(null);

  function run() {
    if (running) return;
    setRunning(true);
    setResult(null);
    setError(null);
    setStages({ compile: "idle", boot: "idle" });

    // Try WebSocket first
    try {
      const ws = new WebSocket(BACKEND_WS);
      const timeout = setTimeout(() => {
        ws.close();
        runSimulated();
      }, 2000);

      ws.onopen = () => {
        clearTimeout(timeout);
        setDemoMode(false);
        ws.send(kernel);
      };

      ws.onmessage = (event) => {
        clearTimeout(timeout);
        const msg = JSON.parse(event.data);
        if (msg.type === "stage") {
          setStages((s) => ({ ...s, [msg.stage]: msg.status === "start" ? "running" : "done" }));
        } else if (msg.type === "result") {
          setResult(msg.data);
          setRunning(false);
          ws.close();
        } else if (msg.type === "error") {
          setError(msg.message);
          setRunning(false);
          ws.close();
        }
      };
      ws.onerror = () => {
        clearTimeout(timeout);
        runSimulated();
      };
    } catch {
      runSimulated();
    }
  }

  function runSimulated() {
    setDemoMode(true);

    // Animate stages
    setStages({ compile: "running", boot: "idle" });
    setTimeout(() => {
      setStages({ compile: "done", boot: "running" });
      setTimeout(() => {
        setStages({ compile: "done", boot: "done" });
        setResult(simulateBenchmark(kernel));
        setRunning(false);
      }, 1200);
    }, 800);
  }

  return (
    <div className="w-full max-w-xl space-y-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6">
      {demoMode && (
        <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
          ⚡ Demo mode — benchmark results are simulated. Run <code>cd backend &amp;&amp; python main.py</code> for real execution.
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {(["baseline", "optimized"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKernel(k)}
              disabled={running}
              className={`rounded-md border px-3 py-1.5 text-xs font-mono transition-colors disabled:opacity-50 ${
                kernel === k
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <button
          onClick={run}
          disabled={running}
          className="rounded-md bg-emerald-500 px-4 py-1.5 text-xs font-medium text-black transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {running ? "Running…" : "Run Live Benchmark"}
        </button>
      </div>

      <div className="flex items-center gap-6">
        {STAGES.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <StageDot status={stages[s.key]} />
            <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{s.label}</span>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-4 font-mono text-xs"
        >
          <div>
            <div className="text-zinc-500">process_creation p99</div>
            <div className="text-zinc-800 dark:text-zinc-200">{result.process_creation?.p99_us.toFixed(1)} µs</div>
          </div>
          <div>
            <div className="text-zinc-500">context switches/sec</div>
            <div className="text-zinc-800 dark:text-zinc-200">{result.context_switch?.switches_per_sec.toFixed(0)}</div>
          </div>
          <div>
            <div className="text-zinc-500">scheduler_latency p99</div>
            <div className="text-zinc-800 dark:text-zinc-200">{result.scheduler_latency?.p99_us.toFixed(1)} µs</div>
          </div>
        </motion.div>
      )}

      <p className="text-xs text-zinc-500">
        This actually boots the real {kernel} kernel image under QEMU and runs
        the benchmark binaries fresh — takes ~30-60s. A single run varies more
        than the 3-run averages above; see documentation/performance-report.md.
      </p>
    </div>
  );
}
