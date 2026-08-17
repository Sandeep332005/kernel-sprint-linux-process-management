"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import useIsDark from "@/hooks/useIsDark";

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
  const isDark = useIsDark();

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
              backgroundColor: i <= active ? "#10b981" : isDark ? "#18181b" : "#f4f4f5",
              color: i <= active ? "#052e1f" : isDark ? "#a1a1aa" : "#52525b",
            }}
            transition={{ duration: 0.3 }}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-2 font-mono text-xs font-medium"
          >
            {step}
          </motion.div>
          {i < steps.length - 1 && (
            <span className="text-zinc-500 dark:text-zinc-600">→</span>
          )}
        </div>
      ))}
    </div>
  );
}
