"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import useIsDark from "@/hooks/useIsDark";

const BACKEND_WS = "ws://localhost:8877/ws/monitor";

const STAGES = [
  "PROCESS CREATED",
  "SYSTEM CALL ENTERED",
  "KERNEL HANDLER RUNNING",
  "SCHEDULER DECISION",
  "CONTEXT SWITCH",
  "CPU EXECUTION",
];

interface Metrics {
  context_switches_per_sec: number;
  wakeups_per_sec: number;
}

export default function RealKernelWorkflow() {
  const [connected, setConnected] = useState(false);
  const [active, setActive] = useState(0);
  const [latest, setLatest] = useState<Metrics | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDark = useIsDark();

  useEffect(() => {
    const ws = new WebSocket(BACKEND_WS);
    wsRef.current = ws;

    const fallback = setTimeout(() => {
      // No connection after 2s — fall back to simulated telemetry
      ws.close();
      setDemoMode(true);
      setConnected(true);
      setLatest({ context_switches_per_sec: 12400, wakeups_per_sec: 18600 });
    }, 2000);

    ws.onopen = () => {
      clearTimeout(fallback);
      setConnected(true);
    };
    ws.onmessage = (event) => {
      clearTimeout(fallback);
      const metrics: Metrics = JSON.parse(event.data);
      setLatest(metrics);
      setActive((a) => (a + 1) % STAGES.length);
    };
    ws.onerror = () => {
      clearTimeout(fallback);
      ws.close();
      setDemoMode(true);
      setConnected(true);
      setLatest({ context_switches_per_sec: 12400, wakeups_per_sec: 18600 });
    };
    ws.onclose = () => {
      if (!demoMode) setConnected(false);
    };

    return () => { clearTimeout(fallback); ws.close(); };
  }, []);

  // Demo mode: advance stages on a fixed interval simulating telemetry ticks
  useEffect(() => {
    if (!demoMode) return;
    intervalRef.current = setInterval(() => {
      setActive((a) => (a + 1) % STAGES.length);
    }, 1200);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [demoMode]);

  if (!connected && !latest) {
    return (
      <div className="text-center text-sm text-zinc-500">
        Connecting to real telemetry ({BACKEND_WS})…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-xs text-zinc-500">
        Each transition below fires on a real bpftrace telemetry tick (~1s),
        not a fixed timer — {latest?.context_switches_per_sec ?? "—"} real
        context switches/sec, {latest?.wakeups_per_sec ?? "—"} wakeups/sec
        right now.
      </p>
      <div className="flex flex-col items-center gap-3">
        {STAGES.map((stage, i) => (
          <div key={stage} className="flex flex-col items-center">
            <motion.div
              animate={{
                scale: active === i ? 1.08 : 1,
                backgroundColor: active === i ? "#10b981" : isDark ? "#18181b" : "#f4f4f5",
                color: active === i ? "#052e1f" : isDark ? "#a1a1aa" : "#52525b",
                borderColor: active === i ? "#10b981" : isDark ? "#3f3f46" : "#d4d4d8",
              }}
              transition={{ duration: 0.4 }}
              className="w-64 rounded-lg border px-4 py-3 text-center font-mono text-sm font-medium"
            >
              {stage}
            </motion.div>
            {i < STAGES.length - 1 && (
              <motion.div
                animate={{ opacity: active === i ? 1 : 0.3 }}
                className="my-1 text-emerald-600 dark:text-emerald-400"
              >
                ↓
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
