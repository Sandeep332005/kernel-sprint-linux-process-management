"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const BACKEND_WS = "ws://localhost:8877/ws/experiments";

interface Metrics {
  mean_us?: number;
  p99_us?: number;
  switches_per_sec?: number;
  throughput_mb_s?: number;
}

interface TestConfig {
  key: string;
  label: string;
  paramLabel: string;
  paramKey: string;
  defaultValue: number;
  min: number;
  max: number;
  hasBeforeAfter: boolean;
}

const TESTS: TestConfig[] = [
  { key: "scheduler_optimization", label: "Scheduler Optimization Test", paramLabel: "Latency probe iterations", paramKey: "iterations", defaultValue: 300, min: 50, max: 2000, hasBeforeAfter: true },
  { key: "process_creation", label: "Process Creation Test", paramLabel: "Number of processes", paramKey: "iterations", defaultValue: 2000, min: 100, max: 10000, hasBeforeAfter: false },
  { key: "context_switch", label: "Context Switch Test", paramLabel: "Round trips", paramKey: "round_trips", defaultValue: 20000, min: 1000, max: 100000, hasBeforeAfter: false },
  { key: "ipc_performance", label: "IPC Performance Test", paramLabel: "Chunk size (bytes)", paramKey: "chunk_bytes", defaultValue: 4096, min: 64, max: 65536, hasBeforeAfter: false },
];

export default function ExperimentsPanel() {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(TESTS.map((t) => [t.key, t.defaultValue]))
  );
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, Record<string, unknown>>>({});
  const [error, setError] = useState<string | null>(null);

  function run(test: TestConfig) {
    if (running) return;
    setRunning(test.key);
    setError(null);

    const ws = new WebSocket(BACKEND_WS);
    ws.onopen = () => ws.send(JSON.stringify({ test: test.key, [test.paramKey]: values[test.key] }));
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "result") {
        setResults((r) => ({ ...r, [test.key]: msg }));
        setRunning(null);
        ws.close();
      } else if (msg.type === "error") {
        setError(msg.message);
        setRunning(null);
        ws.close();
      }
    };
    ws.onerror = () => {
      setError("could not reach backend at " + BACKEND_WS);
      setRunning(null);
    };
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-rose-900 bg-rose-950/30 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      {TESTS.map((test) => {
        const result = results[test.key];
        const isRunning = running === test.key;
        return (
          <div key={test.key} className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium text-zinc-100">{test.label}</p>
              <div className="flex items-center gap-2">
                <label className="font-mono text-xs text-zinc-500">{test.paramLabel}</label>
                <input
                  type="number"
                  min={test.min}
                  max={test.max}
                  value={values[test.key]}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [test.key]: Number(e.target.value) }))
                  }
                  disabled={running !== null}
                  className="w-24 rounded border border-zinc-700 bg-black px-2 py-1 font-mono text-xs text-zinc-200 disabled:opacity-50"
                />
                <button
                  onClick={() => run(test)}
                  disabled={running !== null}
                  className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-black transition hover:bg-emerald-400 disabled:opacity-40"
                >
                  {isRunning ? "Running…" : "Run"}
                </button>
              </div>
            </div>

            {result && test.hasBeforeAfter && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-4 border-t border-zinc-800 pt-3 font-mono text-xs"
              >
                <div>
                  <div className="text-zinc-500">Before (p99)</div>
                  <div className="text-zinc-200">{(result.before as Metrics)?.p99_us?.toFixed(1)} µs</div>
                </div>
                <div>
                  <div className="text-zinc-500">After (p99)</div>
                  <div className="text-zinc-200">{(result.after as Metrics)?.p99_us?.toFixed(1)} µs</div>
                </div>
                <div>
                  <div className="text-zinc-500">Improvement</div>
                  <div className="text-emerald-400">{String(result.p99_improvement_pct)}%</div>
                </div>
                <p className="col-span-3 text-zinc-500">{String(result.note)}</p>
              </motion.div>
            )}

            {result && !test.hasBeforeAfter && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-zinc-800 pt-3 font-mono text-xs text-zinc-300"
              >
                {JSON.stringify(result.result)}
              </motion.div>
            )}
          </div>
        );
      })}

      <p className="text-xs text-zinc-500">
        Only Scheduler Optimization has a genuine before/after — it toggles a
        live-tunable kernel knob (base_slice_ns, restored afterward) and
        re-measures. The other three report one real measurement each,
        parameterized by your input, rather than a fabricated before/after.
      </p>
    </div>
  );
}
