"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { simulateMonitorMetrics, type SimMetrics } from "@/lib/simulate";

const BACKEND_WS = "ws://localhost:8877/ws/monitor";
const HISTORY_LEN = 30;

interface Metrics {
  context_switches_per_sec: number;
  wakeups_per_sec: number;
  cpu_pct: number;
  memory_pct: number | null;
  processes: { pid: string; name: string; cpu: string; mem: string }[];
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const width = 280;
  const height = 48;
  const max = Math.max(1, ...values);
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(1, HISTORY_LEN - 1)) * width;
      const y = height - (v / max) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

function Gauge({ label, pct }: { label: string; pct: number | null }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between font-mono text-xs text-zinc-500">
        <span>{label}</span>
        <span>{pct != null ? `${pct.toFixed(1)}%` : "—"}</span>
      </div>
      <div className="h-2 rounded bg-zinc-200 dark:bg-zinc-800">
        <motion.div
          animate={{ width: `${pct ?? 0}%` }}
          transition={{ duration: 0.4 }}
          className="h-full rounded bg-emerald-500"
        />
      </div>
    </div>
  );
}

export default function LiveMonitor() {
  const [connected, setConnected] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switchesHistory, setSwitchesHistory] = useState<number[]>([]);
  const [wakeupsHistory, setWakeupsHistory] = useState<number[]>([]);
  const [latest, setLatest] = useState<Metrics | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Try real WebSocket first, fall back to simulation
  useEffect(() => {
    const ws = new WebSocket(BACKEND_WS);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setDemoMode(false);
    };
    ws.onmessage = (event) => {
      const metrics: Metrics = JSON.parse(event.data);
      setLatest(metrics);
      setSwitchesHistory((h) => [...h.slice(-(HISTORY_LEN - 1)), metrics.context_switches_per_sec]);
      setWakeupsHistory((h) => [...h.slice(-(HISTORY_LEN - 1)), metrics.wakeups_per_sec]);
    };
    ws.onerror = () => {
      // Fall back to demo mode
      setDemoMode(true);
      setConnected(true); // "connected" in demo mode
      ws.close();
    };
    ws.onclose = () => {
      if (!demoMode) setConnected(false);
    };

    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Demo mode: generate simulated metrics every 1.5s
  useEffect(() => {
    if (!demoMode) return;

    // Seed initial history
    const initial: SimMetrics[] = [];
    for (let i = 0; i < HISTORY_LEN; i++) initial.push(simulateMonitorMetrics());
    setSwitchesHistory(initial.map((m) => m.context_switches_per_sec));
    setWakeupsHistory(initial.map((m) => m.wakeups_per_sec));
    setLatest(initial[initial.length - 1]);

    intervalRef.current = setInterval(() => {
      const m = simulateMonitorMetrics();
      setLatest(m);
      setSwitchesHistory((h) => [...h.slice(-(HISTORY_LEN - 1)), m.context_switches_per_sec]);
      setWakeupsHistory((h) => [...h.slice(-(HISTORY_LEN - 1)), m.wakeups_per_sec]);
    }, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [demoMode]);

  if (error) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6 text-center text-sm text-zinc-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-wide text-zinc-500">
          {demoMode ? "Demo eBPF monitoring (simulated sched_switch / sched_wakeup data)" : "Live eBPF monitoring (real sched_switch / sched_wakeup tracepoints via bpftrace)"}
        </p>
        <div className="flex items-center gap-2">
          {demoMode && (
            <span className="rounded bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 text-[10px] font-mono text-amber-600 dark:text-amber-400">DEMO</span>
          )}
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-zinc-600"}`} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 font-mono text-xs text-zinc-500">
            context switches/sec — {latest?.context_switches_per_sec ?? "—"}
          </p>
          <Sparkline values={switchesHistory} color="#10b981" />
        </div>
        <div>
          <p className="mb-1 font-mono text-xs text-zinc-500">
            wakeups/sec — {latest?.wakeups_per_sec ?? "—"}
          </p>
          <Sparkline values={wakeupsHistory} color="#f59e0b" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Gauge label="CPU" pct={latest?.cpu_pct ?? null} />
        <Gauge label="Memory" pct={latest?.memory_pct ?? null} />
      </div>

      {latest && latest.processes.length > 0 && (
        <div>
          <p className="mb-2 font-mono text-xs text-zinc-500">top processes</p>
          <table className="w-full font-mono text-xs">
            <thead>
              <tr className="text-zinc-500 dark:text-zinc-600">
                <th className="text-left font-normal">PID</th>
                <th className="text-left font-normal">NAME</th>
                <th className="text-right font-normal">CPU%</th>
                <th className="text-right font-normal">MEM%</th>
              </tr>
            </thead>
            <tbody className="text-zinc-700 dark:text-zinc-300">
              {latest.processes.map((p) => (
                <tr key={p.pid}>
                  <td>{p.pid}</td>
                  <td>{p.name}</td>
                  <td className="text-right">{p.cpu}</td>
                  <td className="text-right">{p.mem}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
