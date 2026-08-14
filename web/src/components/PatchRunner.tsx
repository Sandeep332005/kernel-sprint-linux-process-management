"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";

const BACKEND_HTTP = "http://localhost:8877";
const BACKEND_WS = "ws://localhost:8877/ws/patch";

type StageStatus = "idle" | "running" | "done" | "error";

interface StageState {
  apply: StageStatus;
  build: StageStatus;
  boot: StageStatus;
  compare: StageStatus;
  report: StageStatus;
}

const STAGES: { key: keyof StageState; label: string }[] = [
  { key: "apply", label: "Apply Patch" },
  { key: "build", label: "Build Kernel" },
  { key: "boot", label: "Boot + Benchmark" },
  { key: "compare", label: "Compare Results" },
  { key: "report", label: "Generate Report" },
];

interface Report {
  data: {
    process_creation?: { mean_us: number; p99_us: number };
    context_switch?: { switches_per_sec: number };
    scheduler_latency?: { mean_us: number; p99_us: number };
  };
  comparison_vs_baseline: Record<string, number>;
  note: string;
}

const initialStages: StageState = {
  apply: "idle", build: "idle", boot: "idle", compare: "idle", report: "idle",
};

function StageBadge({ label, status }: { label: string; status: StageStatus }) {
  const color =
    status === "done" ? "#10b981" : status === "running" ? "#f59e0b" : status === "error" ? "#f43f5e" : "#3f3f46";
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.div
        animate={{
          backgroundColor: color,
          scale: status === "running" ? [1, 1.2, 1] : 1,
        }}
        transition={status === "running" ? { duration: 0.8, repeat: Infinity } : { duration: 0.3 }}
        className="h-3.5 w-3.5 rounded-full"
      />
      <span className="whitespace-nowrap font-mono text-[10px] text-zinc-500">{label}</span>
    </div>
  );
}

export default function PatchRunner() {
  const [patchText, setPatchText] = useState("");
  const [stages, setStages] = useState<StageState>(initialStages);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const outEndRef = useRef<HTMLDivElement>(null);

  function loadExamplePatch() {
    fetch(`${BACKEND_HTTP}/api/example-patch`)
      .then((r) => r.text())
      .then(setPatchText)
      .catch(() => setError("could not load example patch"));
  }

  function run() {
    if (running || !patchText.trim()) return;
    setRunning(true);
    setStages(initialStages);
    setOutput([]);
    setReport(null);
    setError(null);

    const ws = new WebSocket(BACKEND_WS);
    wsRef.current = ws;

    ws.onopen = () => ws.send(patchText);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "stage") {
        setStages((s) => ({ ...s, [msg.stage]: msg.status === "start" ? "running" : "done" }));
      } else if (msg.type === "output") {
        setOutput((o) => [...o.slice(-200), msg.line]);
        outEndRef.current?.scrollIntoView({ behavior: "smooth" });
      } else if (msg.type === "result") {
        setReport(msg);
        setRunning(false);
        ws.close();
      } else if (msg.type === "error") {
        setError(msg.message);
        if (msg.stage) setStages((s) => ({ ...s, [msg.stage]: "error" }));
        setRunning(false);
        ws.close();
      }
    };
    ws.onerror = () => {
      setError("could not reach backend at " + BACKEND_WS);
      setRunning(false);
    };
  }

  return (
    <div className="w-full space-y-6">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-2 flex items-center justify-between">
          <label className="font-mono text-xs uppercase tracking-wide text-zinc-500">
            Upload Patch (unified diff)
          </label>
          <button
            onClick={loadExamplePatch}
            disabled={running}
            className="text-xs text-emerald-400 hover:underline disabled:opacity-50"
          >
            load example: scheduler-optimization.patch
          </button>
        </div>
        <textarea
          value={patchText}
          onChange={(e) => setPatchText(e.target.value)}
          disabled={running}
          placeholder="paste a unified diff against kernel/sched/fair.c..."
          className="h-40 w-full resize-y rounded-md border border-zinc-800 bg-black p-3 font-mono text-xs text-zinc-200 outline-none placeholder:text-zinc-600 disabled:opacity-50"
        />
        <button
          onClick={run}
          disabled={running || !patchText.trim()}
          className="mt-3 rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {running ? "Running… (build takes several minutes)" : "Run Pipeline"}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
        {STAGES.map((s, i) => (
          <div key={s.key} className="flex items-center gap-6">
            <StageBadge label={s.label} status={stages[s.key]} />
            {i < STAGES.length - 1 && <span className="text-zinc-700">→</span>}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-900 bg-rose-950/30 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      {output.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-black p-4">
          <p className="mb-2 font-mono text-xs text-zinc-500">build/boot output (live)</p>
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] text-zinc-400">
            {output.join("")}
            <div ref={outEndRef} />
          </pre>
        </div>
      )}

      {report && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-emerald-900 bg-emerald-950/20 p-5"
        >
          <p className="mb-3 font-mono text-xs uppercase tracking-wide text-emerald-400">
            Report
          </p>
          <div className="grid grid-cols-3 gap-4 font-mono text-xs">
            <div>
              <div className="text-zinc-500">process_creation p99</div>
              <div className="text-zinc-200">{report.data.process_creation?.p99_us.toFixed(1)} µs</div>
              <div className="text-zinc-500">
                {report.comparison_vs_baseline.process_creation_mean_pct_change}% vs baseline
              </div>
            </div>
            <div>
              <div className="text-zinc-500">switches/sec</div>
              <div className="text-zinc-200">{report.data.context_switch?.switches_per_sec.toFixed(0)}</div>
              <div className="text-zinc-500">
                {report.comparison_vs_baseline.context_switch_pct_change}% vs baseline
              </div>
            </div>
            <div>
              <div className="text-zinc-500">scheduler_latency p99</div>
              <div className="text-zinc-200">{report.data.scheduler_latency?.p99_us.toFixed(1)} µs</div>
              <div className="text-zinc-500">
                {report.comparison_vs_baseline.scheduler_latency_p99_pct_change}% vs baseline
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-zinc-500">{report.note}</p>
        </motion.div>
      )}
    </div>
  );
}
