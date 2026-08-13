"use client";

import { motion } from "framer-motion";

const before = { latencyUs: 850, contextSwitchesPerSec: 15000 };
const after = { latencyUs: 420, contextSwitchesPerSec: 15000 };

function Bar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 font-mono text-xs text-zinc-400">
        {label}
      </span>
      <div className="h-4 flex-1 rounded bg-zinc-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded ${color}`}
        />
      </div>
      <span className="w-24 shrink-0 text-right font-mono text-xs text-zinc-300">
        {value}
      </span>
    </div>
  );
}

export default function SchedulerCompare() {
  const maxLatency = Math.max(before.latencyUs, after.latencyUs);
  const improvement = Math.round(
    ((before.latencyUs - after.latencyUs) / before.latencyUs) * 100
  );

  return (
    <div className="w-full max-w-xl space-y-6 rounded-lg border border-zinc-800 bg-zinc-950 p-6">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-wide text-zinc-500">
          Scheduler latency (µs, lower is better)
        </p>
        <Bar
          label="Before"
          value={before.latencyUs}
          max={maxLatency}
          color="bg-rose-500"
        />
        <Bar
          label="After"
          value={after.latencyUs}
          max={maxLatency}
          color="bg-emerald-500"
        />
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center font-mono text-sm text-emerald-400"
      >
        {improvement}% latency reduction
      </motion.p>
      <p className="text-center text-xs text-zinc-500">
        Sample data — populate from results/baseline vs results/optimized.
      </p>
    </div>
  );
}
