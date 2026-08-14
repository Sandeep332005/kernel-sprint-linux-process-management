"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const LAYERS = [
  {
    title: "User",
    boxes: ["Browser"],
  },
  {
    title: "Web Dashboard — Next.js, :4477",
    boxes: ["/lab", "/benchmark", "/patch", "/experiments", "/chaos", "/kernel-workflow"],
  },
  {
    title: "Orchestrator API — FastAPI, :8877, localhost-only",
    boxes: ["/api/environment", "/ws/lab", "/ws/benchmark", "/ws/patch", "/ws/monitor", "/ws/chaos", "/ws/experiments"],
  },
  {
    title: "Agents — Python modules in the same process, not separate microservices",
    boxes: ["docker_agent", "qemu_agent", "patch_agent", "ebpf_agent", "chaos_agent", "experiments_agent"],
  },
  {
    title: "Sandboxed container — kernel-sprint-env, --privileged, disposable",
    boxes: ["gcc / make", "perf / bpftrace / trace-cmd", "stress-ng / tc netem", "qemu-system-aarch64"],
  },
  {
    title: "Persistent state",
    boxes: ["kernel-sprint-src (Docker volume)", "results/*.md + *.json (git, not a live DB)"],
  },
];

export default function ArchitectureDiagram() {
  const [activeLayer, setActiveLayer] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveLayer((l) => (l + 1) % LAYERS.length);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      {LAYERS.map((layer, i) => (
        <div key={layer.title} className="flex w-full flex-col items-center">
          <motion.div
            animate={{
              borderColor: activeLayer === i ? "#10b981" : "#3f3f46",
              backgroundColor: activeLayer === i ? "rgba(16,185,129,0.08)" : "rgba(24,24,27,1)",
            }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-2xl rounded-lg border p-4"
          >
            <p className="mb-2 text-center font-mono text-[11px] uppercase tracking-wide text-zinc-500">
              {layer.title}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {layer.boxes.map((box) => (
                <motion.span
                  key={box}
                  animate={{
                    color: activeLayer === i ? "#10b981" : "#a1a1aa",
                    borderColor: activeLayer === i ? "#10b981" : "#3f3f46",
                  }}
                  transition={{ duration: 0.4 }}
                  className="rounded border px-2.5 py-1 font-mono text-xs"
                >
                  {box}
                </motion.span>
              ))}
            </div>
          </motion.div>
          {i < LAYERS.length - 1 && (
            <motion.div
              animate={{ opacity: activeLayer === i ? 1 : 0.3 }}
              className="my-1 text-emerald-400"
            >
              ↓
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}
