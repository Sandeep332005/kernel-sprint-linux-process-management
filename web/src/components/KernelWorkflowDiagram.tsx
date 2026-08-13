"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const steps = [
  "Source Code",
  "Configuration",
  "Compilation",
  "Kernel Image",
  "Bootloader",
  "Running Kernel",
];

export default function KernelWorkflowDiagram() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % steps.length);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <motion.div
            animate={{
              backgroundColor: i <= active ? "#10b981" : "#18181b",
              color: i <= active ? "#052e1f" : "#a1a1aa",
            }}
            transition={{ duration: 0.3 }}
            className="rounded-md border border-zinc-700 px-3 py-2 font-mono text-xs font-medium"
          >
            {step}
          </motion.div>
          {i < steps.length - 1 && (
            <span className="text-zinc-600">→</span>
          )}
        </div>
      ))}
    </div>
  );
}
