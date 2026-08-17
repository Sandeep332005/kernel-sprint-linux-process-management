"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const BACKEND_HTTP = "http://localhost:8877";

interface MetricSet {
  mean_us?: number;
  p99_us?: number;
  switches_per_sec?: number;
}

interface KernelResult {
  kernel: string;
  sysctl_sched_base_slice_ns: number;
  process_creation: MetricSet;
  context_switch: MetricSet;
  scheduler_latency: MetricSet;
}

interface Results {
  runs: number;
  environment: string;
  baseline: KernelResult;
  optimized: KernelResult;
  note: string;
}

function Bar({
  label,
  value,
  max,
  color,
  unit,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  unit: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 font-mono text-xs text-zinc-600 dark:text-zinc-400">{label}</span>
      <div className="h-4 flex-1 rounded bg-zinc-200 dark:bg-zinc-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded ${color}`}
        />
      </div>
      <span className="w-28 shrink-0 text-right font-mono text-xs text-zinc-700 dark:text-zinc-300">
        {value.toFixed(1)} {unit}
      </span>
    </div>
  );
}

function MetricPanel({
  title,
  baseline,
  optimized,
  unit,
  higherIsBetter,
}: {
  title: string;
  baseline: number;
  optimized: number;
  unit: string;
  higherIsBetter: boolean;
}) {
  const max = Math.max(baseline, optimized);
  const pctChange = ((optimized - baseline) / baseline) * 100;
  const isBetter = higherIsBetter ? pctChange > 0 : pctChange < 0;
  const label = `${pctChange > 0 ? "+" : ""}${pctChange.toFixed(1)}%`;

  return (
    <div className="space-y-2">
      <p className="font-mono text-xs uppercase tracking-wide text-zinc-500">{title}</p>
      <Bar label="Before" value={baseline} max={max} color="bg-rose-500" unit={unit} />
      <Bar label="After" value={optimized} max={max} color="bg-emerald-500" unit={unit} />
      <p className={`text-right font-mono text-xs ${isBetter ? "text-emerald-600 dark:text-emerald-400" : "text-amber-400"}`}>
        {label} {isBetter ? "(better)" : "(worse)"}
      </p>
    </div>
  );
}

export default function SchedulerCompare() {
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_HTTP}/api/results`)
      .then((r) => r.json())
      .then(setResults)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="w-full max-w-xl rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6 text-center text-sm text-zinc-500">
        Backend not reachable at {BACKEND_HTTP} — start it with{" "}
        <code className="text-zinc-700 dark:text-zinc-300">python backend/main.py</code>.
      </div>
    );
  }

  if (!results) {
    return (
      <div className="w-full max-w-xl rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6 text-center text-sm text-zinc-500">
        Loading real results…
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl space-y-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6">
      <p className="text-center text-xs text-zinc-500">
        {results.runs} real boot-tested runs each · {results.baseline.kernel} vs {results.optimized.kernel}
      </p>

      <MetricPanel
        title="scheduler_latency p99 (µs, lower is better) — the targeted metric"
        baseline={results.baseline.scheduler_latency.p99_us!}
        optimized={results.optimized.scheduler_latency.p99_us!}
        unit="µs"
        higherIsBetter={false}
      />
      <MetricPanel
        title="process_creation mean (µs, lower is better)"
        baseline={results.baseline.process_creation.mean_us!}
        optimized={results.optimized.process_creation.mean_us!}
        unit="µs"
        higherIsBetter={false}
      />
      <MetricPanel
        title="context switches/sec (higher is better)"
        baseline={results.baseline.context_switch.switches_per_sec!}
        optimized={results.optimized.context_switch.switches_per_sec!}
        unit="/s"
        higherIsBetter={true}
      />

      <p className="text-xs leading-relaxed text-zinc-500">{results.note}</p>
    </div>
  );
}
