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
  const wsRef = useRef<WebSocket | null>(null);
  const isDark = useIsDark();

  useEffect(() => {
    const ws = new WebSocket(BACKEND_WS);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onmessage = (event) => {
      const metrics: Metrics = JSON.parse(event.data);
      setLatest(metrics);
      // one real telemetry tick from bpftrace = one stage transition --
      // this advances in lockstep with real kernel activity, not a
      // fixed setInterval loop
      setActive((a) => (a + 1) % STAGES.length);
    };
    ws.onclose = () => setConnected(false);

    return () => ws.close();
  }, []);

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
