"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { simulateChaos } from "@/lib/simulate";

const BACKEND_WS = "ws://localhost:8877/ws/chaos";

interface ChaosResult {
  detected: boolean;
  detection_message: string;
  recommendation: string;
  [key: string]: unknown;
}

interface ActionConfig {
  key: string;
  label: string;
  description: string;
  params: Record<string, number>;
}

const ACTIONS: ActionConfig[] = [
  { key: "cpu", label: "CPU Stress", description: "stress-ng --cpu (all cores)", params: { load_pct: 80, duration_sec: 5 } },
  { key: "memory", label: "Memory Pressure", description: "stress-ng --vm", params: { pct: 50, duration_sec: 5 } },
  { key: "disk", label: "Disk Stress", description: "stress-ng --hdd (32MB bounded)", params: { duration_sec: 5 } },
  { key: "network", label: "Network Delay", description: "tc netem on the container's own interface", params: { delay_ms: 200, duration_sec: 5 } },
  { key: "kill", label: "Kill Process", description: "spawn + kill a demo process in-sandbox", params: {} },
];

export default function ChaosPanel() {
  const [running, setRunning] = useState<string | null>(null);
  const [samples, setSamples] = useState<Record<string, unknown>[]>([]);
  const [results, setResults] = useState<Record<string, ChaosResult>>({});
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState<boolean | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  function run(action: ActionConfig) {
    if (running) return;
    setRunning(action.key);
    setSamples([]);
    setError(null);

    // Try WebSocket first; fall back to simulation
    try {
      const ws = new WebSocket(BACKEND_WS);
      wsRef.current = ws;
      const timeout = setTimeout(() => {
        ws.close();
        runSimulated(action);
      }, 2000);

      ws.onopen = () => {
        clearTimeout(timeout);
        setDemoMode(false);
        ws.send(JSON.stringify({ action: action.key, ...action.params }));
      };

      ws.onmessage = (event) => {
        clearTimeout(timeout);
        const msg = JSON.parse(event.data);
        if (msg.type === "sample") {
          setSamples((s) => [...s.slice(-19), msg]);
        } else if (msg.type === "result") {
          setResults((r) => ({ ...r, [action.key]: msg }));
          setRunning(null);
          ws.close();
        } else if (msg.type === "error") {
          setError(msg.message);
          setRunning(null);
          ws.close();
        }
      };
      ws.onerror = () => {
        clearTimeout(timeout);
        runSimulated(action);
      };
    } catch {
      runSimulated(action);
    }
  }

  function runSimulated(action: ActionConfig) {
    setDemoMode(true);
    const sim = simulateChaos(action.key);

    // Animate samples appearing one by one
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < sim.samples.length) {
        const sample = sim.samples[idx];
        if (sample) {
          setSamples((s) => [...s.slice(-19), sample as unknown as Record<string, unknown>]);
        }
        idx++;
      } else {
        clearInterval(interval);
        setResults((r) => ({ ...r, [action.key]: sim.result as unknown as ChaosResult }));
        setRunning(null);
      }
    }, 400);
  }

  return (
    <div className="space-y-4">
      {demoMode && (
        <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
          ⚡ Demo mode — chaos results are simulated. Run <code>cd backend &amp;&amp; python main.py</code> for real injection.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {ACTIONS.map((action) => {
          const result = results[action.key];
          const isRunning = running === action.key;
          return (
            <div key={action.key} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{action.label}</p>
                  <p className="font-mono text-xs text-zinc-500">{action.description}</p>
                </div>
                <button
                  onClick={() => run(action)}
                  disabled={running !== null}
                  className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-500 disabled:opacity-40"
                >
                  {isRunning ? "Running…" : "Trigger"}
                </button>
              </div>

              {isRunning && samples.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {samples.filter(Boolean).map((s, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:text-zinc-400"
                    >
                      {JSON.stringify(s).slice(0, 40)}
                    </motion.span>
                  ))}
                </div>
              )}

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-md border p-3 text-xs ${
                    result.detected ? "border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20" : "border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900"
                  }`}
                >
                  <p className="text-zinc-700 dark:text-zinc-300">{result.detection_message}</p>
                  <p className="mt-1 text-zinc-500">{result.recommendation}</p>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-zinc-500">
        &ldquo;Detection&rdquo; and &ldquo;recommendation&rdquo; above are simple fixed
        thresholds (a couple of if-statements), not a trained model — labeled
        automated rather than AI so this doesn&apos;t overclaim what it is.
      </p>
    </div>
  );
}
